import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import createError from 'http-errors';
import { json, urlencoded } from 'express';
import dotenv from 'dotenv';
dotenv.config();

// Import routes
import bscRouter from './routes/bsc.js';
import btcRouter from './routes/btc.js';
import kunciRouter from './routes/kunci.js';
import ethRouter from './routes/eth.js';
import solRouter from './routes/sol.js';
import usdtRouter from './routes/usdt.js';
import walletRouter from './routes/wallet.js';


const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Basic middleware
app.set('view engine', 'jade');
app.use(morgan('combined'));
app.use(json());
app.use(urlencoded({ extended: false }));
app.use(cookieParser());

// API routes
const API_PREFIX = '/v2';
app.use(`${API_PREFIX}/bsc`, bscRouter);
app.use(`${API_PREFIX}/btc`, btcRouter);
app.use(`${API_PREFIX}/kunci`, kunciRouter);
app.use(`${API_PREFIX}/eth`, ethRouter);
app.use(`${API_PREFIX}/sol`, solRouter);
app.use(`${API_PREFIX}/usdt`, usdtRouter);
app.use(API_PREFIX, walletRouter);

// Error handling
app.use((req, res, next) => {
  next(createError(404));
});

app.use((err, req, res, next) => {
  const isDev = req.app.get('env') === 'development';
  
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
      stack: isDev ? err.stack : undefined
    }
  });
});

// Server setup
const PORT = process.env.PORT || 3000;
const HOST = process.env.APP_URL || 'localhost';

const server = app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

export default app;