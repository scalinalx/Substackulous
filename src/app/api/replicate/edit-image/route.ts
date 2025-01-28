import { NextResponse } from 'next/server';
import Replicate from 'replicate';

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export async function POST(req: Request) {
  try {
    const { image, prompt, mask } = await req.json();

    if (!image || !prompt || !mask) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert base64 image to URL if needed
    const imageUrl = image.startsWith('data:') 
      ? await uploadBase64Image(image)
      : image;

    // Generate the mask image from the selection coordinates
    const maskUrl = await createMaskImage(mask);

    // Call Replicate's API for image editing
    const output = await replicate.run(
      "stability-ai/sdxl-inpainting:526e2e3e39aa0c8d7380f56377b9c574a6d0d3cf42f9e35ea7d7c7844de5c1d9",
      {
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt,
          num_outputs: 1,
          scheduler: "K_EULER",
          num_inference_steps: 50,
        },
      }
    ) as string[];

    if (!output || output.length === 0) {
      throw new Error('No output received from Replicate');
    }

    return NextResponse.json({ imageUrl: output[0] });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

// Helper function to upload base64 image to a temporary storage and return URL
async function uploadBase64Image(base64Image: string): Promise<string> {
  // For now, we'll return the base64 image as is
  // In a production environment, you should upload this to a storage service
  return base64Image;
}

// Helper function to create a mask image from selection coordinates
async function createMaskImage(mask: { x: number; y: number; width: number; height: number }): Promise<string> {
  // For now, we'll create a simple black and white mask
  // In a production environment, you might want to use a more sophisticated approach
  const canvas = new OffscreenCanvas(mask.width, mask.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Create a black and white mask
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, mask.width, mask.height);
  ctx.fillStyle = 'white';
  ctx.fillRect(mask.x, mask.y, mask.width, mask.height);

  // Convert to base64
  const blob = await canvas.convertToBlob();
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 