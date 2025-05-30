"use client"

import type React from "react"

import { useChat } from "ai/react"
import { useState } from "react"
import { Send, Bot, User, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export default function TravelPlannerChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
  const [isTyping, setIsTyping] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsTyping(true)
    handleSubmit(e)

    // Reset typing indicator after a delay
    setTimeout(() => setIsTyping(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Travel Planner AI</h1>
              <p className="text-sm text-gray-600">Your personal travel planning assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card className="h-[calc(100vh-200px)] flex flex-col bg-white shadow-lg">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Travel Planner AI!</h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  I'm here to help you plan your perfect trip. Tell me where you'd like to go, and I'll help you create
                  an amazing itinerary!
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>

                {message.role === "user" && (
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(isLoading || isTyping) && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t bg-gray-50 p-4">
            <form onSubmit={onSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Tell me about your travel plans..."
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              I can help you plan trips, find destinations, create itineraries, and provide travel advice.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
