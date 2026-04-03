import './SessionCard.css'
import { useState } from 'react'

interface SessionCardProps {
  id: string
  title: string
  summary?: string
  stats?: {
    additions: number
    deletions: number
  }
  timestamp: number
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}

export function SessionCard({
  id,
  title,
  summary,
  stats,
  timestamp,
  isActive,
  onSelect,
  onDelete,
}: SessionCardProps) {
  const [showDelete, setShowDelete] = useState(false)

  const formatTime = (ts: number) => {
    const now = new Date()
    const date = new Date(ts)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`session-card ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(id)}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="session-content">
        <p className="session-title">{title}</p>
        {summary && <p className="session-summary">{summary}</p>}
        <div className="session-meta">
          {stats && (
            <span className="session-stats">
              +{stats.additions} -{stats.deletions} ·{' '}
            </span>
          )}
          <span className="session-time">{formatTime(timestamp)}</span>
        </div>
      </div>

      {showDelete && (
        <button
          className="session-delete"
          onClick={e => {
            e.stopPropagation()
            onDelete(id)
          }}
          title="Delete session"
          aria-label="Delete"
        >
          ✕
        </button>
      )}
    </div>
  )
}
