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
    let prompt;
    if (primaryIntent === 'Growth') {
      prompt = `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

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
1. **Word Count**: Between 400 and 700 words  
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
    } else if (primaryIntent === 'Educational') {
      prompt = `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

**Newsletter Context**  
- Theme: ${theme}  
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}  
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}  
- Primary Intent: ${primaryIntent}  

Use the following templates as inspiration on how to write viral notes that are Educational:

---

1) "7 Steps to Achieve [Goal/Outcome]" Template
Intro:

"Most people struggle to [achieve a particular goal]. And 'gurus' charge [$X] for this strategy."
Context Statement:

"If you're looking to [benefit 1], [benefit 2], or [benefit 3], these [number] steps will get you closer to your goals:"
Steps (bullet or numbered):

Pick 2–3 core themes.Ex. If you're focusing on [topic], [topic], or [topic].
Maintain a consistent scheduleEx. [Frequency 1], [Frequency 2], [Frequency 3].
Make each piece of content clear and actionableStrategy: ["1 piece of content > 1 main takeaway"].
Engage with others in your nicheAction: Follow, comment, and share their work.
Leave thoughtful comments that add valueTip: Offer new angles or personal insights.
Include a call-to-action (CTA) every timeEx. Encourage readers to [subscribe, share, comment, etc.].
Track your best-performing content and double downUse data to see what resonates; refine your strategy accordingly.
Bonus Tip:

[Short, personal or community-focused idea—e.g., "Send a Sunday edition with a personal note."]
Conclusion (Community & Encouragement):

"[Platform/Topic] isn't just about [surface goal]; it's about building a real community and creating opportunities on your own terms. Keep going!"
P.S.:

Invite readers to share, "restack," or pass it on to someone who might need it.

2) "7 Stages of Growth" Template
Headline/Hook:

"There are [X] stages to growing in [Platform/Topic], and most people stop at [Stage Y]."
Stage Breakdown (number each stage):

Stage 1: Start Consistently (Even with No Audience)Emphasize that consistency builds trust—not overnight fame.
Stage 2: Build a Core AudienceFocus on [small, engaged group] rather than vanity metrics.
Stage 3: Grow Through Word-of-MouthIf people aren't sharing, your content may not be compelling enough.
Stage 4: Collaborate with OthersPartnerships, guest features, or cross-promotion.
Stage 5: Monetize Before You Feel "Ready"Start small; see who's willing to invest early.
Stage 6: Expand Your BrandVenture beyond your main medium into [podcasts, videos, workshops, etc.].
Stage 7: Become the Go-To ExpertGain recognition as a trusted source in your niche.
Motivation/Call-Out:

"Most people play it safe and never go past [Stage X]. The real growth starts where your comfort zone ends."
P.S.:

Invite to share or restack for someone who needs it.

3) "Stop Chasing Hacks" Template
Intro (Bold Statement):

"Stop chasing hacks. Here's what actually works to [achieve a goal in your domain]:"
Key Points (short paragraphs):

Pick a Clear LaneYour [content/product/service] doesn't need to serve everyone. Specific focus builds loyalty.
Write/Communicate for One PersonMake it feel personal; speak directly to that one ideal audience member.
Make Value ObviousAlways answer: "What's in it for the [reader/user/customer]?"
Engage Like You Mean ItThoughtful replies and community interactions matter more than you think.
Repurpose Your Best WorkNot everyone sees everything—reuse your content across platforms.
Collaborate WiselyChoose partners whose audiences naturally align with yours.
Build Momentum with ConsistencyShow up regularly so people know they can trust you.
Conclusion (Reality Check):

"[Platform/Topic] growth isn't rocket science. It's about clarity, connection, and consistency."
Question/Engagement CTA:

"What's one strategy you've tried that worked wonders? Drop it in the comments."

4) "Simple Engagement Strategy" Template
Headline/Hook:

"My [engagement/sales/traffic] went up [X times] in [timeframe] with this exact strategy:"
Bullet Steps:

Be a Reply Person: Engage in [platform/community/ comments] consistently.
Post Frequently: [3–5 times per day/week/month].
Like and Interact: Show genuine support as you scroll.
Conclusion (Simplicity Emphasis):

"Just show up every day and engage. It's that simple."

5) "The 100 Rule" Template
Headline/Hook:

