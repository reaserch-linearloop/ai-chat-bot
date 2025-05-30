"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => <h1 className="text-lg font-bold text-gray-900 mb-2 mt-4 first:mt-0">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-gray-800 mb-2 mt-3 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => <h3 className="text-sm font-medium text-gray-700 mb-1 mt-2 first:mt-0">{children}</h3>,

          // Paragraphs
          p: ({ children }) => <p className="text-sm text-gray-700 mb-2 last:mb-0 leading-relaxed">{children}</p>,

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-2 text-sm text-gray-700">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-2 text-sm text-gray-700">{children}</ol>
          ),
          li: ({ children }) => <li className="text-sm text-gray-700">{children}</li>,

          // Emphasis
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-800">{children}</em>,

          // Code
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
            }
            return (
              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">
                <code className="text-xs font-mono text-gray-800">{children}</code>
              </pre>
            )
          },

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border border-gray-200 text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-gray-200 px-2 py-1 text-left font-medium text-gray-700">{children}</th>
          ),
          td: ({ children }) => <td className="border border-gray-200 px-2 py-1 text-gray-600">{children}</td>,

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-200 pl-3 py-1 mb-2 bg-blue-50 text-sm text-gray-700">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="border-gray-200 my-3" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
