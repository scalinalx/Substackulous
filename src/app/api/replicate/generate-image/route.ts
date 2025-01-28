export const runtime = 'edge';

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

    // Use a TransformStream to stream the response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start the response stream
    const response = new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

    // Process generations in the background
    (async () => {
      try {
        const imageUrls: string[] = [];
        const errors: string[] = [];
        let successfulGenerations = 0;

        for (let i = 0; i < 3; i++) {
          try {
            await writer.write(encoder.encode(`data: {"status":"generating","message":"Starting generation ${i + 1}/3"}\n\n`));
            
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
                  break;
                } catch (retryError) {
                  console.error(`[${requestId}] Attempt ${retryCount + 1} failed:`, retryError);
                  await writer.write(encoder.encode(`data: {"status":"retrying","message":"Attempt ${retryCount + 1} failed, retrying..."}\n\n`));
                  if (retryCount === maxRetries) throw retryError;
                  retryCount++;
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }
              }
            }

            const generationTime = Date.now() - generationStartTime;
            const imageUrl = parseReplicateOutput(output);
            
            if (imageUrl) {
              imageUrls.push(imageUrl);
              successfulGenerations++;
              await writer.write(encoder.encode(`data: {"status":"success","imageUrl":"${imageUrl}","index":${i}}\n\n`));
            } else {
              throw new Error(`Failed to parse output from generation ${i + 1}`);
            }
          } catch (genError) {
            console.error(`[${requestId}] Error in generation ${i + 1}:`, genError);
            errors.push(`Generation ${i + 1}: ${(genError as Error).message}`);
            await writer.write(encoder.encode(`data: {"status":"error","message":"Error in generation ${i + 1}: ${(genError as Error).message}"}\n\n`));
          }
        }

        // Send final status
        await writer.write(encoder.encode(`data: {"status":"complete","imageUrls":${JSON.stringify(imageUrls)},"errors":${JSON.stringify(errors)},"successCount":${successfulGenerations}}\n\n`));
      } catch (error) {
        await writer.write(encoder.encode(`data: {"status":"error","message":"${(error as Error).message}"}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return response;
  } catch (error) {
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
