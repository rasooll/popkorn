import { useState, useEffect, useRef } from 'react'
import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '../types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface ChatMessage {
  id: string
  displayName: string
  text: string
  isSystem?: boolean
}

interface Props {
  socket: AppSocket | null
  displayName?: string
}

export function ChatSidebar({ socket }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!socket) return
    const handler = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    }
    socket.on('chat:message', handler)
    return () => { socket.off('chat:message', handler) }
  }, [socket])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    socket?.emit('chat:send', { text })
    setInput('')
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3 px-4 pt-4">
        💬 Chat
      </h3>
      <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-gray-700 text-xs text-center mt-4">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={msg.isSystem ? 'text-center' : ''}>
            {msg.isSystem ? (
              <span className="text-gray-600 text-xs">{msg.text}</span>
            ) : (
              <div>
                <span className="text-amber-400 text-xs font-medium">{msg.displayName}</span>
                <p className="text-gray-300 text-sm mt-0.5 break-words">{msg.text}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 pt-2 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something…"
            maxLength={200}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-gray-950 font-semibold px-3 py-2 rounded-lg text-sm transition-colors"
          >
            →
          </button>
        </div>
      </form>
    </div>
  )
}
