import { toRoman } from '../api.js';

export default function Header({ generaciones, currentGen, query, onQueryChange, onSelectGen }) {
  return (
    <header>
      <h1>Poké<span>dex</span></h1>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o número..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>
      <div className="gen-tabs">
        <button
          className={`gen-tab ${currentGen === 0 ? 'active' : ''}`}
          onClick={() => onSelectGen(0)}
        >
          Todas
        </button>
        {generaciones.map((g) => (
          <button
            key={g.id}
            className={`gen-tab ${currentGen === g.id ? 'active' : ''}`}
            onClick={() => onSelectGen(g.id)}
          >
            Gen {toRoman(g.id)} - {g.region.charAt(0).toUpperCase() + g.region.slice(1)}
          </button>
        ))}
      </div>
    </header>
  );
}