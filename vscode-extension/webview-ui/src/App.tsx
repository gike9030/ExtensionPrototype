import { useState, useRef, useEffect, useCallback } from 'react'
import './App.css'
import { MessageBubble } from './components/MessageBubble'
import { InputArea } from './components/InputArea'
import { SessionsPanel } from './components/SessionsPanel'
import { ExecutingPanel } from './components/ExecutingPanel'
import type { Folder } from './components/SessionsPanel'

const vscodeApi = (() => {
    try {
        return (globalThis as unknown as {
            acquireVsCodeApi: () => { postMessage: (msg: unknown) => void }
        }).acquireVsCodeApi()
    } catch {
        return null
    }
})()

type LayoutMode = 'sidebar' | 'editor' | 'window'

interface ContextFile {
    name: string
    path: string
    content: string
}

interface ActiveFile extends ContextFile {
    included: boolean
}

interface Message {
    role: 'user' | 'assistant'
    content: string
    metadata?: string
    steps?: string[]
}

interface Conversation {
    id: string
    title: string
    timestamp: number
    messages: Message[]
    pinned?: boolean
    folderId?: string | null
}

interface AppState {
    conversations: Conversation[]
    folders: Folder[]
}

const API_URL = 'http://localhost:5587'
const CHAT_ENDPOINT = `${API_URL}/chat`
const TITLE_PREVIEW_LENGTH = 50
const CONTEXT_CONTENT_LIMIT = 3000
const EXECUTION_STEP_INTERVAL_MS = 650

function parseAppState(raw: string): AppState {
    try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
            return { conversations: parsed, folders: [] }
        }
        return {
            conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
            folders: Array.isArray(parsed.folders) ? parsed.folders : [],
        }
    } catch {
        return { conversations: [], folders: [] }
    }
}

function generateFakeSteps(message: string): string[] {
    const m = message.toLowerCase()
    if (m.includes('fix') || m.includes('bug') || m.includes('error') || m.includes('issue')) {
        return ['Analyzing error context', 'Identifying root cause', 'Generating fix']
    }
    if (m.includes('explain') || m.includes('what') || m.includes('how') || m.includes('why')) {
        return ['Understanding question', 'Gathering context', 'Formulating explanation']
    }
    if (m.includes('refactor') || m.includes('improve') || m.includes('optimize')) {
        return ['Reading source code', 'Analyzing structure', 'Writing refactored version']
    }
    if (m.includes('test') || m.includes('unit')) {
        return ['Reading source file', 'Identifying test cases', 'Writing tests']
    }
    return ['Analyzing request', 'Reading context', 'Writing code', 'Reviewing output']
}

