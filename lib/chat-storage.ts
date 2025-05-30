import type { ChatData } from "./types"

const STORAGE_KEY = "travel-planner-chats"

export class ChatStorage {
  static getAllChats(): ChatData[] {
    if (typeof window === "undefined") return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return []

      return parsed
        .map((chat: any) => {
          try {
            // Robust date parsing with fallbacks
            const parseDate = (dateValue: any): Date => {
              if (!dateValue) return new Date()
              if (dateValue instanceof Date) return dateValue
              if (typeof dateValue === "string" || typeof dateValue === "number") {
                const parsed = new Date(dateValue)
                return isNaN(parsed.getTime()) ? new Date() : parsed
              }
              return new Date()
            }

            return {
              ...chat,
              session: {
                ...chat.session,
                id: chat.session?.id || `chat-${Date.now()}`,
                title: chat.session?.title || "Untitled Chat",
                createdAt: parseDate(chat.session?.createdAt),
                messageCount: chat.session?.messageCount || 0,
                lastMessage: chat.session?.lastMessage || "",
              },
              messages: Array.isArray(chat.messages)
                ? chat.messages.map((msg: any) => ({
                    ...msg,
                    id: msg.id || `msg-${Date.now()}-${Math.random()}`,
                    role: msg.role || "user",
                    content: msg.content || "",
                    timestamp: parseDate(msg.timestamp),
                  }))
                : [],
            }
          } catch (error) {
            console.warn("Error parsing chat data:", error)
            return null
          }
        })
        .filter(Boolean) // Remove null entries
    } catch (error) {
      console.error("Error loading chats from localStorage:", error)
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY)
      return []
    }
  }

  static saveChat(chatData: ChatData): void {
    if (typeof window === "undefined") return

    try {
      // Validate chat data before saving
      if (!chatData || !chatData.session) {
        console.warn("Invalid chat data provided to saveChat")
        return
      }

      const allChats = this.getAllChats()
      const existingIndex = allChats.findIndex((chat) => chat.session.id === chatData.session.id)

      // Ensure dates are properly serializable
      const sanitizedChatData = {
        ...chatData,
        session: {
          ...chatData.session,
          createdAt: new Date(chatData.session.createdAt),
        },
        messages: chatData.messages.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }

      if (existingIndex >= 0) {
        allChats[existingIndex] = sanitizedChatData
      } else {
        allChats.push(sanitizedChatData)
      }

      // Keep only the last 50 chats to prevent storage overflow
      const limitedChats = allChats.slice(-50)

      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedChats))
    } catch (error) {
      console.error("Error saving chat to localStorage:", error)
      // Attempt to clear storage if it's corrupted
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch (clearError) {
        console.error("Failed to clear corrupted localStorage:", clearError)
      }
    }
  }

  static deleteChat(chatId: string): void {
    if (typeof window === "undefined") return

    try {
      if (!chatId) {
        console.warn("No chatId provided to deleteChat")
        return
      }

      const allChats = this.getAllChats()
      const filteredChats = allChats.filter((chat) => chat.session.id !== chatId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredChats))
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  static getChatById(chatId: string): ChatData | null {
    try {
      if (!chatId) return null
      const allChats = this.getAllChats()
      return allChats.find((chat) => chat.session.id === chatId) || null
    } catch (error) {
      console.error("Error getting chat by ID:", error)
      return null
    }
  }

  static generateChatTitle(firstMessage: string): string {
    try {
      if (!firstMessage || typeof firstMessage !== "string") {
        return "New Trip Plan"
      }

      const message = firstMessage.toLowerCase().trim()

      // Common patterns to extract destinations
      const patterns = [
        /(?:to|visit|going to|traveling to|trip to)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
        /(?:in|at)\s+([a-zA-Z\s]+?)(?:\s|$|,|\.|!|\?)/,
        /([a-zA-Z\s]+?)\s+(?:trip|travel|vacation|holiday)/,
      ]

      for (const pattern of patterns) {
        try {
          const match = message.match(pattern)
          if (match && match[1]) {
            const destination = match[1].trim()
            if (destination.length > 2 && destination.length < 30) {
              return `Trip to ${destination.charAt(0).toUpperCase() + destination.slice(1)}`
            }
          }
        } catch (patternError) {
          console.warn("Error matching pattern:", patternError)
          continue
        }
      }

      // Fallback to truncated first message
      return firstMessage.length > 30 ? `${firstMessage.substring(0, 30)}...` : firstMessage || "New Trip Plan"
    } catch (error) {
      console.error("Error generating chat title:", error)
      return "New Trip Plan"
    }
  }

  static clearAllChats(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing all chats:", error)
    }
  }

  static validateStorage(): boolean {
    if (typeof window === "undefined") return false

    try {
      const testKey = "test-storage"
      localStorage.setItem(testKey, "test")
      localStorage.removeItem(testKey)
      return true
    } catch (error) {
      console.error("localStorage is not available:", error)
      return false
    }
  }
}
