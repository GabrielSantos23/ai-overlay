# Vercel Deployment Guide

## Environment Variables

Set these environment variables in your Vercel dashboard:

```
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-frontend-domain.com
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key
TAVILY_API_KEY=your-tavily-key
NODE_ENV=production
```

## Deployment Steps

1. **Connect to Vercel:**

   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Select the `apps/server` folder as the root directory

2. **Set Environment Variables:**

   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all the variables listed above

3. **Deploy:**
   - Vercel will automatically build and deploy your app
   - Your API will be available at `https://your-app.vercel.app`

## API Endpoints

- `GET /` - Health check (shows HTML page)
- `POST /ai` - AI chat streaming
- `POST/GET /api/auth/*` - Authentication
- `POST /trpc/*` - tRPC API

## Local Development

```bash
cd apps/server
bun install
bun run dev
```

## Notes

- The HTML file serves as a landing page and API documentation
- All API routes are properly configured in `vercel.json`
- CORS is configured for your frontend domain
- Maximum function timeout is set to 60 seconds for AI requests
