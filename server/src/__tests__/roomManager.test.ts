import { describe, it, expect, beforeEach } from 'vitest'
import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoom,
  getRoomBySocket,
  updatePlayerState,
  setVideoSource,
  setMemberReady,
  updateMemberPing,
  setFreeControl,
  clearRooms,
} from '../roomManager'

beforeEach(() => {
  clearRooms()
})

describe('createRoom', () => {
  it('returns a room with correct initial state', () => {
    const room = createRoom('socket-1', 'Alice')

    expect(room.hostSocketId).toBe('socket-1')
    expect(room.members).toHaveLength(1)
    expect(room.members[0].displayName).toBe('Alice')
    expect(room.members[0].socketId).toBe('socket-1')
    expect(room.videoSource).toBeNull()
    expect(room.freeControl).toBe(false)
    expect(room.playerState.playing).toBe(false)
    expect(room.playerState.currentTime).toBe(0)
  })

  it('generates a 6-character room ID', () => {
    const room = createRoom('socket-1', 'Alice')
    expect(room.roomId).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('generates unique room IDs for different rooms', () => {
    const ids = new Set(Array.from({ length: 20 }, (_, i) => createRoom(`socket-${i}`, 'User').roomId))
    expect(ids.size).toBe(20)
  })

  it('initialises member with zero ping and not ready', () => {
    const room = createRoom('socket-1', 'Alice')
    expect(room.members[0].ping).toBe(0)
    expect(room.members[0].hasFileReady).toBe(false)
  })
})

describe('joinRoom', () => {
  it('adds a member to an existing room', () => {
    const room = createRoom('socket-1', 'Alice')
    const updated = joinRoom(room.roomId, 'socket-2', 'Bob')

    expect(updated).not.toBeNull()
    expect(updated!.members).toHaveLength(2)
    expect(updated!.members[1].displayName).toBe('Bob')
  })

  it('returns null for a non-existent room', () => {
    expect(joinRoom('XXXXXX', 'socket-2', 'Bob')).toBeNull()
  })

  it('returns null when room is at 20 member capacity', () => {
    const room = createRoom('socket-host', 'Host')
    for (let i = 1; i < 20; i++) {
      joinRoom(room.roomId, `socket-${i}`, `User${i}`)
    }
    const result = joinRoom(room.roomId, 'socket-21', 'Overflow')
    expect(result).toBeNull()
  })

  it('does not add duplicate member if already in room', () => {
    const room = createRoom('socket-1', 'Alice')
    joinRoom(room.roomId, 'socket-1', 'Alice')

    const updated = getRoom(room.roomId)
    expect(updated!.members).toHaveLength(1)
  })

  it('does not change the host when a guest joins', () => {
    const room = createRoom('socket-1', 'Alice')
    const updated = joinRoom(room.roomId, 'socket-2', 'Bob')
    expect(updated!.hostSocketId).toBe('socket-1')
  })
})

describe('leaveRoom', () => {
  it('removes the member from the room', () => {
    const room = createRoom('socket-1', 'Alice')
    joinRoom(room.roomId, 'socket-2', 'Bob')
    leaveRoom('socket-2')

    expect(getRoom(room.roomId)!.members).toHaveLength(1)
  })

  it('promotes the next member as host when host leaves', () => {
    const room = createRoom('socket-1', 'Alice')
    joinRoom(room.roomId, 'socket-2', 'Bob')
    const { wasHost } = leaveRoom('socket-1')

    expect(wasHost).toBe(true)
    expect(getRoom(room.roomId)!.hostSocketId).toBe('socket-2')
  })

  it('deletes the room when the last member leaves', () => {
    const room = createRoom('socket-1', 'Alice')
    leaveRoom('socket-1')

    expect(getRoom(room.roomId)).toBeNull()
  })

  it('returns wasHost=false when a guest leaves', () => {
    const room = createRoom('socket-1', 'Alice')
    joinRoom(room.roomId, 'socket-2', 'Bob')
    const { wasHost } = leaveRoom('socket-2')

    expect(wasHost).toBe(false)
  })

  it('returns room=null when socket is not in any room', () => {
    const { room } = leaveRoom('socket-unknown')
    expect(room).toBeNull()
  })
})

describe('getRoom', () => {
  it('returns the room by ID', () => {
    const room = createRoom('socket-1', 'Alice')
    expect(getRoom(room.roomId)).not.toBeNull()
  })

  it('returns null for unknown room ID', () => {
    expect(getRoom('XXXXXX')).toBeNull()
  })
})

describe('getRoomBySocket', () => {
  it('finds the room a socket belongs to', () => {
    const room = createRoom('socket-1', 'Alice')
    joinRoom(room.roomId, 'socket-2', 'Bob')

    expect(getRoomBySocket('socket-2')!.roomId).toBe(room.roomId)
  })

  it('returns null when socket is not in any room', () => {
    expect(getRoomBySocket('socket-nobody')).toBeNull()
  })
})

describe('updatePlayerState', () => {
  it('updates playing and currentTime', () => {
    const room = createRoom('socket-1', 'Alice')
    updatePlayerState(room.roomId, { playing: true, currentTime: 42 })

    const updated = getRoom(room.roomId)!
    expect(updated.playerState.playing).toBe(true)
    expect(updated.playerState.currentTime).toBe(42)
  })

  it('does nothing for unknown room', () => {
    expect(() => updatePlayerState('XXXXXX', { playing: true })).not.toThrow()
  })
})

describe('setVideoSource', () => {
  it('sets a URL source', () => {
    const room = createRoom('socket-1', 'Alice')
    setVideoSource(room.roomId, { type: 'url', url: 'https://example.com/video.mp4' })

    const updated = getRoom(room.roomId)!
    expect(updated.videoSource).toEqual({ type: 'url', url: 'https://example.com/video.mp4' })
  })

  it('sets a local file source', () => {
    const room = createRoom('socket-1', 'Alice')
    setVideoSource(room.roomId, { type: 'local', fingerprint: 'abc123', filename: 'movie.mp4', filesize: 1024 })

    const updated = getRoom(room.roomId)!
    expect(updated.videoSource).toMatchObject({ type: 'local', filename: 'movie.mp4' })
  })

  it('does nothing for unknown room', () => {
    expect(() => setVideoSource('XXXXXX', null)).not.toThrow()
  })
})

describe('setMemberReady', () => {
  it('marks a member as ready', () => {
    const room = createRoom('socket-1', 'Alice')
    setMemberReady(room.roomId, 'socket-1', true)

    expect(getRoom(room.roomId)!.members[0].hasFileReady).toBe(true)
  })

  it('unmarks a member as not ready', () => {
    const room = createRoom('socket-1', 'Alice')
    setMemberReady(room.roomId, 'socket-1', true)
    setMemberReady(room.roomId, 'socket-1', false)

    expect(getRoom(room.roomId)!.members[0].hasFileReady).toBe(false)
  })
})

describe('updateMemberPing', () => {
  it('updates member ping value', () => {
    const room = createRoom('socket-1', 'Alice')
    updateMemberPing(room.roomId, 'socket-1', 45)

    expect(getRoom(room.roomId)!.members[0].ping).toBe(45)
  })
})

describe('setFreeControl', () => {
  it('enables free control', () => {
    const room = createRoom('socket-1', 'Alice')
    setFreeControl(room.roomId, true)

    expect(getRoom(room.roomId)!.freeControl).toBe(true)
  })

  it('disables free control', () => {
    const room = createRoom('socket-1', 'Alice')
    setFreeControl(room.roomId, true)
    setFreeControl(room.roomId, false)

    expect(getRoom(room.roomId)!.freeControl).toBe(false)
  })

  it('does nothing for unknown room', () => {
    expect(() => setFreeControl('XXXXXX', true)).not.toThrow()
  })
})
