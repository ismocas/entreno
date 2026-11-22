// Calendario, progresión de pesos y estadísticas.
import { EX, EQUIP, DAY_INDEX, weekInfo, daysForWeek, buildSession, buildExam } from './plan.js';

// ---------- Fechas (siempre en hora local, formato YYYY-MM-DD) ----------
export const DAY_MS = 86400000;
export function parseDate(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function today() { return fmtDate(new Date()); }
export function mondayOf(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
export function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
export function weeksBetween(a, b) { return Math.round((mondayOf(b) - mondayOf(a)) / (7 * DAY_MS)); }
export function dayDiff(a, b) { return Math.round((parseDate(b) - parseDate(a)) / DAY_MS); }

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const WDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
export function niceDate(s, withDay = true) {
  const d = parseDate(s);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return withDay ? `${WDAYS[d.getDay()][0].toUpperCase()}${WDAYS[d.getDay()].slice(1)}, ${base}` : base;
}

// ---------- Calendario del plan ----------
// Semana del plan para una fecha real, teniendo en cuenta el modo exámenes
export function planWeek(state, dateStr = today()) {
  if (state.exam.active) return state.exam.frozenWeek;
  return weeksBetween(parseDate(state.settings.startDate), parseDate(dateStr)) - state.frozenWeeks;
}

// Fecha real del lunes de una semana del plan (solo tiene sentido fuera del modo exámenes)
export function mondayOfPlanWeek(state, w) {
  return addDays(mondayOf(parseDate(state.settings.startDate)), (w + state.frozenWeeks) * 7);
}

export function sessionOpts(state) { return { useFemoral: !!state.settings.useFemoral }; }

// Sesiones programadas de una semana: [{key, code, date, week}]
export function weekSchedule(state, w) {
  const start = parseDate(state.settings.startDate);
  const monday = mondayOfPlanWeek(state, w);
  return daysForWeek(w, state.settings.days)
    .map((code) => ({ key: `${w}-${code}`, code, week: w, date: fmtDate(addDays(monday, DAY_INDEX[code])) }))
    .filter((s) => w !== 0 || parseDate(s.date) >= start);
}

export function sessionFor(state, item) {
  if (item.code.startsWith('E')) return buildExam(Number(item.code[1]), item.week, sessionOpts(state));
  return buildSession(item.week, item.code, sessionOpts(state));
}

export function isDone(state, key) { return state.sessions.some((s) => s.key === key); }

// Clave de semana real para el modo exámenes
export function examKey(n, dateStr = today()) { return `E${n}-${fmtDate(mondayOf(parseDate(dateStr)))}`; }

export function setExamMode(state, on) {
  const t = today();
  if (on && !state.exam.active) {
    state.exam = { active: true, since: t, frozenWeek: planWeek(state, t) };
  } else if (!on && state.exam.active) {
    const elapsed = weeksBetween(parseDate(state.exam.since), parseDate(t));
    const long = dayDiff(state.exam.since, t) > 21;
    state.frozenWeeks += elapsed + (long ? 1 : 0);
    state.exam = { active: false, since: null, frozenWeek: null };
    return long;
  }
  return false;
}

// ---------- Progresión de pesos ----------
export function incrementFor(state, key) {
  const ov = state.settings.increments?.[key];
  if (ov) return ov;
  return EQUIP[EX[key]?.equip]?.inc ?? 2.5;
}
const roundTo = (x, inc) => Math.round(Math.round(x / inc) * inc * 100) / 100;

// Historial de un ejercicio: [{date, sets, target, deload}]
export function history(state, key) {
  const out = [];
  for (const s of state.sessions) {
    for (const e of s.entries || []) {
      if (e.key === key && e.sets && e.sets.length) out.push({ date: s.date, sessionKey: s.key, ...e });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

// Sugerencia de peso para la siguiente sesión.
// target = prescripción de la sesión que se va a hacer ({repMin, repMax, rir, deload})
export function suggest(state, key, target, extraEntry) {
  const ex = EX[key];
  const inc = incrementFor(state, key);
  let hist = history(state, key);
  if (extraEntry) hist = [...hist, extraEntry];
  const normal = hist.filter((h) => !h.deload && h.sets.some((x) => x.kg > 0));
  const last = normal[normal.length - 1];
  if (!last) {
    const start = state.settings.startWeights?.[key] ?? ex?.start ?? null;
    return { kg: start, trend: 'new', reason: start ? 'Peso de arranque' : 'Elige un peso que te deje el RIR objetivo' };
  }
  const sets = last.sets.filter((x) => x.reps > 0);
  const w = Math.min(...sets.map((x) => x.kg));
  if (target?.deload) return { kg: w, trend: 'eq', reason: 'Descarga: mismo peso, más cómodo', last };

  const t = last.target;
  const tr = t.rir;
  const rirOf = (x) => (x.rir === null || x.rir === undefined ? tr : x.rir);
  const allTop = sets.length >= t.sets && sets.every((x) => x.reps >= t.repMax);
  let kg = w, trend = 'eq', reason = 'Intenta 1 repetición más';
  if (tr === null || tr === undefined) {
    if (allTop) { kg = w + inc; trend = 'up'; reason = 'Rango completado'; }
    else if (sets.some((x) => x.reps < t.repMin)) { kg = Math.max(inc, roundTo(w * 0.925, inc)); trend = 'down'; reason = 'No llegaste al mínimo'; }
  } else if (allTop && sets.every((x) => rirOf(x) >= tr + 3)) {
    kg = w + 2 * inc; trend = 'up2'; reason = 'Demasiado fácil';
  } else if (allTop && sets.every((x) => rirOf(x) >= tr)) {
    kg = w + inc; trend = 'up'; reason = 'Rango completado';
  } else if (sets.some((x) => x.reps < t.repMin) || sets.some((x) => rirOf(x) <= tr - 2)) {
    kg = Math.min(w - inc, roundTo(w * 0.925, inc)); kg = Math.max(inc, kg); trend = 'down';
    reason = sets.some((x) => x.reps < t.repMin) ? 'No llegaste al mínimo del rango' : 'Demasiado exigente';
  }
  // Cambio de rango entre fases: ±5 %
  if (target && target.repMax !== undefined && target.repMax !== t.repMax && trend !== 'down') {
    const f = target.repMax < t.repMax ? 1.05 : 0.95;
    kg = roundTo(kg * f, inc);
    reason += target.repMax < t.repMax ? ' · rango más bajo, +5 %' : ' · rango más alto, −5 %';
  }
  return { kg: Math.round(kg * 100) / 100, trend, reason, last };
}

// Flexiones: nivel 0 normal, 1 pies elevados
export function flexLevel(state, extraEntry) {
  let h = history(state, 'flexiones'); if (extraEntry) h = [...h, extraEntry];
  const last = h.filter((e) => !e.deload).pop();
  if (!last) return 0;
  const lv = last.level || 0;
  const top = last.sets.length >= last.target.sets && last.sets.every((x) => x.reps >= last.target.repMax);
  return Math.min(1, lv + (top ? 1 : 0));
}
export const FLEX_LEVELS = ['Flexiones', 'Flexiones con pies elevados en un banco'];

// Dominadas: N dominadas + (5 − N) negativas; desde 6, rango 6-8 sin negativas
export function pullTarget(state, extraEntry) {
  let h = history(state, 'dominadas'); if (extraEntry) h = [...h, extraEntry];
  const last = h.filter((e) => !e.deload).pop();
  if (!last) return 2;
  const n = last.target.pulls;
  const ok = last.sets.length >= last.target.sets && last.sets.every((x) => x.reps >= n);
  return Math.min(8, n + (ok ? 1 : 0));
}
export const negativesFor = (n) => Math.max(0, 5 - n);

// Máximo estimado (Epley con RIR)
export const e1rm = (kg, reps, rir) => kg * (1 + (reps + (rir ?? 0)) / 30);

export function exerciseStats(state, key) {
  const h = history(state, key).filter((e) => e.sets.some((x) => x.kg > 0));
  const points = h.map((e) => {
    const best = Math.max(...e.sets.map((x) => e1rm(x.kg, x.reps, x.rir)));
    return { date: e.date, e1rm: best, entry: e };
  });
  let bestSet = null;
  for (const e of h) for (const x of e.sets) {
    const v = e1rm(x.kg, x.reps, x.rir);
    if (!bestSet || v > bestSet.v) bestSet = { v, ...x, date: e.date };
  }
  return { points, bestSet };
}

// ---------- Tests ----------
export function testResults(state) {
  const out = [];
  for (const s of state.sessions) {
    if (!s.tests) continue;
    out.push({ date: s.date, ...s.tests });
  }
  return out;
}

export function dropPct(times) {
  const t = times.filter((x) => x > 0);
  if (t.length < 2) return null;
  return ((t[t.length - 1] - t[0]) / t[0]) * 100;
}

// ---------- Hoy ----------
export function todayPlan(state) {
  const t = today();
  const w = planWeek(state, t);
  const info = weekInfo(w);
  if (state.exam.active) {
    const items = [1, 2, 3].map((n) => ({ key: examKey(n, t), code: 'E' + n, week: w, date: t, optional: n === 3 }));
    return { mode: 'exam', week: w, info, items };
  }
  if (w < 0) {
    const first = weekSchedule(state, 0)[0] || weekSchedule(state, 1)[0];
    return { mode: 'before', week: w, info, next: first, startDate: state.settings.startDate };
  }
  const sched = weekSchedule(state, w);
  const todayItem = sched.find((s) => s.date === t);
  const pending = sched.filter((s) => s.date < t && !isDone(state, s.key));
  let next = sched.find((s) => s.date > t && !isDone(state, s.key));
  if (!next) next = weekSchedule(state, w + 1).find((s) => !isDone(state, s.key));
  return { mode: 'normal', week: w, info, sched, todayItem, pending, next };
}
