import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { ChatSession, ChatMessage } from "@/lib/models"

export async function POST(request: NextRequest, { params }: { params: { chatId: string } }) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { messages: newMessages, title } = await request.json()

    if (!Array.isArray(newMessages) || newMessages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 })
    }

    const db = await getDatabase()
    const chats = db.collection<ChatSession>("chats")
    const messages = db.collection<ChatMessage>("messages")

    const chatId = new ObjectId(params.chatId)

    // Verify chat belongs to user
    const chat = await chats.findOne({ _id: chatId, userId: new ObjectId(user.id) })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Get existing messages to check for duplicates
    const existingMessages = await messages.find({ chatId }).sort({ timestamp: 1 }).toArray()

    // Create a set of existing message content for duplicate detection
    const existingMessageHashes = new Set(existingMessages.map((msg) => `${msg.role}:${msg.content.trim()}`))

    // Filter out duplicates and prepare new messages
    const uniqueNewMessages = newMessages
      .filter((msg) => {
        if (!msg || !msg.content || !msg.content.trim()) return false
        const hash = `${msg.role}:${msg.content.trim()}`
        return !existingMessageHashes.has(hash)
      })
      .map((msg, index) => {
        const timestamp = new Date()
        // Add milliseconds to ensure unique timestamps for ordering
        timestamp.setMilliseconds(timestamp.getMilliseconds() + index)

        return {
          chatId,
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content.trim(),
          timestamp,
        } as ChatMessage
      })

    // Only insert if we have unique messages
    if (uniqueNewMessages.length > 0) {
      await messages.insertMany(uniqueNewMessages)
    }

    // Get the total message count and last message for chat metadata
    const totalMessages = await messages.countDocuments({ chatId })
    const lastMessage = await messages.findOne({ chatId }, { sort: { timestamp: -1 } })

    // Update chat metadata
    const updateData: any = {
      updatedAt: new Date(),
      messageCount: totalMessages,
    }

    if (lastMessage) {
      updateData.lastMessage = lastMessage.content.substring(0, 100) // Truncate for preview
    }

    if (title && typeof title === "string" && title.trim()) {
      updateData.title = title.trim()
    }

    await chats.updateOne({ _id: chatId }, { $set: updateData })

    return NextResponse.json({
      success: true,
      savedMessages: uniqueNewMessages.length,
      totalMessages,
    })
  } catch (error) {
    console.error("Save messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
