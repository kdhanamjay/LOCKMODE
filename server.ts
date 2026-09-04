import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { requestContextMiddleware } from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(requestContextMiddleware);

  // Mount MDM REST API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint for container observability & load balancers
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'EduGuard MDM Enterprise Server',
      version: '1.4.2',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Check multiple potential static directories to guarantee finding index.html in any container environment
    const candidateDirs = [
      path.join(process.cwd(), 'dist'),
      path.join(__dirname),
      path.join(__dirname, 'dist'),
      path.join(process.cwd()),
    ];

    const distPath = candidateDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || path.join(process.cwd(), 'dist');

    console.log(`[EduGuard MDM] Production static path resolved to: ${distPath}`);
    app.use(express.static(distPath));

    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('EduGuard MDM — Production build artifacts not found. Please compile the app.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduGuard MDM Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();

