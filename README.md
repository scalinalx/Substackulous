# ThumbGen - AI-Powered Content Generation Platform

A Next.js application that helps content creators generate viral thumbnails, titles, and notes using AI. Built with Next.js 14, TypeScript, Tailwind CSS, and various AI APIs.

## Features

- 🎨 AI Thumbnail Generation
- 📝 Viral Title Generation
- 📋 Content Outline Creation
- 🚀 Viral Note Generation
- 👤 User Authentication
- 💳 Credit System

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (Authentication & Database)
- Various AI APIs (OpenAI, Anthropic, Replicate)
- Vercel AI SDK

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
REPLICATE_API_TOKEN=your_replicate_api_token
```

## Deployment

The app is deployed on Vercel. Push to the main branch to trigger automatic deployment.# Trigger redeploy
