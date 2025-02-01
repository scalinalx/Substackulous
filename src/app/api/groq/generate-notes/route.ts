export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
if (!GROQ_API_KEY) {
  throw new Error('Groq API key not configured');
}

const groq = new Groq({
  apiKey: GROQ_API_KEY
});

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

export async function POST(req: Request) {
  try {
    console.log('Starting note generation request...');
    const { theme, coreTopics, targetAudience, primaryIntent, userId } = await req.json();

    if (!theme) {
      console.log('Theme missing in request');
      return NextResponse.json({ error: 'Theme is required' }, { status: 400 });
    }

    if (!userId) {
      console.log('User ID missing in request');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log('Checking user credits...');
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
      console.log('User profile not found:', userId);
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const creditCost = 2;
    if (profile.credits < creditCost) {
      console.log('Insufficient credits for user:', userId);
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 400 });
    }

    console.log('Making request to Groq API...');
    const prompt = `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

**Newsletter Context**  
- Theme: ${theme}  
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}  
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}  
- Primary Intent: ${primaryIntent}  

**Short Note Guidelines (4 notes)**  
1. **Hook Formula**: Open with "Did you know?" / "Here's why X matters" / Controversial truth / Surprising statistic  
2. **Value Structure**: Problem > Agitate > Solution > Proof  
3. **Viral Elements**:  
   - Leverage psychological triggers (curiosity gap, FOMO, social proof)  
   - Include actionable takeaways  
   - Use audience-specific lingo/jargon  
4. **Platform Optimization**:  
   - 280-300 character sweet spot  
   - 3-4 paragraph max with single-line breaks  
   - Strategic emoji placement (max 1 per note)  
5. **CTAs**: Soft sell with "Save this" / "Thoughts?" / "Tag someone who..."  
6. **Unique Angle**: Vary hooks/angles across notes  
7. **Unexpected Twist**: Include 1 unexpected twist per note  

**Long-Form Note Guidelines (2 notes)**  
1. **Word Count**: Up to 300 words  
2. **Depth**: Expand on the ${theme}, taking into account ${primaryIntent}  
3. **Structure**:  
   - Start with a compelling hook  
   - Dive deep into the topic with actionable insights  
   - Include data, examples, or anecdotes  
   - End with a strong CTA or thought-provoking question  
4. **Tone**: Maintain a conversational yet authoritative tone  
5. **Audience Tailoring**: Use audience-specific language and address their pain points  

**Output Requirements**  
- Format as a numbered list for short notes and unnumbered paragraphs for long notes  
- No markdown in the output  
- Separate each note with the following separator: ---###$$$###---  
- Output ONLY the notes and the separator, no other text  
- Do not indicate the copywriting frameworks or methods used  
- Each sentence should be on a new line  

make sure you remove from the output the part that is enclosed in <think>  </think> tags`;

    const completion = await groq.chat.completions.create({
      messages: [{
        role: "user",
        content: prompt
      }],
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.69,
      max_tokens: 4096,
      top_p: 0.95,
      stream: false,
      stop: null
    });

    console.log('Received response from Groq API');
    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content in Groq response:', completion);
      throw new Error('No content generated by Groq API');
    }

    const notes = content.split('---###$$$###---').map((note: string) => note.trim()).filter(Boolean);

    if (!notes.length) {
      console.error('No notes after processing content');
      throw new Error('No notes generated');
    }

    console.log('Updating user credits...');
    // Update the credits using supabaseAdmin
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - creditCost })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update credits:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update credits',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('Successfully generated notes and updated credits');
    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error in note generation:', error);
    // Return more detailed error information
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate notes',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
} 