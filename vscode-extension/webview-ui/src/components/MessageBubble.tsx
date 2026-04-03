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
  const [showActions, setShowActions] = useState(false)
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

  const getAvatar = () => {
    if (role === 'user') return '👤'
    return '🤖'
  }

  const formatTime = (ts?: number) => {
    if (!ts) return ''
    const date = new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className={`message-bubble ${role}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="message-avatar">{getAvatar()}</div>

      <div className="message-content">
        <div className="message-header">
          <span className="message-role">
            {role === 'user' ? 'You' : 'Assistant'}
          </span>
          {timestamp && <span className="message-time">{formatTime(timestamp)}</span>}
        </div>

        <div className="message-text markdown-content">
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
                  <CodeBlock
                    code={codeString}
                    language={language}
                  />
                )
              },
              pre: ({ children }: any) => (
                <pre>{children}</pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {showActions && (
          <div className="message-actions">
            <button
              className="action-btn"
              onClick={handleCopy}
              title={copied ? 'Copied!' : 'Copy message'}
              aria-label="Copy"
            >
              {copied ? '✓' : '📋'}
            </button>
            {role === 'assistant' && onRegenerate && (
              <button
                className="action-btn"
                onClick={onRegenerate}
                title="Regenerate response"
                aria-label="Regenerate"
              >
                🔄
              </button>
            )}
            <button className="action-btn" title="Like" aria-label="Like">
              👍
            </button>
            <button className="action-btn" title="Dislike" aria-label="Dislike">
              👎
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
