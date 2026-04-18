import { useState } from 'react'

interface Props {
  onCreate: (displayName: string) => void
  onJoin: (roomId: string, displayName: string) => void
  error: string
}

export function RoomLobby({ onCreate, onJoin, error }: Props) {
  const [displayName, setDisplayName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState<'create' | 'join'>('create')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const name = displayName.trim()
    if (!name) return
    if (mode === 'create') {
      onCreate(name)
    } else {
      const code = roomCode.trim().toUpperCase()
      if (code.length !== 6) return
      onJoin(code, name)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="text-6xl">🍿</span>
          <h1 className="text-3xl font-bold text-amber-400 mt-3 tracking-tight">Popkorn</h1>
          <p className="text-gray-500 mt-1 text-sm">Watch together. In sync.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl p-6 shadow-xl border border-gray-800">
          <div className="flex rounded-xl overflow-hidden border border-gray-700 mb-6">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'create'
                  ? 'bg-amber-400 text-gray-950'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                mode === 'join'
                  ? 'bg-amber-400 text-gray-950'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Join Room
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
                Your Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alice"
                maxLength={24}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wider">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  maxLength={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 font-mono tracking-widest text-center text-lg focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={!displayName.trim() || (mode === 'join' && roomCode.trim().length !== 6)}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-gray-950 font-semibold py-3 rounded-xl transition-colors"
            >
              {mode === 'create' ? 'Create Room' : 'Join Room'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
