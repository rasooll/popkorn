import type { VideoSource, PlayerState, RoomState, UserInfo } from './types'

const rooms = new Map<string, RoomState>()

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let id = ''
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return rooms.has(id) ? generateRoomId() : id
}

export function createRoom(hostSocketId: string, displayName: string): RoomState {
  const roomId = generateRoomId()
  const host: UserInfo = { socketId: hostSocketId, displayName, ping: 0, hasFileReady: false }
  const room: RoomState = {
    roomId,
    hostSocketId,
    members: [host],
    videoSource: null,
    playerState: { playing: false, currentTime: 0, lastSyncTimestamp: Date.now() },
    freeControl: false,
  }
  rooms.set(roomId, room)
  return room
}

export function joinRoom(
  roomId: string,
  socketId: string,
  displayName: string
): RoomState | null {
  const room = rooms.get(roomId)
  if (!room) return null
  if (room.members.length >= 20) return null
  if (room.members.some((m) => m.socketId === socketId)) return room

  room.members.push({ socketId, displayName, ping: 0, hasFileReady: false })
  return room
}

export function leaveRoom(socketId: string): { room: RoomState | null; wasHost: boolean } {
  for (const room of rooms.values()) {
    const idx = room.members.findIndex((m) => m.socketId === socketId)
    if (idx === -1) continue

    const wasHost = room.hostSocketId === socketId
    room.members.splice(idx, 1)

    if (room.members.length === 0) {
      rooms.delete(room.roomId)
      return { room: null, wasHost }
    }

    if (wasHost) {
      room.hostSocketId = room.members[0].socketId
    }

    return { room, wasHost }
  }
  return { room: null, wasHost: false }
}

export function getRoom(roomId: string): RoomState | null {
  return rooms.get(roomId) ?? null
}

export function getRoomBySocket(socketId: string): RoomState | null {
  for (const room of rooms.values()) {
    if (room.members.some((m) => m.socketId === socketId)) return room
  }
  return null
}

export function updatePlayerState(roomId: string, state: Partial<PlayerState>): void {
  const room = rooms.get(roomId)
  if (room) Object.assign(room.playerState, state)
}

export function setFreeControl(roomId: string, enabled: boolean): void {
  const room = rooms.get(roomId)
  if (room) room.freeControl = enabled
}

export function setVideoSource(roomId: string, source: VideoSource): void {
  const room = rooms.get(roomId)
  if (room) room.videoSource = source
}

export function setMemberReady(roomId: string, socketId: string, ready: boolean): void {
  const room = rooms.get(roomId)
  if (!room) return
  const member = room.members.find((m) => m.socketId === socketId)
  if (member) member.hasFileReady = ready
}

export function updateMemberPing(roomId: string, socketId: string, ping: number): void {
  const room = rooms.get(roomId)
  if (!room) return
  const member = room.members.find((m) => m.socketId === socketId)
  if (member) member.ping = ping
}

export function clearRooms(): void {
  rooms.clear()
}
