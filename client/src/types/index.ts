export type VideoSource =
  | { type: 'local'; fingerprint: string; filename: string; filesize: number }
  | { type: 'url'; url: string }
  | null

export interface UserInfo {
  socketId: string
  displayName: string
  ping: number
  hasFileReady: boolean
}

export interface PlayerState {
  playing: boolean
  currentTime: number
  lastSyncTimestamp: number
}

export interface RoomState {
  roomId: string
  hostSocketId: string
  members: UserInfo[]
  videoSource: VideoSource
  playerState: PlayerState
  freeControl: boolean
}

export type SyncEventType = 'play' | 'pause' | 'seek' | 'buffer_start' | 'buffer_end'

export interface SyncEvent {
  type: SyncEventType
  currentTime: number
  timestamp: number
  initiatorId: string
}

export interface ChatMessage {
  id: string
  displayName: string
  text: string
  isSystem?: boolean
}

export interface ServerToClientEvents {
  'room:state': (room: RoomState) => void
  'room:error': (message: string) => void
  'sync:event': (event: SyncEvent) => void
  'source:update': (source: VideoSource) => void
  'source:fingerprint': (data: { fingerprint: string; filename: string; filesize: number }) => void
  'pong': (data: { clientTimestamp: number; serverTimestamp: number }) => void
  'chat:message': (msg: ChatMessage) => void
}

export interface ClientToServerEvents {
  'room:create': (displayName: string) => void
  'room:join': (data: { roomId: string; displayName: string }) => void
  'room:leave': () => void
  'sync:event': (data: Omit<SyncEvent, 'timestamp' | 'initiatorId'>) => void
  'source:local': (data: { fingerprint: string; filename: string; filesize: number }) => void
  'source:url': (data: { url: string }) => void
  'source:ready': () => void
  'ping': (data: { clientTimestamp: number }) => void
  'ping:result': (data: { ping: number }) => void
  'chat:send': (data: { text: string }) => void
  'room:freeControl': (enabled: boolean) => void
}
