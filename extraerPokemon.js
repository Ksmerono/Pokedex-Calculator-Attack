import fs from "node:fs/promises";
import path from "node:path";

const API = "https://pokeapi.co/api/v2";

const DIRECTORIO_DATOS = path.resolve("./datos");
const DIRECTORIO_GENERACIONES = path.join(
  DIRECTORIO_DATOS,
  "generaciones"
);

const CONCURRENCIA = 6;

const cachePeticiones = new Map();
const cacheNombres = new Map();
const cacheEvoluciones = new Map();

/* =========================================================
   TRADUCCIONES
========================================================= */

const TRADUCCIONES_TIPOS = {
  normal: "normal",
  fire: "fuego",
  water: "agua",
  electric: "eléctrico",
  grass: "planta",
  ice: "hielo",
  fighting: "lucha",
  poison: "veneno",
  ground: "tierra",
  flying: "volador",
  psychic: "psíquico",
  bug: "bicho",
  rock: "roca",
  ghost: "fantasma",
  dragon: "dragón",
  dark: "siniestro",
  steel: "acero",
  fairy: "hada",
  stellar: "estelar",
  unknown: "desconocido",
  shadow: "sombra"
};

const TRADUCCIONES_ESTADISTICAS = {
  hp: "ps",
  attack: "ataque",
  defense: "defensa",
  "special-attack": "ataque_especial",
  "special-defense": "defensa_especial",
  speed: "velocidad"
};

const TRADUCCIONES_CLASE_DANO = {
  physical: "físico",
  special: "especial",
  status: "estado"
};

const TRADUCCIONES_METODOS = {
  "level-up": "subir_de_nivel",
  machine: "máquina",
  egg: "huevo",
  tutor: "tutor",
  "stadium-surfing-pikachu": "pikachu_surfista_stadium",
  "light-ball-egg": "huevo_con_bola_luminosa",
  "colosseum-purification": "purificación_colosseum",
  "xd-shadow": "movimiento_oscuro_xd",
  "xd-purification": "purificación_xd",
  "form-change": "cambio_de_forma",
  "zygarde-cube": "cubo_zygarde"
};

const TRADUCCIONES_DISPARADORES_EVOLUCION = {
  "level-up": "subir_de_nivel",
  trade: "intercambio",
  "use-item": "usar_objeto",
  shed: "muda",
  spin: "giro",
  "tower-of-darkness": "torre_de_las_sombras",
  "tower-of-waters": "torre_de_las_aguas",
  "three-critical-hits": "tres_golpes_críticos",
  "take-damage": "recibir_daño",
  other: "otro",
  "agile-style-move": "movimiento_estilo_ágil",
  "strong-style-move": "movimiento_estilo_fuerte",
  "recoil-damage": "daño_de_retroceso"
};

const TRADUCCIONES_CRECIMIENTO = {
  slow: "lento",
  medium: "medio",
  fast: "rápido",
  "medium-slow": "medio_lento",
  "slow-then-very-fast": "lento_luego_muy_rápido",
  "fast-then-very-slow": "rápido_luego_muy_lento"
};

const TRADUCCIONES_OBJETIVO = {
  "specific-move": "movimiento_específico",
  "selected-pokemon-me-first": "pokémon_seleccionado_yo_primero",
  ally: "aliado",
  "users-field": "campo_del_usuario",
  user: "usuario",
  "random-opponent": "oponente_aleatorio",
  "all-other-pokemon": "todos_los_demás_pokémon",
  "selected-pokemon": "pokémon_seleccionado",
  "all-opponents": "todos_los_oponentes",
  "entire-field": "todo_el_campo",
  "user-and-allies": "usuario_y_aliados",
  "all-pokemon": "todos_los_pokémon",
  "all-allies": "todos_los_aliados",
  "fainting-pokemon": "pokémon_debilitado"
};

const TRADUCCIONES_CATEGORIA_META = {
  damage: "daño",
  ailment: "problema_de_estado",
  "net-good-stats": "mejora_neta_estadísticas",
  heal: "curación",
  "damage+ailment": "daño_y_estado",
  swagger: "contoneo",
  "damage+lower": "daño_y_bajada_estadística",
  "damage+raise": "daño_y_subida_estadística",
  "damage+heal": "daño_y_curación",
  ohko: "ko_de_un_golpe",
  "whole-field-effect": "efecto_de_campo",
  "field-effect": "efecto_de_zona",
  "force-switch": "forzar_cambio",
  unique: "único"
};

