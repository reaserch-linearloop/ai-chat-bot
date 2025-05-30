import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  email: string
  password: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface ChatSession {
  _id?: ObjectId
  userId: ObjectId
  title: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
  lastMessage?: string
}

export interface ChatMessage {
  _id?: ObjectId
  chatId: ObjectId
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface AuthUser {
  id: string
  email: string
  name: string
}
