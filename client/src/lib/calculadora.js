export const STAT_NOMBRES = {
  ps: 'PS',
  ataque: 'Ataque',
  defensa: 'Defensa',
  ataque_especial: 'Atq. Esp.',
  defensa_especial: 'Def. Esp.',
  velocidad: 'Velocidad'
};

export const ITEMS_TIPO = {
  silk_scarf: 'normal',
  charcoal: 'fuego',
  mystic_water: 'agua',
  miracle_seed: 'planta',
  magnet: 'electrico',
  never_melt_ice: 'hielo',
  black_belt: 'lucha',
  poison_barb: 'veneno',
  soft_sand: 'tierra',
  sharp_beak: 'volador',
  twisted_spoon: 'psiquico',
  silver_powder: 'bicho',
  hard_stone: 'roca',
  spell_tag: 'fantasma',
  dragon_fang: 'dragon',
  black_glasses: 'siniestro',
  metal_coat: 'acero',
  pixie_plate: 'hada'
};

export const TIPOS_DEFENSOR = [
  'normal', 'fuego', 'agua', 'planta', 'electrico', 'eléctrico', 'hielo',
  'lucha', 'veneno', 'tierra', 'volador', 'psiquico', 'psíquico', 'bicho',
  'roca', 'fantasma', 'dragon', 'dragón', 'siniestro', 'acero', 'hada', 'sombra'
];

export function getStatConNaturaleza({ base, iv, ev = 0, level, naturaleza, statName }) {
  let mod = 1;
  if (naturaleza.aumenta === statName) mod = 1.1;
  if (naturaleza.disminuye === statName) mod = 0.9;
  return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level / 100 + 5) * mod);
}

export function getHp({ base, iv, level }) {
  return Math.floor(((2 * base + iv) * level / 100) + level + 10);
}

export function getEfectividad(tiposEfectividad, tipoAtaque, tipoDefensor) {
  if (!tipoDefensor) return 1;
  const eff = tiposEfectividad[tipoAtaque];
  if (!eff) return 1;
  if (eff.efectivo.includes(tipoDefensor)) return 2;
  if (eff.poco_efectivo.includes(tipoDefensor)) return 0.5;
  if (eff.inmune.includes(tipoDefensor)) return 0;
  return 1;
}

export function getItemMod(item, tipoMovimiento, categoriaDano) {
  if (item === 'life_orb') return 1.3;
  if (item === 'choice_band' && categoriaDano === 'físico') return 1.5;
  if (item === 'choice_specs' && categoriaDano === 'especial') return 1.5;
  if (item !== 'none' && ITEMS_TIPO[item] === tipoMovimiento) return 1.2;
  return 1;
}

export function calcDano({ level, move, atkStat, defStat, stab, efectividad, itemMod, isCrit }) {
  const baseDmg = ((2 * level / 5 + 2) * move.potencia * atkStat / defStat) / 50 + 2;
  const total = baseDmg * stab * efectividad * itemMod;
  const critMod = isCrit ? 1.5 : 1;
  const minDmg = Math.floor(total * 0.85 * (isCrit ? critMod : 1));
  const maxDmg = Math.floor(total * 1.00 * (isCrit ? critMod : 1));
  return { min: minDmg, max: maxDmg };
}

export function calcularEstadisticasCompletas({ baseStats, nivel, naturaleza, ivs }) {
  const stat = (name, iv) => getStatConNaturaleza({
    base: baseStats[name],
    iv,
    level: nivel,
    naturaleza,
    statName: name
  });

  return {
    ps: getHp({ base: baseStats.ps, iv: ivs.ps, level: nivel }),
    ataque: stat('ataque', ivs.ataque),
    defensa: stat('defensa', ivs.defensa),
    ataque_especial: stat('ataque_especial', ivs.ataque_especial),
    defensa_especial: stat('defensa_especial', ivs.defensa_especial),
    velocidad: stat('velocidad', ivs.velocidad)
  };
}

export function calcularDanioPorMovimiento({
  pokemon,
  move,
  stats,
  nivel,
  naturaleza,
  tipoDefensor,
  item,
  tiposEfectividad,
  isCrit
}) {
  if (!move.potencia || move.potencia <= 0) return null;

  const atkStat = move.categoria_dano === 'físico' ? stats.ataque : stats.ataque_especial;
  const defStat = move.categoria_dano === 'físico' ? stats.defensa : stats.defensa_especial;

  let stab = 1;
  if (pokemon.tipos.includes(move.tipo)) stab = 1.5;

  const efectividad = getEfectividad(tiposEfectividad, move.tipo, tipoDefensor);
  const itemMod = getItemMod(item, move.tipo, move.categoria_dano);

  return calcDano({
    level: nivel,
    move,
    atkStat,
    defStat,
    stab,
    efectividad,
    itemMod,
    isCrit
  });
}