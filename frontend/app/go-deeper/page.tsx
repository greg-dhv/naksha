'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AppShell from '@/components/AppShell'
import { getChatSessions, getChatHistory, streamChat } from '@/lib/api'
import { ChatMessage } from '@/lib/types'
import { ChatSession } from '@/lib/api'

function newSessionId() {
  return crypto.randomUUID()
}

const QUESTIONS: Record<string, string[]> = {
  default: [
    "What does next month look like for me?",
    "What kind of partner fits me best?",
    "What inner qualities am I here to develop?",
  ],
  season: [
    "What does my chart say about this phase of my life?",
    "What may be shifting for me this year?",
    "What might this year highlight in my love life?",
  ],
  'chart-stands-out': [
    "What patterns stand out most in my birth chart?",
    "Which parts of my birth chart shape me the most?",
    "What are the most important themes in my birth chart?",
  ],
  'chart-soul': [
    "What is my soul here to learn in this lifetime?",
    "What deeper purpose is reflected in my birth chart?",
    "What does my birth chart suggest about my soul's purpose?",
  ],
}

export default function GoDeeperPage() {
  const { user, token, loading, openAuthModal } = useAuth()
  const [sessionId, setSessionId] = useState<string>(() => newSessionId())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [suggested, setSuggested] = useState<string[]>(QUESTIONS.default)
  const bottomRef = useRef<HTMLDivElement>(null)
  const landingInputRef = useRef<HTMLTextAreaElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)

  const isActiveChat = messages.length > 0

  useEffect(() => {
    if (!loading && !user) openAuthModal()
  }, [loading, user])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) setInput(q)
    const from = params.get('from') ?? 'default'
    setSuggested(QUESTIONS[from] ?? QUESTIONS.default)
  }, [])

  useEffect(() => {
    if (!token) return
    getChatSessions(token).then(setSessions).catch(() => {})
  }, [token])

  useEffect(() => {
    if (!token) return
    setMessages([])
    const exists = sessions.find(s => s.session_id === sessionId)
    if (exists) {
      getChatHistory(token, sessionId).then(setMessages).catch(() => {})
    }
  }, [sessionId, token])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function goBack() {
    setSessionId(newSessionId())
    setMessages([])
    setInput('')
    setError('')
  }

  function loadSession(sid: string) {
    setSessionId(sid)
  }

  async function send() {
    if (!input.trim() || streaming || !token) return
    const text = input.trim()
    setInput('')
    setError('')

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      await streamChat(token, text, sessionId, (chunk) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantId ? { ...m, content: m.content + chunk } : m
        ))
      })
      getChatSessions(token).then(setSessions).catch(() => {})
    } catch (e: any) {
      setError(e.message)
      setMessages(prev => prev.filter(m => m.id !== assistantId))
    } finally {
      setStreaming(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (loading) return null
  if (!user) return (
    <div style={{ minHeight: '100vh', background: 'var(--nk-ground)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: 'var(--font-sans)', color: 'var(--nk-text-3)', fontSize: '13px' }}>Sign in to access Go Deeper</p>
    </div>
  )

  const sendButton = (size: number, radius: string) => (
    <button
      onClick={send}
      disabled={!input.trim() || streaming}
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: radius, border: 'none',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: input.trim() && !streaming ? 'var(--nk-primary)' : 'var(--nk-surface-2)',
        color: input.trim() && !streaming ? '#fff' : 'var(--nk-text-4)',
        fontSize: '18px', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
        transition: 'all 200ms ease',
        boxShadow: input.trim() && !streaming ? 'var(--nk-primary-glow)' : 'none',
      }}
    >
      ↑
    </button>
  )

  // ── Active chat view ──
  if (isActiveChat) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '100dvh' }}>

          <div style={{
            padding: '14px 20px 0',
            position: 'sticky', top: 0, zIndex: 10,
            background: 'rgba(11,18,32,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--nk-border-hair)',
          }}>
            <button
              onClick={goBack}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 14px',
                display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--nk-text-3)',
                transition: 'color var(--dur-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--nk-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--nk-text-3)')}
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>←</span>
              Back
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: '24px 20px',
            display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '120px',
          }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: msg.role === 'user' ? '10px 14px' : '16px 18px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: msg.role === 'user' ? 'var(--nk-primary-dim)' : 'var(--nk-surface)',
                  border: `1px solid ${msg.role === 'user' ? 'var(--nk-primary-line)' : 'var(--nk-border)'}`,
                  boxShadow: 'var(--nk-shadow-sm)',
                }}>
                  {msg.role === 'assistant' && (
                    <p style={{
                      fontFamily: 'var(--font-sans)', fontSize: '9px',
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      color: 'var(--nk-primary)', marginBottom: '8px',
                    }}>
                      Naksha
                    </p>
                  )}
                  {msg.role === 'assistant' && msg.content === '' ? (
                    <span style={{ display: 'flex', gap: '5px', alignItems: 'center', height: '22px' }}>
                      <style>{`
                        @keyframes nk-dot-bounce {
                          0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
                          40% { opacity: 1; transform: translateY(-4px); }
                        }
                        .nk-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--nk-text-3); animation: nk-dot-bounce 1.2s infinite ease-in-out; }
                        .nk-dot:nth-child(2) { animation-delay: 0.2s; }
                        .nk-dot:nth-child(3) { animation-delay: 0.4s; }
                      `}</style>
                      <span className="nk-dot" />
                      <span className="nk-dot" />
                      <span className="nk-dot" />
                    </span>
                  ) : (
                    <p style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: msg.role === 'assistant' ? '15px' : '14px',
                      color: msg.role === 'user' ? 'var(--nk-text-2)' : 'var(--nk-text)',
                      lineHeight: msg.role === 'assistant' ? 1.85 : 1.6,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {error && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--nk-danger)', textAlign: 'center' }}>
                {error}
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-bar" style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            background: 'rgba(11,18,32,0.97)',
            borderTop: '1px solid var(--nk-border)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', maxWidth: '720px', margin: '0 auto' }}>
              <textarea
                ref={chatInputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your chart…"
                rows={1}
                style={{
                  flex: 1, background: 'var(--nk-surface)',
                  border: '1px solid var(--nk-border)',
                  borderRadius: 'var(--nk-r-sm)',
                  padding: '12px 14px', color: 'var(--nk-text)',
                  fontFamily: 'var(--font-sans)', fontSize: '14px',
                  resize: 'none', lineHeight: 1.5,
                  maxHeight: '120px', overflowY: 'auto',
                  outline: 'none',
                }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
              {sendButton(44, 'var(--nk-r-sm)')}
            </div>
          </div>
        </div>
      </AppShell>
    )
  }

  // ── Landing view ──
  return (
    <AppShell>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px 80px' }}>
          <div style={{ width: '100%', maxWidth: '560px' }}>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '44px', height: '44px', borderRadius: '50%',
                background: 'var(--nk-primary-dim)', border: '1px solid var(--nk-primary-line)',
                fontSize: '18px', color: 'var(--nk-primary)',
                marginBottom: '20px',
              }}>
                ✦
              </div>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 5vw, 26px)',
                fontWeight: 300, color: 'var(--nk-text)', lineHeight: 1.25, marginBottom: '10px',
              }}>
                What would you like to explore?
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--nk-text-3)', lineHeight: 1.7 }}>
                Ask about your planets, current life season, relationships, career, or anything on your mind.
              </p>
            </div>

            {/* Input */}
            <div style={{
              display: 'flex', gap: '10px', alignItems: 'center',
              background: 'var(--nk-surface)',
              border: '1px solid var(--nk-border)',
              borderRadius: 'var(--nk-r-md)',
              padding: '10px 10px 10px 16px',
              marginBottom: '16px',
              boxShadow: 'var(--nk-shadow-sm)',
              transition: 'border-color 150ms ease',
            }}>
              <textarea
                ref={landingInputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your chart…"
                rows={1}
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: 'var(--nk-text)', fontFamily: 'var(--font-sans)',
                  fontSize: '14px', resize: 'none', lineHeight: '20px',
                  maxHeight: '120px', overflowY: 'auto', padding: '0', display: 'block',
                }}
                onInput={e => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
                }}
              />
              {sendButton(40, 'var(--nk-r-sm)')}
            </div>

            {/* Suggestions */}
            <div style={{ marginBottom: '40px' }}>
              <p style={{
                fontFamily: 'var(--font-sans)', fontSize: '10px', letterSpacing: '0.14em',
                textTransform: 'uppercase', color: 'var(--nk-text-4)',
                textAlign: 'center', marginBottom: '12px',
              }}>
                Or try one of these
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {suggested.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => { setInput(prompt); landingInputRef.current?.focus() }}
                    style={{
                      background: 'var(--nk-surface)',
                      border: '1px solid var(--nk-border)',
                      borderRadius: 'var(--nk-r-sm)', padding: '11px 16px',
                      color: 'var(--nk-text-2)', fontFamily: 'var(--font-sans)', fontSize: '13px',
                      textAlign: 'left', cursor: 'pointer', transition: 'all 150ms ease', lineHeight: 1.5,
                      boxShadow: 'var(--nk-shadow-sm)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--nk-primary-dim)'
                      e.currentTarget.style.borderColor = 'var(--nk-primary-line)'
                      e.currentTarget.style.color = 'var(--nk-text)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'var(--nk-surface)'
                      e.currentTarget.style.borderColor = 'var(--nk-border)'
                      e.currentTarget.style.color = 'var(--nk-text-2)'
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Recent chats */}
            {sessions.length > 0 && (
              <div>
                <p style={{
                  fontFamily: 'var(--font-sans)', fontSize: '10px',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: 'var(--nk-text-4)', marginBottom: '10px',
                }}>
                  Recent chats
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {sessions.slice(0, 6).map(s => (
                    <button
                      key={s.session_id}
                      onClick={() => loadSession(s.session_id)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '12px 14px',
                        background: 'var(--nk-surface)', border: '1px solid var(--nk-border)',
                        borderRadius: 'var(--nk-r-sm)',
                        cursor: 'pointer', transition: 'all 150ms ease',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                        boxShadow: 'var(--nk-shadow-sm)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface-2)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-border-hover)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--nk-surface)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--nk-border)'
                      }}
                    >
                      <p style={{
                        fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--nk-text-2)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                      }}>
                        {s.preview || 'Conversation'}
                      </p>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--nk-text-4)', flexShrink: 0 }}>
                        {new Date(s.last_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AppShell>
  )
}
