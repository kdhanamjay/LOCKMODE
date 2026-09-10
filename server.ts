import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes';
import { requestContextMiddleware } from './server/auth';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable high-capacity body parsing for large study material PDFs, videos, and documents (up to 100MB)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));
  app.use(requestContextMiddleware);

  // Mount MDM REST API endpoints
  app.use('/api', apiRouter);

  // Global API JSON error handler: guarantees that payload limit issues or server errors
  // return structured JSON instead of HTML <!DOCTYPE html> error pages
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err) {
      console.error('[EduGuard API Error Handler]', err.message || err);
      const isTooLarge = err.type === 'entity.too.large' || err.status === 413 || err.statusCode === 413;
      const status = isTooLarge ? 413 : (err.status || err.statusCode || 500);
      const message = isTooLarge
        ? 'The uploaded file is too large (maximum allowed upload size is 100MB). Please choose a smaller file.'
        : err.message || 'An unexpected server error occurred during request processing.';
      return res.status(status).json({
        success: false,
        error: {
          code: isTooLarge ? 'PAYLOAD_TOO_LARGE' : (err.code || 'SERVER_ERROR'),
          message,
        },
      });
    }
    next();
  });

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

