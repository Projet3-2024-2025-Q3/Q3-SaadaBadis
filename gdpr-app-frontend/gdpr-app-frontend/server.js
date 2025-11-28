const express = require('express');
const path = require('path');

const app = express();

// Servir les fichiers statiques depuis le bon répertoire
const distPath = path.join(__dirname, 'dist/gdpr-app-frontend/browser');

app.use(express.static(distPath));

// IMPORTANT : Cette ligne doit capturer TOUTES les routes et renvoyer index.html
// Cela permet à Angular de gérer le routing côté client
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});