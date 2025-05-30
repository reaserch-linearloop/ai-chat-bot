"use client"

import type React from "react"

import { useState, useCallback, useMemo } from "react"
import {
  Plus,
  MessageSquare,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import type { ChatSession } from "@/lib/types"

interface ChatSidebarProps {
  chats: ChatSession[]
  activeChat: string | null
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  onDeleteChat: (chatId: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function ChatSidebar({
  chats,
  activeChat,
  onChatSelect,
  onNewChat,
  onDeleteChat,
  isCollapsed,
  onToggleCollapse,
}: ChatSidebarProps) {
  const [deletingChat, setDeletingChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteChat = useCallback(
    (chatId: string, e: React.MouseEvent) => {
      e.stopPropagation()

      try {
        if (!chatId) {
          setError("Invalid chat ID")
          return
        }

        setDeletingChat(chatId)
        setError(null)

        setTimeout(() => {
          try {
            onDeleteChat(chatId)
            setDeletingChat(null)
          } catch (deleteError) {
            console.error("Error deleting chat:", deleteError)
            setError("Failed to delete chat")
            setDeletingChat(null)
          }
        }, 150)
      } catch (error) {
        console.error("Error in handleDeleteChat:", error)
        setError("Failed to delete chat")
        setDeletingChat(null)
      }
    },
    [onDeleteChat],
  )

  const handleChatSelect = useCallback(
    (chatId: string) => {
      try {
        if (!chatId) {
          setError("Invalid chat ID")
          return
        }
        setError(null)
        onChatSelect(chatId)
      } catch (error) {
        console.error("Error selecting chat:", error)
        setError("Failed to load chat")
      }
    },
    [onChatSelect],
  )

  const handleNewChat = useCallback(() => {
    try {
      setError(null)
      onNewChat()
    } catch (error) {
      console.error("Error creating new chat:", error)
      setError("Failed to create new chat")
    }
  }, [onNewChat])

  const filteredChats = useMemo(() => {
    try {
      if (!Array.isArray(chats)) return []

      return chats.filter((chat) => {
        try {
          if (!chat || !chat.title) return false

          const query = searchQuery.toLowerCase().trim()
          if (!query) return true

          const titleMatch = chat.title.toLowerCase().includes(query)
          const messageMatch = chat.lastMessage && chat.lastMessage.toLowerCase().includes(query)

          return titleMatch || messageMatch
        } catch (filterError) {
          console.warn("Error filtering chat:", filterError)
          return false
        }
      })
    } catch (error) {
      console.error("Error filtering chats:", error)
      return []
    }
  }, [chats, searchQuery])

  const formatDate = useCallback((date: Date | string | number): string => {
    try {
      let dateObj: Date

      if (date instanceof Date) {
        dateObj = date
      } else if (typeof date === "string" || typeof date === "number") {
        dateObj = new Date(date)
      } else {
        return "Unknown"
      }

      if (isNaN(dateObj.getTime())) {
        return "Invalid date"
      }

      const now = new Date()
      const diffInHours = (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60)

      if (diffInHours < 1) {
        return "Just now"
      } else if (diffInHours < 24) {
        return `${Math.floor(diffInHours)}h ago`
      } else if (diffInHours < 168) {
        // 7 days
        const days = Math.floor(diffInHours / 24)
        return `${days}d ago`
      } else {
        return dateObj.toLocaleDateString([], { month: "short", day: "numeric" })
      }
    } catch (error) {
      console.warn("Error formatting date:", error)
      return "Unknown"
    }
  }, [])

  const truncateText = useCallback((text: string, maxLength: number): string => {
    try {
      if (!text || typeof text !== "string") return ""
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
    } catch (error) {
      console.warn("Error truncating text:", error)
      return ""
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg",
        isCollapsed ? "w-16" : "w-80",
      )}
    >
      {/* Error Alert */}
      {error && !isCollapsed && (
        <div className="p-2">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 text-xs">
              {error}
              <Button onClick={clearError} variant="ghost" size="sm" className="ml-2 h-auto p-0 text-red-600">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Travel Plans</h2>
              <p className="text-xs text-gray-600">{Array.isArray(chats) ? chats.length : 0} conversations</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewChat}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all duration-200"
              title="New Trip Plan"
            >
              <Plus className="w-4 h-4" />
              {!isCollapsed && <span className="ml-1">New</span>}
            </Button>
            <Button
              onClick={onToggleCollapse}
              size="sm"
              variant="ghost"
              className="text-gray-500 hover:text-gray-700 hover:bg-white/50"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Search */}
        {!isCollapsed && (
          <div className="mt-3">
            {showSearch ? (
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    try {
                      setSearchQuery(e.target.value)
                    } catch (error) {
                      console.error("Error updating search query:", error)
                    }
                  }}
                  placeholder="Search conversations..."
                  className="pl-10 pr-10 h-9 text-sm bg-white/80 border-gray-200"
                  autoFocus
                />
                <Button
                  onClick={() => {
                    try {
                      setShowSearch(false)
                      setSearchQuery("")
                    } catch (error) {
                      console.error("Error closing search:", error)
                    }
                  }}
                  size="sm"
                  variant="ghost"
                  className="absolute right-1 top-1 h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  try {
                    setShowSearch(true)
                  } catch (error) {
                    console.error("Error opening search:", error)
                  }
                }}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-800 hover:bg-white/50"
              >
                <Search className="w-4 h-4 mr-2" />
                Search conversations...
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredChats.length === 0 ? (
            <div className={cn("text-center py-8 text-gray-500", isCollapsed && "px-2")}>
              {!isCollapsed ? (
                <>
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  {searchQuery ? (
                    <>
                      <p className="text-sm">No conversations found</p>
                      <p className="text-xs mt-1">Try a different search term</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">No travel plans yet</p>
                      <p className="text-xs mt-1">Start planning your next adventure!</p>
                    </>
                  )}
                </>
              ) : (
                <MessageSquare className="w-6 h-6 mx-auto text-gray-400" />
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                try {
                  const chatId = chat.id || chat._id || `fallback-${Date.now()}`
                  const chatTitle = chat.title || "Untitled Chat"
                  const chatDate = chat.createdAt || new Date()
                  const messageCount = chat.messageCount || 0
                  const lastMessage = chat.lastMessage || ""

                  return (
                    <div
                      key={chatId}
                      onClick={() => handleChatSelect(chatId)}
                      className={cn(
                        "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent",
                        activeChat === chatId
                          ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200 shadow-md"
                          : "hover:border-gray-200 hover:shadow-sm",
                        deletingChat === chatId && "opacity-50 scale-95",
                        isCollapsed && "p-2",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {!isCollapsed ? (
                            <>
                              <h3 className="font-medium text-gray-900 text-sm truncate mb-1">{chatTitle}</h3>
                              {lastMessage && (
                                <p className="text-xs text-gray-600 truncate mb-2">{truncateText(lastMessage, 60)}</p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{formatDate(chatDate)}</span>
                                <span>•</span>
                                <span>{messageCount} messages</span>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center">
                              <MessageSquare className="w-5 h-5 text-gray-600" />
                              <div
                                className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 transition-opacity duration-200"
                                style={{ opacity: activeChat === chatId ? 1 : 0 }}
                              />
                            </div>
                          )}
                        </div>

                        {!isCollapsed && (
                          <Button
                            onClick={(e) => handleDeleteChat(chatId, e)}
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
                            disabled={deletingChat === chatId}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                } catch (renderError) {
                  console.warn("Error rendering chat item:", renderError)
                  return null
                }
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Your travel plans are saved securely</p>
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Auto-saved</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
