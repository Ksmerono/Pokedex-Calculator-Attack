export async function getJson(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Error ${res.status} en ${path}`);
  return res.json();
}

export const getGeneraciones = () => getJson('/api/generaciones');
export const getNaturalezas = () => getJson('/api/naturalezas');
export const getTipos = () => getJson('/api/tipos');
export const getHabilidades = () => getJson('/api/habilidades');
export const getObjetos = () => getJson('/api/objetos');
export const getMovimientos = () => getJson('/api/movimientos');

export function getPokemon(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  return getJson(`/api/pokemon?${qs.toString()}`);
}

export const getPokemonById = (id) => getJson(`/api/pokemon/${id}`);

export const spriteUrl = (id) => `/img/sprites/${id}.png`;

export function toRoman(num) {
  const map = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX' };
  return map[num] || num;
}