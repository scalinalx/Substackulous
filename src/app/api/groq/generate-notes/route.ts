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
    const prompt = primaryIntent === 'Growth' ? `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

**Newsletter Context**  
- Theme: ${theme}  
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}  
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}  
- Primary Intent: ${primaryIntent}  

Use the following templates as inspiration on how to write viral notes that promote Growth:

---

### **Template 1: The Success Journey**
**[Your Personal Growth Story]**  
"My first [week/month] on [platform], I had [X] [subscribers/followers]—it [relatable benefit, e.g., 'paid for a coffee'].  
By [month X], I had [Y] [subscribers/followers]—it [relatable benefit, e.g., 'paid for my groceries'].  
Now, I've [achieved a significant milestone, e.g., 'made over $50,000' or 'grown to 33,000 subscribers'].  
This could be YOU, but you're stuck overthinking your first [post/step].  
Start messy. I've got you. [Emoji or call-to-action]"

---

### **Template 2: Community Promotion**
**[Encourage Collaboration and Promotion]**  
"I don't care how small your [Substack/blog/podcast] is, CONGRATULATIONS [emoji]!  
Promote it here, and I'm going to check on each and every one of you.  
And maybe recommend some that fit my audience too.  
You can do the same thing too.  
Let's [grow/support/learn] together! [Emoji]"

---

### **Template 3: Free Tools Call-to-Action**  
**[Highlight Accessibility and Action]**  
"[Tool/service] is FREE.  
[Tool/service] is FREE.  
[Tool/service] is FREE.  
[Tool/service] is FREE.  
Start the damn [business/project/blog]!"

---

### **Template 4: Share Your Work**  
**[Encourage Others to Participate]**  
"I don't care if you have [X] [subscribers/followers] or [Y]—drop your [Substack/link] below.  
I want to see what you're building. Show yourself to the [Substack/world].  
I'll check out as many as I can, and if I find something that fits my audience, I'll recommend you.  
You can do the same thing too.  
This is how we [grow/support each other]—together.  
Let's go. [Emoji]"

---

### **Template 5: Build Your Audience**  
**[Emphasize Free Tools for Growth]**  
"[Tool] is FREE.  
[Tool] is FREE.  
[Tool] is FREE.  
[Tool] is FREE.  
Build the damn [audience/community]!"

---

### **Template 6: Focus on What Matters**  
**[Shift Focus to Meaningful Growth]**  
"Anyone else feel like something's shifting?  
I'm done [overthinking/trying to go viral/seeking validation].  
All I want is to [write/create/build] what matters, [grow at my own pace/build income streams/spend more time offline].  
Nothing else. Literally nothing else.  
Who's with me?"

---

### **Template 7: Growth Tactics**  
**[Share Proven Strategies]**  
"My [Substack/blog/podcast] growth jumped by [X] in [timeframe]:  
[Strategy 1, e.g., 'Post daily']  
[Strategy 2, e.g., 'Reply to people']  
[Strategy 3, e.g., 'Like as you scroll']  
Show up. Be human. It works."

---

### **Template 8: Cross-Promotion Call-to-Action**  
**[Encourage Mutual Support]**  
"Drop your [Substack/link]—  
I'll check it out and recommend those that resonate with my audience.  
You can do the same if someone inspires you here.  
This is how we all [grow/succeed] <3."

---

**Short Note Guidelines (4 notes)**  
1. **Hook Formula**: Start from the template. Also you can open with "Did you know?" / "Here's why X matters" / Controversial truth / Surprising statistic  
3. **Viral Elements**:  
   - Leverage psychological triggers (curiosity gap, FOMO, social proof)  
   - Include actionable takeaways  
   - Use audience-specific lingo/jargon  
4. **Platform Optimization**:  
   - 280-300 character sweet spot  
   - 3-4 paragraph max with single-line breaks  
   - Strategic emoji placement (max 1 per note)  
5. **CTAs**: Get inspiration for CTAs from the templates included above. In general farm engagement and soft sell your audience.  
6. **Unique Angle**: Vary hooks/angles across notes  
7. **Unexpected Twist**: Include 1 unexpected twist per note  

**Long-Form Note Guidelines (2 notes)**  
1. **Word Count**: Up to 700 words  
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
- Frequently use short&sweet sentences that pack a punch.   

Make sure you remove from the output the part that is enclosed in <think>  </think> tags` : `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

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
1. **Word Count**: Up to 700 words  
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
- Frequently use short&sweet sentences that pack a punch.   

Make sure you remove from the output the part that is enclosed in <think>  </think> tags`;

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

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error('No content generated by Groq API');

    const notes = content
      .replace(/<think>[\s\S]*?<\/think>/g, '')
      .trim()
      .split('---###$$$###---')
      .map(note => note.trim())
      .filter(Boolean);

    if (!notes.length) throw new Error('No notes generated');

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ credits: profile.credits - creditCost })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update credits',
        details: updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('Error in note generation:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate notes',
        details: error instanceof Error ? error.stack : 'No stack trace available'
      },
      { status: 500 }
    );
  }
} 