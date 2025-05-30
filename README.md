# Travel Planner Chatbot

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/reaserch-linearloops-projects/v0-travel-planner-chatbot)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/0HZZQjoQQDs)

## Overview

A sophisticated AI-powered travel planning chatbot built with Next.js 14+ and Groq API. The chatbot helps users plan their perfect trips by gathering travel preferences and generating personalized itineraries with budget breakdowns, accommodation suggestions, and day-wise activity plans.

## Features

- 🤖 **AI-Powered Planning**: Uses Groq's Mixtral-8x7b model for intelligent travel recommendations
- 💬 **Multi-turn Conversations**: Maintains context throughout the planning session
- 🎯 **Travel-Focused**: Strictly limited to travel-related queries with polite refusal of off-topic questions
- 📱 **ChatGPT-like UI**: Modern, responsive interface with message bubbles and typing indicators
- 🔒 **Robust Error Handling**: Comprehensive error management with user-friendly messages
- ⚡ **Real-time Streaming**: Instant AI responses with streaming text generation

## Setup Instructions

### 1. Environment Configuration

1. Copy the example environment file:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Get your Groq API key:
   - Visit [Groq Console](https://console.groq.com/keys)
   - Create a new API key
   - Copy the key to your `.env.local` file:
   \`\`\`env
   GROQ_API_KEY=your_actual_groq_api_key_here
   \`\`\`

### 2. Installation

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev
\`\`\`

### 3. Deployment

The app is automatically deployed on Vercel. For manual deployment:

\`\`\`bash
# Build the application
npm run build

# Start production server
npm start
\`\`\`

## Usage

1. **Start a Conversation**: Ask about your travel plans (e.g., "I want to visit Japan")
2. **Provide Information**: The AI will ask for details like:
   - Your name and email
   - Source and destination locations
   - Travel dates and duration
   - Budget preferences
3. **Get Your Itinerary**: Once all information is collected, receive a detailed travel plan

## Error Handling

The application includes comprehensive error handling for:

- **Network Issues**: Automatic retry with exponential backoff
- **API Errors**: User-friendly error messages with retry options
- **Rate Limiting**: Graceful handling of API rate limits
- **Configuration Issues**: Clear guidance for setup problems

## Technical Stack

- **Frontend**: Next.js 14+ with App Router, TypeScript, Tailwind CSS
- **AI Integration**: Groq API with Mixtral-8x7b-32768 model
- **UI Components**: shadcn/ui components
- **Deployment**: Vercel with automatic deployments

## Development

Continue building your app on:
**[https://v0.dev/chat/projects/0HZZQjoQQDs](https://v0.dev/chat/projects/0HZZQjoQQDs)**

## Troubleshooting

### Common Issues

1. **No AI Responses**:
   - Check if `GROQ_API_KEY` is properly set in `.env.local`
   - Verify the API key is valid and has sufficient credits

2. **Network Errors**:
   - Check internet connection
   - Try refreshing the page
   - Use the retry button in error messages

3. **Rate Limiting**:
   - Wait a few moments before sending new messages
   - Consider upgrading your Groq API plan for higher limits

### Getting Help

If you encounter issues:
1. Check the browser console for detailed error messages
2. Verify your environment variables are correctly set
3. Ensure your Groq API key has sufficient credits
4. Try refreshing the page or clearing browser cache

## License

This project is built with [v0.dev](https://v0.dev) and deployed on Vercel.
