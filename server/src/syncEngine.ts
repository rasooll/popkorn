import type { Server } from 'socket.io'
import type { SyncEvent } from './types'
import { getRoomBySocket, updatePlayerState } from './roomManager'

export function registerSyncHandlers(io: Server, socket: { id: string; to: (room: string) => { emit: (ev: string, data: unknown) => void } }) {
  // sync handlers are registered inline in server.ts; this module provides helpers

}

export function broadcastSyncEvent(
  io: Server,
  socketId: string,
  data: Omit<SyncEvent, 'timestamp' | 'initiatorId'>
): void {
  const room = getRoomBySocket(socketId)
  if (!room) return

  const event: SyncEvent = {
    ...data,
    timestamp: Date.now(),
    initiatorId: socketId,
  }

  if (event.type === 'play' || event.type === 'seek') {
    updatePlayerState(room.roomId, {
      playing: event.type === 'play',
      currentTime: event.currentTime,
      lastSyncTimestamp: event.timestamp,
    })
  } else if (event.type === 'pause') {
    updatePlayerState(room.roomId, {
      playing: false,
      currentTime: event.currentTime,
      lastSyncTimestamp: event.timestamp,
    })
  }

  io.to(room.roomId).emit('sync:event', event)
}
