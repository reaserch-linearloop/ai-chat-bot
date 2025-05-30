import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { ChatSession, ChatMessage } from "@/lib/models"

export async function GET(request: NextRequest, { params }: { params: { chatId: string } }) {
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

    const db = await getDatabase()
    const chats = db.collection<ChatSession>("chats")
    const messages = db.collection<ChatMessage>("messages")

    const chatId = new ObjectId(params.chatId)

    // Verify chat belongs to user
    const chat = await chats.findOne({ _id: chatId, userId: new ObjectId(user.id) })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Get messages with proper ordering and deduplication
    const chatMessages = await messages
      .find({ chatId })
      .sort({ timestamp: 1 }) // Ensure chronological order
      .toArray()

    // Remove any potential duplicates that might exist in the database
    const deduplicatedMessages = []
    const seenMessages = new Set()

    for (const message of chatMessages) {
      const messageKey = `${message.role}:${message.content.trim()}`

      if (!seenMessages.has(messageKey)) {
        seenMessages.add(messageKey)
        deduplicatedMessages.push({
          _id: message._id,
          role: message.role,
          content: message.content,
          timestamp: message.timestamp,
        })
      }
    }

    return NextResponse.json(deduplicatedMessages)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { chatId: string } }) {
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

    const db = await getDatabase()
    const chats = db.collection<ChatSession>("chats")
    const messages = db.collection<ChatMessage>("messages")

    const chatId = new ObjectId(params.chatId)

    // Verify chat belongs to user
    const chat = await chats.findOne({ _id: chatId, userId: new ObjectId(user.id) })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Delete messages and chat
    await messages.deleteMany({ chatId })
    await chats.deleteOne({ _id: chatId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
