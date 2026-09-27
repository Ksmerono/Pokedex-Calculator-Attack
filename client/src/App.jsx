import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import PokemonGrid from './components/PokemonGrid.jsx';
import PokemonModal from './components/PokemonModal.jsx';
import { getGeneraciones, getNaturalezas, getObjetos, getPokemon, getTipos } from './api.js';

export default function App() {
  const [generaciones, setGeneraciones] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);
  const [naturalezas, setNaturalezas] = useState([]);
  const [objetos, setObjetos] = useState([]);
  const [tiposEfectividad, setTiposEfectividad] = useState({});

  const [currentGen, setCurrentGen] = useState(0);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestSeq = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        const [gens, nats, objs, tipos] = await Promise.all([
          getGeneraciones(),
          getNaturalezas(),
          getObjetos(),
          getTipos()
        ]);
        setGeneraciones(gens);
        setNaturalezas(nats);
        setObjetos(objs);
        setTiposEfectividad(tipos);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);

  useEffect(() => {
    const seq = ++requestSeq.current;
    setLoading(true);
    setError(null);
    getPokemon({ generacion: currentGen || '', q: query })
      .then((data) => {
        if (seq === requestSeq.current) {
          setPokemonList(data);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (seq === requestSeq.current) {
          setError(e.message);
          setLoading(false);
        }
      });
  }, [currentGen, query]);

  const handleSelectGen = useCallback((genId) => {
    setCurrentGen(genId);
    setQuery('');
  }, []);

  const genInfo = useMemo(() => {
    if (currentGen === 0) return null;
    return generaciones.find(g => g.id === currentGen) || null;
  }, [currentGen, generaciones]);

  return (
    <>
      <Header
        generaciones={generaciones}
        currentGen={currentGen}
        query={query}
        onQueryChange={setQuery}
        onSelectGen={handleSelectGen}
      />

      <div className="gen-info">
        {genInfo ? (
          <>
            <strong>{genInfo.nombre}</strong> — Región{' '}
            {genInfo.region.charAt(0).toUpperCase() + genInfo.region.slice(1)} —{' '}
            {pokemonList.length} Pokémon
          </>
        ) : (
          <>
            <strong>{loading ? '…' : pokemonList.length}</strong> Pokémon en total
          </>
        )}
      </div>

      {error && (
        <div className="no-results">
          Error al cargar los datos. Asegúrate de que el servidor API esté ejecutándose.
        </div>
      )}

      {!error && (
        <PokemonGrid
          loading={loading}
          pokemonList={pokemonList}
          onSelect={setSelectedId}
        />
      )}

      {selectedId !== null && (
        <PokemonModal
          pokemonId={selectedId}
          naturalezas={naturalezas}
          objetos={objetos}
          tiposEfectividad={tiposEfectividad}
          onSelectPokemon={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}