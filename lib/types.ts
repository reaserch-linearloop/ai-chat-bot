export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  lastMessage?: string
  messageCount: number
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export interface ChatData {
  session: ChatSession
  messages: ChatMessage[]
}
