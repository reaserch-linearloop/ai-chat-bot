import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { ChatSession } from "@/lib/models"

export async function GET(request: NextRequest) {
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

    const userChats = await chats
      .find({ userId: new ObjectId(user.id) })
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json(userChats)
  } catch (error) {
    console.error("Get chats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const { title } = await request.json()

    const db = await getDatabase()
    const chats = db.collection<ChatSession>("chats")

    const newChat: ChatSession = {
      userId: new ObjectId(user.id),
      title: title || "New Trip Plan",
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    }

    const result = await chats.insertOne(newChat)
    const createdChat = { ...newChat, _id: result.insertedId }

    return NextResponse.json(createdChat)
  } catch (error) {
    console.error("Create chat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
