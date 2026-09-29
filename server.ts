import express from 'express';
import path from 'path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

// When invoked directly via "node server.ts" without tsx loader, auto-spawn with --import tsx
if (!process.env.__TSX_RUNNING__ && !process.execArgv.some(a => a.includes('tsx'))) {
  const child = spawn(process.execPath, ['--import', 'tsx', fileURLToPath(import.meta.url), ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, __TSX_RUNNING__: '1' }
  });
  child.on('exit', (code) => process.exit(code ?? 0));
} else {
  startServer().catch(err => {
    console.error('[Team Data System] Fatal startup error:', err);
    process.exit(1);
  });
}

async function startServer() {
  // Dynamically import routes so tsx loader is active
  const [
    { default: authRouter },
    { default: filesRouter },
    { default: rmsRouter },
    { default: reportsRouter },
    { default: settingsRouter },
    { default: syncRouter },
    { default: auditRouter },
    { default: locationsRouter }
  ] = await Promise.all([
    import('./server/routes/auth.js'),
    import('./server/routes/files.js'),
    import('./server/routes/rms.js'),
    import('./server/routes/reports.js'),
    import('./server/routes/settings.js'),
    import('./server/routes/sync.js'),
    import('./server/routes/audit.js'),
    import('./server/routes/locations.js')
  ]);

  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const isProduction = process.env.NODE_ENV === 'production';

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
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Team Data System] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[Team Data System] Timezone active: Asia/Dhaka`);
    console.log(`[Team Data System] Connected Spreadsheet ID: 1lb9Wou10ecl28EUgaXD2cA3YCNY7nNHp1BOFrrLezqI`);
  });
}
