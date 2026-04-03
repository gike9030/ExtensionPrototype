import './MessageBubble.css'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import '../markdown.css'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
  onCopy?: (content: string) => void
  onRegenerate?: () => void
}

export function MessageBubble({
  role,
  content,
  timestamp,
  onCopy,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (onCopy) {
      onCopy(content)
    } else {
      navigator.clipboard.writeText(content)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`message-bubble ${role}`}>
      <div className="bubble-content markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : 'plaintext'
              const codeString = String(children).replace(/\n$/, '')

              if (inline) {
                return (
                  <code className="markdown-inline-code" {...props}>
                    {children}
                  </code>
                )
              }

              return (
                <CodeBlock language={language} code={codeString} />
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
