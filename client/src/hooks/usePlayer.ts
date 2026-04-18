import { useEffect, useRef, useCallback } from 'react'
import type { Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents, SyncEvent, PlayerState } from '../types'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface UsePlayerOptions {
  socket: AppSocket | null
  isHost: boolean
  freeControl: boolean
  onBufferingChange: (buffering: boolean, username?: string) => void
}

export function usePlayer({ socket, isHost, freeControl, onBufferingChange }: UsePlayerOptions) {
  const playerRef = useRef<ReturnType<typeof import('video.js')['default']> | null>(null)
  const isSyncing = useRef(false)

  const canControl = isHost || freeControl

  const emitSync = useCallback(
    (type: SyncEvent['type'], currentTime: number) => {
      socket?.emit('sync:event', { type, currentTime })
    },
    [socket]
  )

  useEffect(() => {
    if (!socket) return

    const handleSyncEvent = (event: SyncEvent) => {
      const player = playerRef.current
      if (!player) return
      if (event.initiatorId === socket.id) return

      const latencyOffset = (Date.now() - event.timestamp) / 2
      const targetTime = event.currentTime + latencyOffset / 1000

      isSyncing.current = true

      if (event.type === 'play') {
        const localTime = player.currentTime() ?? 0
        if (Math.abs(localTime - targetTime) >= 1.5) {
          player.currentTime(targetTime)
        }
        player.play()
      } else if (event.type === 'pause') {
        player.pause()
        const localTime = player.currentTime() ?? 0
        if (Math.abs(localTime - targetTime) >= 1.5) {
          player.currentTime(targetTime)
        }
      } else if (event.type === 'seek') {
        const localTime = player.currentTime() ?? 0
        if (Math.abs(localTime - targetTime) >= 1.5) {
          player.currentTime(targetTime)
        }
      } else if (event.type === 'buffer_start') {
        const member = event.initiatorId
        player.pause()
        onBufferingChange(true, member)
      } else if (event.type === 'buffer_end') {
        player.play()
        onBufferingChange(false)
      }

      setTimeout(() => { isSyncing.current = false }, 200)
    }

    socket.on('sync:event', handleSyncEvent)
    return () => { socket.off('sync:event', handleSyncEvent) }
  }, [socket, onBufferingChange])

  const syncToState = useCallback((state: PlayerState) => {
    const player = playerRef.current
    if (!player) return
    isSyncing.current = true
    player.currentTime(state.currentTime)
    if (state.playing) {
      player.play()
    } else {
      player.pause()
    }
    setTimeout(() => { isSyncing.current = false }, 300)
  }, [])

  return { playerRef, canControl, emitSync, isSyncing, syncToState }
}
