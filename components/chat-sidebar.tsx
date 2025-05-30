"use client"

import type React from "react"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingChat(chatId)
    setTimeout(() => {
      onDeleteChat(chatId)
      setDeletingChat(null)
    }, 150)
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 168) {
      // 7 days
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-80",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="text-lg font-semibold text-gray-900">Travel Plans</h2>}
          <div className="flex items-center gap-2">
            <Button
              onClick={onNewChat}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              title="New Trip Plan"
            >
              <Plus className="w-4 h-4" />
              {!isCollapsed && <span className="ml-1">New Trip</span>}
            </Button>
            <Button onClick={onToggleCollapse} size="sm" variant="ghost" className="text-gray-500 hover:text-gray-700">
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className={cn("text-center py-8 text-gray-500", isCollapsed && "px-2")}>
              {!isCollapsed ? (
                <>
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No travel plans yet</p>
                  <p className="text-xs mt-1">Start planning your next adventure!</p>
                </>
              ) : (
                <MessageSquare className="w-6 h-6 mx-auto text-gray-400" />
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={cn(
                    "group relative p-3 rounded-lg cursor-pointer transition-all duration-200",
                    "hover:bg-gray-50 border border-transparent",
                    activeChat === chat.id ? "bg-blue-50 border-blue-200 shadow-sm" : "hover:border-gray-200",
                    deletingChat === chat.id && "opacity-50 scale-95",
                    isCollapsed && "p-2",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {!isCollapsed ? (
                        <>
                          <h3 className="font-medium text-gray-900 text-sm truncate">{chat.title}</h3>
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-500 mt-1 truncate">{chat.lastMessage}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(chat.createdAt)}</span>
                            <span>•</span>
                            <span>{chat.messageCount} messages</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center">
                          <MessageSquare className="w-5 h-5 text-gray-600" />
                          <div
                            className="w-1 h-1 bg-blue-500 rounded-full mt-1"
                            style={{ opacity: activeChat === chat.id ? 1 : 0 }}
                          />
                        </div>
                      )}
                    </div>

                    {!isCollapsed && (
                      <Button
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        size="sm"
                        variant="ghost"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 text-center">Your travel plans are saved locally</p>
        </div>
      )}
    </div>
  )
}
