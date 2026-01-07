import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { generalLimiter } from './middlewares/rateLimiter.js';
import { sanitizeInput } from './middlewares/validation.js';
import logger from './utils/logger.js';
import connectDB from './config/database.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
await connectDB();

// Security middleware
app.use(helmet());

// CORS configuration - permite múltiples origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (ej: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Si allowedOrigins incluye '*', permitir cualquier origin
      if (allowedOrigins.includes('*')) return callback(null, true);
      
      // Verificar si el origin está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting
app.use(generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input sanitization
app.use(sanitizeInput);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Consultorio - Medical Clinic Management System',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
  });
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

export default app;
