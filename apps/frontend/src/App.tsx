import { useEffect } from 'react'

const App = () => {
  const roomCode = "abcd"; // useGameStore()

  useEffect(()=>{
    // Socket.connect() we need to first create the socket client

    // check if there is an active session
    const savedCode = sessionStorage.getItem('inkguess_room_code'); 
    const savedName = sessionStorage.getItem('inkguess_player_name');
    const savedToken = sessionStorage.getItem('inkguess_session_token');

    if(savedCode && savedName && savedToken){
      // if all these exist already then directly set them to store 
    }

    return()=>{
      // Disconnect when app unmounts
      // socket we need to this after socket setup
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