import { useState, useRef, useEffect } from 'react'
import './InputArea.css'

interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  activeFile?: string | null
  contextFiles?: Array<{ name: string; path: string }>
  onRemoveContext?: (path: string) => void
  workspaceFiles?: Array<{ name: string; path: string }>
  onSelectFile?: (file: { name: string; path: string }) => void
  onHashTyped?: () => void
}

export function InputArea({
  value,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = 4000,
  placeholder = 'Ask anything...',
  activeFile,
  contextFiles = [],
  onRemoveContext,
  workspaceFiles = [],
  onSelectFile,
  onHashTyped,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [filePickerQuery, setFilePickerQuery] = useState('')

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, 120)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  // Close picker on outside click
  useEffect(() => {
    if (!showFilePicker) return
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowFilePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilePicker])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowFilePicker(false)
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!disabled && value.trim()) {
        setShowFilePicker(false)
        onSubmit()
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length > maxLength) return
    onChange(newValue)

    // Detect # trigger at end of input
    const hashMatch = newValue.match(/#(\w*)$/)
    if (hashMatch) {
      const query = hashMatch[1]
      setFilePickerQuery(query)
      setShowFilePicker(true)
      if (query === '') onHashTyped?.()
    } else {
      setShowFilePicker(false)
    }
  }

  const handlePickFile = (file: { name: string; path: string }) => {
    // Remove the #query from input
    onChange(value.replace(/#\w*$/, ''))
    onSelectFile?.(file)
    setShowFilePicker(false)
    textareaRef.current?.focus()
  }

  const filteredFiles = workspaceFiles
    .filter(f => f.name.toLowerCase().includes(filePickerQuery.toLowerCase()))
    .slice(0, 8)

  const hasContext = activeFile || contextFiles.length > 0

  return (
    <div className="input-wrapper">
      {/* File context chips */}
      {hasContext && (
        <div className="file-context">
          {activeFile && (
            <span className="file-badge active-file" title="Active editor file">
              <span className="badge-icon">◻</span>
              {activeFile}
            </span>
          )}
          {contextFiles.map(f => (
            <span key={f.path} className="file-badge added-file" title={f.path}>
              <span className="badge-icon">#</span>
              {f.name}
              <button
                className="badge-remove"
                onClick={() => onRemoveContext?.(f.path)}
                title="Remove"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* # File picker dropdown */}
      {showFilePicker && (
        <div className="file-picker" ref={pickerRef}>
          <div className="file-picker-header">Include file</div>
          {filteredFiles.length > 0 ? (
            filteredFiles.map(f => (
              <button
                key={f.path}
                className="file-picker-item"
                onClick={() => handlePickFile(f)}
                title={f.path}
              >
                <span className="picker-icon">◻</span>
                {f.name}
              </button>
            ))
          ) : (
            <div className="file-picker-empty">
              {workspaceFiles.length === 0 ? 'Loading...' : 'No files found'}
            </div>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="input-container">
        <div className="input-controls-left">
          <button
            className="control-btn"
            title="Attach file (#)"
            onClick={() => {
              onChange(value + '#')
              onHashTyped?.()
              setFilePickerQuery('')
              setShowFilePicker(true)
              textareaRef.current?.focus()
            }}
          >
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

      {/* Footer */}
      <div className="input-footer">
        <span className="footer-hint">Type # to include a file</span>
      </div>
    </div>
  )
}
