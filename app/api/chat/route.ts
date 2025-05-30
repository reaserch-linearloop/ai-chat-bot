import { streamText } from "ai"
import { createOpenAI } from "@ai-sdk/openai"

// Create Groq client using OpenAI-compatible interface
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Validate API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY environment variable is not set")
      return new Response(
        JSON.stringify({
          error: "Configuration Error",
          message: "API key not configured. Please check your environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Validate request body
    let messages
    try {
      const body = await req.json()
      messages = body.messages

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({
            error: "Invalid Request",
            message: "Messages array is required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const systemPrompt = `You are a helpful travel planner AI. You must only answer travel-related questions and refuse any non-travel topic. Collect user details like name, email, source, destination, dates, duration, and budget, then generate an itinerary. Do not hallucinate or answer off-topic. Respond politely.

STRICT RULES:
1. ONLY respond to travel-related queries (destinations, flights, hotels, itineraries, travel tips, budgets, etc.)
2. For ANY non-travel question, respond EXACTLY: "I'm here to help only with travel planning."
3. Be conversational and gather information step by step
4. Required information to collect:
   - Name
   - Email address
   - Source location (departure city/country)
   - Destination (where they want to travel)
   - Travel dates (departure and return dates)
   - Duration (number of days)
   - Budget (amount and currency)
   - Optional: Travel preferences (accommodation type, transport mode, interests)

5. Once you have ALL required information, generate a comprehensive itinerary with:
   - Recommended transportation options
   - Accommodation suggestions with price ranges
   - Day-wise activity plans
   - Detailed budget breakdown
   - Destination-specific travel tips

6. Ask for missing information naturally, one piece at a time
7. Keep responses concise but helpful
8. Maintain conversation context throughout the session`

    // Call Groq API with error handling
    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error("Groq API Error:", error)

        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes("401") || error.message.includes("unauthorized")) {
            return "Authentication failed. Please check your API key configuration."
          }
          if (error.message.includes("429") || error.message.includes("rate limit")) {
            return "Rate limit exceeded. Please try again in a moment."
          }
          if (error.message.includes("timeout")) {
            return "Request timed out. Please try again."
          }
          if (error.message.includes("network") || error.message.includes("fetch")) {
            return "Network error. Please check your internet connection and try again."
          }
        }

        return "I'm experiencing technical difficulties. Please try again in a moment."
      },
    })
  } catch (error) {
    console.error("Unexpected error in chat API:", error)

    // Handle different types of errors
    if (error instanceof Error) {
      // Network or API errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return new Response(
          JSON.stringify({
            error: "Network Error",
            message: "Unable to connect to the AI service. Please check your internet connection.",
          }),
          {
            status: 503,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Authentication errors
      if (error.message.includes("401") || error.message.includes("unauthorized")) {
        return new Response(
          JSON.stringify({
            error: "Authentication Error",
            message: "Invalid API credentials. Please check your configuration.",
          }),
          {
            status: 401,
            headers: { "Content-Type": "application/json" },
          },
        )
      }

      // Rate limiting errors
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        return new Response(
          JSON.stringify({
            error: "Rate Limit Error",
            message: "Too many requests. Please wait a moment before trying again.",
          }),
          {
            status: 429,
            headers: { "Content-Type": "application/json" },
          },
        )
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
