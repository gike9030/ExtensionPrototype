import './ExecutingPanel.css'

interface ExecutingPanelProps {
  steps: string[]
  expanded: boolean
  onToggle: () => void
}

const CHECKMARK_ICON = '✓'

export function ExecutingPanel({ steps, expanded, onToggle }: ExecutingPanelProps) {
  const shouldShowSteps = expanded && steps.length > 0
  const currentStepIndex = steps.length - 1

  const renderStepIcon = (stepIndex: number) => {
    return stepIndex === currentStepIndex ? '' : CHECKMARK_ICON
  }

  const renderStepClass = (stepIndex: number) => {
    return `exec-step${stepIndex === currentStepIndex ? ' current' : ' done'}`
  }

  return (
    <div className="executing-panel">
      <button className="executing-header" onClick={onToggle} aria-expanded={expanded}>
        <span className="executing-spinner" />
        <span className="executing-label">Executing...</span>
        <span className={`executing-chevron${expanded ? ' open' : ''}`}>›</span>
      </button>
      {shouldShowSteps && (
        <div className="executing-steps">
          {steps.map((step, idx) => (
            <div key={idx} className={renderStepClass(idx)}>
              <span className="exec-step-icon">{renderStepIcon(idx)}</span>
              <span className="exec-step-text">{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
