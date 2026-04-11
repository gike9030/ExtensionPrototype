import { useState } from 'react'
import './MessageBubble.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import '../markdown.css'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  metadata?: string
  steps?: string[]
  onApplyCode?: (code: string) => void
  onPreviewCode?: (code: string) => void
  onAcceptPreview?: () => void
  onRejectPreview?: () => void
}

export function MessageBubble({
  role,
  content,
  metadata,
  steps,
  onApplyCode,
  onPreviewCode,
  onAcceptPreview,
  onRejectPreview,
}: MessageBubbleProps) {
  const [stepsOpen, setStepsOpen] = useState(false)

  return (
    <div className={`message ${role}`}>
      {metadata && <div className="message-metadata">{metadata}</div>}
      {steps && steps.length > 0 && role === 'assistant' && (
        <div className="steps-section">
          <button
            className="steps-toggle"
            onClick={() => setStepsOpen(p => !p)}
          >
            <span className="steps-toggle-icon">✓</span>
            <span>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
            <span className={`steps-chevron${stepsOpen ? ' open' : ''}`}>›</span>
          </button>
          {stepsOpen && (
            <div className="steps-chips">
              {steps.map((s, i) => (
                <span key={i} className="step-chip">✓ {s}</span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="message-content markdown-content">
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
                  language={language}
                  code={codeString}
                  onApplyCode={role === 'assistant' ? onApplyCode : undefined}
                  onPreviewCode={role === 'assistant' ? onPreviewCode : undefined}
                  onAcceptPreview={role === 'assistant' ? onAcceptPreview : undefined}
                  onRejectPreview={role === 'assistant' ? onRejectPreview : undefined}
                />
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
