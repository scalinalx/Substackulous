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

// Helper function to parse Replicate output
const parseReplicateOutput = (output: any): string | null => {
  console.log('Parsing Replicate output:', JSON.stringify(output, null, 2));
  
  if (typeof output === 'string') {
    return output;
  }
  
  if (Array.isArray(output)) {
    if (output.length > 0) {
      if (typeof output[0] === 'string') {
        return output[0];
      }
      // Some models return an array of objects with an 'image' property
      if (output[0]?.image) {
        return output[0].image;
      }
    }
  }
  
  // Handle object response with 'image' property
  if (output?.image) {
    return output.image;
  }

  console.warn('Unexpected Replicate output format:', output);
  return null;
};

export async function POST(req: Request) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  
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

    console.log(`[${requestId}] Starting request:`, {
      prompt,
      aspectRatio,
      model,
      timestamp: new Date().toISOString()
    });

    if (!prompt) {
      return NextResponse.json(
        { error: 'Missing prompt' },
        { status: 400 }
      );
    }

    // Create a new client for each request to ensure fresh token
    const replicate = getReplicateClient();

    // Generate three images sequentially
    const imageUrls: string[] = [];
    const errors: string[] = [];
    let successfulGenerations = 0;
    
    for (let i = 0; i < 3; i++) {
      try {
        console.log(`[${requestId}] Starting generation ${i + 1}/3...`);
        
        let output;
        const generationStartTime = Date.now();

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
              console.error(`[${requestId}] Attempt ${retryCount + 1} failed:`, retryError);
              if (retryCount === maxRetries) throw retryError;
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        const generationTime = Date.now() - generationStartTime;
        console.log(`[${requestId}] Generation ${i + 1} completed in ${generationTime}ms. Output:`, output);

        const imageUrl = parseReplicateOutput(output);
        if (imageUrl) {
          imageUrls.push(imageUrl);
          successfulGenerations++;
          console.log(`[${requestId}] Successfully parsed image URL for generation ${i + 1}:`, imageUrl);
        } else {
          throw new Error(`Failed to parse output from generation ${i + 1}`);
        }
      } catch (genError) {
        console.error(`[${requestId}] Error in generation ${i + 1}:`, genError);
        errors.push(`Generation ${i + 1}: ${(genError as Error).message}`);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`[${requestId}] Request completed in ${totalTime}ms. Success: ${successfulGenerations}/3`);

    if (imageUrls.length === 0) {
      console.error(`[${requestId}] No successful generations. Errors:`, errors);
      return NextResponse.json(
        { 
          error: 'Failed to generate any images',
          details: errors.join('; '),
          requestId
        },
        { status: 500 }
      );
    }

    // Return successful generations and any errors
    return NextResponse.json({ 
      imageUrls,
      errors: errors.length > 0 ? errors : undefined,
      requestId,
      generationTime: totalTime,
      successCount: successfulGenerations
    });
  } catch (error) {
    console.error(`[${requestId}] Fatal error in image generation process:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to generate images',
        details: (error as Error).message,
        requestId
      },
      { status: 500 }
    );
  }
}
