"use client"

import type React from "react"

import { useState } from "react"
import { Plus, MessageSquare, Trash2, Calendar, ChevronLeft, ChevronRight, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
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

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingChat(chatId)
    setTimeout(() => {
      onDeleteChat(chatId)
      setDeletingChat(null)
    }, 150)
  }

  const filteredChats = chats.filter(
    (chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const formatDate = (date: Date) => {
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      return "Just now"
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else if (diffInHours < 168) {
      // 7 days
      const days = Math.floor(diffInHours / 24)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-lg",
        isCollapsed ? "w-16" : "w-80",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Travel Plans</h2>
              <p className="text-xs text-gray-600">{chats.length} conversations</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button
              onClick={onNewChat}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="pl-10 pr-10 h-9 text-sm bg-white/80 border-gray-200"
                  autoFocus
                />
                <Button
                  onClick={() => {
                    setShowSearch(false)
                    setSearchQuery("")
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
                onClick={() => setShowSearch(true)}
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
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onChatSelect(chat.id)}
                  className={cn(
                    "group relative p-3 rounded-xl cursor-pointer transition-all duration-200",
                    "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border border-transparent",
                    activeChat === chat.id
                      ? "bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200 shadow-md"
                      : "hover:border-gray-200 hover:shadow-sm",
                    deletingChat === chat.id && "opacity-50 scale-95",
                    isCollapsed && "p-2",
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {!isCollapsed ? (
                        <>
                          <h3 className="font-medium text-gray-900 text-sm truncate mb-1">{chat.title}</h3>
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-600 truncate mb-2">{truncateText(chat.lastMessage, 60)}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500">
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
                            className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 transition-opacity duration-200"
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
                        className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 h-auto text-gray-400 hover:text-red-500 hover:bg-red-50"
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
