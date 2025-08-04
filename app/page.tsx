"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Send,
  Bot,
  User,
  Plane,
  MapPin,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  LogOut,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  Mic,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatSidebar } from "@/components/chat-sidebar"
import { AuthForm } from "@/components/auth/auth-form"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { SpeechPanel } from "@/components/speech-panel"
import type { ChatSession, AuthUser } from "@/lib/models"
import { ErrorBoundary } from "@/components/error-boundary"

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center p-6">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-gray-600 mb-4">We encountered an unexpected error. Please try refreshing the page.</p>
        <div className="space-y-2">
          <Button onClick={resetErrorBoundary} className="w-full">
            Try Again
          </Button>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Refresh Page
          </Button>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500">Error Details</summary>
            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">{error.message}</pre>
          </details>
        )}
      </Card>
    </div>
  )
}

export default function TravelPlannerChatbot() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatSession[]>([])
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [speechPanelVisible, setSpeechPanelVisible] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastSavedMessageCount = useRef(0)

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload, setMessages, setInput } = useChat(
    {
      api: "/api/chat",
      onError: (error) => {
        console.error("Chat error:", error)
        setErrorMessage(getErrorMessage(error))
        setIsTyping(false)
      },
      onFinish: (message) => {
        setIsTyping(false)
        // Save the conversation after each AI response with proper deduplication
        if (activeChat && user && token) {
          const newMessages = [...messages, { id: Date.now().toString(), role: "assistant", content: message.content }]
          saveMessages(newMessages)
        }
      },
    },
  )

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

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const handleAuth = useCallback((authUser: AuthUser, authToken: string) => {
    setUser(authUser)
    setToken(authToken)
    localStorage.setItem("travel-planner-token", authToken)
    localStorage.setItem("travel-planner-user", JSON.stringify(authUser))
  }, [])

  const handleLogout = useCallback(() => {
    setUser(null)
    setToken(null)
    setChats([])
    setActiveChat(null)
    setMessages([])
    localStorage.removeItem("travel-planner-token")
    localStorage.removeItem("travel-planner-user")
    lastSavedMessageCount.current = 0
  }, [setMessages])

  const loadChats = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch("/api/chats", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error(`Failed to load chats: ${response.status}`)
      }

      const userChats = await response.json()

      // Validate the response
      if (!Array.isArray(userChats)) {
        console.warn("Invalid chats response format")
        setChats([])
        return
      }

      // Sanitize chat data
      const sanitizedChats = userChats.map((chat) => ({
        ...chat,
        _id: chat._id || `chat-${Date.now()}`,
        title: chat.title || "Untitled Chat",
        createdAt: new Date(chat.createdAt || Date.now()),
        messageCount: chat.messageCount || 0,
        lastMessage: chat.lastMessage || "",
      }))

      setChats(sanitizedChats)

      // Load the most recent chat if available and no active chat
      if (sanitizedChats.length > 0 && !activeChat) {
        loadChat(sanitizedChats[0]._id)
      }
    } catch (error) {
      console.error("Error loading chats:", error)
      setErrorMessage("Failed to load your conversations. Please try refreshing the page.")
    }
  }, [token, activeChat])

  const loadChat = useCallback(
    async (chatId: string) => {
      if (!token || !chatId) return

      try {
        const response = await fetch(`/api/chats/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error(`Failed to load chat: ${response.status}`)
        }

        const chatMessages = await response.json()
        setActiveChat(chatId)

        // Validate and sanitize messages
        const validMessages = Array.isArray(chatMessages) ? chatMessages : []

        // Remove duplicates and ensure proper ordering
        const uniqueMessages = []
        const seenMessages = new Set()

        for (const msg of validMessages) {
          const messageKey = `${msg.role}:${msg.content?.trim()}`
          if (!seenMessages.has(messageKey) && msg.content?.trim()) {
            seenMessages.add(messageKey)
            uniqueMessages.push({
              id: msg._id?.toString() || `msg-${Date.now()}-${uniqueMessages.length}`,
              role: msg.role === "assistant" ? "assistant" : "user",
              content: msg.content.trim(),
            })
          }
        }

        setMessages(uniqueMessages)
        lastSavedMessageCount.current = uniqueMessages.length
        setErrorMessage(null)
        setMobileMenuOpen(false)
      } catch (error) {
        console.error("Error loading chat:", error)
        setErrorMessage("Failed to load this conversation. Please try selecting another chat.")
      }
    },
    [token, setMessages],
  )

  const createNewChat = useCallback(async () => {
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
        lastSavedMessageCount.current = 0
        setErrorMessage(null)
        setMobileMenuOpen(false)
      }
    } catch (error) {
      console.error("Error creating chat:", error)
      setErrorMessage("Failed to create new chat. Please try again.")
    }
  }, [token, setMessages])

  const deleteChat = useCallback(
    async (chatId: string) => {
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
        setErrorMessage("Failed to delete chat. Please try again.")
      }
    },
    [token, activeChat, chats, loadChat, createNewChat],
  )

  const saveMessages = useCallback(
    async (messagesToSave: any[]) => {
      if (!activeChat || !token || messagesToSave.length === 0 || isSaving) return

      // Only save if we have new messages
      if (messagesToSave.length <= lastSavedMessageCount.current) {
        return
      }

      setIsSaving(true)

      try {
        // Get only the new messages that haven't been saved yet
        const newMessages = messagesToSave.slice(lastSavedMessageCount.current)

        if (newMessages.length === 0) {
          setIsSaving(false)
          return
        }

        // Generate title from first user message if this is a new chat
        const firstUserMessage = messagesToSave.find((msg) => msg.role === "user")?.content
        const title = firstUserMessage ? generateChatTitle(firstUserMessage) : undefined

        const response = await fetch(`/api/chats/${activeChat}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: newMessages,
            title,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          lastSavedMessageCount.current = messagesToSave.length
          console.log(`Saved ${result.savedMessages} new messages`)

          // Refresh chats to update metadata
          loadChats()
        } else {
          console.error("Failed to save messages:", response.status)
        }
      } catch (error) {
        console.error("Error saving messages:", error)
      } finally {
        setIsSaving(false)
      }
    },
    [activeChat, token, isSaving, loadChats],
  )

  const generateChatTitle = useCallback((firstMessage: string): string => {
    try {
      if (!firstMessage || typeof firstMessage !== "string") {
        return "New Trip Plan"
      }

      const message = firstMessage.toLowerCase().trim()
      if (!message) return "New Trip Plan"

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

      return firstMessage.length > 30 ? `${firstMessage.substring(0, 30)}...` : firstMessage || "New Trip Plan"
    } catch (error) {
      console.error("Error generating chat title:", error)
      return "New Trip Plan"
    }
  }, [])

  const getErrorMessage = useCallback((error: Error): string => {
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
  }, [])

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!input.trim() || isLoading || isSaving) return

      // Create new chat if none exists
      if (!activeChat) {
        await createNewChat()
      }

      // Clear any existing errors
      setErrorMessage(null)
      setIsTyping(true)

      try {
        await handleSubmit(e)
        setRetryCount(0)

        // Save user message immediately to prevent duplicates
        const userMessage = { id: Date.now().toString(), role: "user", content: input.trim() }
        const newMessages = [...messages, userMessage]

        // Update local state immediately
        setMessages(newMessages)

        // Save to database
        saveMessages(newMessages)
      } catch (error) {
        console.error("Submit error:", error)
        setErrorMessage("Failed to send message. Please try again.")
        setIsTyping(false)
      }
    },
    [input, isLoading, isSaving, activeChat, createNewChat, handleSubmit, messages, setMessages, saveMessages],
  )

  const handleRetry = useCallback(async () => {
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
  }, [retryCount, reload])

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  // Speech panel handlers
  const handleTranscriptChange = useCallback(
    (transcript: string) => {
      setInput(transcript)
    },
    [setInput],
  )

  const handleSpeakText = useCallback((text: string) => {
    // This is handled by the speech panel itself
  }, [])

  // Get last assistant message for speech
  const lastAssistantMessage = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant")?.content

  // Show auth form if not authenticated
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      {!user || !token ? (
        <AuthForm onAuth={handleAuth} />
      ) : (
        <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 overflow-hidden">
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            } md:translate-x-0 fixed md:relative z-50 transition-transform duration-300 ease-in-out`}
          >
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
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b backdrop-blur-sm bg-white/95">
              <div className="px-4 md:px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Mobile Menu Button */}
                    <Button
                      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                      variant="ghost"
                      size="sm"
                      className="md:hidden text-gray-600 hover:text-gray-800"
                    >
                      {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>

                    <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                      <Plane className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Travel Planner AI</h1>
                      <p className="text-xs md:text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">Welcome back, {user.name}!</span>
                        {isSaving && <span className="text-blue-600 ml-2">Saving...</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Speech Panel Toggle */}
                    <Button
                      onClick={() => setSpeechPanelVisible(!speechPanelVisible)}
                      variant="outline"
                      size="sm"
                      className={`text-gray-600 hover:text-gray-800 ${speechPanelVisible ? "bg-blue-50 border-blue-200" : ""}`}
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      <span className="hidden md:inline">Speech</span>
                    </Button>

                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 hidden md:flex bg-transparent"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>

                    {/* Mobile Logout */}
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="md:hidden text-gray-600">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 p-3 md:p-6 min-h-0">
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
                            className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100 bg-transparent"
                            disabled={retryCount >= 3}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Retry {retryCount > 0 && `(${retryCount}/3)`}
                          </Button>
                          <Button
                            onClick={handleRefresh}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-100 bg-transparent"
                          >
                            Refresh Page
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                  {/* Welcome Message */}
                  {messages.length === 0 && (
                    <div className="text-center py-8 md:py-16">
                      <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <Bot className="w-8 h-8 md:w-10 md:h-10 text-white" />
                      </div>
                      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                        {activeChat ? "Continue Your Travel Planning" : "Welcome to Travel Planner AI!"}
                      </h2>
                      <p className="text-gray-600 max-w-lg mx-auto leading-relaxed mb-6 text-sm md:text-base px-4">
                        I'm your context-aware travel planning assistant. I'll remember our entire conversation and help
                        you create the perfect itinerary by gathering your preferences step by step.
                      </p>

                      {/* Information Collection Process */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 md:p-6 max-w-2xl mx-auto mb-6 border border-blue-100">
                        <h3 className="text-base md:text-lg font-semibold text-blue-900 mb-4 flex items-center justify-center gap-2">
                          <Sparkles className="w-5 h-5" />
                          How I'll Help You Plan
                        </h3>
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto px-4">
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
                          🎯 I only help with travel planning • 🧠 I remember our entire conversation • ✈️ I create
                          detailed itineraries • 🎤 Use speech for hands-free interaction
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Chat Messages */}
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 md:gap-4 ${message.role === "user" ? "justify-end" : "justify-start"} ${
                        index === 0 ? "animate-in slide-in-from-bottom-4 duration-500" : ""
                      }`}
                    >
                      {/* Assistant Avatar */}
                      {message.role === "assistant" && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                            <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 md:px-5 py-3 shadow-sm transition-all duration-200 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-gray-50 text-gray-800 border border-gray-100 hover:shadow-md"
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
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-600 rounded-full flex items-center justify-center shadow-md">
                            <User className="w-4 h-4 md:w-5 md:h-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing Indicator */}
                  {(isLoading || isTyping) && (
                    <div className="flex gap-3 md:gap-4 justify-start animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                          <Bot className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 md:px-5 py-3 shadow-sm">
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
                <div className="border-t bg-gray-50/50 backdrop-blur-sm p-3 md:p-4">
                  <form onSubmit={onSubmit} className="flex gap-2 md:gap-3">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Tell me about your travel plans... (or use speech)"
                      className="flex-1 border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white shadow-sm text-sm md:text-base"
                      disabled={isLoading || isSaving}
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || isSaving || !input.trim()}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 md:px-6 shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      {isLoading || isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </form>

                  {/* Helper Text */}
                  <div className="mt-3 text-center">
                    <p className="text-xs text-gray-500">
                      🧠 Context-aware AI • 🎯 Travel planning only • 📝 All chats saved to your account
                      {isSaving && " • 💾 Saving..."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Speech Panel */}
          <SpeechPanel
            onTranscriptChange={handleTranscriptChange}
            onSpeakText={handleSpeakText}
            lastAssistantMessage={lastAssistantMessage}
            isVisible={speechPanelVisible}
            onToggleVisibility={() => setSpeechPanelVisible(!speechPanelVisible)}
          />
        </div>
      )}
    </ErrorBoundary>
  )
}
