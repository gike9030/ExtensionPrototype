import { useState, useRef, useEffect } from 'react'
import './SessionsPanel.css'

interface Folder {
  id: string
  name: string
  isExpanded: boolean
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  metadata?: string
}

interface Conversation {
  id: string
  title: string
  timestamp: number
  messages: Message[]
  pinned?: boolean
  folderId?: string | null
}

interface SessionsPanelProps {
  conversations: Conversation[]
  folders: Folder[]
  isExpanded: boolean
  onToggle: () => void
  onSelectSession: (id: string) => void
  onRenameSession: (id: string, newTitle: string) => void
  onDeleteSession: (id: string) => void
  onTogglePin: (id: string) => void
  onAddToFolder: (sessionId: string, folderId: string) => void
  onRemoveFromFolder: (sessionId: string) => void
  onCreateFolder: (name: string) => void
  onToggleFolderExpand: (folderId: string) => void
  onRenameFolder: (folderId: string, newName: string) => void
  onDeleteFolder: (folderId: string) => void
}

const PAGE_SIZE = 5
const SNIPPET_LENGTH = 55
const PINNED_ICON = '📌'
const CHAT_ICON = '💬'
const FOLDER_ICON = '📁'
const CHEVRON_ICON = '›'
const MENU_TRIGGER = '···'

const RELATIVE_TIME_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'd',
  month: 'wk',
  older: 'mo',
}

const MS_PER_DAY = 86400000
const DAYS_PER_WEEK = 7
const WEEKS_PER_MONTH = 5

function getRelativeTime(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / MS_PER_DAY)
  
  if (days === 0) return RELATIVE_TIME_LABELS.today
  if (days === 1) return RELATIVE_TIME_LABELS.yesterday
  if (days < DAYS_PER_WEEK) return `${days}${RELATIVE_TIME_LABELS.week}`
  
  const weeks = Math.floor(days / DAYS_PER_WEEK)
  if (weeks < WEEKS_PER_MONTH) return `${weeks} ${RELATIVE_TIME_LABELS.month}${weeks > 1 ? 's' : ''}`
  
  return `${Math.floor(days / 30)} ${RELATIVE_TIME_LABELS.older}`
}

function getConversationSnippet(conv: Conversation): string {
  const lastMessage = conv.messages[conv.messages.length - 1]
  if (!lastMessage || !lastMessage.content) return ''
  return lastMessage.content.replace(/\n/g, ' ').substring(0, SNIPPET_LENGTH)
}

function matchesSearchQuery(conv: Conversation, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  if (conv.title.toLowerCase().includes(q)) return true
  return conv.messages.some(m => m.content?.toLowerCase().includes(q))
}

interface HighlightProps {
  text: string
  query: string
}

function SearchHighlight({ text, query }: HighlightProps) {
  if (!query) return <>{text}</>
  
  const matchIndex = text.toLowerCase().indexOf(query.toLowerCase())
  if (matchIndex === -1) return <>{text}</>
  
  const endIndex = matchIndex + query.length
  return (
    <>
      {text.slice(0, matchIndex)}
      <mark className="search-highlight">{text.slice(matchIndex, endIndex)}</mark>
      {text.slice(endIndex)}
    </>
  )
}

function FolderPlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h3.764c.415 0 .813.165 1.107.46L8.43 3.5H13.5A1.5 1.5 0 0 1 15 5v7.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zm8.5 5a.5.5 0 0 0-1 0V10H7a.5.5 0 0 0 0 1h1.5v1.5a.5.5 0 0 0 1 0V11H11a.5.5 0 0 0 0-1H9.5V8.5z"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.099zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
  )
}

function FilterIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
      <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z"/>
    </svg>
  )
}

export type { Folder, Conversation, Message }

