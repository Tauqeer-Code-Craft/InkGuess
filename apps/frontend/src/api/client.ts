import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const BASE_URL = 'http://localhost:3000';

export const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface CreateRoomResponse {
    roomCode: string;
}

export interface CheckRoomResponse{
    exists: boolean;
    codes: string;
}

// Mutate hook to create room
export const useCreateRoomMutation = () => {
    return useMutation<CreateRoomResponse,Error>({
        mutationFn: async ()=>{
            const response = await apiClient.post<CreateRoomResponse>('/api/rooms');
            return response.data;
        },
    });
};

// Query function to check room existence 
export const checkRoomExists = async(roomCode: string): Promise<CheckRoomResponse> =>{
    const response = await apiClient.get<CheckRoomResponse>(`/api/rooms/check/${roomCode}`);
    return response.data;
}