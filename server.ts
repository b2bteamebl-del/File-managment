import fs from 'node:fs';
import path from 'node:path';

const distServer = path.resolve(process.cwd(), 'dist-server/server.js');
const isNpmDev = process.env.npm_lifecycle_event === 'dev';

if (isNpmDev) {
  // During 'npm run dev' (invoked with tsx), run TypeScript source directly with live HMR
  await import('./server/app.ts');
} else {
  // In production or when run via 'node server.ts' / 'npm start'
  if (!fs.existsSync(distServer)) {
    const { execSync } = await import('node:child_process');
    console.log('[Server Boot] Pre-bundled server not found. Bundling with esbuild...');
    execSync('npx esbuild server/app.ts --bundle --platform=node --format=esm --packages=external --outfile=dist-server/server.js', { stdio: 'inherit' });
  }
  await import('./dist-server/server.js');
}