export function SessionsPanel({
  conversations,
  folders,
  isExpanded,
  onToggle,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onTogglePin,
  onAddToFolder,
  onRemoveFromFolder,
  onCreateFolder,
  onToggleFolderExpand,
  onRenameFolder,
  onDeleteFolder,
}: SessionsPanelProps) {
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [contextMenuId, setContextMenuId] = useState<string | null>(null)
  const [folderSubMenuId, setFolderSubMenuId] = useState<string | null>(null)
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const [folderMenuPosition, setFolderMenuPosition] = useState({ top: 0, right: 0 })

  const renameInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isSearchActive) searchInputRef.current?.focus()
  }, [isSearchActive])

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus()
  }, [renamingId])

  useEffect(() => {
    if (creatingFolder) folderInputRef.current?.focus()
  }, [creatingFolder])

  useEffect(() => {
    const handleOutsideClick = () => {
      setContextMenuId(null)
      setFolderSubMenuId(null)
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [])

  const closeSearch = () => {
    setIsSearchActive(false)
    setSearchQuery('')
  }

  const handleOpenContextMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (contextMenuId === id) {
      setContextMenuId(null)
    } else {
      setContextMenuId(id)
      const button = e.currentTarget as HTMLButtonElement
      const rect = button.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      })
    }
    setFolderSubMenuId(null)
  }

  const handleStartRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation()
    setRenamingId(conv.id)
    setRenameValue(conv.title)
    setContextMenuId(null)
  }

  const handleConfirmRename = (id: string) => {
    const trimmed = renameValue.trim()
    if (trimmed) onRenameSession(id, trimmed)
    setRenamingId(null)
  }

  const handleConfirmFolderCreate = () => {
    const trimmed = newFolderName.trim()
    if (trimmed) onCreateFolder(trimmed)
    setNewFolderName('')
    setCreatingFolder(false)
  }

  const handleOpenFolderMenu = (e: React.MouseEvent, folderId: string) => {
    e.stopPropagation()
    if (folderMenuId === folderId) {
      setFolderMenuId(null)
    } else {
      setFolderMenuId(folderId)
      const button = e.currentTarget as HTMLButtonElement
      const rect = button.getBoundingClientRect()
      setFolderMenuPosition({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right
      })
    }
  }

  const visibleConversations = searchQuery
    ? conversations.filter(c => matchesSearchQuery(c, searchQuery))
    : conversations

  const pinnedConversations = visibleConversations
    .filter(c => c.pinned && !c.folderId)
    .sort((a, b) => b.timestamp - a.timestamp)

  const regularConversations = visibleConversations
    .filter(c => !c.pinned && !c.folderId)
    .sort((a, b) => b.timestamp - a.timestamp)

  const matchCount = searchQuery ? visibleConversations.length : 0

  const renderConversationItem = (conv: Conversation, isIndented = false) => {
    const isRenaming = renamingId === conv.id
    const menuOpen = contextMenuId === conv.id
    const subMenuOpen = folderSubMenuId === conv.id
    const snippet = getConversationSnippet(conv)
    const icon = conv.pinned ? PINNED_ICON : CHAT_ICON

    return (
      <div
        key={conv.id}
        className={`session-item${isIndented ? ' indented' : ''}${menuOpen ? ' menu-open' : ''}`}
        onClick={() => !isRenaming && onSelectSession(conv.id)}
      >
        <span className="session-icon">{icon}</span>

        <div className="session-body">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              className="rename-input"
              value={renameValue}
              placeholder="Enter chat name"
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmRename(conv.id)
                if (e.key === 'Escape') setRenamingId(null)
              }}
              onBlur={() => handleConfirmRename(conv.id)}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <>
              <div className="session-title">
                <SearchHighlight text={conv.title} query={searchQuery} />
              </div>
              <div className="session-snippet">
                <SearchHighlight text={snippet} query={searchQuery} />
              </div>
            </>
          )}
        </div>

        <div className="session-meta" onClick={e => e.stopPropagation()}>
          <span className="session-time">{getRelativeTime(conv.timestamp)}</span>
          <div className="ctx-wrap">
            <button
              className="ctx-trigger"
              title="More options"
              onClick={e => handleOpenContextMenu(e, conv.id)}
            >
              {MENU_TRIGGER}
            </button>

            {menuOpen && !subMenuOpen && (
              <div 
                className="ctx-menu" 
                onClick={e => e.stopPropagation()}
                style={{
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`
                }}
              >
                <button className="ctx-item" onClick={e => { e.stopPropagation(); handleStartRename(e, conv) }}>
                  Rename
                </button>
                {conv.folderId && (
                  <button
                    className="ctx-item"
                    onClick={e => { e.stopPropagation(); onRemoveFromFolder(conv.id); setContextMenuId(null) }}
                  >
                    Remove from folder
                  </button>
                )}
                {!conv.folderId && (
                  <>
                    <button
                      className="ctx-item"
                      onClick={e => { e.stopPropagation(); setFolderSubMenuId(conv.id) }}
                    >
                      Add to folder {CHEVRON_ICON}
                    </button>
                    <button
                      className="ctx-item"
                      onClick={e => { e.stopPropagation(); onTogglePin(conv.id); setContextMenuId(null) }}
                    >
                      {conv.pinned ? 'Unpin' : 'Pin'}
                    </button>
                  </>
                )}
                <button
                  className="ctx-item ctx-danger"
                  onClick={e => { e.stopPropagation(); onDeleteSession(conv.id); setContextMenuId(null) }}
                >
                  Delete
                </button>
              </div>
            )}

            {subMenuOpen && (
              <div 
                className="ctx-menu" 
                onClick={e => e.stopPropagation()}
                style={{
                  top: `${menuPosition.top}px`,
                  right: `${menuPosition.right}px`
                }}
              >
                <button
                  className="ctx-item ctx-back"
                  onClick={e => { e.stopPropagation(); setFolderSubMenuId(null) }}
                >
                  {CHEVRON_ICON} Back
                </button>
                {folders.length === 0 ? (
                  <span className="ctx-empty">No folders yet</span>
                ) : (
                  folders.map(f => (
                    <button
                      key={f.id}
                      className="ctx-item"
                      onClick={e => {
                        e.stopPropagation()
                        onAddToFolder(conv.id, f.id)
                        setContextMenuId(null)
                        setFolderSubMenuId(null)
                      }}
                    >
                      {FOLDER_ICON} {f.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`sessions-panel${isExpanded ? ' expanded' : ''}`}>
      {isSearchActive ? (
        <div className="sessions-search-bar">
          <SearchIcon />
          <input
            ref={searchInputRef}
            className="search-input"
            value={searchQuery}
            placeholder="Search conversations..."
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') closeSearch() }}
          />
          {searchQuery && (
            <span className="search-count">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
          )}
          <button className="toolbar-btn search-close" title="Close search" onClick={closeSearch}>✕</button>
        </div>
      ) : (
        <div className="sessions-toolbar">
          <button className="sessions-toggle-btn" onClick={onToggle} title="Toggle sessions">
            <span className="sessions-label">SESSIONS</span>
            <span className={`sessions-chevron${isExpanded ? ' open' : ''}`}>{CHEVRON_ICON}</span>
          </button>
          <div className="sessions-actions" onClick={e => e.stopPropagation()}>
            <button
              className="toolbar-btn"
              title="New folder"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlusIcon />
            </button>
            <button
              className="toolbar-btn"
              title="Search conversations"
              onClick={() => setIsSearchActive(true)}
            >
              <SearchIcon />
            </button>
            <button className="toolbar-btn" title="Filter (coming soon)">
              <FilterIcon />
            </button>
          </div>
        </div>
      )}

      {isExpanded && creatingFolder && (
        <div className="folder-create-row">
          <input
            ref={folderInputRef}
            className="folder-name-input"
            value={newFolderName}
            placeholder="folder name..."
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleConfirmFolderCreate()
              if (e.key === 'Escape') { setCreatingFolder(false); setNewFolderName('') }
            }}
            onBlur={() => { if (!newFolderName.trim()) setCreatingFolder(false) }}
          />
        </div>
      )}

      {isExpanded && <div className="sessions-list">
        {conversations.length === 0 && (
          <div className="sessions-empty">
            <p>No conversations yet.</p>
            <p>Start a new chat below.</p>
          </div>
        )}

        {searchQuery && visibleConversations.length === 0 && (
          <div className="sessions-empty">
            <p>No results for "{searchQuery}"</p>
          </div>
        )}

        {(() => {
          const flatList = [...pinnedConversations, ...regularConversations]
          const visibleList = flatList.slice(0, displayCount)
          const hasMoreItems = flatList.length > displayCount

          return (
            <>
              {visibleList.map(c => renderConversationItem(c))}
              {hasMoreItems && (
                <button
                  className="load-more-btn"
                  onClick={() => setDisplayCount(n => n + PAGE_SIZE)}
                >
                  load more...
                </button>
              )}
            </>
          )
        })()}

        {folders.map(folder => {
          const folderConversations = visibleConversations
            .filter(c => c.folderId === folder.id)
            .sort((a, b) => b.timestamp - a.timestamp)

          if (searchQuery && folderConversations.length === 0) return null

          return (
            <div key={folder.id} className="folder-group">
              <div className="folder-header-container">
                <div
                  className="folder-header"
                  onClick={() => onToggleFolderExpand(folder.id)}
                >
                  <span className="folder-icon">{FOLDER_ICON}</span>
                  {renamingFolderId === folder.id ? (
                    <input
                      type="text"
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => {
                        if (renameValue.trim()) {
                          onRenameFolder(folder.id, renameValue.trim())
                        }
                        setRenamingFolderId(null)
                        setRenameValue('')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (renameValue.trim()) {
                            onRenameFolder(folder.id, renameValue.trim())
                          }
                          setRenamingFolderId(null)
                          setRenameValue('')
                        } else if (e.key === 'Escape') {
                          setRenamingFolderId(null)
                          setRenameValue('')
                        }
                      }}
                      className="folder-name-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="folder-name">{folder.name}</span>
                  )}
                  <span className={`folder-chevron${folder.isExpanded ? ' open' : ''}`}>{CHEVRON_ICON}</span>
                </div>
                <div className="folder-menu-container">
                  <button
                    className="folder-menu-btn"
                    onClick={(e) => handleOpenFolderMenu(e, folder.id)}
                  >
                    {MENU_TRIGGER}
                  </button>
                  {folderMenuId === folder.id && (
                    <div 
                      className="folder-menu" 
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        top: `${folderMenuPosition.top}px`,
                        right: `${folderMenuPosition.right}px`
                      }}
                    >
                      <button
                        className="menu-item"
                        onClick={() => {
                          setRenamingFolderId(folder.id)
                          setRenameValue(folder.name)
                          setFolderMenuId(null)
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="menu-item menu-item-danger"
                        onClick={() => {
                          onDeleteFolder(folder.id)
                          setFolderMenuId(null)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {folder.isExpanded && (
                <div className="folder-contents">
                  {folderConversations.length === 0
                    ? <div className="folder-empty">Empty</div>
                    : folderConversations.map(c => renderConversationItem(c, true))
                  }
                </div>
              )}
            </div>
          )
        })}
      </div>}
    </div>
  )
}
