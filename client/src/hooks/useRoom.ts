import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import type {
  RoomState,
  ServerToClientEvents,
  ClientToServerEvents,
} from '../types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

export function useRoom() {
  const socketRef = useRef<AppSocket | null>(null)
  const [room, setRoom] = useState<RoomState | null>(null)
  const [mySocketId, setMySocketId] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const socket: AppSocket = io({ transports: ['websocket'] })
    socketRef.current = socket

    socket.on('connect', () => {
      setMySocketId(socket.id ?? '')
      setConnected(true)
    })
    socket.on('disconnect', () => setConnected(false))
    socket.on('room:state', setRoom)
    socket.on('room:error', setError)

    socket.on('pong', ({ clientTimestamp }) => {
      const rtt = Date.now() - clientTimestamp
      socket.emit('ping:result', { ping: rtt })
    })

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', { clientTimestamp: Date.now() })
      }
    }, 10000)

    return () => {
      clearInterval(pingInterval)
      socket.disconnect()
    }
  }, [])

  const createRoom = useCallback((displayName: string) => {
    setError('')
    socketRef.current?.emit('room:create', displayName)
  }, [])

  const joinRoom = useCallback((roomId: string, displayName: string) => {
    setError('')
    socketRef.current?.emit('room:join', { roomId, displayName })
  }, [])

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit('room:leave')
    setRoom(null)
  }, [])

  const isHost = room ? room.hostSocketId === mySocketId : false

  return { socket: socketRef.current, room, mySocketId, isHost, error, connected, createRoom, joinRoom, leaveRoom }
}
