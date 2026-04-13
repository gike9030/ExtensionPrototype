import { useState } from 'react'
import './MessageBubble.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CodeBlock } from '../CodeBlock/CodeBlock'
import '../../markdown.css'

export interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  metadata?: string
  steps?: string[]
  onApplyCode?: (code: string) => void
  activePreviewCode?: string | null
}

const CHECKMARK_ICON = '✓'
const STEP_LANGUAGE_REGEX = /language-(\w+)/
const DEFAULT_CODE_LANGUAGE = 'plaintext'

interface CodeRendererProps {
  node?: any
  inline?: boolean
  className?: string
  children?: any
  [key: string]: any
}

function createCodeBlockRenderer(
  role: string,
  onApplyCode?: (code: string) => void,
  activePreviewCode?: string | null
) {
  return (props: CodeRendererProps) => {
    const { inline, className, children, ...rest } = props
    const match = STEP_LANGUAGE_REGEX.exec(className || '')
    const language = match ? match[1] : DEFAULT_CODE_LANGUAGE
    const codeString = String(children).replace(/\n$/, '')

    if (inline) {
      return (
        <code className="markdown-inline-code" {...rest}>
          {children}
        </code>
      )
    }

    return (
      <CodeBlock
        language={language}
        code={codeString}
        onApplyCode={role === 'assistant' ? onApplyCode : undefined}
        isPreviewActive={activePreviewCode === codeString}
      />
    )
  }
}

export function MessageBubble({
  role,
  content,
  metadata,
  steps,
  onApplyCode,
  activePreviewCode,
}: MessageBubbleProps) {
  const [stepsOpen, setStepsOpen] = useState(false)

  const handleStepsToggle = () => setStepsOpen(prev => !prev)

  const shouldShowSteps = steps && steps.length > 0 && role === 'assistant'
  const stepCountText = steps ? `${steps.length} step${steps.length !== 1 ? 's' : ''}` : ''
  const codeBlockRenderer = createCodeBlockRenderer(role, onApplyCode, activePreviewCode)

  return (
    <div className={`message ${role}`}>
      {metadata && <div className="message-metadata">{metadata}</div>}
      {shouldShowSteps && (
        <div className="steps-section">
          <button
            className="steps-toggle"
            onClick={handleStepsToggle}
            aria-expanded={stepsOpen}
          >
            <span className="steps-toggle-icon">{CHECKMARK_ICON}</span>
            <span>{stepCountText}</span>
            <span className={`steps-chevron${stepsOpen ? ' open' : ''}`}>›</span>
          </button>
          {stepsOpen && (
            <div className="steps-chips">
              {steps!.map((step, idx) => (
                <span key={idx} className="step-chip">
                  {CHECKMARK_ICON} {step}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="message-content markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code: codeBlockRenderer,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
