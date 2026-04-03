import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark, coy } from 'react-syntax-highlighter/dist/esm/styles/prism'
import './CodeBlock.css'
import { useState } from 'react'

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = 'plaintext' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  // Detect theme from VS Code CSS variables (dark mode)
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">{language}</span>
        <button
          className="code-copy-btn"
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDarkMode ? dark : coy}
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
