// Guardado local en el móvil (localStorage) y copias de seguridad.
const KEY = 'entreno.v1';

export function defaults() {
  return {
    version: 1,
    settings: {
      startDate: '2026-11-26',
      days: 4,
      wakeLock: true,
      vibrate: true,
      useFemoral: false,
      increments: {},
    },
    exam: { active: false, since: null, frozenWeek: null },
    frozenWeeks: 0,
    sessions: [],
    current: null,
    lastExport: null,
  };
}

function merge(base, data) {
  return { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) }, exam: { ...base.exam, ...(data.exam || {}) } };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return merge(defaults(), JSON.parse(raw));
  } catch (e) {
    console.error('No se pudieron leer los datos', e);
    return defaults();
  }
}

export function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.error('No se pudo guardar', e); }
}

export async function askPersist() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch (e) { /* sin soporte */ }
}

export function exportFile(state) {
  const data = JSON.stringify({ app: 'entreno', exportedAt: new Date().toISOString(), state }, null, 1);
  const name = `entreno-copia-${new Date().toISOString().slice(0, 10)}.json`;
  return new File([data], name, { type: 'application/json' });
}

export function parseImport(text) {
  const obj = JSON.parse(text);
  if (!obj || obj.app !== 'entreno' || !obj.state) throw new Error('El archivo no es una copia de esta app');
  return merge(defaults(), obj.state);
}
