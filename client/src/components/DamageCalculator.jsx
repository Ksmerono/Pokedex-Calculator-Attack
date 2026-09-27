import { useMemo, useState } from 'react';
import {
  calcularEstadisticasCompletas,
  calcularDanioPorMovimiento,
  getEfectividad,
  TIPOS_DEFENSOR
} from '../lib/calculadora.js';

const DEFAULT_IVS = {
  ps: 31,
  ataque: 31,
  defensa: 31,
  ataque_especial: 31,
  defensa_especial: 31,
  velocidad: 31
};

const IV_LABELS = {
  ps: 'PS',
  ataque: 'Atq',
  defensa: 'Def',
  ataque_especial: 'AtqEsp',
  defensa_especial: 'DefEsp',
  velocidad: 'Vel'
};

export default function DamageCalculator({ pokemon, naturalezas, objetos, tiposEfectividad }) {
  const [nivel, setNivel] = useState(50);
  const [natureId, setNatureId] = useState('');
  const [tipoDefensor, setTipoDefensor] = useState('');
  const [item, setItem] = useState('none');
  const [isCrit, setIsCrit] = useState(false);
  const [ivs, setIvs] = useState(DEFAULT_IVS);

  const naturaleza = useMemo(() => {
    const id = parseInt(natureId, 10);
    if (Number.isInteger(id)) {
      const found = naturalezas.find((n) => n.id === id);
      if (found) return found;
    }
    return naturalezas[0];
  }, [natureId, naturalezas]);

  const stats = useMemo(() => calcularEstadisticasCompletas({
    baseStats: pokemon.estadisticas,
    nivel,
    naturaleza,
    ivs
  }), [pokemon, nivel, naturaleza, ivs]);

  const itemData = useMemo(
    () => (item && item !== 'none' ? objetos.find((o) => o.clave === item) : null),
    [item, objetos]
  );

  const movimientos = useMemo(
    () => (pokemon.movimientos || []).filter((m) => m.potencia && m.potencia > 0),
    [pokemon]
  );

  const resultados = useMemo(() =>
    movimientos.map((m) => {
      const efectividad = getEfectividad(tiposEfectividad, m.tipo, tipoDefensor);
      const danio = calcularDanioPorMovimiento({
        pokemon,
        move: m,
        stats,
        nivel,
        naturaleza,
        tipoDefensor,
        item,
        tiposEfectividad,
        isCrit
      });
      return { move: m, efectividad, danio };
    }),
    [movimientos, pokemon, stats, nivel, naturaleza, tipoDefensor, item, tiposEfectividad, isCrit]
  );

  const setIv = (key, value) => {
    const v = Math.min(31, Math.max(0, parseInt(value, 10) || 0));
    setIvs((prev) => ({ ...prev, [key]: v }));
  };

  const statClass = (statName) => {
    if (naturaleza.aumenta === statName) return 'bonus';
    if (naturaleza.disminuye === statName) return 'penalty';
    return '';
  };

  const minColor = (efectividad) =>
    efectividad === 2 ? '#6c5' : efectividad === 0.5 ? '#f84' : efectividad === 0 ? '#888' : '#fc6';
  const maxColor = (efectividad) =>
    efectividad === 2 ? '#6c5' : efectividad === 0.5 ? '#f84' : efectividad === 0 ? '#888' : '#f44';

  return (
    <div className="damage-calc">
      <div className="damage-controls">
        <label>Nivel
          <input
            type="number"
            min="1"
            max="100"
            value={nivel}
            onChange={(e) => setNivel(parseInt(e.target.value, 10) || 50)}
          />
        </label>

        <label>Naturaleza
          <select value={natureId} onChange={(e) => setNatureId(e.target.value)}>
            {naturalezas.map((n) => (
              <option key={n.id} value={n.id}>
                {n.nombre}
                {n.aumenta ? ` (+${n.aumenta.slice(0, 3)} / -${n.disminuye.slice(0, 3)})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label>Tipo Defensor
          <select value={tipoDefensor} onChange={(e) => setTipoDefensor(e.target.value)}>
            <option value="">—</option>
            {TIPOS_DEFENSOR.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <label>Objeto
          <select value={item} onChange={(e) => setItem(e.target.value)}>
            {objetos.map((o) => (
              <option key={o.clave} value={o.clave}>{o.nombre}</option>
            ))}
          </select>
        </label>

        <div className="item-desc">
          {itemData ? (
            <>
              <strong>{itemData.nombre}:</strong> {itemData.descripcion}
              <br /><em>{itemData.efecto}</em>
            </>
          ) : (
            <em>Selecciona un objeto para ver su descripción</em>
          )}
        </div>

        <label className="checkbox-label">
          <input type="checkbox" checked={isCrit} onChange={(e) => setIsCrit(e.target.checked)} />
          Crítico
        </label>
      </div>

      <div className="ivs-section">
        <h4>IVs (0-31)</h4>
        <div className="ivs-grid">
          {Object.keys(DEFAULT_IVS).map((key) => (
            <div key={key} className="iv-input">
              <label>{IV_LABELS[key]}</label>
              <input
                type="number"
                min="0"
                max="31"
                value={ivs[key]}
                onChange={(e) => setIv(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <div className="stats-preview">
          <div className="stat-preview-item">
            <span className="stat-label">PS</span>
            <span className="stat-val">{stats.ps}</span>
          </div>
          <div className="stat-preview-item">
            <span className="stat-label">Atq</span>
            <span className={`stat-val ${statClass('ataque')}`}>{stats.ataque}</span>
          </div>
          <div className="stat-preview-item">
            <span className="stat-label">Def</span>
            <span className={`stat-val ${statClass('defensa')}`}>{stats.defensa}</span>
          </div>
          <div className="stat-preview-item">
            <span className="stat-label">AtqEsp</span>
            <span className={`stat-val ${statClass('ataque_especial')}`}>{stats.ataque_especial}</span>
          </div>
          <div className="stat-preview-item">
            <span className="stat-label">DefEsp</span>
            <span className={`stat-val ${statClass('defensa_especial')}`}>{stats.defensa_especial}</span>
          </div>
          <div className="stat-preview-item">
            <span className="stat-label">Vel</span>
            <span className={`stat-val ${statClass('velocidad')}`}>{stats.velocidad}</span>
          </div>
        </div>
      </div>

      <div className="damage-results">
        <div className="damage-header">
          <span>Ataque</span>
          <span>Tipo</span>
          <span>Cat.</span>
          <span>Mín.</span>
          <span>Máx.</span>
        </div>
        {resultados.map(({ move, efectividad, danio }) => (
          <div key={move.id} className="damage-row">
            <span className="dmg-name">{move.nombre}</span>
            <span className={`dmg-type type-${move.tipo}`}>{move.tipo}</span>
            <span className="dmg-cat">{move.categoria_dano}</span>
            <span className="dmg-min" style={{ color: minColor(efectividad) }}>
              {efectividad === 0 ? '0' : danio?.min ?? '—'}
            </span>
            <span className="dmg-max" style={{ color: maxColor(efectividad) }}>
              {efectividad === 0 ? '0' : danio?.max ?? '—'}
            </span>
          </div>
        ))}
        {resultados.length === 0 && (
          <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Sin ataques con potencia
          </div>
        )}
      </div>
    </div>
  );
}