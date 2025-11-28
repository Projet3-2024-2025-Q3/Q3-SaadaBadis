const express = require('express');
const path = require('path');

const app = express();

const distPath = path.join(__dirname, 'dist/gdpr-app-frontend/browser');

// Désactiver complètement le cache
app.disable('etag');
app.disable('x-powered-by');

// Middleware pour logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${req.get('user-agent')}`);
  next();
});

// Headers anti-cache très agressifs
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Servir les fichiers statiques
app.use(express.static(distPath, {
  maxAge: 0,
  etag: false,
  lastModified: false,
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js') || filepath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }
  }
}));

// Fallback pour Angular routing
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error:', err);
      res.status(500).send('Error loading page');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});