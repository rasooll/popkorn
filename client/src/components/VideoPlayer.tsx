import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type { SyncEvent } from '../types'

interface Props {
  src: string | null
  srcType: 'url' | 'hls' | null
  canControl: boolean
  playerRef: React.MutableRefObject<ReturnType<typeof videojs> | null>
  isSyncing: React.MutableRefObject<boolean>
  onEmitSync: (type: SyncEvent['type'], currentTime: number) => void
  onBuffer: (isBuffering: boolean) => void
  onReady?: () => void
}

export function VideoPlayer({ src, srcType, canControl, playerRef, isSyncing, onEmitSync, onBuffer, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canControlRef = useRef(canControl)
  const onReadyRef = useRef(onReady)
  const readyFired = useRef(false)

  useEffect(() => {
    canControlRef.current = canControl
    playerRef.current?.controls(canControl)
  }, [canControl, playerRef])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!containerRef.current) return

    const videoEl = document.createElement('video')
    videoEl.className = 'video-js vjs-big-play-centered'
    videoEl.style.width = '100%'
    videoEl.style.height = '100%'
    containerRef.current.appendChild(videoEl)

    const player = videojs(videoEl, {
      controls: canControlRef.current,
      fluid: true,
      preload: 'auto',
      playbackRates: [0.5, 1, 1.25, 1.5, 2],
    })

    playerRef.current = player

    player.on('play', () => {
      if (isSyncing.current || !canControlRef.current) return
      onEmitSync('play', player.currentTime() ?? 0)
    })

    player.on('pause', () => {
      if (isSyncing.current || !canControlRef.current) return
      onEmitSync('pause', player.currentTime() ?? 0)
    })

    player.on('seeked', () => {
      if (isSyncing.current || !canControlRef.current) return
      onEmitSync('seek', player.currentTime() ?? 0)
    })

    player.on('waiting', () => {
      if (!canControlRef.current) return
      onBuffer(true)
      onEmitSync('buffer_start', player.currentTime() ?? 0)
    })

    player.on('canplay', () => {
      if (!readyFired.current) {
        readyFired.current = true
        onReadyRef.current?.()
      }
      if (!canControlRef.current) return
      onBuffer(false)
      onEmitSync('buffer_end', player.currentTime() ?? 0)
    })

    return () => {
      player.dispose()
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !src) return

    if (srcType === 'hls') {
      player.src({ src, type: 'application/x-mpegURL' })
    } else {
      player.src({ src, type: 'video/mp4' })
    }
  }, [src, srcType, playerRef])

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video bg-black"
      style={{ position: 'relative' }}
    />
  )
}
