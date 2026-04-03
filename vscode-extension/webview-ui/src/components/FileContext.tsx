import './FileContext.css'

interface FileContextProps {
  filePath?: string
}

export function FileContext({ filePath }: FileContextProps) {
  if (!filePath) return null

  // Extract filename from path
  const filename = filePath.split(/[\/\\]/).pop() || filePath

  // Detect language by file extension
  const getLanguageIcon = (name: string) => {
    if (name.endsWith('.ts')) return '📘'
    if (name.endsWith('.tsx')) return '⚛️'
    if (name.endsWith('.json')) return '📋'
    if (name.endsWith('.js')) return '📙'
    if (name.endsWith('.jsx')) return '⚛️'
    if (name.endsWith('.css')) return '🎨'
    if (name.endsWith('.html')) return '🌐'
    if (name.endsWith('.md')) return '📝'
    if (name.endsWith('.py')) return '🐍'
    return '📄'
  }

  return (
    <div className="file-context">
      <span className="file-icon">{getLanguageIcon(filename)}</span>
      <span className="file-name" title={filePath}>
        {filename}
      </span>
    </div>
  )
}
