import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  updatePlayerState,
  setVideoSource,
  setMemberReady,
  updateMemberPing,
  setFreeControl,
} from './roomManager'
import type { SyncEvent } from './types'

const app = express()
const httpServer = createServer(app)
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
const io = new Server(httpServer, {
  cors: { origin: CORS_ORIGIN, methods: ['GET', 'POST'] },
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

if (process.env.NODE_ENV === 'production') {
  const staticDir = path.join(__dirname, '..', 'public')
  app.use(express.static(staticDir))
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')))
}

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`)

  socket.on('room:create', (displayName: string) => {
    const room = createRoom(socket.id, displayName)
    socket.join(room.roomId)
    socket.emit('room:state', room)
  })

  socket.on('room:join', ({ roomId, displayName }: { roomId: string; displayName: string }) => {
    const upper = roomId.toUpperCase()
    const room = joinRoom(upper, socket.id, displayName)
    if (!room) {
      socket.emit('room:error', 'Room not found or full.')
      return
    }
    socket.join(upper)
    io.to(upper).emit('room:state', room)
  })

  socket.on('room:leave', () => handleLeave(socket.id))

  socket.on('disconnect', () => {
    handleLeave(socket.id)
    console.log(`[disconnect] ${socket.id}`)
  })

  socket.on('room:freeControl', (enabled: boolean) => {
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostSocketId !== socket.id) return
    setFreeControl(room.roomId, enabled)
    io.to(room.roomId).emit('room:state', { ...room })
  })

  socket.on(
    'sync:event',
    (data: Omit<SyncEvent, 'timestamp' | 'initiatorId'>) => {
      const room = getRoomBySocket(socket.id)
      if (!room) return
      if (room.hostSocketId !== socket.id && !room.freeControl) return

      const event: SyncEvent = {
        ...data,
        timestamp: Date.now(),
        initiatorId: socket.id,
      }

      updatePlayerState(room.roomId, {
        playing: event.type === 'play',
        currentTime: event.currentTime,
        lastSyncTimestamp: event.timestamp,
      })

      socket.to(room.roomId).emit('sync:event', event)
    }
  )

  socket.on(
    'source:local',
    (data: { fingerprint: string; filename: string; filesize: number }) => {
      const room = getRoomBySocket(socket.id)
      if (!room || room.hostSocketId !== socket.id) return

      setVideoSource(room.roomId, { type: 'local', ...data })
      setMemberReady(room.roomId, socket.id, true)
      io.to(room.roomId).emit('source:fingerprint', data)
      io.to(room.roomId).emit('room:state', { ...room })
    }
  )

  socket.on('source:url', (data: { url: string }) => {
    const room = getRoomBySocket(socket.id)
    if (!room || room.hostSocketId !== socket.id) return

    setVideoSource(room.roomId, { type: 'url', url: data.url })
    io.to(room.roomId).emit('source:update', room.videoSource)
    io.to(room.roomId).emit('room:state', { ...room })
  })

  socket.on('source:ready', () => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    setMemberReady(room.roomId, socket.id, true)
    io.to(room.roomId).emit('room:state', { ...room })
  })

  socket.on('ping', (data: { clientTimestamp: number }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    socket.emit('pong', { clientTimestamp: data.clientTimestamp, serverTimestamp: Date.now() })
  })

  socket.on('ping:result', (data: { ping: number }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    updateMemberPing(room.roomId, socket.id, data.ping)
    io.to(room.roomId).emit('room:state', { ...room })
  })

  socket.on('chat:send', (data: { text: string }) => {
    const room = getRoomBySocket(socket.id)
    if (!room) return
    const member = room.members.find((m) => m.socketId === socket.id)
    if (!member) return
    const msg = {
      id: `${Date.now()}-${socket.id}`,
      displayName: member.displayName,
      text: data.text.slice(0, 200),
    }
    io.to(room.roomId).emit('chat:message', msg)
  })

  function handleLeave(socketId: string) {
    const { room } = leaveRoom(socketId)
    if (room) {
      io.to(room.roomId).emit('room:state', room)
    }
  }
})

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Popkorn server running on http://0.0.0.0:${PORT}`)
})
