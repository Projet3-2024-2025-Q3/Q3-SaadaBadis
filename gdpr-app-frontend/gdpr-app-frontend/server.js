const express = require('express');
const path = require('path');

const app = express();

const distPath = path.join(__dirname, 'dist/gdpr-app-frontend/browser');

// Désactiver le cache strict
app.disable('etag');

// Middleware pour logger les requêtes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - User-Agent: ${req.get('user-agent')}`);
  next();
});

// Headers globaux pour mobiles
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Servir les fichiers statiques
app.use(express.static(distPath, {
  maxAge: 0,
  etag: false,
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js') || filepath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    } else if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    } else if (filepath.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json; charset=UTF-8');
    } else if (filepath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html; charset=UTF-8');
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Fallback pour toutes les routes (IMPORTANT pour le routing Angular)
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  console.log('Serving index.html for:', req.url);
  
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(404).send('Page not found');
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving from: ${distPath}`);
});


