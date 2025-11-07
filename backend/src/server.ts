import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler } from './middleware/errorHandler';
import healthRouter from './routes/health';
import testRouter from './routes/test';
import { websocketService } from './services/websocketService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS allowed origins
const ALLOWED_ORIGINS = [
  'http://localhost:3001',
  'https://dreamup.pages.dev',
  'https://superbuilders.dreamup.archlife.org',
  'https://www.superbuilders.dreamup.archlife.org',
];

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', healthRouter);
app.use('/api', testRouter);

// Error handling (must be last)
app.use(errorHandler);

// Create HTTP server and initialize WebSocket
const httpServer = createServer(app);
websocketService.initialize(httpServer);

// Start server
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  websocketService.close();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
