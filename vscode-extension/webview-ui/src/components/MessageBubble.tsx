import './MessageBubble.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from './CodeBlock'
import '../markdown.css'

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  metadata?: string
}

export function MessageBubble({
  role,
  content,
  metadata,
}: MessageBubbleProps) {
  return (
    <div className={`message ${role}`}>
      {metadata && <div className="message-metadata">{metadata}</div>}
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
