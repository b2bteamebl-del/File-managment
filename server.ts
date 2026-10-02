import fs from 'node:fs';
import path from 'node:path';

const distServer = path.resolve(process.cwd(), 'dist-server/server.js');
const distIndex = path.resolve(process.cwd(), 'dist/index.html');
const isNpmDev = process.env.npm_lifecycle_event === 'dev' || process.env.NODE_ENV !== 'production';

if (isNpmDev) {
  // In development, run TypeScript source directly with live Vite middleware
  await import('./server/app.ts');
} else {
  // In production, ensure both dist/index.html and dist-server/server.js are built
  if (!fs.existsSync(distIndex) || !fs.existsSync(distServer)) {
    const { execSync } = await import('node:child_process');
    console.log('[Server Boot] Production files missing. Running build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
    } catch (e) {
      console.warn('[Server Boot] Build step warning:', e);
    }
  }

  if (fs.existsSync(distServer)) {
    await import('./dist-server/server.js');
  } else {
    await import('./server/app.ts');
  }
}
