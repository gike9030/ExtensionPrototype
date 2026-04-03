import { useState, useRef, useEffect } from 'react'
import './App.css'
import { MessageBubble } from './components/MessageBubble'
import { InputArea } from './components/InputArea'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  timestamp: number
  messages: Message[]
}

const API_URL = 'http://localhost:5587'

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Update messages when active conversation changes
  useEffect(() => {
    const active = conversations.find(conv => conv.id === activeConversationId)
    if (active) {
      setMessages(active.messages)
    }
  }, [activeConversationId, conversations])

  const generateConversationTitle = (firstMessage: string) => {
    const text = firstMessage.substring(0, 50)
    return text.length === 50 ? text + '...' : text
  }

  const createNewConversation = () => {
    const newId = Date.now().toString()
    const newConv: Conversation = {
      id: newId,
      title: 'New Conversation',
      timestamp: Date.now(),
      messages: [],
    }
    setConversations(prev => [newConv, ...prev])
    setActiveConversationId(newId)
    setMessages([])
    setInput('')
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Ensure active conversation exists
    if (!activeConversationId) {
      createNewConversation()
    }

    const userMessage: Message = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()
      const assistantMessage: Message = { role: 'assistant', content: data.reply }
      const finalMessages = [...updatedMessages, assistantMessage]
      setMessages(finalMessages)

      // Update conversation in history
      setConversations(prev =>
        prev.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              messages: finalMessages,
              title:
                conv.title === 'New Conversation'
                  ? generateConversationTitle(text)
                  : conv.title,
              timestamp: Date.now(),
            }
          }
          return conv
        })
      )
    } catch {
      const errorMessage: Message = {
        role: 'assistant',
        content: '⚠️ Could not reach backend.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id)
  }

  const handleDeleteConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id))
    if (activeConversationId === id) {
      const remaining = conversations.filter(conv => conv.id !== id)
      setActiveConversationId(remaining.length > 0 ? remaining[0].id : null)
      setMessages([])
    }
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all conversations?')) {
      setConversations([])
      setActiveConversationId(null)
      setMessages([])
    }
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button className="search-btn" onClick={() => console.log('search')} title="Search">
            🔍
          </button>
          <button className="new-chat-btn" onClick={createNewConversation} title="New chat">
            +
          </button>
        </div>

        {sidebarOpen && (
          <div className="sidebar-content">
            <div className="conversations-list">
              {conversations.length === 0 ? (
                <div className="empty-history">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`conversation-item ${
                      activeConversationId === conv.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setActiveConversationId(conv.id)
                      setSidebarOpen(false)
                    }}
                  >
                    <div className="conversation-title">{conv.title}</div>
                    <button
                      className="delete-btn"
                      onClick={e => {
                        e.stopPropagation()
                        handleDeleteConversation(conv.id)
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h1>What can I help you with?</h1>
              <p>Start a new conversation below</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  timestamp={Date.now()}
                  onCopy={content => navigator.clipboard.writeText(content)}
                />
              ))}
              {loading && (
                <div className="message-bubble assistant loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="input-area">
          <InputArea
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            disabled={loading}
            maxLength={4000}
            placeholder="Ask anything..."
          />
        </div>
      </div>
    </div>
  )
}

export default App