function App() {
    const initialState = parseAppState(
        (window as unknown as { __INITIAL_STATE__?: string }).__INITIAL_STATE__ ?? '[]'
    )

    const [conversations, setConversations] = useState<Conversation[]>(initialState.conversations)
    const [folders, setFolders] = useState<Folder[]>(initialState.folders)
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [execSteps, setExecSteps] = useState<string[]>([])
    const [execExpanded, setExecExpanded] = useState(true)
    const [activePreviewCode, setActivePreviewCode] = useState<string | null>(null)
    const [acceptedCodes, setAcceptedCodes] = useState<Set<string>>(new Set())
    const execTimers = useRef<ReturnType<typeof setTimeout>[]>([])
    const plannedSteps = useRef<string[]>([])
    const [activeFile, setActiveFile] = useState<ActiveFile | null>(null)
    const [contextFiles, setContextFiles] = useState<ContextFile[]>([])
    const [workspaceFiles, setWorkspaceFiles] = useState<Array<{ name: string; path: string }>>([])

    const [sessionsExpanded, setSessionsExpanded] = useState(initialState.conversations.length > 0)
    const [layoutMode, setLayoutMode] = useState<LayoutMode>(
        ((window as unknown as { __LAYOUT_MODE__?: string }).__LAYOUT_MODE__ as LayoutMode) ?? 'sidebar'
    )
    const [showLayoutMenu, setShowLayoutMenu] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const layoutMenuRef = useRef<HTMLDivElement>(null)
    const conversationsRef = useRef(conversations)
    conversationsRef.current = conversations

    useEffect(() => {
        const state: AppState = { conversations, folders }
        vscodeApi?.postMessage({ command: 'saveState', data: JSON.stringify(state) })
    }, [conversations, folders])

    useEffect(() => {
        const handler = (event: MessageEvent<{
            command: string; data?: string; mode?: LayoutMode;
            name?: string; path?: string; content?: string;
            files?: Array<{ name: string; path: string }>;
            code?: string;
        }>) => {
            const msg = event.data
            if (msg.command === 'restoreState' && msg.data) {
                const restored = parseAppState(msg.data)
                setConversations(restored.conversations)
                setFolders(restored.folders)
                setActiveConversationId(null)
                setMessages([])
                setSessionsExpanded(false)
            }
            if (msg.command === 'setMode' && msg.mode) {
                setLayoutMode(msg.mode)
            }
            if (msg.command === 'activeFileChanged' && msg.name && msg.path && msg.content !== undefined) {
                setActiveFile({ name: msg.name, path: msg.path, content: msg.content, included: false })
            }
            if (msg.command === 'workspaceFiles' && msg.files) {
                setWorkspaceFiles(msg.files)
            }
            if (msg.command === 'fileContent' && msg.name && msg.path && msg.content !== undefined) {
                const file: ContextFile = { name: msg.name, path: msg.path, content: msg.content }
                setContextFiles(prev => prev.find(f => f.path === msg.path) ? prev : [...prev, file])
            }
            if (msg.command === 'codeAcceptedViaKeyboard' && msg.code) {
                setAcceptedCodes(prev => new Set([...prev, msg.code as string]))
                setActivePreviewCode(null)
            }
        }
        window.addEventListener('message', handler)
        return () => window.removeEventListener('message', handler)
    }, [])

    useEffect(() => {
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            setActivePreviewCode(null)
            setAcceptedCodes(new Set())
        }
    }, [messages])

    useEffect(() => {
        if (!showLayoutMenu) return
        const handler = (e: MouseEvent) => {
            if (layoutMenuRef.current && !layoutMenuRef.current.contains(e.target as Node)) {
                setShowLayoutMenu(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showLayoutMenu])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    useEffect(() => {
        const active = conversationsRef.current.find(c => c.id === activeConversationId)
        setMessages(active ? active.messages : [])
    }, [activeConversationId]) // eslint-disable-line react-hooks/exhaustive-deps

    const createNewConversation = useCallback((): string => {
        const newId = Date.now().toString()
        const newConv: Conversation = {
            id: newId,
            title: 'New Conversation',
            timestamp: Date.now(),
            messages: [],
            pinned: false,
            folderId: null,
        }
        setConversations(prev => [newConv, ...prev])
        setActiveConversationId(newId)
        setMessages([])
        setInput('')
        return newId
    }, [])

    const handleSelectSession = (id: string) => {
        setActiveConversationId(id)
        const conv = conversations.find(c => c.id === id)
        if (conv) setMessages(conv.messages)
        setSessionsExpanded(false)
    }

    const handleRenameSession = (id: string, newTitle: string) => {
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
        )
    }

    const handleDeleteSession = (id: string) => {
        setConversations(prev => prev.filter(c => c.id !== id))
        if (activeConversationId === id) {
            setActiveConversationId(null)
            setMessages([])
        }
    }

    const handleTogglePin = (id: string) => {
        setConversations(prev =>
            prev.map(c => c.id === id ? { ...c, pinned: !c.pinned } : c)
        )
    }

    const handleAddToFolder = (sessionId: string, folderId: string) => {
        setConversations(prev =>
            prev.map(c => c.id === sessionId ? { ...c, folderId, pinned: false } : c)
        )
    }

    const handleCreateFolder = (name: string) => {
        const newFolder: Folder = {
            id: Date.now().toString(),
            name,
            isExpanded: true,
        }
        setFolders(prev => [...prev, newFolder])
    }

    const handleToggleFolderExpand = (folderId: string) => {
        setFolders(prev =>
            prev.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f)
        )
    }

    const handleHashTyped = useCallback(() => {
        if (workspaceFiles.length === 0) {
            vscodeApi?.postMessage({ command: 'getWorkspaceFiles' })
        }
    }, [workspaceFiles.length])

    const handleSelectFile = useCallback((file: { name: string; path: string }) => {
        if (contextFiles.find(f => f.path === file.path)) return
        vscodeApi?.postMessage({ command: 'getFileContent', data: file.path })
    }, [contextFiles])

    const handleRemoveContext = useCallback((filePath: string) => {
        setContextFiles(prev => prev.filter(f => f.path !== filePath))
    }, [])

    const handleToggleActiveFile = useCallback(() => {
        setActiveFile(prev => prev ? { ...prev, included: !prev.included } : prev)
    }, [])

    const sendMessage = async () => {
        const text = input.trim()
        if (!text || loading) return

        let convId = activeConversationId
        const userMessage: Message = { role: 'user', content: text }
        const updatedMessages = [...messages, userMessage]

        if (!convId) {
            convId = Date.now().toString()
            const titleText = text.length > TITLE_PREVIEW_LENGTH 
                ? text.substring(0, TITLE_PREVIEW_LENGTH) + '...'
                : text
            const newConv: Conversation = {
                id: convId,
                title: titleText,
                timestamp: Date.now(),
                messages: [userMessage],
                pinned: false,
                folderId: null,
            }
            setConversations(prev => [newConv, ...prev])
            setActiveConversationId(convId)
        } else {
            setMessages(updatedMessages)
        }

        setSessionsExpanded(false)

        const allContext = activeFile?.included ? [activeFile, ...contextFiles] : contextFiles
        let fullMessage = text
        if (allContext.length > 0) {
            const contextBlock = allContext
                .map(f => `[File: ${f.name}]\n\`\`\`\n${f.content.slice(0, CONTEXT_CONTENT_LIMIT)}\n\`\`\``)
                .join('\n\n')
            fullMessage = `${contextBlock}\n\nUser question: ${text}`
        }

        setInput('')
        setLoading(true)

        execTimers.current.forEach(clearTimeout)
        execTimers.current = []
        const steps = generateFakeSteps(text)
        plannedSteps.current = steps
        setExecSteps([])
        setExecExpanded(true)
        steps.forEach((step, i) => {
            const t = setTimeout(() => setExecSteps(prev => [...prev, step]), i * EXECUTION_STEP_INTERVAL_MS)
            execTimers.current.push(t)
        })

        try {
            const res = await fetch(CHAT_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: fullMessage
                }),
            })
            
            if (!res.ok) {
                throw new Error(`API request failed with status ${res.status}`)
            }

            let reply: string
            try {
                const data = await res.json()
                reply = data.reply || data
            } catch {
                throw new Error('Invalid JSON response from backend')
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: reply,
                steps: plannedSteps.current
            }
            const finalMessages = [...updatedMessages, assistantMessage]
            setMessages(finalMessages)

            const titleText = text.length > TITLE_PREVIEW_LENGTH 
                ? text.substring(0, TITLE_PREVIEW_LENGTH) + '...'
                : text
            setConversations(prev =>
                prev.map(c => {
                    if (c.id !== convId) return c
                    return {
                        ...c,
                        messages: finalMessages,
                        title: c.title === 'New Conversation' ? titleText : c.title,
                        timestamp: Date.now(),
                    }
                })
            )
        } catch (err) {
            const errorMsg: Message = { 
                role: 'assistant', 
                content: '⚠️ Could not reach backend.' 
            }
            const errorMessages = [...updatedMessages, errorMsg]
            setMessages(errorMessages)
            setConversations(prev =>
                prev.map(c => c.id !== convId ? c : { ...c, messages: errorMessages, timestamp: Date.now() })
            )
        } finally {
            setLoading(false)
            setExecSteps([])
        }
    }

    const handleApplyCode = useCallback((code: string) => {
        vscodeApi?.postMessage({ command: 'previewCode', data: code })
        setActivePreviewCode(code)
    }, [])

    const handleAcceptCode = useCallback((code: string) => {
        setAcceptedCodes(prev => new Set([...prev, code]))
        setActivePreviewCode(null)
        vscodeApi?.postMessage({ command: 'acceptPreview' })
    }, [])

    const handleRejectCode = useCallback((code: string) => {
        setAcceptedCodes(prev => {
            const newSet = new Set(prev)
            newSet.delete(code)
            return newSet
        })
        setActivePreviewCode(null)
        vscodeApi?.postMessage({ command: 'rejectPreview' })
    }, [])

    const isCodeAccepted = useCallback((code: string) => {
        return acceptedCodes.has(code)
    }, [acceptedCodes])

    const handleMoveToEditor = () => {
        setShowLayoutMenu(false)
        vscodeApi?.postMessage({ command: 'moveToEditorArea' })
    }

    const handleMoveToWindow = () => {
        setShowLayoutMenu(false)
        vscodeApi?.postMessage({ command: 'moveToNewWindow' })
    }

    const handleMoveToSidebar = () => {
        vscodeApi?.postMessage({ command: 'moveToSidebar' })
    }

    const activeTitle = conversations.find(c => c.id === activeConversationId)?.title ?? 'Chat'

    return (
        <div className={`app layout-${layoutMode}`}>
            {/* Header */}
            <div className={`chat-container${sessionsExpanded ? ' sessions-expanded' : ''}`}>
                <div className="header" style={{ order: sessionsExpanded ? 0 : 2 }}>
                    <div className="header-left">
                        {layoutMode !== 'sidebar' && (
                            <button className="back-btn" title="Back to sidebar" onClick={handleMoveToSidebar}>
                                ←
                            </button>
                        )}
                        <h2 className="header-title">
                            {activeConversationId ? activeTitle : 'Chat'}
                        </h2>
                    </div>

                    <div className="header-right">
                        <button
                            className="header-btn"
                            title="New conversation"
                            onClick={() => {
                                createNewConversation()
                                setSessionsExpanded(false)
                            }}
                        >
                            +
                        </button>
                        <button className="header-btn" title="Settings">⚙</button>

                        {/* Layout menu */}
                        <div className="layout-menu-container" ref={layoutMenuRef}>
                            <button
                                className={`header-btn${showLayoutMenu ? ' active' : ''}`}
                                title="Panel layout"
                                onClick={() => setShowLayoutMenu(p => !p)}
                            >
                                ⊞
                            </button>
                            {showLayoutMenu && (
                                <div className="layout-dropdown">
                                    <button className="dropdown-item" onClick={handleMoveToEditor}>
                                        Move Chat Into Editor Area
                                    </button>
                                    <button className="dropdown-item" onClick={handleMoveToWindow}>
                                        Move Chat Into New Window
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sessions collapsible panel — always rendered, shows/hides list */}
                <div style={{ order: 1 }}>
                    <SessionsPanel
                        conversations={conversations}
                        folders={folders}
                        isExpanded={sessionsExpanded}
                        onToggle={() => setSessionsExpanded(p => !p)}
                        onSelectSession={handleSelectSession}
                        onRenameSession={handleRenameSession}
                        onDeleteSession={handleDeleteSession}
                        onTogglePin={handleTogglePin}
                        onAddToFolder={handleAddToFolder}
                        onCreateFolder={handleCreateFolder}
                        onToggleFolderExpand={handleToggleFolderExpand}
                    />
                </div>

                {/* Chat area — hidden when sessions is expanded */}
                {!sessionsExpanded && (
                    <div className="messages-area" style={{ order: 3 }}>
                        {messages.length === 0 ? (
                            <div className="welcome-message">
                                <div className="welcome-content">
                                    <h1>Hello!</h1>
                                    <p>Start the conversation</p>
                                </div>
                            </div>
                        ) : (
                            <div className="messages-list">
                                {messages.map((msg, i) => (
                                    <MessageBubble
                                        key={i}
                                        role={msg.role}
                                        content={msg.content}
                                        metadata={msg.metadata}
                                        steps={msg.steps}
                                        onApplyCode={handleApplyCode}
                                        activePreviewCode={activePreviewCode}
                                        onAcceptCode={handleAcceptCode}
                                        onRejectCode={handleRejectCode}
                                        isCodeAccepted={isCodeAccepted}
                                    />
                                ))}
                                {loading && (
                                    <ExecutingPanel
                                        steps={execSteps}
                                        expanded={execExpanded}
                                        onToggle={() => setExecExpanded(p => !p)}
                                    />
                                )}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}

                {/* Input hidden when sessions expanded */}
                {!sessionsExpanded && (
                    <div className="input-section" style={{ order: 4 }}>
                        <InputArea
                            value={input}
                            onChange={setInput}
                            onSubmit={sendMessage}
                            disabled={loading}
                            maxLength={4000}
                            placeholder="Ask anything..."
                            activeFile={activeFile?.name ?? null}
                            activeFileIncluded={activeFile?.included ?? false}
                            onToggleActiveFile={handleToggleActiveFile}
                            contextFiles={contextFiles.map(f => ({ name: f.name, path: f.path }))}
                            onRemoveContext={handleRemoveContext}
                            workspaceFiles={workspaceFiles}
                            onSelectFile={handleSelectFile}
                            onHashTyped={handleHashTyped}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

export default App
