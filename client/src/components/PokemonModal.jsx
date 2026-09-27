import { useEffect, useState } from 'react';
import { getPokemonById, spriteUrl, toRoman } from '../api.js';
import DamageCalculator from './DamageCalculator.jsx';

export default function PokemonModal({ pokemonId, naturalezas, objetos, tiposEfectividad, onSelectPokemon, onClose }) {
  const [pokemon, setPokemon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getPokemonById(pokemonId)
      .then((data) => {
        if (!cancelled) {
          setPokemon(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [pokemonId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (error) {
    return (
      <div className="modal-overlay active" onClick={onClose}>
        <div className="modal">
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="no-results">Error al cargar el Pokémon</div>
        </div>
      </div>
    );
  }

  if (loading || !pokemon) {
    return (
      <div className="modal-overlay active" onClick={onClose}>
        <div className="modal">
          <button className="modal-close" onClick={onClose}>&times;</button>
          <div className="loading">Cargando datos</div>
        </div>
      </div>
    );
  }

  const p = pokemon;
  const img = spriteUrl(p.id);
  const stats = p.estadisticas;
  const total = stats.ps + stats.ataque + stats.defensa + stats.ataque_especial + stats.defensa_especial + stats.velocidad;

  const statRows = [
    { name: 'PS', value: stats.ps, cls: 'ps' },
    { name: 'Ataque', value: stats.ataque, cls: 'ataque' },
    { name: 'Defensa', value: stats.defensa, cls: 'defensa' },
    { name: 'Atq. Esp.', value: stats.ataque_especial, cls: 'spc-ataque' },
    { name: 'Def. Esp.', value: stats.defensa_especial, cls: 'spc-defensa' },
    { name: 'Velocidad', value: stats.velocidad, cls: 'velocidad' }
  ];

  const evo = p.evolucion;

  const renderEvo = () => {
    const prev = evo.evoluciona_de ? evo.evoluciona_de.pokemon_id : null;

    const condicion = (e) => {
      if (e.condiciones && e.condiciones.length > 0) {
        const c = e.condiciones[0];
        if (c.disparador === 'subir_de_nivel' && c.nivel_minimo) return `Nv. ${c.nivel_minimo}`;
        if (c.disparador === 'objeto' && c.objeto) return c.objeto;
        if (c.disparador === 'intercambio') return 'Intercambio';
        return c.disparador.replace(/_/g, ' ');
      }
      return '';
    };

    return (
      <div className="modal-evolution">
        {prev && (
          <>
            <div className="evo-pokemon" onClick={() => onSelectPokemon(prev)}>
              <img src={spriteUrl(prev)} alt={pokemon.nombre} />
              <div className="evo-name">{pokemon.nombre}</div>
            </div>
            <div className="evo-arrow">→</div>
          </>
        )}
        <div className="evo-pokemon" style={{ border: '2px solid var(--accent)', borderRadius: '12px', padding: '0.5rem' }}>
          <img src={img} alt={p.nombre} style={{ width: 80, height: 80 }} />
          <div className="evo-name" style={{ color: '#fff', fontWeight: 700 }}>{p.nombre}</div>
        </div>
        {(evo.evoluciona_a || []).map((e) => (
          <div key={e.pokemon_id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="evo-arrow">→</div>
            <div className="evo-pokemon" onClick={() => onSelectPokemon(e.pokemon_id)}>
              <img src={spriteUrl(e.pokemon_id)} alt={e.nombre} />
              <div className="evo-name">{e.nombre}</div>
              {condicion(e) && <div className="evo-condition">{condicion(e)}</div>}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const movimientos = p.movimientos || [];

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>

        <div className="modal-header">
          <div className="modal-id">#{String(p.id).padStart(4, '0')} — Gen {toRoman(p.generacion)}</div>
          <div className="modal-name">{p.nombre}</div>
          <div className="modal-desc">{p.descripcion}</div>
        </div>

        <img className="modal-img" src={img} alt={p.nombre} />

        <div className="modal-types">
          {p.tipos.map((t) => (
            <span key={t} className={`type-badge type-${t}`}>{t}</span>
          ))}
        </div>

        <div className="modal-section">
          <h3>Estadísticas — Total: {total}</h3>
          <div className="modal-stats">
            {statRows.map((s) => (
              <div key={s.name} className="modal-stat-row">
                <span className="stat-name">{s.name}</span>
                <span className="stat-value">{s.value}</span>
                <div className="modal-stat-bar">
                  <div className={`stat-fill ${s.cls}`} style={{ width: `${Math.min(100, s.value / 2.55)}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3>Datos</h3>
          <div className="modal-info-grid">
            <div className="modal-info-item">
              <div className="label">Altura</div>
              <div className="value">{p.altura_metros} m</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Peso</div>
              <div className="value">{p.peso_kilogramos} kg</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Exp. Base</div>
              <div className="value">{p.experiencia_base}</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Tasa Captura</div>
              <div className="value">{p.especie.tasa_captura}%</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Hábitat</div>
              <div className="value">{p.especie.habitat || '—'}</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Color</div>
              <div className="value">{p.especie.color || '—'}</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Grupos Huevo</div>
              <div className="value">{(p.especie.grupos_huevo || []).join(', ') || '—'}</div>
            </div>
            <div className="modal-info-item">
              <div className="label">Crecimiento</div>
              <div className="value">{(p.especie.crecimiento || '—').replace(/_/g, ' ')}</div>
            </div>
          </div>
        </div>

        <div className="modal-section">
          <h3>Habilidades</h3>
          <div className="modal-abilities">
            {p.habilidades.map((a) => (
              <div key={a.id} className={`ability-item ${a.oculta ? 'hidden-ability' : ''}`}>
                <span className="ability-tag">{a.nombre}{a.oculta ? ' ★' : ''}</span>
                {a.descripcion && <div className="ability-desc">{a.descripcion}</div>}
                {a.efecto && <div className="ability-effect">{a.efecto}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-section">
          <h3>Cadena Evolutiva</h3>
          {renderEvo()}
        </div>

        <div className="modal-section">
          <h3>Movimientos</h3>
          <div className="moves-count"><strong>{movimientos.length}</strong> movimientos</div>
          <div className="moves-list">
            <div className="move-header">
              <span>Nombre</span>
              <span>Tipo</span>
              <span>Cat.</span>
              <span>Pot.</span>
              <span>Prec.</span>
            </div>
            {movimientos.map((m) => (
              <div key={m.id} className="move-row">
                <span className="move-name">{m.nombre}</span>
                <span className={`move-type-badge type-${m.tipo}`}>{m.tipo}</span>
                <span className="move-cat">{m.categoria_dano}</span>
                <span className="move-val">{m.potencia ?? '—'}</span>
                <span className="move-val">{m.precision ?? '—'}</span>
              </div>
            ))}
            {movimientos.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Sin movimientos registrados
              </div>
            )}
          </div>
        </div>

        <div className="modal-section">
          <h3>Calculadora de Daño</h3>
          <DamageCalculator
            pokemon={p}
            naturalezas={naturalezas}
            objetos={objetos}
            tiposEfectividad={tiposEfectividad}
          />
        </div>
      </div>
    </div>
  );
}