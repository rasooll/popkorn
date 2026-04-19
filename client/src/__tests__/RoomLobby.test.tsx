import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoomLobby } from '../components/RoomLobby'

function renderLobby(overrides?: Partial<React.ComponentProps<typeof RoomLobby>>) {
  const props = {
    onCreate: vi.fn(),
    onJoin: vi.fn(),
    error: '',
    ...overrides,
  }
  render(<RoomLobby {...props} />)
  return props
}

// Tab buttons are type="button", submit is type="submit" — use getAllByRole and pick index
const TAB = 0
const SUBMIT = 1

describe('RoomLobby', () => {
  describe('layout', () => {
    it('renders the Popkorn brand', () => {
      renderLobby()
      expect(screen.getByText('Popkorn')).toBeInTheDocument()
    })

    it('shows Create Room and Join Room tab buttons', () => {
      renderLobby()
      // Both tabs are type="button" — they're the first two buttons in the tab bar
      const tabs = screen.getAllByRole('button', { name: /Create Room|Join Room/ })
      expect(tabs.some((b) => b.textContent === 'Create Room')).toBe(true)
      expect(tabs.some((b) => b.textContent === 'Join Room')).toBe(true)
    })

    it('shows the name input by default', () => {
      renderLobby()
      expect(screen.getByPlaceholderText('e.g. Alice')).toBeInTheDocument()
    })
  })

  describe('create room', () => {
    it('calls onCreate with the display name on submit', async () => {
      const user = userEvent.setup()
      const { onCreate } = renderLobby()

      await user.type(screen.getByPlaceholderText('e.g. Alice'), 'Alice')
      await user.click(screen.getAllByRole('button', { name: 'Create Room' })[SUBMIT])

      expect(onCreate).toHaveBeenCalledWith('Alice')
    })

    it('trims whitespace from display name', async () => {
      const user = userEvent.setup()
      const { onCreate } = renderLobby()

      await user.type(screen.getByPlaceholderText('e.g. Alice'), '  Alice  ')
      await user.click(screen.getAllByRole('button', { name: 'Create Room' })[SUBMIT])

      expect(onCreate).toHaveBeenCalledWith('Alice')
    })

    it('submit button is disabled when name is empty', () => {
      renderLobby()
      expect(screen.getAllByRole('button', { name: 'Create Room' })[SUBMIT]).toBeDisabled()
    })

    it('does not call onCreate when name is only whitespace', async () => {
      const user = userEvent.setup()
      const { onCreate } = renderLobby()

      await user.type(screen.getByPlaceholderText('e.g. Alice'), '   ')
      await user.click(screen.getAllByRole('button', { name: 'Create Room' })[SUBMIT])

      expect(onCreate).not.toHaveBeenCalled()
    })
  })

  describe('join room', () => {
    async function renderAndSwitchToJoin(overrides?: Partial<React.ComponentProps<typeof RoomLobby>>) {
      const user = userEvent.setup()
      const props = renderLobby(overrides)
      await user.click(screen.getAllByRole('button', { name: 'Join Room' })[TAB])
      return { user, props }
    }

    it('shows room code input after switching to join tab', async () => {
      await renderAndSwitchToJoin()
      expect(screen.getByPlaceholderText('e.g. ABC123')).toBeInTheDocument()
    })

    it('calls onJoin with room code and display name', async () => {
      const { user, props } = await renderAndSwitchToJoin()

      await user.type(screen.getByPlaceholderText('e.g. Alice'), 'Bob')
      await user.type(screen.getByPlaceholderText('e.g. ABC123'), 'ABC123')
      await user.click(screen.getAllByRole('button', { name: 'Join Room' })[SUBMIT])

      expect(props.onJoin).toHaveBeenCalledWith('ABC123', 'Bob')
    })

    it('uppercases the room code as user types', async () => {
      const { user } = await renderAndSwitchToJoin()

      await user.type(screen.getByPlaceholderText('e.g. ABC123'), 'abc123')

      expect(screen.getByPlaceholderText('e.g. ABC123')).toHaveValue('ABC123')
    })

    it('submit button is disabled when code is less than 6 characters', async () => {
      const { user } = await renderAndSwitchToJoin()
      await user.type(screen.getByPlaceholderText('e.g. Alice'), 'Bob')
      await user.type(screen.getByPlaceholderText('e.g. ABC123'), 'ABC')

      expect(screen.getAllByRole('button', { name: 'Join Room' })[SUBMIT]).toBeDisabled()
    })

    it('submit button is disabled when name is empty with a valid code', async () => {
      const { user } = await renderAndSwitchToJoin()
      await user.type(screen.getByPlaceholderText('e.g. ABC123'), 'ABC123')

      expect(screen.getAllByRole('button', { name: 'Join Room' })[SUBMIT]).toBeDisabled()
    })
  })

  describe('error display', () => {
    it('shows error message when error prop is set', () => {
      renderLobby({ error: 'Room not found or full.' })
      expect(screen.getByText('Room not found or full.')).toBeInTheDocument()
    })

    it('shows nothing when error is empty', () => {
      renderLobby({ error: '' })
      expect(screen.queryByText('Room not found or full.')).not.toBeInTheDocument()
    })
  })
})
