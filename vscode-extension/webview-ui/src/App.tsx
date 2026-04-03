import { useState, useRef, useEffect } from 'react'
import './App.css'
import { MessageBubble } from './components/MessageBubble'
import { InputArea } from './components/InputArea'

interface Message {
  role: 'user' | 'assistant'
  content: string
  metadata?: string // e.g., "Reviewed X files and created Y files"
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
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <button className="back-btn" title="Back to conversations">
            ←
          </button>
          <h2 className="header-title">
            {activeConversationId
              ? conversations.find(c => c.id === activeConversationId)?.title || 'New Conversation'
              : 'Copilot Chat'}
          </h2>
        </div>
        <div className="header-right">
          <button className="header-btn" title="Settings">
            ⚙️
          </button>
          <button className="header-btn" title="Close">
            ✕
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="chat-container">
        <div className="messages-area">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <div className="welcome-content">
                <h1>What can I help you with?</h1>
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
                />
              ))}
              {loading && (
                <div className="message loading">
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

        {/* Input Area */}
        <div className="input-section">
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
