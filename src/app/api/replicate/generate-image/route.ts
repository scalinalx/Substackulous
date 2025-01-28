import { NextResponse } from "next/server";
import Replicate from "replicate";

// Initialize the Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

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

    if (!process.env.REPLICATE_API_TOKEN) {
      return new Response('Replicate API token not configured', { status: 500 });
    }

    const apiToken = process.env.REPLICATE_API_TOKEN;
    console.log('Starting image generation with prompt:', prompt);
    console.log('Using aspect ratio:', aspectRatio);
    console.log('Using model:', model);
    console.log('Using API token:', apiToken);

    // Generate three images sequentially
    const imageUrls: string[] = [];
    
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
        }

        console.log(`Generation ${i + 1} output:`, output);

        if (typeof output === 'string') {
          imageUrls.push(output);
        } else if (Array.isArray(output) && output.length > 0) {
          imageUrls.push(output[0]);
        } else {
          console.warn(`Generation ${i + 1} output was not in expected format:`, output);
        }
      } catch (genError) {
        console.error(`Error in generation ${i + 1}:`, genError);
        // Continue with next generation even if one fails
      }
    }

    console.log('All generations complete. Generated images:', imageUrls);

    if (imageUrls.length === 0) {
      throw new Error('No successful generations from Replicate');
    }

    // Return all image URLs
    return NextResponse.json({ imageUrls });
  } catch (error) {
    console.error('Error in image generation process:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to generate image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
