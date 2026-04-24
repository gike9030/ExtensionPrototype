import { useState, useRef, useEffect } from 'react'
import './InputArea.css'

interface FileReference {
  name: string
  path: string
}

interface InputAreaProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
  maxLength?: number
  placeholder?: string
  activeFile?: string | null
  activeFileIncluded?: boolean
  onToggleActiveFile?: () => void
  contextFiles?: FileReference[]
  onRemoveContext?: (path: string) => void
  workspaceFiles?: FileReference[]
  onSelectFile?: (file: FileReference) => void
  onHashTyped?: () => void
}

const TEXTAREA_MAX_HEIGHT = 120
const DEFAULT_MAX_LENGTH = 4000
const DEFAULT_PLACEHOLDER = 'Ask anything...'
const FILE_PICKER_MAX_RESULTS = 8
const HASH_TRIGGER_PATTERN = /#(\w*)$/
const FILE_PICKER_TRIGGER = '#'
const ATTACH_BUTTON_LABEL = '+'
const FORMATTER_MODES = ['Ask', 'Code', 'Agent']
const AVAILABLE_MODELS = ['Gemini 2.0', 'Claude 3 Opus', 'GPT-4 Turbo', 'Claude 3 Sonnet']
const FOOTER_HINT = 'Type # to include a file'

export function InputArea({
  value,
  onChange,
  onSubmit,
  disabled = false,
  maxLength = DEFAULT_MAX_LENGTH,
  placeholder = DEFAULT_PLACEHOLDER,
  activeFile,
  activeFileIncluded = false,
  onToggleActiveFile,
  contextFiles = [],
  onRemoveContext,
  workspaceFiles = [],
  onSelectFile,
  onHashTyped,
}: InputAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const modelMenuRef = useRef<HTMLDivElement>(null)

  const [showFilePicker, setShowFilePicker] = useState(false)
  const [filePickerQuery, setFilePickerQuery] = useState('')
  const [showModeMenu, setShowModeMenu] = useState(false)
  const [composerMode, setComposerMode] = useState(FORMATTER_MODES[0])
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const newHeight = Math.min(textareaRef.current.scrollHeight, TEXTAREA_MAX_HEIGHT)
      textareaRef.current.style.height = `${newHeight}px`
    }
  }, [value])

  useEffect(() => {
    if (!showFilePicker && !showModeMenu && !showModelMenu) return

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node

      if (pickerRef.current && !pickerRef.current.contains(target)) {
        setShowFilePicker(false)
      }
      if (modeMenuRef.current && !modeMenuRef.current.contains(target)) {
        setShowModeMenu(false)
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(target)) {
        setShowModelMenu(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showFilePicker, showModeMenu, showModelMenu])

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

    const hashMatch = newValue.match(HASH_TRIGGER_PATTERN)
    if (hashMatch) {
      const query = hashMatch[1]
      setFilePickerQuery(query)
      setShowFilePicker(true)
      if (query === '') onHashTyped?.()
    } else {
      setShowFilePicker(false)
    }
  }

  const handlePickFile = (file: FileReference) => {
    onChange(value.replace(HASH_TRIGGER_PATTERN, ''))
    onSelectFile?.(file)
    setShowFilePicker(false)
    textareaRef.current?.focus()
  }

  const filteredFiles = workspaceFiles
    .filter(f => f.name.toLowerCase().includes(filePickerQuery.toLowerCase()))
    .slice(0, FILE_PICKER_MAX_RESULTS)

  const hasContext = !!activeFile || contextFiles.length > 0

  const toggleFilePicker = () => {
    onChange(value + FILE_PICKER_TRIGGER)
    onHashTyped?.()
    setFilePickerQuery('')
    setShowFilePicker(true)
    textareaRef.current?.focus()
  }

  const toggleModeMenu = () => setShowModeMenu(prev => !prev)
  const toggleModelMenu = () => setShowModelMenu(prev => !prev)

  return (
    <div className="input-wrapper">
      {hasContext && (
        <div className="file-context">
          {activeFile && (
            <button
              type="button"
              className={`file-badge active-file${activeFileIncluded ? ' included' : ' excluded'}`}
              title={activeFileIncluded ? 'Active editor file included' : 'Click to include active editor file'}
              onClick={onToggleActiveFile}
            >
              <span className="badge-icon">◻</span>
              {activeFile}
              <span className="active-file-toggle">{activeFileIncluded ? '×' : '+'}</span>
            </button>
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

      <div className="input-container">
        <div className="input-main-row">
          <div className="input-controls-left">
            <button
              className="control-btn"
              title="Attach file (#)"
              onClick={toggleFilePicker}
            >
              {ATTACH_BUTTON_LABEL}
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

        <div className="input-bottom-row">
          <div className="composer-modes" ref={modeMenuRef}>
            <button
              type="button"
              className="composer-mode-button"
              onClick={toggleModeMenu}
              title="Choose mode"
            >
              <span className="composer-mode-label">{composerMode}</span>
              <span className="composer-mode-caret">▾</span>
            </button>

            {showModeMenu && (
              <div className="composer-mode-menu">
                {FORMATTER_MODES.map(mode => (
                  <button
                    key={mode}
                    type="button"
                    className={`composer-mode-item${composerMode === mode ? ' active' : ''}`}
                    onClick={() => {
                      setComposerMode(mode)
                      setShowModeMenu(false)
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="composer-models" ref={modelMenuRef}>
            <button
              type="button"
              className="composer-model-button"
              onClick={toggleModelMenu}
              title="Choose model"
            >
              <span className="composer-model-label">{selectedModel}</span>
              <span className="composer-model-caret">▾</span>
            </button>

            {showModelMenu && (
              <div className="composer-model-menu">
                {AVAILABLE_MODELS.map(model => (
                  <button
                    key={model}
                    type="button"
                    className={`composer-model-item${selectedModel === model ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedModel(model)
                      setShowModelMenu(false)
                    }}
                  >
                    {model}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="input-footer">
        <span className="footer-hint">{FOOTER_HINT}</span>
      </div>
    </div>
  )
}
