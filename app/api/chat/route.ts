import { createOpenAI } from "@ai-sdk/openai"
import { streamText } from "ai"

// Create Groq client using OpenAI-compatible interface
const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    const systemPrompt = `You are a helpful travel planner AI assistant. Your role is strictly limited to travel planning and related topics.

IMPORTANT RULES:
1. ONLY answer travel-related questions (destinations, itineraries, accommodations, transportation, budgets, travel tips, etc.)
2. If asked about non-travel topics, politely respond: "I'm here to help only with travel planning."
3. Be conversational and friendly while gathering information
4. Collect the following information from users before generating an itinerary:
   - Name
   - Email
   - Source location (departure city/country)
   - Destination (where they want to travel)
   - Travel dates (departure and return)
   - Duration (number of days)
   - Budget (approximate amount and currency)
   - Optional: Travel preferences (accommodation type, travel mode, interests)

5. Once you have all required information, generate a detailed itinerary including:
   - Transportation recommendations
   - Accommodation suggestions
   - Day-wise activity plans
   - Budget breakdown
   - Travel tips specific to the destination

6. Ask for missing information one piece at a time in a natural conversation flow
7. Be helpful, informative, and maintain context throughout the conversation
8. Do not hallucinate or provide false information about places, prices, or travel requirements`

    const result = streamText({
      model: groq("mixtral-8x7b-32768"),
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.7,
      maxTokens: 1000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response("Error processing request", { status: 500 })
  }
}