"You'll need to show up [100 times] before you see real results."
List the "100 Actions":

Write [100 posts/pieces of content].
Reply to [100 comments].
Send [100 outreach messages/emails].
Publish [100 short-form pieces of content on your chosen platform].
Key Insight:

"Most people quit at [10]. Don't stop before the magic happens."

6) "Harsh Truth + Action Steps" Template
Headline/Hook:

"Harsh [Platform/Topic] truth: [Core statement]."
Short List of Essentials:

Show up daily/regularly.
Promote your work outside [platform].
Build relationships with others in your field.
Support others if you want support back.
Stop/Start Sections:

STOP: [Waiting for results to happen magically.]
START: [Actively sharing, engaging with your niche, being unapologetic about growth.]
Engagement CTA:

"Drop your [link/product/page] below—let's check them out and support each other."
Motivational Ending:

"Let's grow together."

7) "30-Day Growth Plan" Template
Headline:

"If I Had [X Days] to [Achieve a Goal], Here's Exactly What I'd Do"
Context/Claim:

"I launched [Project Name] and achieved [specific result]. This strategy isn't flashy, but it works."
Steps Overview:

Start with Your Value PropositionWho are you helping, and how?
Clear tagline or description.
Optimize Your [Profile/Page]Headline, Bio, Welcome Post (focus on Credibility + Conversion).
Post Consistently with a Clear Plan[Frequency: e.g., 3x a week, each post has a distinct goal].
Day-by-Day BreakdownExample schedule:Day 1: Personal story (awareness)
Day 3: Trust-building info (engagement)
Day 5: Conversion push (ask for sale/subscription)
Other days: [Short updates, Q&A, repurposed content].
Promote on Other Platforms[List the platforms: LinkedIn, Twitter, etc. + strategy].
Use a Lead Magnet[Giveaway, checklist, or free webinar].
Nurture Your Audience to Become Loyal/PayingWelcome email, exclusive offers, limited-time discounts.
Results / Expectation Setting:

"Expect steady growth in [timeframe] if you stick to this plan."
Final Prompt/CTA:

"Save this and share if it helped. Comment 'Guide' if you want a deeper dive."

8) "Addressing a Trend and Providing Solutions" Template
Headline/Hook:

"Have you noticed this new trend in [your niche/industry]? Everyone's talking about [pain point or complaint]."
Transition to a Hard Truth:

"Complaining won't solve it. Mastering the [platform/topic] will."
3 Strategies Overview (Short Bullets):

Prioritize EngagementComments and replies build trust.
Connect GenuinelySpend time where your audience is; listen to them.
Offer Value First, AlwaysProvide more than you ask in return.
Conclusion (Empowerment):

"Consistent action + focus on others = lasting growth."
P.S.:

"Be honest—have you felt [pain point]? Restack/share to help others."

9) "85% Strategy Checklist" Template
Intro/Hook:

"If 85% of your [Platform/Topic] strategy looks like this, you'll see inevitable growth…"
Checklist (Bulleted List):

Consistent [Content Creation]
Posting bold, original updates
Replying to your [readers/customers/community]
Networking with peers
Promoting unapologetically
Repurposing top content
Offering genuine value
Experimenting with premium/paid tiers
Cross-promoting with aligned brands
Focusing on connection over perfection
Conclusion:

"With a strategy this effective, growth becomes inevitable—even if you're not perfect."

10) "It's Easier to Hit [Big Milestone] Than to Struggle for [Small Milestone]" Template
Headline/Hook:

"It's easier to [achieve big outcome] than to struggle for [tiny outcome]. (Let me prove it to you in 30 seconds.)"
Illustrative Scenarios (Short paragraphs):

Low-Frequency Approach[One piece of content a week, random, for a year]. Minimal progress.
Medium-Frequency + Some CTASlight improvement, still small scale.
Strategic GrowthEngage with peers, repurpose content, collaborate, see exponential growth.
Multi-Platform Amplification[Podcasts, cross-promo, multi-platform content machine], watch your reach explode.
Main Takeaway:

"The secret isn't in doing more. It's in choosing strategies that propel you further, faster."
P.S.:

"Restack/share if someone needs it."

11) "Avoid vs. Instead" Template
Intro/Hook:

"People overcomplicate [Platform/Topic]. If you're just starting out, here's what to avoid—and what to do instead."
Avoid List:

