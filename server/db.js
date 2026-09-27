const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'datos');

function loadJson(file) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
}

const db = {
  pokemon: loadJson('pokemon.json'),
  movimientos: loadJson('movimientos.json'),
  generaciones: loadJson('generaciones.json'),
  naturalezas: loadJson('naturalezas.json'),
  tipos: loadJson('tipos.json'),
  habilidades: loadJson('habilidades.json'),
  objetos: loadJson('objetos.json')
};

db.pokemonMap = new Map(db.pokemon.map(p => [p.id, p]));
db.movimientosMap = new Map(db.movimientos.map(m => [m.id, m]));
db.habilidadesMap = new Map(db.habilidades.map(h => [h.nombre, h]));
db.objetosMap = new Map(db.objetos.map(o => [o.clave, o]));
db.naturalezasMap = new Map(db.naturalezas.map(n => [n.id, n]));
db.generacionesMap = new Map(db.generaciones.map(g => [g.id, g]));

module.exports = db;