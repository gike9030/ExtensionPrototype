import './ExecutingPanel.css'

interface Props {
    steps: string[]
    expanded: boolean
    onToggle: () => void
}

export function ExecutingPanel({ steps, expanded, onToggle }: Props) {
    return (
        <div className="executing-panel">
            <button className="executing-header" onClick={onToggle}>
                <span className="executing-spinner" />
                <span className="executing-label">Executing...</span>
                <span className={`executing-chevron${expanded ? ' open' : ''}`}>›</span>
            </button>
            {expanded && steps.length > 0 && (
                <div className="executing-steps">
                    {steps.map((step, i) => {
                        const isCurrent = i === steps.length - 1
                        return (
                            <div key={i} className={`exec-step${isCurrent ? ' current' : ' done'}`}>
                                <span className="exec-step-icon">{isCurrent ? '' : '✓'}</span>
                                <span className="exec-step-text">{step}</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
