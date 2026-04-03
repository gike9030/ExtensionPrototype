import './ChatHeader.css'
import { useState } from 'react'

interface ChatHeaderProps {
  chatMode: string
  onChatModeChange: (mode: string) => void
  model: string
  onModelChange: (model: string) => void
  onSettings: () => void
  onClearHistory: () => void
}

export function ChatHeader({
  chatMode,
  onChatModeChange,
  model,
  onModelChange,
  onSettings,
  onClearHistory,
}: ChatHeaderProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const chatModes = ['Chat', 'Code Explanation', 'Debug']
  const models = ['GPT-4', 'GPT-3.5', 'Claude']

  return (
    <div className="chat-header">
      <div className="header-left">
        <div className="header-group">
          <label htmlFor="chat-mode" className="header-label">
            Mode
          </label>
          <select
            id="chat-mode"
            className="header-select"
            value={chatMode}
            onChange={e => onChatModeChange(e.target.value)}
            title="Select chat mode"
          >
            {chatModes.map(mode => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div className="header-group">
          <label htmlFor="model-select" className="header-label">
            Model
          </label>
          <select
            id="model-select"
            className="header-select"
            value={model}
            onChange={e => onModelChange(e.target.value)}
            title="Select model"
          >
            {models.map(m => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="header-right">
        <button
          className="header-icon-btn"
          onClick={onSettings}
          title="Settings"
          aria-label="Settings"
        >
          ⚙️
        </button>

        <div className="more-menu">
          <button
            className="header-icon-btn"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            title="More options"
            aria-label="More"
          >
            ⋯
          </button>
          {showMoreMenu && (
            <div className="more-menu-dropdown">
              <button className="menu-item" onClick={onClearHistory}>
                Clear History
              </button>
              <button className="menu-item">Export Chat</button>
              <button className="menu-item">Help</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
