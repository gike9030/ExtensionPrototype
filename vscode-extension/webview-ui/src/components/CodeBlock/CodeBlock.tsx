import { useState } from 'react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './CodeBlock.css'

export interface CodeBlockProps {
  code: string
  language?: string
  onApplyCode?: (code: string) => void
  isPreviewActive?: boolean
  onPreviewStateChange?: (active: boolean) => void
}

export function CodeBlock({
  code,
  language = 'plaintext',
  onApplyCode,
  isPreviewActive = false,
  onPreviewStateChange,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
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
    onApplyCode?.(code)
    onPreviewStateChange?.(true)
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
          {isPreviewActive ? (
            <button className="code-apply-btn applied" disabled title="Code is being previewed in editor">
              ✓ Applied
            </button>
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
