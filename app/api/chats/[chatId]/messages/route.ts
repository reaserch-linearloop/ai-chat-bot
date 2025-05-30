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

    const db = await getDatabase()
    const chats = db.collection<ChatSession>("chats")
    const messages = db.collection<ChatMessage>("messages")

    const chatId = new ObjectId(params.chatId)

    // Verify chat belongs to user
    const chat = await chats.findOne({ _id: chatId, userId: new ObjectId(user.id) })
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Save new messages
    const messagesToInsert: ChatMessage[] = newMessages.map((msg: any) => ({
      chatId,
      role: msg.role,
      content: msg.content,
      timestamp: new Date(),
    }))

    if (messagesToInsert.length > 0) {
      await messages.insertMany(messagesToInsert)
    }

    // Update chat metadata
    const lastMessage = newMessages[newMessages.length - 1]?.content
    await chats.updateOne(
      { _id: chatId },
      {
        $set: {
          updatedAt: new Date(),
          messageCount: await messages.countDocuments({ chatId }),
          ...(lastMessage && { lastMessage }),
          ...(title && { title }),
        },
      },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Save messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
