const express = require('express');
const db = require('./db');

const router = express.Router();

function pokemonResumen(p) {
  return {
    id: p.id,
    nombre: p.nombre,
    generacion: p.generacion,
    tipos: p.tipos,
    estadisticas: p.estadisticas,
    especie: {
      legendario: p.especie.legendario,
      mitico: p.especie.mitico
    }
  };
}

function pokemonCompleto(p) {
  const full = JSON.parse(JSON.stringify(p));
  full.movimientos = (p.movimientos_ids || [])
    .map(id => db.movimientosMap.get(id))
    .filter(Boolean);
  full.habilidades = (p.habilidades || []).map(h => {
    const hab = db.habilidadesMap.get(h.nombre);
    return {
      ...h,
      descripcion: hab ? hab.descripcion : '',
      efecto: hab ? hab.efecto : ''
    };
  });
  return full;
}

function toRoman(num) {
  const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' };
  return map[num] || num;
}

router.get('/generaciones', (req, res) => {
  res.json(db.generaciones);
});

router.get('/naturalezas', (req, res) => {
  res.json(db.naturalezas);
});

router.get('/tipos', (req, res) => {
  res.json(db.tipos);
});

router.get('/habilidades', (req, res) => {
  res.json(db.habilidades);
});

router.get('/objetos', (req, res) => {
  res.json(db.objetos);
});

router.get('/movimientos', (req, res) => {
  res.json(db.movimientos);
});

router.get('/pokemon', (req, res) => {
  let list = db.pokemon;

  const gen = Number(req.query.generacion) || 0;
  if (gen > 0) {
    const g = db.generacionesMap.get(gen);
    if (g) {
      const idSet = new Set(g.pokemon_ids);
      list = list.filter(p => idSet.has(p.id));
    }
  }

  const q = String(req.query.q || '').toLowerCase().trim();
  if (q) {
    list = list.filter(p =>
      p.nombre.toLowerCase().includes(q) || String(p.id).includes(q)
    );
  }

  res.json(list.map(pokemonResumen));
});

router.get('/pokemon/:id', (req, res) => {
  const p = db.pokemonMap.get(Number(req.params.id));
  if (!p) {
    return res.status(404).json({ error: 'Pokémon no encontrado' });
  }
  res.json(pokemonCompleto(p));
});

router.get('/info/generacion/:id', (req, res) => {
  const g = db.generacionesMap.get(Number(req.params.id));
  if (!g) {
    return res.status(404).json({ error: 'Generación no encontrada' });
  }
  res.json({ ...g, nombre_romano: toRoman(g.id) });
});

module.exports = router;