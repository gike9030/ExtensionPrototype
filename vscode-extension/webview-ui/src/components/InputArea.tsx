import { useState, useRef, useEffect } from 'react'
import './InputArea.css'

interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  maxLength?: number
  placeholder?: string
}

export function InputArea({
  value,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = 4000,
  placeholder = 'Ask anything...',
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        onSubmit()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(newValue)
    }
  }

  return (
    <div className="input-wrapper">
      {/* File Context - Shows active file(s) */}
      <div className="file-context">
        <span className="file-badge">+ appsettings.json</span>
      </div>

      {/* Input Container */}
      <div className="input-container">
        <div className="input-controls-left">
          <button className="control-btn" title="Attach file">
            +
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="input-textarea"
          aria-label="Message input"
          rows={1}
        />

        <div className="input-controls-right">
          <button className="control-btn" title="Settings">
            ⚙️
          </button>
          <button
            className="submit-btn"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            title="Send"
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="input-footer">
        <div className="footer-controls">
          <select className="footer-select" defaultValue="local">
            <option value="local">Local</option>
            <option value="remote">Remote</option>
          </select>
          <div className="control-separator">|</div>
          <select className="footer-select" defaultValue="approvals">
            <option value="approvals">Bypass Approvals</option>
            <option value="strict">Strict Mode</option>
          </select>
        </div>
      </div>
    </div>
  )
}
