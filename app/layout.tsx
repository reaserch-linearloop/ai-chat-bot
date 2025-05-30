import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Travel Planner AI - Your Personal Travel Assistant",
  description:
    "Plan your perfect trip with AI-powered travel recommendations, itineraries, and personalized suggestions. Get flight, hotel, and activity recommendations tailored to your budget and preferences.",
  keywords: "travel planner, AI travel assistant, trip planning, itinerary generator, travel recommendations",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
