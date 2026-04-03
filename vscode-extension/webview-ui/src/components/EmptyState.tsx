import './EmptyState.css'

interface EmptyStateProps {
  onExampleClick?: (example: string) => void
}

const examples = [
  {
    icon: '💡',
    title: 'Explain code',
    prompt: 'Explain what this function does in simple terms',
  },
  {
    icon: '🐛',
    title: 'Debug issue',
    prompt: 'Help me debug this error and suggest fixes',
  },
  {
    icon: '✨',
    title: 'Generate code',
    prompt: 'Generate a TypeScript function that validates email addresses',
  },
  {
    icon: '📚',
    title: 'Learn concept',
    prompt: 'Explain React hooks and when to use them',
  },
]

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-content">
        <div className="empty-state-header">
          <div className="empty-state-icon">🤖</div>
          <h1 className="empty-state-title">AI Assistant</h1>
          <p className="empty-state-subtitle">
            Your coding companion powered by advanced AI
          </p>
        </div>

        <div className="empty-state-features">
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span className="feature-text">Instant answers</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🎯</span>
            <span className="feature-text">Code assistance</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📖</span>
            <span className="feature-text">Learning support</span>
          </div>
        </div>

        <div className="empty-state-divider">
          <span>Try these examples</span>
        </div>

        <div className="examples-grid">
          {examples.map((example, i) => (
            <button
              key={i}
              className="example-card"
              onClick={() => onExampleClick?.(example.prompt)}
              title={example.prompt}
            >
              <span className="example-icon">{example.icon}</span>
              <p className="example-title">{example.title}</p>
              <p className="example-prompt">{example.prompt}</p>
            </button>
          ))}
        </div>

        <div className="empty-state-footer">
          <p className="footer-text">
            💬 Type a message below to get started
          </p>
          <p className="footer-hint">
            Supports markdown, code blocks, and complex queries
          </p>
        </div>
      </div>
    </div>
  )
}
