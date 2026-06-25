import { useEffect } from 'react'
import { useGameStore } from './store/useGameStore';
import { socketService } from './sockets/socketService';

const App = () => {
  const roomCode = useGameStore((state)=> state.roomCode)

  useEffect(()=>{
    // Socket.connect() we need to first create the socket client
    socketService.connect();

    // check if there is an active session
    const savedCode = sessionStorage.getItem('inkguess_room_code'); 
    const savedName = sessionStorage.getItem('inkguess_player_name');
    const savedToken = sessionStorage.getItem('inkguess_session_token');

    if(savedCode && savedName && savedToken){
      useGameStore.getState().setPlayerName(savedName);
      useGameStore.getState().setRoomCode(savedCode);
    }

    return()=>{
      // Disconnect when app unmounts
      socketService.disconnect();
    }
  },[]);

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxSizing: 'border-box'
    }}>
      {roomCode === null ? <>Lobby component</>: <>gameboard component</>}
    </div>
  )
}

export default App