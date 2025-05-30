"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface MarkdownRendererProps {
  content: string
  className?: string
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono border">
        <code className={className}>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-gray-800 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-700"
        title="Copy code"
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  )
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with better styling
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-gray-900 mb-3 mt-6 first:mt-0 pb-2 border-b border-gray-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-800 mb-3 mt-5 first:mt-0 flex items-center">
              <span className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full mr-3" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-gray-700 mb-2 mt-4 first:mt-0 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
              {children}
            </h3>
          ),

          // Enhanced paragraphs
          p: ({ children }) => <p className="text-sm text-gray-700 mb-3 last:mb-0 leading-relaxed">{children}</p>,

          // Styled lists
          ul: ({ children }) => <ul className="space-y-2 mb-4 text-sm text-gray-700 pl-4">{children}</ul>,
          ol: ({ children }) => <ol className="space-y-2 mb-4 text-sm text-gray-700 pl-4">{children}</ol>,
          li: ({ children }) => (
            <li className="text-sm text-gray-700 flex items-start">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <span className="flex-1">{children}</span>
            </li>
          ),

          // Enhanced emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded">{children}</strong>
          ),
          em: ({ children }) => <em className="italic text-blue-700 font-medium">{children}</em>,

          // Code styling
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-gray-100 text-blue-800 px-2 py-1 rounded-md text-xs font-mono border">
                  {children}
                </code>
              )
            }
            return <CodeBlock className={className}>{String(children)}</CodeBlock>
          },

          // Enhanced tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4 rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full text-xs bg-white">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">{children}</thead>,
          th: ({ children }) => (
            <th className="border-b border-gray-200 px-4 py-3 text-left font-semibold text-gray-800 uppercase tracking-wider">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border-b border-gray-100 px-4 py-3 text-gray-700">{children}</td>,

          // Styled blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-2 mb-4 bg-gradient-to-r from-blue-50 to-transparent text-sm text-gray-700 italic rounded-r-lg">
              {children}
            </blockquote>
          ),

          // Enhanced horizontal rule
          hr: () => <hr className="border-gray-300 my-6 border-t-2" />,

          // Links with better styling
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-500 transition-colors duration-200"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