Posting random topics with no focus.
[Hiding all content, being overly salesy, too soon].
Trying to copy someone else's voice.
Overthinking design, logos, or perfect visuals early on.
Instead List:

Pick one niche and stick to it.
Offer free, high-value solutions or content first.
Share personal stories to build a real connection.
Post consistently (even if it's just once a week).
Conclusion (Focus/Timeframe):

"Do this for the first [90 days/timeframe], and you'll build momentum and learn what truly works."

----

**Short Note Guidelines (4 notes)**  
1. **Hook Formula**: Start from the templates then go form there. Vary the hooks , be original, creative, engaging and even clickbaity if the context requires it. 
2. Focus on what the primary feeling or insight you want to share. Adjust tone, add emojis, or style to match personality. Be authentic and genuine. 
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
1. **Word Count**: Between 400 and 700 words  
2. **Depth**: Expand on the ${theme}, taking into account ${primaryIntent}. Take the templates as a starting point and expand on them. 
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
    } else if (primaryIntent === 'Entertain') {
      prompt = `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

**Newsletter Context**  
- Theme: ${theme}  
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}  
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}  
- Primary Intent: ${primaryIntent}  

Use the following templates as inspiration on how to write viral notes that are Entertaining:

----

1) 

"Modern [VALUE/IDEAL] is the ability to [KEY ACTION 1], [KEY ACTION 2], [KEY ACTION 3], and [KEY ACTION 4]—in a world designed to make it nearly impossible to do so."
How to Customize
[VALUE/IDEAL]: Instead of "luxury," choose a concept relevant to your niche (e.g., "success," "wellness," "freedom").
[KEY ACTIONS]: Replace with the specific pursuits that represent an ideal state for your audience (e.g., "focus fully," "rest well," "create freely," "live joyfully").

----

2) 

"You don't need [huge result everyone chases]. You just need to get in front of [the specific audience that matters]."
How to Customize
[huge result everyone chases]: Swap in any overhyped metric (e.g., "100,000 followers," "media fame").
[the specific audience that matters]: Identify your target market or the precise group that truly benefits from your work.

----

3) 

"Who here still [does a tradition/habit/practice]? [Emoji or call-to-action]."
How to Customize
[does a tradition/habit/practice]: Replace with any activity relevant to your audience's interests (e.g., "writes handwritten letters," "practices daily journaling," "uses paper planners").
[Emoji or call-to-action]: Add a simple prompt or emoji to spark engagement (e.g., "🙋‍♀️," "Let me know in the comments!").

----

4) 

"Do it [EMOTION/STATE].
Do it [SITUATION].
Do it [CONDITION].
Do it even if [OBSTACLE].
No matter what—just do it."
How to Customize
[EMOTION/STATE]: Fearful, uncertain, excited, etc.
[SITUATION/CONDITION/OBSTACLE]: Fill in real-life challenges your audience faces (e.g., "with zero budget," "without validation," "when you feel stuck").

----

5) 

"You only truly [RESULT/BENEFIT] once you start [ACTION]."
How to Customize
[RESULT/BENEFIT]: "master your craft," "grow," "improve," etc.
[ACTION]: "creating," "implementing," "trying," "launching."

----

6) 

"[Concept 1] isn't [negative label]. It's [positive reframe].
[Concept 2] isn't [negative label]. It's [beneficial quality].
[Concept 3] isn't [negative label]. It's [empowering shift].
Burnout doesn't mean you're [common misconception]. It means you're [real cause].
Slow down. You'll [long-term benefit]."
How to Customize
[Concepts and negative labels]: Swap in different aspects of work or life people often misjudge (e.g., "delegating," "outsourcing," "saying no").
[Positive reframe/beneficial quality/empowering shift]: Offer the new perspective you want your audience to adopt.

----

8) 
Original:

"A baby puffin is called a 'puffling.' I just thought someone might need to know that today. Carry on. 🐧✨"
Template Version:

"A [thing] is actually called a [funny/interesting name]. I just thought someone might need to know that today. Carry on. [Emoji]."
How to Customize
[thing]: Choose any surprising or fun fact relevant to your audience (e.g., "newborn hedgehog," "group of flamingos," "rare vintage car model").
[funny/interesting name]: Insert a quirky, lesser-known term.
[Emoji]: Add a themed emoji to keep it playful (e.g., animal emojis, confetti, sparkles).
----

**Short Note Guidelines (4 notes)**  
1. **Hook Formula**: Start from the templates then go form there. Vary the hooks , be original, creative, engaging and even clickbaity if the context requires it. 
2. Focus on what the primary feeling or insight you want to share. Adjust tone, add emojis, or style to match personality. Be authentic and genuine. 
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
1. **Word Count**: Between 400 and 700 words  
2. **Depth**: Expand on the ${theme}, taking into account ${primaryIntent}. Take the templates as a starting point and expand on them. 
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
    } else {
      prompt = `Act as a top Substack growth strategist with 10+ years of experience creating viral content. Generate 4 high-impact short notes and 2 long-form notes based on the following framework:

**Newsletter Context**  
- Theme: ${theme}  
${coreTopics ? `- Core Topics: ${coreTopics}` : ''}  
${targetAudience ? `- Target Audience: ${targetAudience}` : ''}  
- Primary Intent: ${primaryIntent}  

Deliver notes that convey a personal story in ways that make the readers relate, engage, communicate and connect.
As reference, here 4 example GREAT personal story -type of Substack notes:

---
"At 16, I got rejected for a job at McDonald’s as a waitress.

By 22, McDonald’s became my client.

At 25, I packed my bags, moved to a new country, and started fresh after losing my mom.

At 27, I became the youngest director in the company.

By 30, I’d traveled to 120 countries for work.

At 35, I left the corporate world, met the love of my life, and started from zero—no plan, just passion.

At 36, I picked up art for the first time (because why not?).

At 37, I opened an art gallery (what?!).

At 38, I was selling $5 gigs on Fiverr

But then I launched a copywriting agency and started building my portfolio career—learning as I went.

At 39, Forbes came knocking, and I got published!

At 40, I hit reset again and rebuilt a brand agency from scratch.

At 41, we moved cities... again. New place, new vibes.

And now? I’m on Substack, sharing this wild ride with you, helping you build your own portfolio career path.

So, what’s your next move?

Who knows?

It’s never too late or too early to start.

Your story now 👇"
---
"OMG, I didn’t even notice THIS happened.

I’m a freakin Substack bestseller. 

In less than 3 months in!!!

THANK YOU THANK YOU THANK YOU

How do I celebrate you?"
---
"Substack is my happy place.

After a year of posting on LinkedIn, I thought I had it figured out.

12,000 followers and counting, but...

It was all just a numbers game.

A never-ending cycle of posting, promoting, and pretending.

But Substack is different.

It's where I can be myself, without the noise and the nonsense.

No more cheesy sales pitches, no more fake engagement.

Just real people, having real conversations, and sharing real ideas.

I've found my community, my tribe, my home.

It's where I can create, connect, and contribute.

Substack, if you're listening...

Please, don't let the spammers and the self-promoters ruin it.

Keep it real, keep it authentic, and keep it focused on the creators.

We're the ones who will make this platform thrive."
---
"Confession: I quit Substack after one day.

(I thought it wasn’t worth my time.)

The first time I tried Substack, I wrote a single post, shrugged, and left. ""This isn’t working. No one’s reading. What’s the point?""

I didn’t log back in for almost a year.

Then, on September 5th, 2024, something changed. I gave it one real shot.

Four and a half months later? 40K subscribers.

Here’s what I did differently:

I stopped trying to please everyone. My content got bold, specific, and unapologetically me.

I showed up daily. Notes, posts, comments—I treated this like a job, not a hobby.

I focused on connection. Instead of just posting, I started engaging. Real conversations, real relationships.

Substack isn’t about going viral or hacking your way to success. It’s about doing the simple stuff: Write. Share. Connect. Repeat.

Sometimes, the thing you quit is the thing that works—if you commit.

Ever thought about quitting here? Don’t.

You’re probably closer to a breakthrough than you think.

This platform rewards those who keep going."
---


**Short Note Guidelines (4 notes)**  
1. **Hook Formula**: Take inspiration from the examples. Aim for emotional connection and engagement. Aim for whispering strong feelings into existence.  
2. **Value Structure**: Connect with the reader on an emotional level. Do not copy the or paraphrase the notes ad-literam. Be genuine, natural, human, charming and relatable. Above all, relatable.  
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
1. **Word Count**: Between 400 and 700 words  
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
    }

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