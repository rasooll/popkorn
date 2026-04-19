import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SourceSelector } from '../components/SourceSelector'
import type { VideoSource } from '../types'

const defaultProps = {
  isHost: false,
  videoSource: null as VideoSource,
  onSelectUrl: vi.fn(),
  onSelectFile: vi.fn(),
  myFileReady: false,
  allReadyCount: 0,
  totalCount: 1,
}

function renderSelector(overrides?: Partial<typeof defaultProps>) {
  const props = { ...defaultProps, onSelectUrl: vi.fn(), onSelectFile: vi.fn(), ...overrides }
  render(<SourceSelector {...props} />)
  return props
}

describe('SourceSelector — host view', () => {
  it('shows both My File and Stream URL tabs', () => {
    renderSelector({ isHost: true })
    expect(screen.getByRole('button', { name: /My File/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Stream URL/i })).toBeInTheDocument()
  })

  it('defaults to the My File tab', () => {
    renderSelector({ isHost: true })
    expect(screen.getByText('Choose video file')).toBeInTheDocument()
  })

  it('switches to URL tab on click', async () => {
    const user = userEvent.setup()
    renderSelector({ isHost: true })

    await user.click(screen.getByRole('button', { name: /Stream URL/i }))

    expect(screen.getByPlaceholderText(/https:\/\/example.com\/video.mp4/i)).toBeInTheDocument()
  })

  describe('URL validation', () => {
    async function submitUrl(url: string) {
      const user = userEvent.setup()
      const props = renderSelector({ isHost: true })
      await user.click(screen.getByRole('button', { name: /Stream URL/i }))
      await user.type(screen.getByPlaceholderText(/https:\/\//i), url)
      await user.click(screen.getByRole('button', { name: 'Load' }))
      return props
    }

    it('calls onSelectUrl for a valid mp4 URL', async () => {
      const { onSelectUrl } = await submitUrl('https://example.com/video.mp4')
      expect(onSelectUrl).toHaveBeenCalledWith('https://example.com/video.mp4')
    })

    it('calls onSelectUrl for a valid m3u8 URL', async () => {
      const { onSelectUrl } = await submitUrl('https://stream.example.com/live.m3u8')
      expect(onSelectUrl).toHaveBeenCalledWith('https://stream.example.com/live.m3u8')
    })

    it('shows error for URL without supported extension', async () => {
      await submitUrl('https://example.com/video')
      expect(screen.getByText(/must start with http/i)).toBeInTheDocument()
    })

    it('shows error for non-http URL', async () => {
      await submitUrl('ftp://example.com/video.mp4')
      expect(screen.getByText(/must start with http/i)).toBeInTheDocument()
    })

    it('does not call onSelectUrl for invalid URL', async () => {
      const { onSelectUrl } = await submitUrl('not-a-url')
      expect(onSelectUrl).not.toHaveBeenCalled()
    })
  })

  it('shows readiness counter when local source is active', () => {
    renderSelector({
      isHost: true,
      videoSource: { type: 'local', fingerprint: 'abc', filename: 'movie.mp4', filesize: 1048576 },
      allReadyCount: 1,
      totalCount: 3,
    })
    expect(screen.getByText('1 / 3 ready')).toBeInTheDocument()
  })

  it('shows streaming confirmation when URL source is active on URL tab', async () => {
    const user = userEvent.setup()
    renderSelector({
      isHost: true,
      videoSource: { type: 'url', url: 'https://example.com/video.mp4' },
    })
    await user.click(screen.getByRole('button', { name: /Stream URL/i }))
    expect(screen.getByText(/streaming/i)).toBeInTheDocument()
  })
})

describe('SourceSelector — guest view', () => {
  it('does not show the Stream URL tab', () => {
    renderSelector({ isHost: false })
    expect(screen.queryByRole('button', { name: /Stream URL/i })).not.toBeInTheDocument()
  })

  it('shows waiting message when host has not selected a source', () => {
    renderSelector({ isHost: false, videoSource: null })
    expect(screen.getByText(/waiting for host/i)).toBeInTheDocument()
  })

  it('shows streaming info when host is using a URL source', () => {
    renderSelector({
      isHost: false,
      videoSource: { type: 'url', url: 'https://example.com/video.mp4' },
    })
    expect(screen.getByText(/host is streaming/i)).toBeInTheDocument()
    expect(screen.getByText(/example.com\/video.mp4/i)).toBeInTheDocument()
  })

  it('shows file pick prompt when host selected a local file', () => {
    renderSelector({
      isHost: false,
      videoSource: { type: 'local', fingerprint: 'abc', filename: 'movie.mp4', filesize: 1048576 },
      myFileReady: false,
    })
    expect(screen.getByText(/movie.mp4/)).toBeInTheDocument()
    expect(screen.getByText(/pick the same file/i)).toBeInTheDocument()
  })

  it('shows ready state when guest has matched the file', () => {
    renderSelector({
      isHost: false,
      videoSource: { type: 'local', fingerprint: 'abc', filename: 'movie.mp4', filesize: 1048576 },
      myFileReady: true,
    })
    expect(screen.getByText('✅ Ready')).toBeInTheDocument()
  })

  it('does not show file picker once guest is ready', () => {
    renderSelector({
      isHost: false,
      videoSource: { type: 'local', fingerprint: 'abc', filename: 'movie.mp4', filesize: 1048576 },
      myFileReady: true,
    })
    expect(screen.queryByText(/choose the same video file/i)).not.toBeInTheDocument()
  })
})
