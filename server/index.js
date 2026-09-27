const express = require('express');
const fs = require('fs');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 8080;

app.use('/api', routes);

app.use('/img', express.static(path.join(__dirname, '..', 'img')));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log('================================');
  console.log('  Pokédex - Servidor API');
  console.log('================================');
  console.log(`  Puerto:  ${PORT}`);
  console.log(`  API:     http://localhost:${PORT}/api`);
  console.log(`  Sprites: http://localhost:${PORT}/img/sprites`);
  console.log('================================');
});