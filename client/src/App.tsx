import { useRoom } from './hooks/useRoom'
import { RoomLobby } from './components/RoomLobby'
import { RoomView } from './components/RoomView'

function App() {
  const { socket, room, mySocketId, isHost, error, connected, createRoom, joinRoom, leaveRoom } = useRoom()

  return (
    <>
      {!connected && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-900 text-red-200 text-xs text-center py-1.5">
          ⚡ Connecting…
        </div>
      )}

      {room ? (
        <RoomView
          room={room}
          mySocketId={mySocketId}
          isHost={isHost}
          socket={socket}
          onLeave={leaveRoom}
        />
      ) : (
        <RoomLobby
          onCreate={createRoom}
          onJoin={joinRoom}
          error={error}
        />
      )}
    </>
  )
}

export default App
