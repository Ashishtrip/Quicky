import { io, Socket } from 'socket.io-client';
import { Platform } from 'react-native';

const API_BASE_URL = 'https://quicky-production.up.railway.app';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  connect(storeId: string) {
    if (this.socket) return;

    this.socket = io(`${API_BASE_URL}/store`, {
      auth: { storeId },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log(`[Store WS] Connected as store ${storeId}`);
    });

    this.socket.on('disconnect', () => {
      console.log('[Store WS] Disconnected');
    });

    this.socket.on('new-order-assignment', (payload: any) => {
      console.log('[Store WS] Received new order assignment:', payload);
      this.notifyListeners('new-order-assignment', payload);
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

export const storeSocket = new SocketService();
