import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './CodeBlock.css'
import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
  onApplyCode?: (code: string) => void
}

export function CodeBlock({ code, language = 'plaintext', onApplyCode }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [applied, setApplied] = useState(false)

  const isDarkMode = !document.body.classList.contains('vscode-light')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleApply = () => {
    onApplyCode?.(code)
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <div className="code-actions">
          {onApplyCode && (
            <button
              className={`code-apply-btn${applied ? ' applied' : ''}`}
              onClick={handleApply}
              title="Apply to active editor"
            >
              {applied ? '✓ Applied' : '↙ Apply'}
            </button>
          )}
          <button
            className="code-copy-btn"
            onClick={handleCopy}
            title={copied ? 'Copied!' : 'Copy code'}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkMode ? vscDarkPlus : vs}
        className="code-content"
        showLineNumbers={code.split('\n').length > 5}
        wrapLines={true}
        customStyle={{
          margin: 0,
          padding: '12px',
          borderRadius: '4px',
          fontSize: '12px',
          backgroundColor: 'var(--vscode-input-background, #2d2d2d)',
          color: 'var(--vscode-foreground, #ccc)',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}
