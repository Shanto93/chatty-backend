import { Server as HTTPServer } from 'http';
import { Server, ServerOptions } from 'socket.io';
import ChatGateway from './chat.gateway';

let chatGateway: ChatGateway | null = null;

export function initializeSocketIO(httpServer: HTTPServer): Server {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://localhost:3000',
    'https://localhost:3001',
    'https://chatty-frontend-nu.vercel.app',
    'http://chatty-frontend-nu.vercel.app',
  ];

  if (process.env.CLIENT_URL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  } as Partial<ServerOptions>);

  console.log('Socket.IO server initialized with CORS for:', allowedOrigins);
  chatGateway = new ChatGateway(io);

  return io;
}

export function getChatGateway(): ChatGateway {
  if (!chatGateway) {
    throw new Error('ChatGateway not initialized. Call initializeSocketIO first.');
  }
  return chatGateway;
}

export default {
  initializeSocketIO,
  getChatGateway,
};
