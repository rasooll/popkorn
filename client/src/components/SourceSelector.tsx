import { useState } from 'react'
import type { VideoSource } from '../types'

interface Props {
  isHost: boolean
  videoSource: VideoSource
  onSelectUrl: (url: string) => void
  onSelectFile: (file: File) => void
  myFileReady: boolean
  allReadyCount: number
  totalCount: number
}

const SUPPORTED_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.m3u8']

function isValidVideoUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return SUPPORTED_EXTENSIONS.some((ext) => u.pathname.toLowerCase().endsWith(ext))
  } catch {
    return false
  }
}

export function SourceSelector({
  isHost,
  videoSource,
  onSelectUrl,
  onSelectFile,
  myFileReady,
  allReadyCount,
  totalCount,
}: Props) {
  const [tab, setTab] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState('')

  function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidVideoUrl(urlInput)) {
      setUrlError('URL must start with http(s):// and end with .mp4 / .webm / .mkv / .m3u8')
      return
    }
    setUrlError('')
    onSelectUrl(urlInput.trim())
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onSelectFile(file)
  }

  const localSource = videoSource?.type === 'local' ? videoSource : null

  return (
    <div className="bg-gray-900 border-t border-gray-800 p-4">
      {isHost ? (
        <div>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setTab('file')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'file' ? 'bg-amber-400 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              📁 My File
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === 'url' ? 'bg-amber-400 text-gray-950' : 'text-gray-400 hover:text-white'
              }`}
            >
              🔗 Stream URL
            </button>
          </div>

          {tab === 'file' && (
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer bg-gray-800 hover:bg-gray-750 border border-dashed border-gray-700 rounded-xl px-4 py-3 transition-colors">
                <span className="text-gray-400 text-sm">Choose video file</span>
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {localSource && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 truncate max-w-xs">{localSource.filename}</span>
                  <span className="text-amber-400 ml-3 whitespace-nowrap">
                    {allReadyCount} / {totalCount} ready
                  </span>
                </div>
              )}
            </div>
          )}

          {tab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/video.mp4"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Load
                </button>
              </div>
              {urlError && <p className="text-red-400 text-xs">{urlError}</p>}
              {videoSource?.type === 'url' && (
                <p className="text-green-400 text-xs">▶ Streaming: {videoSource.url.slice(0, 60)}…</p>
              )}
            </form>
          )}
        </div>
      ) : (
        // Guest view
        <div>
          {!videoSource && (
            <p className="text-gray-500 text-sm text-center">
              🍿 Waiting for host to select a video…
            </p>
          )}

          {videoSource?.type === 'url' && (
            <p className="text-gray-400 text-sm text-center">
              🍿 Host is streaming:{' '}
              <span className="text-amber-400 font-mono">
                {videoSource.url.length > 50 ? videoSource.url.slice(0, 50) + '…' : videoSource.url}
              </span>
            </p>
          )}

          {videoSource?.type === 'local' && (
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                🍿 Host selected{' '}
                <span className="text-white font-medium">{videoSource.filename}</span>{' '}
                ({(videoSource.filesize / 1048576).toFixed(1)} MB). Pick the same file from your computer.
              </p>
              {myFileReady ? (
                <p className="text-green-400 text-sm">✅ Ready</p>
              ) : (
                <label className="flex items-center gap-3 cursor-pointer bg-gray-800 border border-dashed border-gray-700 rounded-xl px-4 py-3 hover:border-amber-400 transition-colors">
                  <span className="text-gray-400 text-sm">Choose the same video file</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
