"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Plane, MapPin, AlertCircle, RefreshCw, CheckCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatSidebar } from "@/components/chat-sidebar"
import { AuthForm } from "@/components/auth/auth-form"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import type { ChatSession, ChatMessage, AuthUser } from "@/lib/models"

export default function TravelPlannerChatbot() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, setMessages } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
      setErrorMessage(getErrorMessage(error))
    },
    onFinish: (message) => {
      // Save the conversation after each AI response
      if (activeChat && user && token) {
        saveMessages([...messages, { id: Date.now().toString(), role: "assistant", content: message.content }])
      }
    },
  })

  // Check for stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("travel-planner-token")
    const storedUser = localStorage.getItem("travel-planner-user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        localStorage.removeItem("travel-planner-token")
        localStorage.removeItem("travel-planner-user")
      }
    }
  }, [])

  // Load chats when user is authenticated
  useEffect(() => {
    if (user && token) {
      loadChats()
    }
  }, [user, token])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Clear error message when user starts typing
  useEffect(() => {
    if (input && errorMessage) {
      setErrorMessage(null)
    }
  }, [input, errorMessage])

  const handleAuth = (authUser: AuthUser, authToken: string) => {
    setUser(authUser)
    setToken(authToken)
    localStorage.setItem("travel-planner-token", authToken)
    localStorage.setItem("travel-planner-user", JSON.stringify(authUser))
  }

  const handleLogout = () => {
    setUser(null)
    setToken(null)
    setChats([])
    setActiveChat(null)
    setMessages([])
    localStorage.removeItem("travel-planner-token")
    localStorage.removeItem("travel-planner-user")
  }

  const loadChats = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userChats = await response.json()
        setChats(userChats)

        // Load the most recent chat if available
        if (userChats.length > 0 && !activeChat) {
          loadChat(userChats[0]._id)
        }
      }
    } catch (error) {
      console.error("Error loading chats:", error)
    }
  }

  const loadChat = async (chatId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const chatMessages = await response.json()
        setActiveChat(chatId)

        // Convert to useChat format
        const formattedMessages = chatMessages.map((msg: ChatMessage) => ({
          id: msg._id?.toString() || Date.now().toString(),
          role: msg.role,
          content: msg.content,
        }))

        setMessages(formattedMessages)
        setErrorMessage(null)
      }
    } catch (error) {
      console.error("Error loading chat:", error)
    }
  }

  const createNewChat = async () => {
    if (!token) return

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "New Trip Plan" }),
      })

      if (response.ok) {
        const newChat = await response.json()
        setChats((prev) => [newChat, ...prev])
        setActiveChat(newChat._id)
        setMessages([])
        setErrorMessage(null)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
    }
  }

  const deleteChat = async (chatId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        setChats((prev) => prev.filter((chat) => chat._id !== chatId))

        if (activeChat === chatId) {
          const remainingChats = chats.filter((chat) => chat._id !== chatId)
          if (remainingChats.length > 0) {
            loadChat(remainingChats[0]._id!)
          } else {
            createNewChat()
          }
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error)
    }
  }

  const saveMessages = async (messagesToSave: any[]) => {
    if (!activeChat || !token || messagesToSave.length === 0) return

    try {
      // Generate title from first user message if this is a new chat
      const firstUserMessage = messagesToSave.find((msg) => msg.role === "user")?.content
      const title = firstUserMessage ? generateChatTitle(firstUserMessage) : undefined

      await fetch(`/api/chats/${activeChat}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: messagesToSave,
          title,
        }),
      })

      // Refresh chats to update metadata
      loadChats()
    } catch (error) {
      console.error("Error saving messages:", error)
    }
  }

  const generateChatTitle = (firstMessage: string): string => {
    const message = firstMessage.toLowerCase()
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

    return firstMessage.length > 30 ? `${firstMessage.substring(0, 30)}...` : firstMessage || "New Trip Plan"
  }

  const getErrorMessage = (error: Error): string => {
    const message = error.message.toLowerCase()

    if (message.includes("network") || message.includes("fetch")) {
      return "Network connection issue. Please check your internet and try again."
    }
    if (message.includes("401") || message.includes("unauthorized")) {
      return "Authentication error. The service is temporarily unavailable."
    }
    if (message.includes("429") || message.includes("rate limit")) {
      return "Too many requests. Please wait a moment before trying again."
    }
    if (message.includes("timeout")) {
      return "Request timed out. Please try again."
    }
    if (message.includes("configuration") || message.includes("api key")) {
      return "Service configuration issue. Please try again later."
    }

    return "Something went wrong. Please try again."
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Create new chat if none exists
    if (!activeChat) {
      await createNewChat()
    }

    // Clear any existing errors
    setErrorMessage(null)

    try {
      await handleSubmit(e)
      setRetryCount(0)

      // Save user message
      setTimeout(() => {
        const newMessages = [...messages, { id: Date.now().toString(), role: "user", content: input }]
        saveMessages(newMessages)
      }, 100)
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Failed to send message. Please try again.")
    }
  }

  const handleRetry = async () => {
    if (retryCount >= 3) {
      setErrorMessage("Multiple attempts failed. Please refresh the page and try again.")
      return
    }

    setRetryCount((prev) => prev + 1)
    setErrorMessage(null)

    try {
      await reload()
    } catch (error) {
      console.error("Retry error:", error)
      setErrorMessage("Retry failed. Please check your connection.")
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  // Show auth form if not authenticated
  if (!user || !token) {
    return <AuthForm onAuth={handleAuth} />
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Sidebar */}
      <ChatSidebar
        chats={chats.map((chat) => ({
          id: chat._id!,
          title: chat.title,
          createdAt: chat.createdAt,
          lastMessage: chat.lastMessage,
          messageCount: chat.messageCount,
        }))}
        activeChat={activeChat}
        onChatSelect={loadChat}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                  <Plane className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Travel Planner AI</h1>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Welcome back, {user.name}!
                  </p>
                </div>
              </div>

              <Button onClick={handleLogout} variant="outline" size="sm" className="text-gray-600 hover:text-gray-800">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 p-6">
          <Card className="h-full flex flex-col bg-white/80 backdrop-blur-sm shadow-xl border-0">
            {/* Error Alert */}
            {(error || errorMessage) && (
              <div className="p-4 border-b">
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {errorMessage || getErrorMessage(error)}
                    <div className="flex gap-2 mt-2">
                      <Button
                        onClick={handleRetry}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100"
                        disabled={retryCount >= 3}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry {retryCount > 0 && `(${retryCount}/3)`}
                      </Button>
                      <Button
                        onClick={handleRefresh}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100"
                      >
                        Refresh Page
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Welcome Message */}
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Bot className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    {activeChat ? "Continue Your Travel Planning" : "Welcome to Travel Planner AI!"}
                  </h2>
                  <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-6">
                    I'm your context-aware travel planning assistant. I'll remember our entire conversation and help you
                    create the perfect itinerary by gathering your preferences step by step.
                  </p>

                  {/* Information Collection Process */}
                  <div className="bg-blue-50 rounded-xl p-6 max-w-2xl mx-auto mb-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">How I'll Help You Plan:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Personal Details</p>
                          <p className="text-gray-600">Name & Email</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Travel Route</p>
                          <p className="text-gray-600">From & To locations</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Schedule</p>
                          <p className="text-gray-600">Dates & Duration</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Budget</p>
                          <p className="text-gray-600">Your travel budget</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Example prompts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    <div className="text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium mb-1">Start with:</p>
                      <p className="text-xs text-blue-700">"I want to plan a trip to Japan"</p>
                    </div>
                    <div className="text-left p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                      <p className="text-sm text-indigo-800 font-medium mb-1">Or say:</p>
                      <p className="text-xs text-indigo-700">"Help me plan a budget trip to Europe"</p>
                    </div>
                  </div>

                  <div className="mt-6 text-xs text-gray-500">
                    <p>
                      🎯 I only help with travel planning • 🧠 I remember our entire conversation • ✈️ I create detailed
                      itineraries
                    </p>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Assistant Avatar */}
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                        : "bg-gray-50 text-gray-800 border border-gray-100"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <MarkdownRenderer content={message.content} />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
                    )}
                  </div>

                  {/* User Avatar */}
                  {message.role === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Analyzing your travel needs...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t bg-gray-50/50 backdrop-blur-sm p-4">
              <form onSubmit={onSubmit} className="flex gap-3">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Tell me about your travel plans... (I'll remember everything we discuss)"
                  className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm"
                  disabled={isLoading}
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 shadow-md transition-all duration-200"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>

              {/* Helper Text */}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  🧠 Context-aware AI • 🎯 Travel planning only • 📝 All chats saved to your account
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
