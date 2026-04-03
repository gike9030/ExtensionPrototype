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
  placeholder = 'Message...',
}: InputAreaProps) {
  const [rows, setRows] = useState(1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-grow textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150) // Max 150px
      textareaRef.current.style.height = `${newHeight}px`

      // Calculate rows for accessibility
      const lineCount = value.split('\n').length
      setRows(Math.min(lineCount, 5))
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

  const characterCountPercentage = (value.length / maxLength) * 100

  return (
    <div className="input-area">
      <div className="input-container">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="input-textarea"
          aria-label="Message input"
        />

        <div className="input-footer">
          <div className="char-count">
            <span
              className={`char-counter ${
                characterCountPercentage > 90 ? 'warning' : ''
              }`}
            >
              {value.length}/{maxLength}
            </span>
            {characterCountPercentage > 0 && (
              <div className="char-progress">
                <div
                  className={`progress-bar ${characterCountPercentage > 90 ? 'warning' : ''}`}
                  style={{ width: `${characterCountPercentage}%` }}
                />
              </div>
            )}
          </div>

          <button
            className="submit-btn"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            title={disabled ? 'Waiting for response' : 'Send message (Enter)'}
            aria-label="Send message"
          >
            {disabled ? '⏳' : '✈️'}
          </button>
        </div>
      </div>

      <div className="input-hints">
        <small>Shift+Enter for newline • Ctrl+/ for voice (future)</small>
      </div>
    </div>
  )
}
