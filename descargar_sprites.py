import os
import json
import urllib.request
import concurrent.futures

SPRITES_DIR = os.path.join(os.path.dirname(__file__), 'img', 'sprites')
POKEMON_JSON = os.path.join(os.path.dirname(__file__), 'datos', 'pokemon.json')
BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{}.png'

def download_one(pid):
    filepath = os.path.join(SPRITES_DIR, f'{pid}.png')
    if os.path.exists(filepath):
        return 'skip', pid, ''
    try:
        urllib.request.urlretrieve(BASE_URL.format(pid), filepath)
        return 'ok', pid, ''
    except Exception as e:
        return 'error', pid, str(e)

def download_sprites():
    os.makedirs(SPRITES_DIR, exist_ok=True)

    with open(POKEMON_JSON, 'r', encoding='utf-8') as f:
        pokemon = json.load(f)

    ids = [p['id'] for p in pokemon]
    total = len(ids)
    ok = 0
    skip = 0
    err = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(download_one, pid): pid for pid in ids}
        for i, future in enumerate(concurrent.futures.as_completed(futures)):
            status, pid, msg = future.result()
            if status == 'ok':
                ok += 1
            elif status == 'skip':
                skip += 1
            else:
                err += 1
            if (i + 1) % 100 == 0 or i + 1 == total:
                print(f'Progreso: {i+1}/{total} | Descargados: {ok} | Ya existían: {skip} | Errores: {err}')

    print(f'\n--- Completado ---')
    print(f'Descargados: {ok}')
    print(f'Ya existían: {skip}')
    print(f'Errores: {err}')
    print(f'Total: {total}')

if __name__ == '__main__':
    download_sprites()
