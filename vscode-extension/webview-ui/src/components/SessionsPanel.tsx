import { useState, useRef, useEffect } from 'react'
import './SessionsPanel.css'

export interface Folder {
    id: string
    name: string
    isExpanded: boolean
}

export interface Conversation {
    id: string
    title: string
    timestamp: number
    messages: { role: 'user' | 'assistant'; content: string; metadata?: string }[]
    pinned?: boolean
    folderId?: string | null
}

const PAGE_SIZE = 5

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
    onCreateFolder: (name: string) => void
    onToggleFolderExpand: (folderId: string) => void
}

function relativeTime(ts: number): string {
    const days = Math.floor((Date.now() - ts) / 86400000)
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks} wk${weeks > 1 ? 's' : ''}`
    return `${Math.floor(days / 30)} mo`
}

function getSnippet(conv: Conversation): string {
    const last = conv.messages[conv.messages.length - 1]
    if (!last) return ''
    return last.content.replace(/\n/g, ' ').substring(0, 55)
}

// Highlight matched substring in text
function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return <>{text}</>
    return (
        <>
            {text.slice(0, idx)}
            <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
            {text.slice(idx + query.length)}
        </>
    )
}

function matchesSearch(conv: Conversation, query: string): boolean {
    if (!query) return true
    const q = query.toLowerCase()
    if (conv.title.toLowerCase().includes(q)) return true
    return conv.messages.some(m => m.content.toLowerCase().includes(q))
}

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
    onCreateFolder,
    onToggleFolderExpand,
}: SessionsPanelProps) {
    const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
    const [contextMenuId, setContextMenuId] = useState<string | null>(null)
    const [folderSubMenuId, setFolderSubMenuId] = useState<string | null>(null)
    const [renamingId, setRenamingId] = useState<string | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const [creatingFolder, setCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState('')
    const [isSearchActive, setIsSearchActive] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const renameInputRef = useRef<HTMLInputElement>(null)
    const folderInputRef = useRef<HTMLInputElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isSearchActive) searchInputRef.current?.focus()
    }, [isSearchActive])

    const closeSearch = () => {
        setIsSearchActive(false)
        setSearchQuery('')
    }

    // Close context menu on outside click
    useEffect(() => {
        const handler = () => {
            setContextMenuId(null)
            setFolderSubMenuId(null)
        }
        document.addEventListener('click', handler)
        return () => document.removeEventListener('click', handler)
    }, [])

    useEffect(() => {
        if (renamingId) renameInputRef.current?.focus()
    }, [renamingId])

    useEffect(() => {
        if (creatingFolder) folderInputRef.current?.focus()
    }, [creatingFolder])

    const openContextMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setContextMenuId(prev => (prev === id ? null : id))
        setFolderSubMenuId(null)
    }

    const startRename = (e: React.MouseEvent, conv: Conversation) => {
        e.stopPropagation()
        setRenamingId(conv.id)
        setRenameValue(conv.title)
        setContextMenuId(null)
    }

    const confirmRename = (id: string) => {
        const t = renameValue.trim()
        if (t) onRenameSession(id, t)
        setRenamingId(null)
    }

    const confirmFolderCreate = () => {
        const t = newFolderName.trim()
        if (t) onCreateFolder(t)
        setNewFolderName('')
        setCreatingFolder(false)
    }

    const visibleConvs = searchQuery
        ? conversations.filter(c => matchesSearch(c, searchQuery))
        : conversations

    const pinned = visibleConvs.filter(c => c.pinned && !c.folderId).sort((a, b) => b.timestamp - a.timestamp)
    const regular = visibleConvs.filter(c => !c.pinned && !c.folderId).sort((a, b) => b.timestamp - a.timestamp)
    const matchCount = searchQuery ? visibleConvs.length : 0

    const renderItem = (conv: Conversation, indented = false) => {
        const isRenaming = renamingId === conv.id
        const menuOpen = contextMenuId === conv.id
        const subOpen = folderSubMenuId === conv.id
        const snippet = getSnippet(conv)

        return (
            <div
                key={conv.id}
                className={`session-item${indented ? ' indented' : ''}${menuOpen ? ' menu-open' : ''}`}
                onClick={() => !isRenaming && onSelectSession(conv.id)}
            >
                <span className="session-icon">{conv.pinned ? '📌' : '💬'}</span>

                <div className="session-body">
                    {isRenaming ? (
                        <input
                            ref={renameInputRef}
                            className="rename-input"
                            value={renameValue}
                            placeholder="Enter chat name"
                            onChange={e => setRenameValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') confirmRename(conv.id)
                                if (e.key === 'Escape') setRenamingId(null)
                            }}
                            onBlur={() => confirmRename(conv.id)}
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div className="session-title">
                            <Highlight text={conv.title} query={searchQuery} />
                        </div>
                    )}
                    <div className="session-snippet">
                        <Highlight text={snippet} query={searchQuery} />
                    </div>
                </div>

                <div className="session-meta" onClick={e => e.stopPropagation()}>
                    <span className="session-time">{relativeTime(conv.timestamp)}</span>
                    <div className="ctx-wrap">
                        <button
                            className="ctx-trigger"
                            title="More options"
                            onClick={e => openContextMenu(e, conv.id)}
                        >
                            ···
                        </button>

                        {menuOpen && !subOpen && (
                            <div className="ctx-menu" onClick={e => e.stopPropagation()}>
                                <button className="ctx-item" onClick={e => startRename(e, conv)}>Rename</button>
                                <button
                                    className="ctx-item ctx-danger"
                                    onClick={e => { e.stopPropagation(); onDeleteSession(conv.id); setContextMenuId(null) }}
                                >
                                    Delete
                                </button>
                                <button
                                    className="ctx-item"
                                    onClick={e => { e.stopPropagation(); setFolderSubMenuId(conv.id) }}
                                >
                                    Add to folder ›
                                </button>
                                <button
                                    className="ctx-item"
                                    onClick={e => { e.stopPropagation(); onTogglePin(conv.id); setContextMenuId(null) }}
                                >
                                    {conv.pinned ? 'Unpin' : 'Pin'}
                                </button>
                            </div>
                        )}

                        {subOpen && (
                            <div className="ctx-menu" onClick={e => e.stopPropagation()}>
                                <button
                                    className="ctx-item ctx-back"
                                    onClick={e => { e.stopPropagation(); setFolderSubMenuId(null) }}
                                >
                                    ← Back
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
                                            📁 {f.name}
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
            {/* Toolbar — normal or search mode */}
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
                    {/* Left: clickable toggle */}
                    <button className="sessions-toggle-btn" onClick={onToggle} title="Toggle sessions">
                        <span className="sessions-label">SESSIONS</span>
                        <span className={`sessions-chevron${isExpanded ? ' open' : ''}`}>›</span>
                    </button>
                    {/* Right: action icons — stop propagation so they don't toggle */}
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
                            if (e.key === 'Enter') confirmFolderCreate()
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

                {searchQuery && visibleConvs.length === 0 && (
                    <div className="sessions-empty">
                        <p>No results for "{searchQuery}"</p>
                    </div>
                )}

                {/* Paginated flat list: pinned first, then regular */}
                {(() => {
                    const flat = [...pinned, ...regular]
                    const visible = flat.slice(0, displayCount)
                    const hasMore = flat.length > displayCount
                    return (
                        <>
                            {visible.map(c => renderItem(c))}
                            {hasMore && (
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

                {/* Folders — hide if searching and no matches inside */}
                {folders.map(folder => {
                    const folderSessions = visibleConvs
                        .filter(c => c.folderId === folder.id)
                        .sort((a, b) => b.timestamp - a.timestamp)

                    // Hide entire folder when searching and nothing matches
                    if (searchQuery && folderSessions.length === 0) return null

                    return (
                        <div key={folder.id} className="folder-group">
                            <div
                                className="folder-header"
                                onClick={() => onToggleFolderExpand(folder.id)}
                            >
                                <span className="folder-icon">📁</span>
                                <span className="folder-name">{folder.name}</span>
                                <span className={`folder-chevron${folder.isExpanded ? ' open' : ''}`}>›</span>
                            </div>
                            {folder.isExpanded && (
                                <div className="folder-contents">
                                    {folderSessions.length === 0
                                        ? <div className="folder-empty">Empty</div>
                                        : folderSessions.map(c => renderItem(c, true))
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

// Simple inline SVG icons
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
