import { useContext } from 'react';
import SocketContext from '../contexts/SocketContext'; // ✅ CORRIGIDO: default export, não named

/**
 * Hook para usar o Socket.io context
 * Wrapper do SocketContext para facilitar uso
 */
export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context) {
        // Return default values when not in SocketProvider
        // This prevents errors in components that conditionally use sockets
        return {
            socket: null,
            isConnected: false,
            onlineUsers: [],
            isUserOnline: () => false,
            connect: () => console.warn('SocketProvider not found'),
            disconnect: () => console.warn('SocketProvider not found'),
            emit: () => console.warn('SocketProvider not found'),
            emitTyping: () => console.warn('SocketProvider not found'),
            emitStopTyping: () => console.warn('SocketProvider not found'),
            emitMessageRead: () => console.warn('SocketProvider not found'),
            joinChatRoom: () => console.warn('SocketProvider not found'),
            leaveChatRoom: () => console.warn('SocketProvider not found'),
        };
    }

    return context;
};

export default useSocket;