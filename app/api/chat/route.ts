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

      // Clean and validate messages to prevent duplicates
      const cleanedMessages = messages
        .filter((msg) => msg && msg.content && msg.content.trim())
        .map((msg, index) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content.trim(),
          timestamp: msg.timestamp || Date.now() + index, // Ensure unique timestamps
        }))

      // Remove consecutive duplicate messages
      const deduplicatedMessages = []
      for (let i = 0; i < cleanedMessages.length; i++) {
        const current = cleanedMessages[i]
        const previous = deduplicatedMessages[deduplicatedMessages.length - 1]

        // Only add if it's different from the previous message
        if (!previous || previous.role !== current.role || previous.content !== current.content) {
          deduplicatedMessages.push(current)
        }
      }

      messages = deduplicatedMessages
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

    const enhancedSystemPrompt = `You are a context-aware, multi-turn AI Travel Planner. Your role is to assist users in planning their travel itinerary. You must strictly adhere to the domain of travel planning only.

Capabilities:
- Maintain memory throughout the conversation to understand user context.
- Ask clarifying questions until all required fields are filled.
- Politely reject any requests or queries not related to travel planning.

Strict Instructions:
- Do NOT answer anything unrelated to travel. If asked, reply: "I'm here to help only with travel planning."
- Do NOT generate jokes, write code, or explain programming languages.
- Only answer questions or respond in the context of planning a trip.
- Ask questions one at a time, collect information, and maintain conversational tone.
- After collecting all necessary details, generate a personalized itinerary with:
    - Travel Mode Suggestions
    - Accommodation ideas
    - Day-wise Plan
    - Budget Breakdown

Required User Inputs:
- Name
- Email
- From (source location)
- To (destination)
- Travel dates
- Duration (number of days)
- Budget (in local currency)

Only proceed to itinerary generation once all required fields are gathered. Use user inputs from memory when responding. Always assume you are in an interactive travel planning session.`

    // Call Groq API with error handling
    const result = await streamText({
      model: groq("llama-3.1-8b-instant"),
      messages: [{ role: "system", content: enhancedSystemPrompt }, ...messages],
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
