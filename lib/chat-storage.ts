import type { ChatData } from "./types"

const STORAGE_KEY = "travel-planner-chats"

export class ChatStorage {
  static getAllChats(): ChatData[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      return parsed.map((chat: any) => ({
        ...chat,
        session: {
          ...chat.session,
          createdAt: new Date(chat.session.createdAt),
        },
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
    } catch (error) {
      console.error("Error loading chats:", error)
      return []
    }
  }

  static saveChat(chatData: ChatData): void {
    if (typeof window === "undefined") return

    try {
      const allChats = this.getAllChats()
      const existingIndex = allChats.findIndex((chat) => chat.session.id === chatData.session.id)

      if (existingIndex >= 0) {
        allChats[existingIndex] = chatData
      } else {
        allChats.push(chatData)
      }

      // Keep only the last 50 chats to prevent storage overflow
      const limitedChats = allChats.slice(-50)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedChats))
    } catch (error) {
      console.error("Error saving chat:", error)
    }
  }

  static deleteChat(chatId: string): void {
    if (typeof window === "undefined") return

    try {
      const allChats = this.getAllChats()
      const filteredChats = allChats.filter((chat) => chat.session.id !== chatId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredChats))
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  static getChatById(chatId: string): ChatData | null {
    const allChats = this.getAllChats()
    return allChats.find((chat) => chat.session.id === chatId) || null
  }

  static generateChatTitle(firstMessage: string): string {
    // Extract destination or create a meaningful title from the first message
    const message = firstMessage.toLowerCase()

    // Common patterns to extract destinations
    const patterns = [
      /(?:to|visit|going to|traveling to|trip to)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
      /(?:in|at)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
      /([a-zA-Z\s]+?)\s+(?:trip|travel|vacation|holiday)/,
    ]

    for (const pattern of patterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        const destination = match[1].trim()
        if (destination.length > 2 && destination.length < 30) {
          return `Trip to ${destination.charAt(0).toUpperCase() + destination.slice(1)}`
        }
      }
    }

    // Fallback to truncated first message
    return firstMessage.length > 30 ? `${firstMessage.substring(0, 30)}...` : firstMessage || "New Trip Plan"
  }
}
