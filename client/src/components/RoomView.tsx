import { useState, useCallback, useEffect } from 'react'
import type { Socket } from 'socket.io-client'
import type { RoomState, VideoSource, ServerToClientEvents, ClientToServerEvents, SyncEvent } from '../types'
import { VideoPlayer } from './VideoPlayer'
import { SourceSelector } from './SourceSelector'
import { ChatSidebar } from './ChatSidebar'
import { usePlayer } from '../hooks/usePlayer'
import { djb2 } from '../lib/fingerprint'

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

interface Props {
  room: RoomState
  mySocketId: string
  isHost: boolean
  socket: AppSocket | null
  onLeave: () => void
}

export function RoomView({ room, mySocketId, isHost, socket, onLeave }: Props) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [videoSrcType, setVideoSrcType] = useState<'url' | 'hls' | null>(null)
  const [buffering, setBuffering] = useState<{ active: boolean; username?: string }>({ active: false })
  const freeControl = room.freeControl
  const [myFileReady, setMyFileReady] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  const handleBufferingChange = useCallback((isBuffering: boolean, uid?: string) => {
    const member = room.members.find((m) => m.socketId === uid)
    setBuffering({ active: isBuffering, username: member?.displayName })
  }, [room.members])

  const { playerRef, canControl, emitSync, isSyncing, syncToState } = usePlayer({
    socket,
    isHost,
    freeControl,
    onBufferingChange: handleBufferingChange,
  })

  function copyRoomLink() {
    const link = `${window.location.origin}/room/${room.roomId}`
    navigator.clipboard.writeText(link)
  }

  function handleSelectUrl(url: string) {
    socket?.emit('source:url', { url })
    const isHls = url.toLowerCase().endsWith('.m3u8')
    setVideoSrc(url)
    setVideoSrcType(isHls ? 'hls' : 'url')
  }

  function handleSelectFile(file: File) {
    const fingerprint = djb2(file.name + file.size + file.lastModified)

    if (isHost) {
      socket?.emit('source:local', {
        fingerprint: String(fingerprint),
        filename: file.name,
        filesize: file.size,
      })
      const objectUrl = URL.createObjectURL(file)
      setVideoSrc(objectUrl)
      setVideoSrcType('url')
      setMyFileReady(true)
      setFileError(null)
    } else {
      // Guest: check fingerprint against room source
      const source = room.videoSource
      if (!source || source.type !== 'local') return
      const fp = djb2(file.name + file.size + file.lastModified)
      if (String(fp) !== source.fingerprint) {
        setFileError(`❌ Wrong file — pick ${source.filename} (${(source.filesize / 1048576).toFixed(1)} MB)`)
        return
      }
      setFileError(null)
      const objectUrl = URL.createObjectURL(file)
      setVideoSrc(objectUrl)
      setVideoSrcType('url')
      socket?.emit('source:ready')
      setMyFileReady(true)
    }
  }

  // When host streams a URL, guests receive source:update and load it
  // This is handled via room.videoSource changes passed as prop
  const displaySource: VideoSource = room.videoSource

  // Guests auto-load URL source when host selects it, then sync to current playerState
  useEffect(() => {
    if (isHost) return
    if (room.videoSource?.type === 'url') {
      const url = room.videoSource.url
      const isHls = url.toLowerCase().endsWith('.m3u8')
      setVideoSrc(url)
      setVideoSrcType(isHls ? 'hls' : 'url')
      // Defer sync until player has loaded the source
      setTimeout(() => syncToState(room.playerState), 1500)
    }
  }, [room.videoSource, isHost]) // intentionally omit syncToState/playerState to only fire on source change

  const allReadyCount = room.members.filter((m) => m.hasFileReady).length
  const myMember = room.members.find((m) => m.socketId === mySocketId)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍿</span>
          <span className="text-amber-400 font-bold tracking-tight">Popkorn</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm">Room:</span>
          <span className="font-mono text-white font-semibold tracking-widest">{room.roomId}</span>
          <button
            type="button"
            onClick={copyRoomLink}
            className="text-gray-400 hover:text-amber-400 transition-colors text-sm"
            title="Copy room link"
          >
            📋
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="ml-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            Leave
          </button>
        </div>
      </header>

      {/* Buffering banner */}
      {buffering.active && (
        <div className="bg-gray-900 border-b border-amber-400/30 px-4 py-2 text-center text-amber-400 text-sm">
          ⏳ Buffering{buffering.username ? `: ${buffering.username}…` : '…'}
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left: video + source selector */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 bg-black flex items-center justify-center min-h-0">
            {videoSrc ? (
              <VideoPlayer
                src={videoSrc}
                srcType={videoSrcType}
                canControl={canControl}
                playerRef={playerRef}
                isSyncing={isSyncing}
                onEmitSync={(type: SyncEvent['type'], t: number) => emitSync(type, t)}
                onBuffer={(isBuffering) => {
                  if (isBuffering) {
                    socket?.emit('sync:event', { type: 'buffer_start', currentTime: playerRef.current?.currentTime() ?? 0 })
                  } else {
                    socket?.emit('sync:event', { type: 'buffer_end', currentTime: playerRef.current?.currentTime() ?? 0 })
                  }
                }}
              />
            ) : (
              <div className="text-center text-gray-700">
                <div className="text-5xl mb-3">🎬</div>
                <p className="text-sm">Select a video source below</p>
              </div>
            )}
          </div>

          {fileError && (
            <div className="px-4 py-2 bg-red-950 border-t border-red-800 text-red-400 text-sm">
              {fileError}
            </div>
          )}

          <SourceSelector
            isHost={isHost}
            videoSource={displaySource}
            onSelectUrl={handleSelectUrl}
            onSelectFile={handleSelectFile}
            myFileReady={myMember?.hasFileReady ?? myFileReady}
            allReadyCount={allReadyCount}
            totalCount={room.members.length}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-gray-900 border-t md:border-t-0 md:border-l border-gray-800 flex flex-col shrink-0">
          {/* Members */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">
              👥 Members ({room.members.length}/20)
            </h3>
            <ul className="space-y-2">
              {room.members.map((member) => {
                const isMe = member.socketId === mySocketId
                const isRoomHost = member.socketId === room.hostSocketId
                return (
                  <li key={member.socketId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isRoomHost && <span className="text-xs">👑</span>}
                      <span className="text-sm text-gray-200">
                        {member.displayName}
                        {isMe && <span className="text-gray-500 ml-1">(you)</span>}
                      </span>
                      {member.hasFileReady && <span className="text-green-400 text-xs">✅</span>}
                    </div>
                    {member.ping > 0 && (
                      <span
                        className={`text-xs font-mono ${
                          member.ping < 80
                            ? 'text-green-400'
                            : member.ping < 200
                            ? 'text-yellow-400'
                            : 'text-red-400'
                        }`}
                      >
                        {member.ping}ms
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Free control toggle (host only) */}
          {isHost && (
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">Free control</span>
              <button
                type="button"
                onClick={() => socket?.emit('room:freeControl', !freeControl)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  freeControl ? 'bg-amber-400' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    freeControl ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          <ChatSidebar
            socket={socket}
            displayName={room.members.find((m) => m.socketId === mySocketId)?.displayName ?? ''}
          />
        </aside>
      </div>
    </div>
  )
}