const TRADUCCIONES_ESTADO = {
  unknown: "desconocido",
  none: "ninguno",
  paralysis: "parálisis",
  sleep: "sueño",
  freeze: "congelación",
  burn: "quemadura",
  poison: "envenenamiento",
  confusion: "confusión",
  infatuation: "enamoramiento",
  trap: "atrapado",
  nightmare: "pesadilla",
  torment: "tormento",
  disable: "anulación",
  yawn: "bostezo",
  "heal-block": "bloqueo_de_curación",
  "no-type-immunity": "sin_inmunidad_de_tipo",
  "leech-seed": "drenadoras",
  embargo: "embargo",
  "perish-song": "canto_mortal",
  ingrain: "arraigo",
  silence: "silencio",
  "tar-shot": "alquitranazo"
};

/* =========================================================
   UTILIDADES
========================================================= */

function esperar(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function obtenerJSON(url, intentos = 5) {
  if (cachePeticiones.has(url)) {
    return cachePeticiones.get(url);
  }

  const promesa = (async () => {
    for (
      let intento = 1;
      intento <= intentos;
      intento++
    ) {
      try {
        const respuesta = await fetch(url, {
          headers: {
            "User-Agent":
              "ExtractorPokemonJSON/1.0"
          }
        });

        if (respuesta.status === 429) {
          const tiempoEspera =
            1500 * intento;

          console.warn(
            `Límite de peticiones. Esperando ${tiempoEspera} ms...`
          );

          await esperar(tiempoEspera);
          continue;
        }

        if (!respuesta.ok) {
          throw new Error(
            `${respuesta.status} ${respuesta.statusText}`
          );
        }

        return await respuesta.json();
      } catch (error) {
        if (intento === intentos) {
          throw new Error(
            `Error solicitando ${url}: ${error.message}`
          );
        }

        await esperar(500 * intento);
      }
    }
  })();

  cachePeticiones.set(url, promesa);

  try {
    return await promesa;
  } catch (error) {
    cachePeticiones.delete(url);
    throw error;
  }
}

function idDesdeUrl(url) {
  if (!url) {
    return null;
  }

  const partes = url
    .split("/")
    .filter(Boolean);

  const id = Number(
    partes.at(-1)
  );

  return Number.isNaN(id)
    ? null
    : id;
}

function nombreIdioma(
  lista = [],
  idioma = "es"
) {
  return (
    lista.find(
      elemento =>
        elemento.language?.name === idioma
    )?.name ?? null
  );
}

function limpiarTexto(texto) {
  if (texto == null) {
    return null;
  }

  return String(texto)
    .replace(/\f/g, " ")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function traducir(
  diccionario,
  valor
) {
  if (valor == null) {
    return null;
  }

  return (
    diccionario[valor] ??
    valor
  );
}

function traducirTipo(tipo) {
  return traducir(
    TRADUCCIONES_TIPOS,
    tipo
  );
}

async function mapConLimite(
  elementos,
  limite,
  funcion
) {
  const resultados =
    new Array(elementos.length);

  let indice = 0;

  async function trabajador() {
    while (true) {
      const actual = indice++;

      if (
        actual >=
        elementos.length
      ) {
        return;
      }

      resultados[actual] =
        await funcion(
          elementos[actual],
          actual
        );
    }
  }

  const trabajadores =
    Array.from(
      {
        length: Math.min(
          limite,
          elementos.length
        )
      },
      () => trabajador()
    );

  await Promise.all(
    trabajadores
  );

  return resultados;
}

async function guardarJSON(
  ruta,
  datos
) {
  await fs.mkdir(
    path.dirname(ruta),
    {
      recursive: true
    }
  );

  await fs.writeFile(
    ruta,
    JSON.stringify(
      datos,
      null,
      2
    ),
    "utf8"
  );
}

/* =========================================================
   NOMBRES EN ESPAÑOL
========================================================= */

async function nombreRecursoEnEspanol(
  recurso,
  endpoint
) {
  if (!recurso) {
    return null;
  }

  const id =
    idDesdeUrl(recurso.url);

  const clave =
    `${endpoint}:${id ?? recurso.name}`;

  if (
    cacheNombres.has(clave)
  ) {
    return cacheNombres.get(
      clave
    );
  }

  const promesa =
    (async () => {
      try {
        const datos =
          await obtenerJSON(
            recurso.url ??
            `${API}/${endpoint}/${recurso.name}`
          );

        return (
          nombreIdioma(
            datos.names,
            "es"
          ) ??
          recurso.name
        );
      } catch {
        return recurso.name;
      }
    })();

  cacheNombres.set(
    clave,
    promesa
  );

  return promesa;
}

/* =========================================================
   EVOLUCIONES
========================================================= */

async function traducirCondicionEvolucion(
  detalle
) {
  return {
    disparador:
      traducir(
        TRADUCCIONES_DISPARADORES_EVOLUCION,
        detalle.trigger?.name
      ),

    nivel_minimo:
      detalle.min_level ??
      null,

    objeto:
      detalle.item
        ? await nombreRecursoEnEspanol(
            detalle.item,
            "item"
          )
        : null,

    objeto_equipado:
      detalle.held_item
        ? await nombreRecursoEnEspanol(
            detalle.held_item,
            "item"
          )
        : null,

    felicidad_minima:
      detalle.min_happiness ??
      null,

    belleza_minima:
      detalle.min_beauty ??
      null,

    afecto_minimo:
      detalle.min_affection ??
      null,

    momento_del_dia:
      detalle.time_of_day ||
      null,

    movimiento_conocido_id:
      detalle.known_move
        ? idDesdeUrl(
            detalle.known_move.url
          )
        : null,

    tipo_movimiento_conocido:
      detalle.known_move_type
        ? traducirTipo(
            detalle
              .known_move_type
              .name
          )
        : null,

    ubicacion:
      detalle.location
        ? await nombreRecursoEnEspanol(
            detalle.location,
            "location"
          )
        : null,

    genero_requerido:
      detalle.gender === 1
        ? "hembra"
        : detalle.gender === 2
          ? "macho"
          : null,

    necesita_lluvia:
      detalle
        .needs_overworld_rain ??
      false,

    especie_intercambiada_id:
      detalle.trade_species
        ? idDesdeUrl(
            detalle
              .trade_species
              .url
          )
        : null,

    girar_consola:
      detalle
        .turn_upside_down ??
      false
  };
}

async function construirMapaEvoluciones(
  cadenaUrl
) {
  if (!cadenaUrl) {
    return {};
  }

  if (
    cacheEvoluciones.has(
      cadenaUrl
    )
  ) {
    return cacheEvoluciones.get(
      cadenaUrl
    );
  }

  const promesa =
    (async () => {
      const datos =
        await obtenerJSON(
          cadenaUrl
        );

      const mapa = {};

      async function recorrer(
        nodo,
        anterior = null,
        etapa = 1
      ) {
        const especieId =
          idDesdeUrl(
            nodo.species.url
          );

        const especie =
          await obtenerJSON(
            nodo.species.url
          );

        const nombre =
          nombreIdioma(
            especie.names,
            "es"
          ) ??
          nodo.species.name;

        if (!mapa[especieId]) {
          mapa[especieId] = {
            etapa,
            evoluciona_de:
              anterior,
            evoluciona_a: []
          };
        }

        for (
          const siguiente
          of nodo.evolves_to ??
            []
        ) {
          const siguienteId =
            idDesdeUrl(
              siguiente.species.url
            );

          const especieSiguiente =
            await obtenerJSON(
              siguiente.species.url
            );

          const nombreSiguiente =
            nombreIdioma(
              especieSiguiente.names,
              "es"
            ) ??
            siguiente.species.name;

          const condiciones = [];

          for (
            const detalle
            of siguiente
              .evolution_details ??
              []
          ) {
            condiciones.push(
              await traducirCondicionEvolucion(
                detalle
              )
            );
          }

          mapa[
            especieId
          ].evoluciona_a.push({
            pokemon_id:
              siguienteId,
            nombre:
              nombreSiguiente,
            condiciones
          });

          await recorrer(
            siguiente,
            {
              pokemon_id:
                especieId,
              nombre,
              condiciones
            },
            etapa + 1
          );
        }
      }

      await recorrer(
        datos.chain
      );

      return mapa;
    })();

  cacheEvoluciones.set(
    cadenaUrl,
    promesa
  );

  return promesa;
}

/* =========================================================
   POKÉMON
========================================================= */

async function obtenerHabilidadesPokemon(
  pokemon
) {
  return Promise.all(
    [...pokemon.abilities]
      .sort(
        (a, b) =>
          a.slot -
          b.slot
      )
      .map(
        async entrada => ({
          id:
            idDesdeUrl(
              entrada
                .ability
                .url
            ),

          nombre:
            await nombreRecursoEnEspanol(
              entrada.ability,
              "ability"
            ),

          oculta:
            entrada.is_hidden,

          posicion:
            entrada.slot
        })
      )
  );
}

function obtenerMovimientosPokemon(
  pokemon
) {
  const ids =
    new Set();

  const aprendizaje = [];

  for (
    const entrada
    of pokemon.moves ?? []
  ) {
    const movimientoId =
      idDesdeUrl(
        entrada.move.url
      );

    ids.add(
      movimientoId
    );

    for (
      const detalle
      of entrada
        .version_group_details ??
        []
    ) {
      aprendizaje.push({
        movimiento_id:
          movimientoId,

        metodo:
          traducir(
            TRADUCCIONES_METODOS,
            detalle
              .move_learn_method
              ?.name
          ),

        nivel:
          detalle
            .level_learned_at ??
          0,

        grupo_version:
          detalle
            .version_group
            ?.name ??
          null
      });
    }
  }

  aprendizaje.sort(
    (a, b) =>
      a.movimiento_id -
        b.movimiento_id ||
      (
        a.grupo_version ??
        ""
      ).localeCompare(
        b.grupo_version ??
        ""
      ) ||
      a.nivel -
        b.nivel
  );

  return {
    ids:
      [...ids].sort(
        (a, b) =>
          a - b
      ),

    aprendizaje
  };
}

async function extraerPokemon(
  referenciaEspecie,
  generacionId
) {
  const especie =
    await obtenerJSON(
      referenciaEspecie.url
    );

  const variedadPredeterminada =
    especie.varieties?.find(
      variedad =>
        variedad.is_default
    ) ??
    especie.varieties?.[0];

  if (
    !variedadPredeterminada
  ) {
    throw new Error(
      `No se encontró variedad para ${especie.name}`
    );
  }

  const pokemon =
    await obtenerJSON(
      variedadPredeterminada
        .pokemon
        .url
    );

  const mapaEvoluciones =
    await construirMapaEvoluciones(
      especie.evolution_chain
        ?.url
    );

  const estadisticas = {};

  for (
    const entrada
    of pokemon.stats ?? []
  ) {
    const clave =
      TRADUCCIONES_ESTADISTICAS[
        entrada.stat.name
      ] ??
      entrada.stat.name;

    estadisticas[clave] =
      entrada.base_stat;
  }

  const movimientos =
    obtenerMovimientosPokemon(
      pokemon
    );

  const descripcionEntry =
    especie
      .flavor_text_entries
      ?.find(
        entrada =>
          entrada.language
            ?.name ===
          "es"
      );

  const descripcion =
    limpiarTexto(
      descripcionEntry
        ?.flavor_text
    );

  const gruposHuevo =
    await Promise.all(
      (
        especie.egg_groups ??
        []
      ).map(
        grupo =>
          nombreRecursoEnEspanol(
            grupo,
            "egg-group"
          )
      )
    );

  const habitat =
    especie.habitat
      ? await nombreRecursoEnEspanol(
          especie.habitat,
          "pokemon-habitat"
        )
      : null;

  const forma =
    especie.shape
      ? await nombreRecursoEnEspanol(
          especie.shape,
          "pokemon-shape"
        )
      : null;

  const color =
    especie.color
      ? await nombreRecursoEnEspanol(
          especie.color,
          "pokemon-color"
        )
      : null;

  return {
    id:
      pokemon.id,

    nombre:
      nombreIdioma(
        especie.names,
        "es"
      ) ??
      pokemon.name,

    nombre_api:
      pokemon.name,

    generacion:
      generacionId,

    descripcion,

    altura_decimetros:
      pokemon.height,

    altura_metros:
      pokemon.height /
      10,

    peso_hectogramos:
      pokemon.weight,

    peso_kilogramos:
      pokemon.weight /
      10,

    experiencia_base:
      pokemon.base_experience,

    tipos:
      [...pokemon.types]
        .sort(
          (a, b) =>
            a.slot -
            b.slot
        )
        .map(
          entrada =>
            traducirTipo(
              entrada
                .type
                .name
            )
        ),

    habilidades:
      await obtenerHabilidadesPokemon(
        pokemon
      ),

    estadisticas,

    especie: {
      ratio_genero:
        especie.gender_rate,

      tasa_captura:
        especie.capture_rate,

      felicidad_base:
        especie.base_happiness,

      contador_eclosion:
        especie.hatch_counter,

      tiene_diferencias_genero:
        especie
          .has_gender_differences,

      puede_cambiar_forma:
        especie
          .forms_switchable,

      crecimiento:
        traducir(
          TRADUCCIONES_CRECIMIENTO,
          especie
            .growth_rate
            ?.name
        ),

      bebe:
        especie.is_baby,

      legendario:
        especie
          .is_legendary,

      mitico:
        especie
          .is_mythical,

      grupos_huevo:
        gruposHuevo,

      habitat,

      forma,

      color
    },

    evolucion:
      mapaEvoluciones[
        pokemon.id
      ] ?? {
        etapa: 1,
        evoluciona_de:
          null,
        evoluciona_a: []
      },

    movimientos_ids:
      movimientos.ids,

    aprendizaje_movimientos:
      movimientos.aprendizaje
  };
}

/* =========================================================
   MOVIMIENTOS
========================================================= */

async function extraerMovimiento(
  referencia
) {
  const movimiento =
    await obtenerJSON(
      referencia.url
    );

  const nombre =
    nombreIdioma(
      movimiento.names,
      "es"
    ) ??
    nombreIdioma(
      movimiento.names,
      "en"
    ) ??
    movimiento.name;

  const efectoES =
    movimiento
      .effect_entries
      ?.find(
        entrada =>
          entrada.language
            ?.name ===
          "es"
      );

  const efectoEN =
    movimiento
      .effect_entries
      ?.find(
        entrada =>
          entrada.language
            ?.name ===
          "en"
      );

  let efecto =
    efectoES
      ?.short_effect ??
    efectoES
      ?.effect ??
    efectoEN
      ?.short_effect ??
    efectoEN
      ?.effect ??
    null;

  if (
    efecto != null &&
    movimiento.effect_chance !=
      null
  ) {
    efecto =
      efecto.replaceAll(
        "$effect_chance",
        String(
          movimiento
            .effect_chance
        )
      );
  }

  const cambiosEstadisticas =
    (
      movimiento
        .stat_changes ??
      []
    ).map(
      cambio => ({
        estadistica:
          TRADUCCIONES_ESTADISTICAS[
            cambio.stat.name
          ] ??
          cambio.stat.name,

        cambio:
          cambio.change
      })
    );

  return {
    id:
      movimiento.id,

    nombre,

    nombre_api:
      movimiento.name,

    generacion:
      idDesdeUrl(
        movimiento
          .generation
          ?.url
      ),

    tipo:
      traducirTipo(
        movimiento.type
          ?.name
      ),

    categoria_dano:
      traducir(
        TRADUCCIONES_CLASE_DANO,
        movimiento
          .damage_class
          ?.name
      ),

    potencia:
      movimiento.power,

    precision:
      movimiento.accuracy,

    pp:
      movimiento.pp,

    prioridad:
      movimiento.priority,

    probabilidad_efecto:
      movimiento
        .effect_chance,

    objetivo:
      traducir(
        TRADUCCIONES_OBJETIVO,
        movimiento
          .target
          ?.name
      ),

    efectos_secundarios:
      movimiento.meta
        ? {
            estado:
              traducir(
                TRADUCCIONES_ESTADO,
                movimiento
                  .meta
                  .ailment
                  ?.name
              ),

            categoria:
              traducir(
                TRADUCCIONES_CATEGORIA_META,
                movimiento
                  .meta
                  .category
                  ?.name
              ),

            probabilidad_estado:
              movimiento
                .meta
                .ailment_chance,

            probabilidad_critico_extra:
              movimiento
                .meta
                .crit_rate,

            drenaje_porcentaje:
              movimiento
                .meta
                .drain,

            probabilidad_retroceso:
              movimiento
                .meta
                .flinch_chance,

            curacion_porcentaje:
              movimiento
                .meta
                .healing,

            golpes_minimos:
              movimiento
                .meta
                .min_hits,

            golpes_maximos:
              movimiento
                .meta
                .max_hits,

            turnos_minimos:
              movimiento
                .meta
                .min_turns,

            turnos_maximos:
              movimiento
                .meta
                .max_turns,

            probabilidad_cambio_estadistica:
              movimiento
                .meta
                .stat_chance
          }
        : null,

    cambios_estadisticas:
      cambiosEstadisticas,

    efecto:
      limpiarTexto(
        efecto
      )
  };
}

/* =========================================================
   GENERACIONES
========================================================= */

async function obtenerGeneraciones() {
  const listado =
    await obtenerJSON(
      `${API}/generation?limit=100`
    );

  return listado.results
    .map(
      referencia => ({
        id:
          idDesdeUrl(
            referencia.url
          ),

        nombre_api:
          referencia.name,

        url:
          referencia.url
      })
    )
    .filter(
      generacion =>
        generacion.id !=
        null
    )
    .sort(
      (a, b) =>
        a.id - b.id
    );
}

/* =========================================================
   PROCESO PRINCIPAL
========================================================= */

async function main() {
  await fs.mkdir(
    DIRECTORIO_DATOS,
    {
      recursive: true
    }
  );

  await fs.mkdir(
    DIRECTORIO_GENERACIONES,
    {
      recursive: true
    }
  );

  console.log(
    "Consultando generaciones disponibles en PokeAPI..."
  );

  const generaciones =
    await obtenerGeneraciones();

  console.log(
    `Se han encontrado ${generaciones.length} generaciones.`
  );

  const todosPokemon = [];

  const referenciasMovimientos =
    new Map();

  const resumenGeneraciones =
    [];

  for (
    const generacionInfo
    of generaciones
  ) {
    console.log(
      `\n========== GENERACIÓN ${generacionInfo.id} ==========`
    );

    const generacion =
      await obtenerJSON(
        generacionInfo.url
      );

    const nombreGeneracion =
      nombreIdioma(
        generacion.names,
        "es"
      ) ??
      `Generación ${generacionInfo.id}`;

    const region =
      generacion.main_region
        ? await nombreRecursoEnEspanol(
            generacion
              .main_region,
            "region"
          )
        : null;

    console.log(
      `${nombreGeneracion} - ${generacion.pokemon_species.length} especies`
    );

    const especiesOrdenadas =
      [
        ...generacion
          .pokemon_species
      ].sort(
        (a, b) =>
          idDesdeUrl(
            a.url
          ) -
          idDesdeUrl(
            b.url
          )
      );

    const pokemonGeneracion =
      await mapConLimite(
        especiesOrdenadas,
        CONCURRENCIA,

        async (
          especie,
          indice
        ) => {
          console.log(
            `Pokémon ${indice + 1}/${especiesOrdenadas.length}: ${especie.name}`
          );

          try {
            return await extraerPokemon(
              especie,
              generacion.id
            );
          } catch (error) {
            console.error(
              `ERROR extrayendo ${especie.name}: ${error.message}`
            );

            return null;
          }
        }
      );

    const pokemonValidos =
      pokemonGeneracion
        .filter(Boolean)
        .sort(
          (a, b) =>
            a.id -
            b.id
        );

    todosPokemon.push(
      ...pokemonValidos
    );

    for (
      const movimiento
      of generacion.moves ??
        []
    ) {
      referenciasMovimientos.set(
        idDesdeUrl(
          movimiento.url
        ),
        movimiento
      );
    }

    /*
     * También recogemos movimientos encontrados
     * dentro de los Pokémon.
     */
    for (
      const pokemon
      of pokemonValidos
    ) {
      for (
        const movimientoId
        of pokemon.movimientos_ids
      ) {
        if (
          !referenciasMovimientos.has(
            movimientoId
          )
        ) {
          referenciasMovimientos.set(
            movimientoId,
            {
              name:
                String(
                  movimientoId
                ),

              url:
                `${API}/move/${movimientoId}/`
            }
          );
        }
      }
    }

    const archivoGeneracion =
      {
        id:
          generacion.id,

        nombre:
          nombreGeneracion,

        region,

        pokemon_ids:
          pokemonValidos.map(
            pokemon =>
              pokemon.id
          ),

        cantidad_pokemon:
          pokemonValidos.length,

        grupos_version:
          (
            generacion
              .version_groups ??
            []
          ).map(
            grupo =>
              grupo.name
          )
      };

    resumenGeneraciones.push(
      archivoGeneracion
    );

    await guardarJSON(
      path.join(
        DIRECTORIO_GENERACIONES,
        `generacion-${generacion.id}.json`
      ),
      archivoGeneracion
    );
  }

  /* =====================================================
     MOVIMIENTOS
  ===================================================== */

  console.log(
    `\nExtrayendo ${referenciasMovimientos.size} movimientos...`
  );

  const listaReferenciasMovimientos =
    [
      ...referenciasMovimientos.entries()
    ]
      .sort(
        (a, b) =>
          a[0] -
          b[0]
      )
      .map(
        (
          [, referencia]
        ) =>
          referencia
      );

  const movimientos =
    await mapConLimite(
      listaReferenciasMovimientos,
      CONCURRENCIA,

      async (
        referencia,
        indice
      ) => {
        console.log(
          `Movimiento ${indice + 1}/${listaReferenciasMovimientos.length}: ${referencia.name}`
        );

        try {
          return await extraerMovimiento(
            referencia
          );
        } catch (error) {
          console.error(
            `ERROR movimiento ${referencia.name}: ${error.message}`
          );

          return null;
        }
      }
    );

  const movimientosValidos =
    movimientos
      .filter(Boolean)
      .sort(
        (a, b) =>
          a.id -
          b.id
      );

  todosPokemon.sort(
    (a, b) =>
      a.id - b.id
  );

  /* =====================================================
     GUARDAR ARCHIVOS
  ===================================================== */

  await guardarJSON(
    path.join(
      DIRECTORIO_DATOS,
      "pokemon.json"
    ),
    todosPokemon
  );

  await guardarJSON(
    path.join(
      DIRECTORIO_DATOS,
      "movimientos.json"
    ),
    movimientosValidos
  );

  await guardarJSON(
    path.join(
      DIRECTORIO_DATOS,
      "generaciones.json"
    ),
    resumenGeneraciones
  );

  /*
   * Índice rápido:
   *
   * {
   *   "1": "Destructor",
   *   "33": "Placaje",
   *   "85": "Rayo"
   * }
   */

  const indiceMovimientos =
    Object.fromEntries(
      movimientosValidos.map(
        movimiento => [
          movimiento.id,
          movimiento.nombre
        ]
      )
    );

  await guardarJSON(
    path.join(
      DIRECTORIO_DATOS,
      "indice-movimientos.json"
    ),
    indiceMovimientos
  );

  /* =====================================================
     FINAL
  ===================================================== */

  console.log(
    "\n========================================"
  );

  console.log(
    "EXTRACCIÓN COMPLETADA"
  );

  console.log(
    "========================================"
  );

  console.log(
    `Pokémon guardados: ${todosPokemon.length}`
  );

  console.log(
    `Movimientos guardados: ${movimientosValidos.length}`
  );

  console.log(
    `Generaciones: ${resumenGeneraciones.length}`
  );

  console.log(
    `Directorio: ${DIRECTORIO_DATOS}`
  );

  console.log(
    "\nArchivos creados:"
  );

  console.log(
    "datos/pokemon.json"
  );

  console.log(
    "datos/movimientos.json"
  );

  console.log(
    "datos/indice-movimientos.json"
  );

  console.log(
    "datos/generaciones.json"
  );

  console.log(
    "datos/generaciones/generacion-X.json"
  );
}

main().catch(
  error => {
    console.error(
      "\nERROR FATAL:"
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);