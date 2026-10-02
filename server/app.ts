import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import authRouter from './routes/auth.js';
import filesRouter from './routes/files.js';
import rmsRouter from './routes/rms.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import syncRouter from './routes/sync.js';
import auditRouter from './routes/audit.js';
import locationsRouter from './routes/locations.js';
import notificationsRouter from './routes/notifications.js';
import smsRouter from './routes/sms.js';
import { SheetsSyncService } from './sheetsSync.js';

function getPort(): number {
  const portIdx = process.argv.indexOf('--port');
  if (portIdx !== -1 && process.argv[portIdx + 1]) {
    return parseInt(process.argv[portIdx + 1], 10);
  }
  return parseInt(process.env.PORT || '3000', 10);
}

function getHost(): string {
  const hostIdx = process.argv.indexOf('--host');
  if (hostIdx !== -1 && process.argv[hostIdx + 1]) {
    return process.argv[hostIdx + 1];
  }
  return '0.0.0.0';
}

export async function startServer() {
  const app = express();
  const PORT = getPort();
  const HOST = getHost();

  // Body parsers with generous limit for document/image attachments (10MB binary is ~14MB base64)
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/files', filesRouter);
  app.use('/api/rms', rmsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/settings', settingsRouter);
  app.use('/api/sync', syncRouter);
  app.use('/api/audit-logs', auditRouter);
  app.use('/api/locations', locationsRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/sms', smsRouter);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      app: 'RM File Management & Team Member Data System',
      time: new Date().toISOString(),
      timezone: 'Asia/Dhaka',
    });
  });

  // Frontend integration
  const distIndexPath = path.resolve(process.cwd(), 'dist/index.html');
  const distPath = path.resolve(process.cwd(), 'dist');

  if (process.env.NODE_ENV === 'production' && fs.existsSync(distIndexPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      if (fs.existsSync(distIndexPath)) {
        return res.sendFile(distIndexPath);
      }
      return next();
    });
  } else {
    // Development or fallback: Mount Vite in middleware mode
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('[Vite Server Middleware Init Note]:', err);
      if (fs.existsSync(distIndexPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => res.sendFile(distIndexPath));
      }
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`[Team Data System] Server running on http://${HOST}:${PORT}`);
    console.log(`[Team Data System] Timezone active: Asia/Dhaka`);
    console.log(`[Team Data System] Connected Spreadsheet ID: 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI`);
    SheetsSyncService.startAutoSyncWorker(25000);
    console.log(`[Team Data System] Real-time Google Sheets Auto-Sync Engine active`);
  });
}

startServer().catch(err => {
  console.error('[Team Data System] Fatal startup error:', err);
  process.exit(1);
});
