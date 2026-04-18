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
