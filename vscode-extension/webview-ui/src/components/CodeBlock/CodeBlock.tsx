import { useState, useEffect } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './CodeBlock.css'

export interface CodeBlockProps {
  code: string
  language?: string
  onApplyCode?: (code: string) => void
  isPreviewActive?: boolean
  onPreviewStateChange?: (active: boolean) => void
  onAccept?: () => void
  onReject?: () => void
  isCodeAccepted?: boolean
}

export function CodeBlock({
  code,
  language = 'plaintext',
  onApplyCode,
  isPreviewActive = false,
  onPreviewStateChange,
  onAccept,
  onReject,
  isCodeAccepted = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [isAccepted, setIsAccepted] = useState(false)
  const [isRejected, setIsRejected] = useState(false)
  const isDarkMode = !document.body.classList.contains('vscode-light')
  const lineCount = code.split('\n').length
  const shouldShowLineNumbers = lineCount > 5

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleApply = () => {
    setIsRejected(false)
    setIsAccepted(false)
    onApplyCode?.(code)
    onPreviewStateChange?.(true)
  }

  useEffect(() => {
    if (isPreviewActive) {
      setIsRejected(false)
      setIsAccepted(false)
    }
  }, [isPreviewActive])

  const handleAccept = () => {
    setIsAccepted(true)
    setIsRejected(false)
    onAccept?.()
  }

  const handleReject = () => {
    setIsAccepted(false)
    setIsRejected(true)
    onReject?.()
  }

  const syntaxStyle = isDarkMode ? vscDarkPlus : vs
  const syntaxCustomStyle = {
    margin: 0,
    padding: '12px',
    borderRadius: '4px',
    fontSize: '12px',
    backgroundColor: 'var(--vscode-input-background, #2d2d2d)',
    color: 'var(--vscode-foreground, #ccc)',
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <div className="code-actions">
          {isAccepted || isCodeAccepted ? (
            <button className="code-apply-btn applied" disabled title="Code has been applied">
              ✓ Applied
            </button>
          ) : isPreviewActive && !isRejected ? (
            <>
              <button className="code-apply-btn applied" disabled title="Code is being previewed in editor">
                ✓ Applied
              </button>
              <button className="code-accept-btn" onClick={handleAccept} title="Accept the preview">
                ✓ Accept
              </button>
              <button className="code-reject-btn" onClick={handleReject} title="Reject the preview">
                ✕ Reject
              </button>
            </>
          ) : (
            onApplyCode && (
              <button className="code-apply-btn" onClick={handleApply} title="Apply to active editor">
                ↙ Apply
              </button>
            )
          )}
          <button className="code-copy-btn" onClick={handleCopy} title={copied ? 'Copied!' : 'Copy code'}>
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={syntaxStyle}
        className="code-content"
        showLineNumbers={shouldShowLineNumbers}
        wrapLines
        customStyle={syntaxCustomStyle}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
