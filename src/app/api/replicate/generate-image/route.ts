export const runtime = 'edge';

import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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
      prompt_upsampling = true,
      userId
    } = await req.json();

    if (!prompt || !userId) {
      return NextResponse.json(
        { error: 'Prompt and userId are required' },
        { status: 400 }
      );
    }

    // Get the session from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('No Authorization header');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get the user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data: { user: sessionUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !sessionUser) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (sessionUser.id !== userId) {
      console.error('User ID mismatch:', { sessionUserId: sessionUser.id, requestUserId: userId });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // First, check if user has enough credits
    let { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
      return NextResponse.json({ 
        error: 'Failed to fetch user profile',
        details: profileError.message 
      }, { status: 404 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const creditCost = model === 'flux' ? 25 : 30;
    if (profile.credits < creditCost) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    console.log(`[${requestId}] Starting request:`, {
      prompt,
      aspectRatio,
      model,
      timestamp: new Date().toISOString()
    });

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

        if (successfulGenerations > 0) {
          // Update the credits using supabaseAdmin
          const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ credits: profile.credits - creditCost })
            .eq('id', userId);

          if (updateError) {
            console.error('Failed to update credits:', updateError);
            await writer.write(encoder.encode(`data: {"status":"error","message":"Failed to update credits"}\n\n`));
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
