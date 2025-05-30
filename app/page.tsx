"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState, useEffect, useRef } from "react"
import { Send, Bot, User, Plane, MapPin, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TravelPlannerChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
      setErrorMessage(getErrorMessage(error))
    },
  })

  const [isTyping, setIsTyping] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

    // Clear any existing errors
    setErrorMessage(null)
    setIsTyping(true)

    try {
      await handleSubmit(e)
      setRetryCount(0) // Reset retry count on successful submission
    } catch (error) {
      console.error("Submit error:", error)
      setErrorMessage("Failed to send message. Please try again.")
    } finally {
      setTimeout(() => setIsTyping(false), 1500)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Travel Planner AI</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Your intelligent travel planning assistant
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-180px)] flex flex-col bg-white/80 backdrop-blur-sm shadow-xl border-0">
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
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Welcome to Travel Planner AI!</h2>
                <p className="text-gray-600 max-w-lg mx-auto leading-relaxed">
                  I'm your personal travel planning assistant. I'll help you create the perfect itinerary by gathering
                  your travel preferences and generating customized recommendations.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                  <p>✈️ Flight recommendations • 🏨 Hotel suggestions • 📅 Day-wise planning • 💰 Budget breakdown</p>
                </div>

                {/* Example prompts */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  <div className="text-left p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800 font-medium">Try asking:</p>
                    <p className="text-xs text-blue-600 mt-1">"I want to plan a trip to Japan for 7 days"</p>
                  </div>
                  <div className="text-left p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-sm text-indigo-800 font-medium">Or say:</p>
                    <p className="text-xs text-indigo-600 mt-1">"Help me plan a budget trip to Europe"</p>
                  </div>
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
                  <div className="whitespace-pre-wrap leading-relaxed text-sm">{message.content}</div>
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
            {(isLoading || isTyping) && (
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
                    <span className="text-xs text-gray-500 ml-2">Planning your trip...</span>
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
                placeholder="Tell me about your travel plans... (e.g., I want to visit Paris)"
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
                🌍 I specialize in travel planning • Ask me about destinations, itineraries, budgets, and more!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
