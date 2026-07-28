import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const API_BASE_URL = process.env['EXPO_PUBLIC_API_URL'] || 'https://quicky-production.up.railway.app';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  connect(userId: string) {
    if (this.socket) return;

    this.socket = io(`${API_BASE_URL}/user`, {
      auth: { userId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log(`[User WS] Connected as user ${userId}`);
    });

    this.socket.on('disconnect', () => {
      console.log('[User WS] Disconnected');
    });

    this.socket.on('order-accepted', (payload: any) => {
      console.log('[User WS] Received order-accepted:', payload);
      this.notifyListeners('order-accepted', payload);
    });

    this.socket.on('order-packed', (payload: any) => {
      console.log('[User WS] Received order-packed:', payload);
      this.notifyListeners('order-packed', payload);
    });

    this.socket.on('order-status-changed', (payload: any) => {
      console.log('[User WS] Received order-status-changed:', payload);
      this.notifyListeners('order-status-changed', payload);
    });

    this.socket.on('order-expired', (payload: any) => {
      console.log('[User WS] Received order-expired:', payload);
      this.notifyListeners('order-expired', payload);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        this.listeners.set(event, callbacks.filter(cb => cb !== callback));
      }
    };
  }

  private notifyListeners(event: string, payload: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(payload));
    }
  }
}

export const userSocket = new SocketService();
