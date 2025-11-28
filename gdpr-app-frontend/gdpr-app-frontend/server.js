const express = require('express');
const path = require('path');

const app = express();

const distPath = path.join(__dirname, 'dist/gdpr-app-frontend/browser');

// Configuration pour Safari iOS avec les bons MIME types
app.use(express.static(distPath, {
  setHeaders: (res, filepath) => {
    if (filepath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
    if (filepath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=UTF-8');
    }
    // Désactiver le cache pour le développement
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Capturer toutes les routes pour Angular
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});