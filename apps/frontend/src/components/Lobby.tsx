import React, { useState } from 'react'
import { useGameStore } from '../store/useGameStore';
import { checkRoomExists, useCreateRoomMutation } from '../api/client';
import { socketService } from '../sockets/socketService';

const Lobby: React.FC = () => {
    const [nameInput,setNameInput] = useState('')
    const [codeInput,setCodeInput] = useState('');
    const [error,setError] = useState<string | null> (null);
    const [checkingRoom,setCheckingRoom] = useState(false);

    const setPlayerName = useGameStore((state)=> state.setPlayerName);
    const setRoomCode = useGameStore((state)=> state.setRoomCode);

    const createRoomMutation = useCreateRoomMutation();

    const handleCreateRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!nameInput.trim()){
            setError('Please enter you name first.');
            return;
        }
        setError(null);

        try {
            const response = await createRoomMutation.mutateAsync();
            const code = response.roomCode;
            setPlayerName(nameInput.trim());
            setRoomCode(code);
            socketService.joinRoom(code,nameInput.trim());
        } catch (error: any) {
            setError(error.response?.data?.message || "Failed to create room. Please try again.")
        }
    };

    const handleJoinRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!nameInput.trim()){
            setError('Please enter you name first.');
            return;
        }
        if(!codeInput.trim()){
            setError('Please enter a room code.');
            return;
        }
        setError(null);
        setCheckingRoom(true);

        try {
            const code = codeInput.trim().toUpperCase();
            const res = await checkRoomExists(code);

            if(!res.exists){
                setPlayerName(nameInput.trim());
                setRoomCode(code);
                socketService.joinRoom(code,nameInput.trim());
            }else{
                setError('Room code not found. Please check and try again.');
            }
        } catch (error: any) {
            setError('Error joining room. Please try again.');
        }finally{
            setCheckingRoom(false);
        }
    };

  return (
    <div className='glass-panel animate-slide-up' style={{maxWidth: '480px', width: '100%', margin: '0 auto'}} >
        <h1 className='logo'>Inkguess</h1>
        <p style={{color: 'var(--text-secondary)', marginBottom: '2rem'}}>
            Draw, Guess, and Win! Real-time multiplayer sketching.
        </p>

        {error && (
                <div
                    style={{background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        color: '#ef4444',
                        marginBottom: '1.5rem',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                    }}
                >{error}
                </div>
        )}

        <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}} >
            <div>
                <label
                style={{display: 'block',textAlign:'left',marginBottom:'0.5rem',fontWeight: 600, fontSize: '0.9rem'}}>
                YOUR NAME
                </label>
                <input type="text"
                className='text-input'
                placeholder='e.g SketchMaster'
                maxLength={16}
                value={nameInput}
                onChange={(e)=>setNameInput(e.target.value)}
                 />
            </div>

            {/* dividers */}
            <div style={{ height: '1px', background: 'rgba(139,92,246,0.1)'}}/>
            <div style={{ display: 'flex', flexDirection: 'column',gap: '1rem' }}>
                <button
                    className='btn-primary'
                    onClick={handleCreateRoom}
                    disabled= {createRoomMutation.isPending || !nameInput.trim()}
                >
                    {createRoomMutation.isPending? 'Creating Room...': 'Create Private Room'}
                </button>

                <div style={{
                    display:'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem'
                }}>
                    <span style={{width: '40px',height: '1px', background: 'rgba(255,255,255,0.1'}}></span>
                    OR JOIN EXISTING
                    <span style={{width: '40px',height: '1px', background: 'rgba(255,255,255,0.1'}}></span>
                </div>

                <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '0.5rem'}}>
                        <input 
                        type="text" 
                        className='text-input'
                        placeholder='ENTER 4-LETTER CODE'
                        maxLength={4} 
                        value={codeInput}
                        onChange={(e)=>setCodeInput(e.target.value.toUpperCase())}
                        style={{flex: 1,textTransform: 'uppercase',textAlign: 'center',letterSpacing: '2px'}}
                        />

                        <button
                        type='submit'
                        className='btn-secondary'
                        disabled={checkingRoom || !nameInput.trim() || !codeInput.trim()}
                        style={{padding: '0.75rem 1.25rem'}}>
                        {checkingRoom ? 'Checking...' : 'Join'}
                        </button>
                </form>
            </div>
        </div>
    </div>
  )
}

export default Lobby