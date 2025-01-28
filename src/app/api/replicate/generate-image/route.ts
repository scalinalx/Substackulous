import { NextResponse } from "next/server";
import Replicate from "replicate";

// Initialize the Replicate client with auth token
const getReplicateClient = () => {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    throw new Error('Replicate API token not configured');
  }
  return new Replicate({ auth: token });
};

export async function POST(req: Request) {
  try {
    const { 
      prompt, 
      aspectRatio = "3:2", 
      model = "ideogram",
      output_format = "jpg",
      output_quality = 90,
      safety_tolerance = 2,
      prompt_upsampling = true
    } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Create a new client for each request to ensure fresh token
    const replicate = getReplicateClient();
    console.log('Starting image generation with prompt:', prompt);
    console.log('Using aspect ratio:', aspectRatio);
    console.log('Using model:', model);

    // Generate three images sequentially
    const imageUrls: string[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`Starting generation ${i + 1}/3...`);
        
        let output;
        if (model === 'flux') {
          output = await replicate.run(
            "black-forest-labs/flux-1.1-pro",
            {
              input: {
                prompt,
                aspect_ratio: aspectRatio,
                output_format,
                output_quality,
                safety_tolerance,
                prompt_upsampling
              }
            }
          );
        } else {
          // Add retry logic for Ideogram model
          let retryCount = 0;
          const maxRetries = 2;
          
          while (retryCount <= maxRetries) {
            try {
              output = await replicate.run(
                "ideogram-ai/ideogram-v2-turbo",
                {
                  input: {
                    prompt,
                    resolution: "None",
                    style_type: "Design",
                    aspect_ratio: aspectRatio,
                    magic_prompt_option: "On"
                  },
                }
              );
              break; // If successful, exit retry loop
            } catch (retryError) {
              console.error(`Attempt ${retryCount + 1} failed:`, retryError);
              if (retryCount === maxRetries) throw retryError;
              retryCount++;
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        console.log(`Generation ${i + 1} output:`, output);

        if (typeof output === 'string') {
          imageUrls.push(output);
        } else if (Array.isArray(output) && output.length > 0) {
          imageUrls.push(output[0]);
        } else {
          throw new Error(`Invalid output format from generation ${i + 1}`);
        }
      } catch (genError) {
        console.error(`Error in generation ${i + 1}:`, genError);
        errors.push(`Generation ${i + 1}: ${(genError as Error).message}`);
      }
    }

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any images. Errors: ' + errors.join('; ') },
        { status: 500 }
      );
    }

    // Return successful generations and any errors
    return NextResponse.json({ 
      imageUrls,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in image generation process:', error);
    return NextResponse.json(
      { error: 'Failed to generate images: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
