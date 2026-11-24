import { useSyncExternalStore } from 'react';

type Listener = () => void;

/**
 * Petit store global (sans dépendance) avec persistance optionnelle dans localStorage.
 * Les sélecteurs passés à `use` doivent renvoyer des références stables (champs du state),
 * jamais un nouvel objet/tableau calculé — dériver avec useMemo côté composant.
 */
export function createStore<T extends object>(init: () => T, persist?: { key: string; version: number }) {
  const listeners = new Set<Listener>();

  const load = (): T => {
    if (!persist) return init();
    try {
      const raw = localStorage.getItem(persist.key);
      if (raw) {
        const parsed = JSON.parse(raw) as { v: number; s: Partial<T> };
        if (parsed.v === persist.version) return { ...init(), ...parsed.s };
      }
    } catch {
      /* stockage indisponible : on repart des données de démo */
    }
    return init();
  };

  let state = load();

  const save = () => {
    if (!persist) return;
    try {
      localStorage.setItem(persist.key, JSON.stringify({ v: persist.version, s: state }));
    } catch {
      /* quota ou navigation privée : l'état reste en mémoire */
    }
  };

  const emit = () => listeners.forEach((l) => l());
  const subscribe = (l: Listener) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };

  return {
    get: () => state,
    set(updater: Partial<T> | ((s: T) => Partial<T>)) {
      const patch = typeof updater === 'function' ? updater(state) : updater;
      state = { ...state, ...patch };
      save();
      emit();
    },
    reset() {
      state = init();
      save();
      emit();
    },
    subscribe,
    use<S>(selector: (s: T) => S): S {
      return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
    },
  };
}
