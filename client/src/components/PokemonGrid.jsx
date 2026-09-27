import PokemonCard from './PokemonCard.jsx';

export default function PokemonGrid({ loading, pokemonList, onSelect }) {
  if (loading) {
    return <div className="loading">Cargando datos</div>;
  }

  if (pokemonList.length === 0) {
    return <div className="no-results">No se encontraron Pokémon</div>;
  }

  return (
    <div className="grid">
      {pokemonList.map((p) => (
        <PokemonCard key={p.id} pokemon={p} onSelect={onSelect} />
      ))}
    </div>
  );
}