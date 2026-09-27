import { spriteUrl } from '../api.js';

export default function PokemonCard({ pokemon: p, onSelect }) {
  const stats = p.estadisticas;
  const total = stats.ps + stats.ataque + stats.defensa + stats.ataque_especial + stats.defensa_especial + stats.velocidad;

  let badge = null;
  if (p.especie.mitico) badge = <div className="card-mythical">Mítico</div>;
  else if (p.especie.legendario) badge = <div className="card-legendary">Legendario</div>;

  return (
    <div className="card" onClick={() => onSelect(p.id)}>
      {badge}
      <div className="card-id">#{String(p.id).padStart(4, '0')}</div>
      <img className="card-img" src={spriteUrl(p.id)} alt={p.nombre} loading="lazy" />
      <div className="card-name">{p.nombre}</div>
      <div className="card-types">
        {p.tipos.map((t) => (
          <span key={t} className={`type-badge type-${t}`}>{t}</span>
        ))}
      </div>
      <div className="card-stats">
        <div>PS <span style={{ color: '#6c5' }}>{stats.ps}</span></div>
        <div>Atq <span style={{ color: '#f44' }}>{stats.ataque}</span></div>
        <div>Atq Sp <span style={{ color: '#68f' }}>{stats.ataque_especial}</span></div>
        <div>Def <span style={{ color: '#fc6' }}>{stats.defensa}</span></div>
        <div>Def Sp <span style={{ color: '#8cf' }}>{stats.defensa_especial}</span></div>
        <div>Vel <span style={{ color: '#f84' }}>{stats.velocidad}</span></div>
      </div>
    </div>
  );
}