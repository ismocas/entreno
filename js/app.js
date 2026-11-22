// Interfaz de la app: pestañas, entrenamiento en curso, resumen y ajustes.
import { EX, EQUIP, DAY_NAMES, weekInfo, intervalPhases, circuitPhases } from './plan.js';
import {
  today, parseDate, fmtDate, addDays, niceDate, planWeek, mondayOfPlanWeek, weekSchedule, sessionFor, isDone,
  setExamMode, incrementFor, suggest, history, flexLevel, FLEX_LEVELS, pullTarget, negativesFor, exerciseStats,
  testResults, dropPct, todayPlan, mondayOf,
} from './engine.js';
import { load, save, askPersist, exportFile, parseImport } from './storage.js';

let state = load();
const ui = { tab: 'hoy', view: null, sub: null, preview: null, showList: false, editSet: null, openWeek: null,
  progressKey: null, dialog: null, toast: null };
const mem = { restBuzzed: {}, gtIdx: null, gtBeep: {} };

// ---------- Utilidades ----------
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const kgf = (x) => (x === null || x === undefined ? '—' : String(Math.round(x * 100) / 100).replace('.', ','));
const secf = (x) => x.toFixed(2).replace('.', ',');
const clock = (sec) => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
const num = (v) => { const n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? 0 : n; };
const pct = (x) => (x === null || x === undefined ? '—' : `${x >= 0 ? '+' : ''}${x.toFixed(1).replace('.', ',')} %`);

const P = {
  home: '<path d="M5 12H3l9-9 9 9h-2"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/><path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M16 3v4M8 3v4M4 11h16"/>',
  chart: '<path d="M4 19h16"/><path d="M4 15l4-6 4 2 4-5 4 4"/>',
  sliders: '<path d="M4 6h8M16 6h4M4 12h2M10 12h10M4 18h11M19 18h1"/><circle cx="14" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  x: '<path d="M18 6L6 18M6 6l12 12"/>',
  right: '<path d="M9 6l6 6-6 6"/>', left: '<path d="M15 6l-6 6 6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', up: '<path d="M6 15l6-6 6 6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  download: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/>',
  upload: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12"/>',
  share: '<circle cx="6" cy="12" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8.7 10.7l6.6-3.4M8.7 13.3l6.6 3.4"/>',
  pencil: '<path d="M4 20h4L18.5 9.5a2.83 2.83 0 1 0-4-4L4 16v4M13.5 6.5l4 4"/>',
  bulb: '<path d="M9 16a5 5 0 1 1 6 0 3.5 3.5 0 0 0-1 3 2 2 0 0 1-4 0 3.5 3.5 0 0 0-1-3M9.7 17h4.6"/>',
  pin: '<circle cx="12" cy="11" r="3"/><path d="M17.66 16.66l-4.25 4.24a2 2 0 0 1-2.82 0l-4.25-4.24a8 8 0 1 1 11.32 0z"/>',
  pause: '<path d="M7 5h3v14H7zM14 5h3v14h-3z"/>',
  swap: '<path d="M7 10h14l-4-4M17 14H3l4 4"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  shield: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  book: '<path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM19 17H6"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;

const KIND = { L: 'piernas', X: 'tren superior', J: 'pista', V: 'pista aeróbica', S: 'cuerpo completo', T: 'tests' };

function buzz(pattern) {
  if (!state.settings.vibrate) return;
  try { navigator.vibrate?.(pattern); } catch (e) { /* sin soporte */ }
}

function commit() { save(state); render(); }

function toast(text, actionLabel, onAction) {
  ui.toast = { text, actionLabel, onAction, id: Date.now() };
  const id = ui.toast.id;
  render();
  setTimeout(() => { if (ui.toast?.id === id) { ui.toast = null; render(); } }, actionLabel ? 10000 : 2800);
}

function dialog(o) { ui.dialog = o; render(); }

// ---------- Nombres y descripciones ----------
function stepName(s) {
  if (s.type === 'bodyweight' && s.key === 'flexiones') return FLEX_LEVELS[s.level || 0];
  return s.name || EX[s.key]?.name || s.title || '';
}

function stepDesc(s) {
  const ex = EX[s.key] || {};
  switch (s.type) {
    case 'checklist': return `~${s.minutes} min · ${s.items.length} ejercicios`;
    case 'strength': return `${s.sets} × ${s.repMin}-${s.repMax}${ex.side ? ' ' + ex.side : ''}${s.rir !== null ? ' · RIR ' + (s.rirText || s.rir) : ''} · ${s.restText}`;
    case 'bodyweight': return `${s.sets} × ${s.repMin}-${s.repMax}${s.rir !== null && s.rir !== undefined ? ' · RIR ' + s.rir : ''} · ${s.restText}`;
    case 'dominadas': return `${s.sets} × ${pullsText(s)} · ${s.restText}`;
    case 'power': return `${s.sets} × ${s.reps}${s.unit ? ' × ' + s.unit : ''}${s.side ? ' por lado' : ''}`;
    case 'hold': return `${s.sets} × ${s.sec} s${s.side ? ' por lado' : ''}`;
    case 'sprint': return `${s.series > 1 ? s.series + ' series × ' : ''}${s.reps} × ${s.distance} al ${s.intensity} · recuperación ${s.recoveryText}`;
    case 'intervals': return s.desc;
    case 'circuit': return `${s.rounds} vueltas · ${s.work} s trabajo / ${s.rest} s descanso · ${s.stations.length} estaciones`;
  }
  return '';
}

function pullsText(s) {
  const n = s.pulls ?? 2, neg = s.neg ?? negativesFor(n);
  if (n >= 6) return `${n} dominadas (objetivo 6-8)`;
  return `(${n} dominadas + ${neg} negativas)`;
}

function lastText(key) {
  const h = history(state, key);
  const last = h[h.length - 1];
  if (!last) return null;
  const reps = last.sets.map((x) => x.reps).join(' · ');
  if (last.sets[0].kg !== undefined) {
    const w = Math.min(...last.sets.map((x) => x.kg));
    return `${reps} con ${kgf(w)} kg`;
  }
  return `${reps} reps`;
}

// Añade a cada paso la sugerencia de peso y los objetivos calculados
function prepSteps(steps) {
  return steps.map((s) => {
    const c = { ...s };
    if (s.type === 'strength') {
      c.sug = suggest(state, s.key, { repMin: s.repMin, repMax: s.repMax, rir: s.rir, deload: !!s.deload });
      c.lastText = lastText(s.key);
    } else if (s.type === 'bodyweight') {
      if (s.key === 'flexiones') c.level = flexLevel(state);
      c.lastText = lastText(s.key);
    } else if (s.type === 'dominadas') {
      c.pulls = pullTarget(state); c.neg = negativesFor(c.pulls); c.lastText = lastText('dominadas');
    }
    return c;
  });
}

// ---------- Sesión en curso ----------
const cur = () => state.current;
function logOf(i) {
  const c = cur();
  if (!c.logs[i]) {
    const s = c.steps[i];
    c.logs[i] = s.type === 'checklist' ? { checked: [] }
      : ['strength', 'bodyweight', 'dominadas'].includes(s.type) ? { sets: [] }
      : s.type === 'sprint' ? { times: [] }
      : s.type === 'circuit' ? { rpe: [] }
      : {};
  }
  return c.logs[i];
}

function totalOf(s) {
  if (s.type === 'hold') return s.sets * (s.side ? 2 : 1);
  if (s.type === 'power') return s.sets;
  if (s.type === 'sprint') return s.series * s.reps;
  return s.sets;
}

function stepDone(i) {
  const c = cur(), s = c.steps[i], lg = c.logs[i];
  if (!lg) return false;
  switch (s.type) {
    case 'checklist': return lg.checked.length >= s.items.length || lg.visited;
    case 'strength': case 'bodyweight': case 'dominadas': return lg.sets.length >= s.sets;
    case 'power': case 'hold': return (lg.done || 0) >= totalOf(s);
    case 'sprint': return lg.times.length >= totalOf(s);
    default: return !!lg.done;
  }
}

function startSession(item) {
  if (state.current) { toast('Ya tienes una sesión en curso'); return; }
  const def = sessionFor(state, item);
  state.current = {
    key: item.key, code: def.code, week: item.week, date: item.date, title: def.title, subtitle: def.subtitle,
    exam: !!def.exam, deload: !!def.deload, startedAt: Date.now(), step: 0, logs: {},
    steps: prepSteps(def.steps), rest: null, sw: null, hold: null, gt: null, note: '',
  };
  ui.view = 'session'; ui.editSet = null; ui.showList = false; ui.preview = null;
  pushNav(); askPersist(); commit(); window.scrollTo(0, 0);
}

function startRest(sec, label = 'Descanso') {
  if (!sec) return;
  cur().rest = { endsAt: Date.now() + sec * 1000, total: sec, label };
}

function goStep(i) {
  const c = cur();
  if (i < 0 || i >= c.steps.length) return;
  const prev = c.steps[c.step];
  if (prev?.type === 'checklist') logOf(c.step).visited = true;
  c.step = i; c.sw = null; c.hold = null; ui.editSet = null; ui.showList = false;
  commit(); window.scrollTo(0, 0);
}

function draftFor(i) {
  const c = cur(), s = c.steps[i], lg = logOf(i);
  if (lg.draft) return lg.draft;
  const prev = lg.sets[lg.sets.length - 1];
  if (s.type === 'strength') return { reps: prev?.reps ?? s.repMin, kg: prev?.kg ?? (s.sug?.kg ?? 0), rir: prev?.rir ?? (s.rir ?? null) };
  if (s.type === 'bodyweight') return { reps: prev?.reps ?? s.repMin, rir: prev?.rir ?? (s.rir ?? null) };
  return { reps: prev?.reps ?? s.pulls, neg: prev?.neg ?? s.neg };
}

function stepper(field, value, label, i) {
  return `<div><div class="lbl">${label}</div><div class="stp">
    <button data-a="stp" data-i="${i}" data-f="${field}" data-d="-1" aria-label="Menos">${ic('minus')}</button>
    <input data-input="draft" data-i="${i}" data-f="${field}" inputmode="decimal" value="${value === null ? '' : kgf(value)}" aria-label="${label}">
    <button data-a="stp" data-i="${i}" data-f="${field}" data-d="1" aria-label="Más">${ic('plus')}</button></div></div>`;
}

function restCard() {
  const r = cur().rest;
  if (!r) return '';
  const rem = (r.endsAt - Date.now()) / 1000;
  return `<div class="card row" style="padding:12px 14px">
    <div><div class="muted" data-rest-label>${rem > 0 ? esc(r.label) : 'Descanso terminado'}</div>
    <div class="h2 tabnum" style="font-size:24px" data-rest>${clock(rem)}</div></div>
    <div class="btns" style="width:auto">
      <button class="chip" data-a="restAdd" data-d="-15">−15 s</button>
      <button class="chip" data-a="restAdd" data-d="15">+15 s</button>
      <button class="chip" data-a="restSkip" aria-label="Quitar descanso">${ic('x')}</button>
    </div></div>`;
}

function noteCard(s) {
  const bits = [];
  if (s.place) bits.push(`<div class="muted" style="display:flex;gap:8px">${ic('pin')}<span>${esc(s.place)}</span></div>`);
  if (s.note) bits.push(`<div class="muted" style="display:flex;gap:8px;color:var(--text2)">${ic('bulb')}<span>${esc(s.note)}</span></div>`);
  return bits.length ? `<div class="card" style="display:flex;flex-direction:column;gap:8px;padding:12px 14px">${bits.join('')}</div>` : '';
}

function trendChip(sug) {
  if (!sug || sug.trend === 'new') return '';
  const map = { up: ['up', '↑ sube'], up2: ['up', '↑↑ sube doble'], down: ['down', '↓ baja'], eq: ['', '= mantener'], new: ['', 'Arranque'] };
  const [cls, txt] = map[sug.trend] || ['', ''];
  return `<span class="trend ${cls}">${txt}</span>`;
}

// Cada tipo de paso devuelve { head, body, primary }
const R = {};

R.checklist = (s, i, lg) => ({
  body: `<div class="list">${s.items.map((it, k) => {
    const on = lg.checked.includes(k);
    return `<button class="li" data-a="ck" data-i="${i}" data-k="${k}">
      <div class="grow"><div style="${on ? 'color:var(--muted)' : ''}">${esc(it.name)}</div>
      <div class="muted small">${esc(it.qty)}${it.note ? ' · ' + esc(it.note) : ''}</div></div>
      <span class="check ${on ? 'on' : ''}">${on ? ic('check') : ''}</span></button>`;
  }).join('')}</div>`,
});

function setsBlock(s, i, lg, kind) {
  const total = Math.max(s.sets, lg.sets.length);
  const active = ui.editSet ?? (lg.sets.length < s.sets ? lg.sets.length : null);
  const d = draftFor(i);
  const hasRir = kind !== 'dominadas' && s.rir !== null && s.rir !== undefined;
  const ex = EX[s.key] || {};
  const rows = [];
  for (let k = 0; k < total; k++) {
    const x = lg.sets[k];
    if (k === active) {
      let st = '';
      if (kind === 'strength') {
        st = stepper('reps', d.reps, 'Reps', i) + stepper('kg', d.kg, ex.equip === 'mancuernas' ? 'Kg/mano' : 'Kg', i) + (hasRir ? stepper('rir', d.rir, 'RIR', i) : '');
      } else if (kind === 'bodyweight') {
        st = stepper('reps', d.reps, 'Reps', i) + (hasRir ? stepper('rir', d.rir, 'RIR', i) : '');
      } else {
        st = stepper('reps', d.reps, 'Dominadas', i) + stepper('neg', d.neg, 'Negativas', i);
      }
      const n = kind === 'strength' ? (hasRir ? 3 : 2) : kind === 'bodyweight' ? (hasRir ? 2 : 1) : 2;
      rows.push(`<div class="active"><div class="row" style="margin-bottom:10px"><span class="acc small">Serie ${k + 1}${ui.editSet !== null ? ' · editando' : ''}</span>
        ${ui.editSet !== null ? `<button class="link" data-a="delSet" data-i="${i}" data-k="${k}" style="color:var(--danger);padding:0">Borrar</button>` : ''}</div>
        <div class="stps" style="--n:${n}">${st}</div></div>`);
    } else if (x) {
      const c2 = kind === 'strength' ? `${kgf(x.kg)} kg` : kind === 'dominadas' ? `${x.neg} neg.` : '';
      const c3 = kind === 'dominadas' ? '' : (x.rir !== null && x.rir !== undefined ? `RIR ${x.rir}` : '');
      rows.push(`<button class="setrow done" data-a="editSet" data-i="${i}" data-k="${k}"><span class="muted">${k + 1}</span><span>${x.reps} reps</span><span>${c2}</span><span>${c3}</span><span class="acc">${ic('check')}</span></button>`);
    } else {
      const c1 = kind === 'dominadas' ? `${s.pulls} dom.` : `${s.repMin}-${s.repMax}`;
      const c2 = kind === 'strength' ? `${kgf(s.sug?.kg)} kg` : kind === 'dominadas' ? `${s.neg} neg.` : '';
      const c3 = hasRir ? `RIR ${s.rirText || s.rir}` : '';
      rows.push(`<div class="setrow todo"><span>${k + 1}</span><span>${c1}</span><span>${c2}</span><span>${c3}</span><span></span></div>`);
    }
  }
  return { html: `<div style="display:flex;flex-direction:column;gap:6px">${rows.join('')}</div>`, active };
}

function setsPrimary(s, i, lg, active) {
  if (active === null) return null;
  return `<button class="btn" data-a="logSet" data-i="${i}">${ui.editSet !== null ? 'Guardar cambios' : `Apuntar serie ${active + 1}`}</button>`;
}

R.strength = (s, i, lg) => {
  const ex = EX[s.key];
  const { html, active } = setsBlock(s, i, lg, 'strength');
  const chips = [`${s.sets} × ${s.repMin}-${s.repMax}${ex.side ? ' ' + ex.side : ''}`];
  if (s.rir !== null) chips.push(`RIR ${s.rirText || s.rir}`);
  chips.push(`Descanso ${s.restText}`);
  if (s.deload) chips.push('Descarga');
  const kg = s.sug?.kg;
  return {
    chips,
    body: `<div class="card"><div class="row" style="align-items:flex-start">
        <div><div class="muted">Peso sugerido</div>
          <div class="big" style="margin-top:2px">${kg ? kgf(kg) + ' <small>kg' + (ex.equip === 'mancuernas' ? ' por mano' : '') + '</small>' : '<span style="font-size:22px">Elige peso</span>'}</div></div>
        <div style="text-align:right"><div class="muted">Última vez</div><div class="small" style="margin-top:4px;color:var(--text2)">${esc(s.lastText || 'Primera sesión')}</div></div>
      </div>
      <div class="row" style="margin-top:10px"><span class="muted small">${esc(s.sug?.reason || '')}</span>${trendChip(s.sug)}</div></div>
      ${html}${restCard()}${noteCard(s)}
      ${s.swap ? `<button class="link" data-a="swap" data-i="${i}">${ic('swap')} Cambiar por ${esc(EX[s.swap].name.toLowerCase())}</button>` : ''}`,
    primary: setsPrimary(s, i, lg, active),
  };
};

R.bodyweight = (s, i, lg) => {
  const { html, active } = setsBlock(s, i, lg, 'bodyweight');
  const chips = [`${s.sets} × ${s.repMin}-${s.repMax}`];
  if (s.rir !== null && s.rir !== undefined) chips.push(`RIR ${s.rir}`);
  chips.push(`Descanso ${s.restText}`);
  let info = '';
  if (s.key === 'flexiones') info = s.level ? 'Nivel 2: pies elevados. Cuando hagas 3 × 15, añade una pausa abajo de 1 segundo.' : 'Cuando hagas 3 × 15, la app te sube a pies elevados.';
  return {
    chips,
    body: `<div class="card row"><div><div class="muted">Última vez</div><div style="margin-top:3px">${esc(s.lastText || 'Primera sesión')}</div></div></div>
      ${info ? `<div class="muted small">${info}</div>` : ''}${html}${restCard()}${noteCard(s)}
      ${s.swap ? `<button class="link" data-a="swap" data-i="${i}">${ic('swap')} Cambiar por ${esc(EX[s.swap].name.toLowerCase())}</button>` : ''}`,
    primary: setsPrimary(s, i, lg, active),
  };
};

R.dominadas = (s, i, lg) => {
  const { html, active } = setsBlock(s, i, lg, 'dominadas');
  return {
    chips: [`${s.sets} series`, `Descanso ${s.restText}`],
    body: `<div class="card"><div class="muted">Objetivo por serie</div><div class="h2" style="margin-top:4px">${pullsText(s)}</div>
      <div class="muted small" style="margin-top:8px">Si completas las ${s.pulls} dominadas en todas las series, la próxima vez sube a ${Math.min(8, s.pulls + 1)}.</div></div>
      ${html}${restCard()}${noteCard(s)}`,
    primary: setsPrimary(s, i, lg, active),
  };
};

R.power = (s, i, lg) => {
  const done = lg.done || 0;
  const rows = Array.from({ length: s.sets }, (_, k) =>
    `<div class="setrow ${k < done ? 'done' : 'todo'}" style="grid-template-columns:34px 1fr 22px"><span class="${k < done ? 'muted' : ''}">${k + 1}</span>
     <span>${s.reps}${s.unit ? ' × ' + s.unit : ' reps'}${s.side ? ' por lado' : ''}</span><span class="acc">${k < done ? ic('check') : ''}</span></div>`).join('');
  return {
    chips: [`${s.sets} × ${s.reps}${s.unit ? ' × ' + s.unit : ''}${s.side ? ' por lado' : ''}`, `Descanso ${s.rest} s`],
    body: `<div style="display:flex;flex-direction:column;gap:6px">${rows}</div>
      ${done ? `<button class="link" data-a="pwUndo" data-i="${i}">${ic('undo')} Deshacer última</button>` : ''}${restCard()}${noteCard(s)}`,
    primary: done < s.sets ? `<button class="btn" data-a="pwDone" data-i="${i}">Serie ${done + 1} hecha</button>` : null,
  };
};

const sideLabel = (s, k) => (s.side ? (k % 2 === 0 ? ' · lado izquierdo' : ' · lado derecho') : '');

R.hold = (s, i, lg) => {
  const done = lg.done || 0, total = totalOf(s);
  const c = cur();
  const running = c.hold && c.hold.step === i;
  const rem = running ? Math.max(0, Math.ceil((c.hold.endsAt - Date.now()) / 1000)) : s.sec;
  const per = s.side ? 2 : 1;
  const rows = Array.from({ length: total }, (_, k) =>
    `<div class="setrow ${k < done ? 'done' : 'todo'}" style="grid-template-columns:1fr 22px;${k === done ? 'border:1px solid var(--acc);color:var(--text)' : ''}">
     <span>Serie ${Math.floor(k / per) + 1}${sideLabel(s, k)}</span><span class="acc">${k < done ? ic('check') : ''}</span></div>`).join('');
  return {
    chips: [`${s.sets} × ${s.sec} s${s.side ? ' por lado' : ''}`, `Descanso ${s.rest} s`],
    body: `${done < total ? `<div class="card" style="text-align:center;padding:22px 14px">
        <div class="muted">Serie ${Math.floor(done / per) + 1}${sideLabel(s, done)}</div>
        <div class="clock" style="margin-top:6px"><span data-hold>${rem}</span><span style="font-size:20px;color:var(--muted)"> s</span></div></div>` : ''}
      <div style="display:flex;flex-direction:column;gap:6px">${rows}</div>
      ${done < total && !running ? `<button class="link" data-a="holdMark" data-i="${i}">${ic('check')} Marcar hecha sin cronómetro</button>` : ''}
      ${done ? `<button class="link" data-a="holdUndo" data-i="${i}">${ic('undo')} Deshacer última</button>` : ''}
      ${restCard()}${noteCard(s)}`,
    primary: done >= total ? null : running
      ? `<button class="ghost" data-a="holdCancel">Cancelar</button>`
      : `<button class="btn" data-a="holdStart" data-i="${i}">${ic('play')} Empezar ${s.sec} s</button>`,
  };
};

R.sprint = (s, i, lg) => {
  const c = cur();
  const total = totalOf(s), idx = lg.times.length;
  const running = c.sw && c.sw.step === i;
  const serie = Math.min(s.series - 1, Math.floor(idx / s.reps));
  const series = Array.from({ length: s.series }, (_, b) => {
    const ts = lg.times.slice(b * s.reps, (b + 1) * s.reps);
    const cells = Array.from({ length: s.reps }, (_, r) => {
      const k = b * s.reps + r, t = lg.times[k];
      if (t !== undefined) return `<div>${t > 0 ? secf(t) : '—'}</div>`;
      return `<div class="${k === idx ? 'cur' : 'pend'}">${k === idx ? '•' : '—'}</div>`;
    }).join('');
    const drop = dropPct(ts);
    return `<div><div class="row" style="margin-bottom:6px"><span class="muted">${s.series > 1 ? 'Serie ' + (b + 1) : 'Repeticiones'}</span>
      <span class="muted">${drop !== null && (s.seriesRest || s.test === 'rsa') ? 'Caída: ' + pct(drop) : ''}</span></div>
      <div class="times" style="--n:${Math.min(s.reps, 6)}">${cells}</div></div>`;
  }).join('');
  const rpeHtml = s.rpe ? rpeRow(i, lg.rpe, null, 'RPE del bloque') : '';
  return {
    chips: [s.series > 1 ? `${s.series} series × ${s.reps}` : `${s.reps} repeticiones`, s.distance, s.intensity, `Recup. ${s.recoveryText}`]
      .concat(s.seriesRest ? [`${Math.round(s.seriesRest / 60)} min entre series`] : []),
    body: `${noteCard(s)}
      ${idx < total ? `<div class="card" style="text-align:center;padding:20px 14px">
        <div class="muted">${s.test ? 'Intento' : 'Sprint'} ${(idx % s.reps) + 1} de ${s.reps}${s.series > 1 ? ' · serie ' + (serie + 1) : ''}</div>
        <div class="clock" style="margin:6px 0"><span data-sw>${running ? secf((Date.now() - c.sw.startedAt) / 1000) : '0,00'}</span><span style="font-size:20px;color:var(--muted)"> s</span></div>
        ${running ? '' : `<button class="link" data-a="swSkip" data-i="${i}">Sin tiempo</button>`}</div>` : ''}
      ${series}
      ${idx && !running ? `<button class="link" data-a="swUndo" data-i="${i}">${ic('undo')} Deshacer último</button>` : ''}
      ${restCard()}
      ${idx >= total ? rpeHtml : ''}`,
    primary: idx >= total ? null : running
      ? `<button class="btn" data-a="swStop" data-i="${i}" style="min-height:64px;font-size:19px">Parar</button>`
      : `<button class="btn" data-a="swStart" data-i="${i}" style="min-height:64px;font-size:19px">${ic('play')} Salir</button>`,
  };
};

function rpeRow(i, value, round, label) {
  return `<div><div class="muted" style="margin-bottom:6px">${label}</div><div class="rpe">${Array.from({ length: 10 }, (_, k) =>
    `<button class="${value === k + 1 ? 'on' : ''}" data-a="rpe" data-i="${i}" data-v="${k + 1}" ${round !== null ? `data-r="${round}"` : ''}>${k + 1}</button>`).join('')}</div></div>`;
}

function guidedState(i) {
  const c = cur(), s = c.steps[i];
  const phases = s.type === 'circuit' ? circuitPhases(s) : intervalPhases(s);
  const g = c.gt && c.gt.step === i ? c.gt : null;
  if (!g) return { phases, g: null };
  const now = g.pausedAt ?? Date.now();
  const el = (now - g.startedAt - g.paused) / 1000;
  let acc = 0, idx = phases.length, inPhase = 0;
  for (let k = 0; k < phases.length; k++) { if (el < acc + phases[k].sec) { idx = k; inPhase = el - acc; break; } acc += phases[k].sec; }
  const total = phases.reduce((a, p) => a + p.sec, 0);
  return { phases, g, idx, rem: idx < phases.length ? phases[idx].sec - inPhase : 0, el, total };
}

function guidedCard(i) {
  const st = guidedState(i);
  const lg = logOf(i);
  if (lg.done) return `<div class="card row"><span>Completado</span><span class="acc">${ic('check')}</span></div>`;
  if (!st.g) {
    const total = st.phases.reduce((a, p) => a + p.sec, 0);
    return `<div class="card" style="text-align:center;padding:20px 14px"><div class="muted">Duración total</div>
      <div class="clock" style="font-size:44px;margin-top:4px">${clock(total)}</div>
      <div class="muted small" style="margin-top:6px">Vibra al empezar cada parte. En los descansos, 3 avisos cortos antes de volver.</div></div>
      <button class="link" data-a="gtMark" data-i="${i}">${ic('check')} Marcar como hecho sin temporizador</button>`;
  }
  const p = st.phases[st.idx] || {};
  const nx = st.phases[st.idx + 1];
  const work = p.kind === 'work';
  return `<div class="card ${work ? 'acc-border' : ''}" style="text-align:center;padding:20px 14px">
    <div class="${work ? 'acc' : 'muted'}" style="font-size:15px;font-weight:600" data-gt-label>${esc(p.label || '')}</div>
    <div class="muted small" data-gt-tag>${esc(p.tag || '')}</div>
    <div class="clock" style="margin:8px 0" data-gt-time>${clock(st.rem)}</div>
    <div class="muted small" data-gt-next>${nx ? 'Después: ' + esc(nx.label) + ' · ' + clock(nx.sec) : 'Última parte'}</div>
    <div class="bar" style="margin-top:14px"><div data-gt-bar style="width:${Math.min(100, (st.el / st.total) * 100)}%"></div></div>
    ${st.g.pausedAt ? '<div class="muted small" style="margin-top:8px">En pausa</div>' : ''}</div>
    <button class="link" data-a="gtStop" data-i="${i}" style="color:var(--muted)">${ic('x')} Terminar ahora</button>`;
}

function guidedPrimary(i) {
  const lg = logOf(i), st = guidedState(i);
  if (lg.done) return null;
  if (!st.g) return `<button class="btn" data-a="gtStart" data-i="${i}">${ic('play')} Empezar</button>`;
  return st.g.pausedAt
    ? `<button class="btn" data-a="gtResume" data-i="${i}">${ic('play')} Reanudar</button>`
    : `<button class="ghost acc" data-a="gtPause" data-i="${i}">${ic('pause')} Pausa</button>`;
}

R.intervals = (s, i, lg) => ({
  chips: [s.desc].concat(s.rpeTarget ? [`RPE objetivo ${s.rpeTarget}`] : []),
  body: `${guidedCard(i)}${noteCard(s)}${lg.done ? rpeRow(i, lg.rpe, null, '¿Qué RPE ha sido?') : ''}`,
  primary: guidedPrimary(i),
});

R.circuit = (s, i, lg) => {
  const st = guidedState(i);
  const roundsDone = lg.done ? s.rounds : st.g ? st.phases.slice(0, st.idx).filter((p, k, arr) => p.kind === 'rest' && p.label === 'Descanso entre vueltas').length : 0;
  const rpes = Array.from({ length: s.rounds }, (_, r) => r < roundsDone ? rpeRow(i, lg.rpe[r], r, `RPE de la vuelta ${r + 1}`) : '').join('');
  return {
    chips: [`${s.rounds} vueltas`, `${s.work} s / ${s.rest} s`, `${s.roundRest} s entre vueltas`, `RPE ${s.rpeTarget}`],
    body: `${guidedCard(i)}
      <div class="list">${s.stations.map((x, k) => `<div class="li"><div class="grow"><div>${k + 1}. ${esc(x.name)}</div><div class="muted small">${esc(x.note)}</div></div></div>`).join('')}</div>
      ${rpes}`,
    primary: guidedPrimary(i),
  };
};

function sectionLabel(i) {
  const c = cur(), n = c.steps.length;
  const s = c.steps[i];
  if (s.type === 'checklist') return i === 0 ? 'Calentamiento' : 'Vuelta a la calma';
  return `Parte principal · ${i} de ${n - 2}`;
}

function sessionView() {
  const c = cur(), i = c.step, s = c.steps[i], lg = logOf(i);
  const r = R[s.type](s, i, lg);
  const last = i === c.steps.length - 1;
  const nextBtn = `<button class="btn" data-a="${last ? 'finish' : 'next'}">${last ? 'Terminar sesión' : 'Siguiente'}</button>`;
  const primary = r.primary || nextBtn;
  const title = s.type === 'checklist' ? `${s.title} <span class="muted" style="font-size:15px;font-weight:400">· ~${s.minutes} min</span>` : esc(stepName(s));
  return `<div class="screen session">
    <div class="top"><button data-a="exit" aria-label="Salir">${ic('x')}</button><span>${sectionLabel(i)}</span><button data-a="list" aria-label="Ver todos los ejercicios">${ic('list')}</button></div>
    <div class="prog">${c.steps.map((_, k) => `<div class="${k === i ? 'c' : stepDone(k) ? 'd' : ''}"></div>`).join('')}</div>
    <div><div class="h2" style="font-size:24px">${title}</div>
      ${r.chips ? `<div class="chips" style="margin-top:10px">${r.chips.map((x) => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : ''}</div>
    ${r.body}
  </div>
  <div class="footer"><div class="in">${primary}
    <div class="stepnav"><button data-a="prev" ${i === 0 ? 'style="visibility:hidden"' : ''}>${ic('left')} Anterior</button>
    <span>${i + 1} / ${c.steps.length}</span>
    ${r.primary ? `<button data-a="${last ? 'finish' : 'next'}">${last ? 'Terminar' : 'Saltar'} ${ic('right')}</button>` : '<span style="width:70px"></span>'}</div>
  </div></div>
  ${ui.showList ? listSheet() : ''}`;
}

function listSheet() {
  const c = cur();
  return `<div class="overlay" data-a="closeList"><div class="sheet" data-stop>
    <div class="row"><div class="h2">${esc(c.title)}</div><button data-a="closeList" aria-label="Cerrar">${ic('x')}</button></div>
    <div class="list">${c.steps.map((s, k) => `<button class="li" data-a="goto" data-k="${k}">
      <div class="grow"><div style="${k === c.step ? 'color:var(--acc)' : ''}">${esc(s.type === 'checklist' ? s.title : stepName(s))}</div>
      <div class="muted small">${esc(stepDesc(s))}</div></div>
      ${stepDone(k) ? `<span class="acc">${ic('check')}</span>` : ic('right')}</button>`).join('')}</div>
    <button class="ghost danger" data-a="discard">Descartar sesión</button>
  </div></div>`;
}

// ---------- Resumen ----------
function buildRecord() {
  const c = cur();
  const entries = []; let tests = null;
  c.steps.forEach((s, i) => {
    const lg = c.logs[i] || {};
    if ((s.type === 'strength' || s.type === 'bodyweight') && lg.sets?.length) {
      entries.push({ key: s.key, sets: lg.sets, target: { sets: s.sets, repMin: s.repMin, repMax: s.repMax, rir: s.rir ?? null }, deload: !!s.deload, level: s.level });
    } else if (s.type === 'dominadas' && lg.sets?.length) {
      entries.push({ key: 'dominadas', sets: lg.sets, target: { sets: s.sets, pulls: s.pulls }, deload: !!s.deload });
    } else if (s.type === 'sprint' && lg.times?.length) {
      entries.push({ type: 'sprint', name: s.name, times: lg.times, rpe: lg.rpe ?? null, test: s.test || null, repeated: !!(s.seriesRest || s.test === 'rsa') });
      if (s.test) {
        tests = tests || {};
        const ts = lg.times.filter((x) => x > 0);
        if (s.test === 'rsa') { tests.rsa = lg.times; tests.rsaDrop = dropPct(lg.times); }
        else if (ts.length) tests[s.test] = Math.min(...ts);
      }
    } else if (s.type === 'intervals' && (lg.done || lg.rpe)) {
      entries.push({ type: 'intervals', name: s.name, rpe: lg.rpe ?? null });
    } else if (s.type === 'circuit' && (lg.done || lg.rpe?.length)) {
      entries.push({ type: 'circuit', rpe: lg.rpe || [] });
    } else if ((s.type === 'hold' || s.type === 'power') && lg.done) {
      entries.push({ type: s.type, name: s.name, done: lg.done });
    }
  });
  return { key: c.key, code: c.code, week: c.week, date: today(), title: c.title, startedAt: c.startedAt, finishedAt: Date.now(),
    entries, tests, note: c.note || '', exam: !!c.exam, deload: !!c.deload };
}

function summaryView() {
  const c = cur(), rec = buildRecord();
  const mins = Math.round((Date.now() - c.startedAt) / 60000);
  let sets = 0, kg = 0;
  rec.entries.forEach((e) => {
    if (e.sets) { sets += e.sets.length; e.sets.forEach((x) => { if (x.kg) kg += x.kg * x.reps; }); }
    if (e.done) sets += e.done;
    if (e.times) sets += e.times.length;
  });
  const hasStrength = rec.entries.some((e) => e.sets);
  const rows = rec.entries.map((e) => {
    if (e.key && EX[e.key] && !EX[e.key].bodyweight) {
      const sg = suggest(state, e.key, { ...e.target, deload: false }, { date: rec.date, ...e });
      const w = Math.min(...e.sets.map((x) => x.kg));
      const reps = e.sets.map((x) => x.reps).join(' · ');
      return `<div class="li"><div class="grow"><div>${esc(EX[e.key].name)}</div><div class="muted small">${reps} con ${kgf(w)} kg${sg.reason ? ' · ' + esc(sg.reason) : ''}</div></div>
        <span class="trend ${sg.trend.startsWith('up') ? 'up' : sg.trend === 'down' ? 'down' : ''}">${sg.trend === 'up' ? '↑' : sg.trend === 'up2' ? '↑↑' : sg.trend === 'down' ? '↓' : '='} ${kgf(sg.kg)} kg</span></div>`;
    }
    if (e.key === 'flexiones') {
      const lv = flexLevel(state, { date: rec.date, ...e });
      return `<div class="li"><div class="grow"><div>${esc(FLEX_LEVELS[e.level || 0])}</div><div class="muted small">${e.sets.map((x) => x.reps).join(' · ')} reps</div></div>
        <span class="trend ${lv > (e.level || 0) ? 'up' : ''}">${lv > (e.level || 0) ? '↑ pies elevados' : '= mismo nivel'}</span></div>`;
    }
    if (e.key === 'dominadas') {
      const n = pullTarget(state, { date: rec.date, ...e });
      return `<div class="li"><div class="grow"><div>Dominadas + negativas</div><div class="muted small">${e.sets.map((x) => x.reps).join(' · ')} dominadas</div></div>
        <span class="trend ${n > e.target.pulls ? 'up' : ''}">${n > e.target.pulls ? '↑' : '='} ${n} dom.</span></div>`;
    }
    if (e.key === 'nordico') {
      return `<div class="li"><div class="grow"><div>Curl nórdico</div><div class="muted small">${e.sets.map((x) => x.reps).join(' · ')} reps</div></div></div>`;
    }
    if (e.type === 'sprint') {
      const ts = e.times.filter((x) => x > 0);
      const best = ts.length ? Math.min(...ts) : null;
      const drop = dropPct(e.times);
      return `<div class="li"><div class="grow"><div>${esc(e.name)}</div><div class="muted small">${ts.length ? 'Mejor ' + secf(best) + ' s' : 'Sin tiempos'}${drop !== null && e.repeated ? ' · caída ' + pct(drop) : ''}</div></div>
        ${e.rpe ? `<span class="trend">RPE ${e.rpe}</span>` : ''}</div>`;
    }
    if (e.type === 'intervals') return `<div class="li"><div class="grow">${esc(e.name)}</div>${e.rpe ? `<span class="trend">RPE ${e.rpe}</span>` : ''}</div>`;
    if (e.type === 'circuit') return `<div class="li"><div class="grow">Circuito</div>${e.rpe.length ? `<span class="trend">RPE ${e.rpe.filter(Boolean).join(' · ')}</span>` : ''}</div>`;
    return '';
  }).join('');
  return `<div class="screen">
    <div style="text-align:center;padding-top:10px">
      <div style="width:52px;height:52px;border-radius:50%;background:var(--acc-bg);margin:0 auto;display:flex;align-items:center;justify-content:center" class="acc">${ic('check')}</div>
      <div class="h2" style="margin-top:12px;font-size:22px">Sesión completada</div>
      <div class="muted" style="margin-top:2px">${niceDate(rec.date)} · ${esc(c.title)}</div></div>
    <div class="stats3">
      <div class="card" style="padding:12px 4px"><div class="h2">${mins >= 60 ? Math.floor(mins / 60) + ' h ' + String(mins % 60).padStart(2, '0') : mins + ' min'}</div><div class="muted small">Duración</div></div>
      <div class="card" style="padding:12px 4px"><div class="h2">${sets}</div><div class="muted small">Series</div></div>
      <div class="card" style="padding:12px 4px"><div class="h2">${Math.round(kg).toLocaleString('es-ES')}</div><div class="muted small">Kg totales</div></div></div>
    ${rec.tests ? `<div class="card"><div class="muted">Tests guardados</div><div style="margin-top:4px">${testLine(rec.tests)}</div></div>` : ''}
    ${rows ? `<div class="sec">${hasStrength ? 'Resultados y próxima sesión' : 'Resultados'}</div><div class="list">${rows}</div>` : ''}
    <div class="sec">Notas</div>
    <textarea data-input="note" placeholder="Molestias, sensaciones, lo que quieras recordar">${esc(c.note || '')}</textarea>
    <button class="btn" data-a="saveSession">Guardar y salir</button>
    <button class="ghost" data-a="backToSession">Volver a la sesión</button>
  </div>`;
}

function testLine(t) {
  const out = [];
  if (t.sprint30) out.push(`Sprint 30 m: ${secf(t.sprint30)} s`);
  if (t.agility) out.push(`5-10-5: ${secf(t.agility)} s`);
  if (t.rsaDrop !== undefined && t.rsaDrop !== null) out.push(`Caída 6 × 30 m: ${pct(t.rsaDrop)}`);
  return out.join(' · ') || '—';
}

// ---------- Pestaña Hoy ----------
function phaseLine(info) {
  if (info.phase === 'antes') return 'El plan aún no ha empezado';
  const cyc = info.cycle > 1 ? `Ciclo ${info.cycle} · ` : '';
  if (info.cw === 0) return cyc + 'Semana 0 · arranque';
  return `${cyc}${info.label} · semana ${info.cw} de 12`;
}

function sessionCard(item, label, def) {
  const steps = def.steps.filter((s) => s.type !== 'checklist').length;
  return `<div class="card pad">
    <div class="tag">${esc(label)}</div>
    <div class="h2" style="margin:6px 0 10px">${esc(def.title)}</div>
    <div class="chips"><span class="chip">${def.minutes} min</span><span class="chip">${steps} ejercicios o bloques</span>${def.deload ? '<span class="chip acc">Descarga</span>' : ''}</div>
    <div class="btns" style="margin-top:14px">
      <button class="btn" data-a="start" data-key="${item.key}" data-code="${item.code}" data-week="${item.week}" data-date="${item.date}">${ic('play')} Empezar</button>
      <button class="ghost" style="width:auto;padding:0 16px" data-a="preview" data-key="${item.key}" data-code="${item.code}" data-week="${item.week}" data-date="${item.date}">Ver</button>
    </div></div>`;
}

function weekDots(state, w) {
  const sched = weekSchedule(state, w);
  const monday = mondayOfPlanWeek(state, w);
  const t = today();
  const L = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  return `<div class="week">${L.map((d, k) => {
    const date = fmtDate(addDays(monday, k));
    const it = sched.find((s) => s.date === date);
    let cls = '', inner = '—';
    if (it) {
      inner = '';
      if (isDone(state, it.key)) { cls = 'done'; inner = ic('check'); }
      else if (date === t) cls = 'today';
      else if (date < t) cls = 'miss';
      else cls = 'sch';
    }
    return `<div><div class="${date === t ? 'acc' : 'muted'}" style="font-size:12px">${d}</div><div class="dot ${cls}">${inner}</div></div>`;
  }).join('')}</div>`;
}

function backupBanner() {
  if (!state.sessions.length) return '';
  if (state.lastExport && Date.now() - state.lastExport < 7 * 86400000) return '';
  return `<button class="banner" data-a="export">${ic('shield')}<span class="grow">Haz una copia de seguridad: tus datos solo están en este móvil</span>${ic('right')}</button>`;
}

function hoyView() {
  const tp = todayPlan(state);
  const t = today();
  const parts = [];
  if (state.current) {
    parts.push(`<button class="banner" data-a="resume" style="border-color:var(--acc)"><span class="acc">${ic('play')}</span>
      <span class="grow"><b style="font-weight:600;color:var(--text)">Sesión en curso</b><br>${esc(state.current.title)}</span>${ic('right')}</button>`);
  }
  if (tp.mode === 'exam') {
    parts.push(`<div><div class="muted">${niceDate(t)}</div><div class="title">Modo exámenes</div>
      <div class="muted" style="margin-top:4px">Calendario congelado en: ${phaseLine(tp.info)}</div></div>`);
    tp.items.forEach((it) => {
      const def = sessionFor(state, it);
      if (isDone(state, it.key)) {
        parts.push(`<div class="card row"><div><div class="muted">${it.optional ? 'Opcional' : 'Esta semana'}</div><div style="margin-top:2px">${esc(def.title)}</div></div><span class="acc">${ic('check')}</span></div>`);
      } else parts.push(sessionCard(it, it.optional ? 'Opcional · 45 min' : 'Esta semana · 45 min', def));
    });
    parts.push(`<div class="muted small">Haz las sesiones 1 y 2 cuando puedas esta semana. Los pesos se siguen actualizando. Desactiva el modo en Ajustes cuando acabes.</div>`);
    parts.push(backupBanner());
    return `<div class="screen">${parts.join('')}</div>`;
  }
  if (tp.mode === 'before') {
    const def = sessionFor(state, tp.next);
    parts.push(`<div><div class="muted">${niceDate(t)}</div><div class="title">Empiezas el ${niceDate(tp.next.date).toLowerCase()}</div>
      <div class="muted" style="margin-top:4px">Semana 0 · arranque</div></div>`);
    parts.push(sessionCard(tp.next, `Primera sesión · ${niceDate(tp.next.date)}`, def));
    parts.push(`<div class="muted small">Puedes revisar todas las sesiones en la pestaña Plan.</div>`);
    return `<div class="screen">${parts.join('')}</div>`;
  }
  const ti = tp.todayItem;
  const todayDone = ti && isDone(state, ti.key);
  const todayDef = ti ? sessionFor(state, ti) : null;
  let title = 'Hoy descansas';
  if (ti) title = todayDone ? 'Sesión de hoy hecha' : `Hoy toca ${KIND[todayDef.code]}`;
  parts.push(`<div><div class="muted">${niceDate(t)}</div><div class="title">${title}</div>
    <div class="muted" style="margin-top:4px">${phaseLine(tp.info)}</div></div>
    <div class="bar"><div style="width:${Math.max(3, ((tp.info.cw + 1) / 13) * 100)}%"></div></div>`);
  if (ti && !todayDone && !state.current) parts.push(sessionCard(ti, `Hoy · ${KIND[todayDef.code]}`, todayDef));
  if (todayDone) parts.push(`<div class="card row"><div><div class="muted">Completada</div><div style="margin-top:2px">${esc(todayDef.title)}</div></div><span class="acc">${ic('check')}</span></div>`);
  tp.pending.forEach((p) => {
    const def = sessionFor(state, p);
    if (!state.current) parts.push(sessionCard(p, `Pendiente · ${DAY_NAMES[p.code] || ''} ${niceDate(p.date, false)}`, def));
  });
  parts.push(`<div><div class="muted" style="margin-bottom:8px">Esta semana</div>${weekDots(state, tp.week)}</div>`);
  if (tp.next) {
    const def = sessionFor(state, tp.next);
    parts.push(`<button class="card row" style="width:100%;text-align:left" data-a="preview" data-key="${tp.next.key}" data-code="${tp.next.code}" data-week="${tp.next.week}" data-date="${tp.next.date}">
      <div><div class="muted">Próximo · ${niceDate(tp.next.date)}</div><div style="font-weight:600;margin-top:2px">${esc(def.title)}</div></div>${ic('right')}</button>`);
  }
  parts.push(backupBanner());
  return `<div class="screen">${parts.join('')}</div>`;
}

// ---------- Vista previa de una sesión ----------
function previewView() {
  const it = ui.preview;
  const def = sessionFor(state, it);
  const steps = prepSteps(def.steps);
  const info = weekInfo(it.week);
  return `<div class="screen">
    <div class="top"><button data-a="back" aria-label="Volver">${ic('left')}</button><span>${esc(def.exam ? 'Modo exámenes' : phaseLine(info))}</span><span style="width:20px"></span></div>
    <div><div class="muted">${def.exam ? '' : niceDate(it.date)}</div><div class="title">${esc(def.title)}</div>
      <div class="chips" style="margin-top:10px"><span class="chip">${def.minutes} min</span>${def.deload ? '<span class="chip acc">Descarga</span>' : ''}</div></div>
    <div class="list">${steps.map((s) => `<div class="li"><div class="grow">
      <div>${esc(s.type === 'checklist' ? s.title : stepName(s))}</div>
      <div class="muted small">${esc(stepDesc(s))}${s.type === 'strength' && s.sug?.kg ? ' · ' + kgf(s.sug.kg) + ' kg' : ''}</div>
      ${s.type === 'checklist' ? `<div class="muted small" style="margin-top:4px">${s.items.map((x) => esc(x.name)).join(' · ')}</div>` : ''}
    </div></div>`).join('')}</div>
    ${!isDone(state, it.key) && !state.current ? `<button class="btn" data-a="start" data-key="${it.key}" data-code="${it.code}" data-week="${it.week}" data-date="${it.date}">${ic('play')} Empezar esta sesión</button>` : ''}
    ${isDone(state, it.key) ? '<div class="muted" style="text-align:center">Sesión ya completada</div>' : ''}
  </div>`;
}

// ---------- Pestaña Plan ----------
function shortPhase(wi) {
  if (wi.cw === 0) return 'arranque';
  if (wi.cw === 2 && wi.cycle === 1) return 'vuelta · tests el jueves';
  if (wi.cw === 12) return 'descarga · tests el jueves';
  return { vuelta: 'vuelta', base: 'base', rend: 'rendimiento', descarga: 'descarga' }[wi.phase] || '';
}

function planView() {
  const w = planWeek(state);
  const info = weekInfo(Math.max(0, w));
  const first = info.cycle === 1 ? 0 : 13 + (info.cycle - 2) * 10;
  const last = info.cycle === 1 ? 12 : first + 9;
  const weeks = []; for (let k = first; k <= last; k++) weeks.push(k);
  const open = ui.openWeek ?? Math.max(0, w);
  const segs = info.cycle === 1
    ? [[0, 0, 'Arranque', 1], [1, 2, 'Vuelta', 2], [3, 6, 'Base', 4], [7, 7, 'Desc.', 1], [8, 11, 'Rendim.', 4], [12, 12, 'Desc.', 1]]
    : [[first, first + 3, 'Base', 4], [first + 4, first + 4, 'Desc.', 1], [first + 5, first + 8, 'Rendim.', 4], [first + 9, first + 9, 'Desc.', 1]];
  const bar = segs.map(([a, b, , f]) => {
    const col = w > b ? 'var(--acc)' : w >= a ? 'rgba(200,242,90,.55)' : '#2A2A2E';
    return `<div style="flex:${f};background:${col}"></div>`;
  }).join('');
  const labels = segs.map(([, , l, f]) => `<span style="flex:${f};text-align:center">${l}</span>`).join('');
  const t = today();
  const list = weeks.map((k) => {
    const wi = weekInfo(k);
    const isCur = k === w;
    const sched = weekSchedule(state, k);
    const done = sched.filter((s) => isDone(state, s.key)).length;
    const head = `<button class="row" style="width:100%;text-align:left;padding:2px 0" data-a="week" data-w="${k}">
      <span style="${isCur ? 'font-weight:600' : ''}">Semana ${wi.cw} · ${shortPhase(wi)}</span>
      <span class="${isCur ? 'acc' : 'muted'} small">${isCur ? 'Actual' : done ? `${done}/${sched.length}` : ''}</span></button>`;
    if (k !== open) return `<div class="card" style="padding:11px 14px${k < w ? ';opacity:.7' : ''}">${head}</div>`;
    const rows = sched.map((s) => {
      const def = sessionFor(state, s);
      const st = isDone(state, s.key) ? `<span class="acc">${ic('check')}</span>` : s.date === t ? '<span class="acc small">Hoy</span>' : ic('right');
      return `<button class="li" style="padding:10px 0" data-a="preview" data-key="${s.key}" data-code="${s.code}" data-week="${s.week}" data-date="${s.date}">
        <div class="grow"><div>${DAY_NAMES[s.code]} · ${esc(def.title)}</div><div class="muted small">${niceDate(s.date, false)}${def.code === 'T' ? ' · tests' : ''}</div></div>${st}</button>`;
    }).join('');
    return `<div class="card ${isCur ? 'acc-border' : ''}" style="padding:11px 14px">${head}<div style="margin-top:6px">${rows || '<div class="muted small" style="padding:8px 0">Sin sesiones</div>'}</div></div>`;
  }).join('');
  return `<div class="screen">
    <div class="title">Plan</div>
    ${state.exam.active ? '<div class="banner">Modo exámenes activo: el calendario está congelado</div>' : ''}
    <div class="phasebar">${bar}</div>
    <div class="row muted" style="font-size:10px;gap:3px">${labels}</div>
    ${list}
    ${info.cycle === 1 ? '<div class="muted small">Al acabar la semana 12 diseñamos el siguiente ciclo con tus tests. Mientras tanto, la app repite base y rendimiento con tus pesos nuevos.</div>' : ''}
  </div>`;
}

// ---------- Pestaña Progreso ----------
function chartSvg(points) {
  if (!points.length) return '';
  const W = 300, H = 120, pad = 8;
  const vals = points.map((p) => p.e1rm);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (max - min < 1) { min -= 1; max += 1; }
  const x = (k) => pad + (points.length === 1 ? (W - 2 * pad) / 2 : (k * (W - 2 * pad)) / (points.length - 1));
  const y = (v) => H - pad - ((v - min) / (max - min)) * (H - 2 * pad - 12);
  const pts = points.map((p, k) => `${x(k).toFixed(1)},${y(p.e1rm).toFixed(1)}`).join(' ');
  const lk = points.length - 1;
  return `<svg viewBox="0 0 ${W} ${H + 16}" width="100%" role="img" aria-label="Evolución del máximo estimado">
    <line x1="0" y1="${H - pad}" x2="${W}" y2="${H - pad}" stroke="#26262A" stroke-width="0.5"/>
    <polyline fill="none" stroke="#C8F25A" stroke-width="2" stroke-linejoin="round" points="${pts}"/>
    <circle cx="${x(lk)}" cy="${y(points[lk].e1rm)}" r="3.5" fill="#C8F25A"/>
    <text x="0" y="${H + 12}" fill="#6E6E74" font-size="10">${niceDate(points[0].date, false)}</text>
    <text x="${W}" y="${H + 12}" fill="#6E6E74" font-size="10" text-anchor="end">${niceDate(points[lk].date, false)}</text></svg>`;
}

function progresoView() {
  const keys = Object.keys(EX).filter((k) => !EX[k].bodyweight && history(state, k).some((e) => e.sets.some((x) => x.kg > 0)));
  const tests = testResults(state);
  const testDate = fmtDate(addDays(mondayOfPlanWeek(state, 2), 3));
  let body = '';
  if (!keys.length) {
    body = `<div class="card empty">Aquí verás tu progreso cuando completes tu primera sesión de fuerza.</div>`;
  } else {
    const key = keys.includes(ui.progressKey) ? ui.progressKey : keys[0];
    const st = exerciseStats(state, key);
    const pts = st.points;
    const lastV = pts[pts.length - 1].e1rm, firstV = pts[0].e1rm;
    const hist = history(state, key).slice(-6).reverse();
    body = `<select data-input="progressKey">${keys.map((k) => `<option value="${k}" ${k === key ? 'selected' : ''}>${esc(EX[k].name)}</option>`).join('')}</select>
      <div class="stats2">
        <div class="card"><div class="muted small">Máximo estimado</div><div class="h2" style="font-size:22px">${kgf(Math.round(lastV))} kg</div>
          <div class="${lastV >= firstV ? 'acc' : 'muted'} small">${pts.length > 1 ? pct(((lastV - firstV) / firstV) * 100) + ' desde el inicio' : 'Primera sesión'}</div></div>
        <div class="card"><div class="muted small">Mejor serie</div><div class="h2" style="font-size:22px">${st.bestSet.reps} × ${kgf(st.bestSet.kg)}</div>
          <div class="muted small">${st.bestSet.rir !== null && st.bestSet.rir !== undefined ? 'RIR ' + st.bestSet.rir + ' · ' : ''}${niceDate(st.bestSet.date, false)}</div></div></div>
      <div class="card" style="padding:12px 10px 6px">${chartSvg(pts)}</div>
      <div class="sec">Historial</div>
      <div class="list">${hist.map((e) => `<div class="li"><div class="grow"><div>${niceDate(e.date)}${e.deload ? ' · descarga' : ''}</div>
        <div class="muted small">${e.sets.map((x) => `${x.reps}×${kgf(x.kg)}`).join(' · ')}</div></div></div>`).join('')}</div>`;
  }
  let testsHtml;
  if (!tests.length) testsHtml = `<div class="muted small">Primer test: ${niceDate(testDate)} (semana 2). Segundo: semana 12.</div>`;
  else {
    const a = tests[0], b = tests[tests.length - 1];
    const row = (label, f, unit) => {
      const va = f(a), vb = f(b);
      if (va === undefined || va === null) return '';
      const txt = tests.length > 1 && vb !== undefined && vb !== null ? `${unit(va)} → <span class="acc">${unit(vb)}</span>` : unit(va);
      return `<div class="li"><span>${label}</span><span class="muted">${txt}</span></div>`;
    };
    testsHtml = `<div class="list">${row('Sprint 30 m', (t) => t.sprint30, (v) => secf(v) + ' s')}${row('5-10-5', (t) => t.agility, (v) => secf(v) + ' s')}${row('Caída en 6 × 30 m', (t) => t.rsaDrop, (v) => pct(v))}</div>
      <div class="muted small">${tests.length} test${tests.length > 1 ? 's' : ''} · último el ${niceDate(b.date, false)}</div>`;
  }
  return `<div class="screen"><div class="title">Progreso</div>${body}<div class="sec">Tests</div>${testsHtml}
    <div class="muted small" style="margin-top:6px">${state.sessions.length} sesiones completadas</div></div>`;
}

// ---------- Pestaña Ajustes ----------
function ajustesView() {
  if (ui.sub === 'inc') return incView();
  if (ui.sub === 'subs') return subsView();
  const s = state.settings;
  const sw = (on, a) => `<button class="sw ${on ? 'on' : ''}" data-a="${a}" aria-pressed="${on}" aria-label="Cambiar"></button>`;
  const exp = state.lastExport ? `Última: ${niceDate(fmtDate(new Date(state.lastExport)), false)}` : 'Nunca';
  return `<div class="screen"><div class="title">Ajustes</div>
    <div class="sec">Plan</div>
    <div class="list">
      <div class="li"><div class="grow"><div>Días por semana</div><div class="muted small">El 5.º día (viernes) empieza en la fase base</div></div>
        <div class="seg"><button class="${s.days === 4 ? 'on' : ''}" data-a="days" data-v="4">4</button><button class="${s.days === 5 ? 'on' : ''}" data-a="days" data-v="5">5</button></div></div>
      <div class="li"><div class="grow"><div>Modo exámenes</div><div class="muted small">${state.exam.active ? 'Activo desde el ' + niceDate(state.exam.since, false) : 'Congela el calendario'}</div></div>${sw(state.exam.active, 'exam')}</div>
      <div class="li"><div class="grow"><div>Fecha de inicio</div><div class="muted small">Semana 0 = la semana de esta fecha</div></div>
        <input type="date" data-input="startDate" value="${s.startDate}" style="width:auto;padding:8px 10px"></div>
    </div>
    <div class="sec">Ejercicios</div>
    <div class="list">
      <button class="li" data-a="sub" data-v="inc"><span>Incrementos de peso</span>${ic('right')}</button>
      <button class="li" data-a="sub" data-v="subs"><div class="grow"><div>Sustituciones</div><div class="muted small">Curl nórdico ↔ curl femoral</div></div>${ic('right')}</button>
    </div>
    <div class="sec">Durante el entrenamiento</div>
    <div class="list">
      <div class="li"><span>Pantalla siempre encendida</span>${sw(s.wakeLock, 'wake')}</div>
      <div class="li"><span>Vibrar al acabar el descanso</span>${sw(s.vibrate, 'vib')}</div>
    </div>
    <div class="sec">Datos</div>
    <div class="list">
      <button class="li" data-a="export"><div class="grow"><div>Exportar copia</div><div class="muted small">${exp} · puedes guardarla en Drive o enviártela</div></div>${ic('share')}</button>
      <button class="li" data-a="download"><span>Descargar copia en el móvil</span>${ic('download')}</button>
      <button class="li" data-a="import"><span>Importar copia</span>${ic('upload')}</button>
    </div>
    <input type="file" id="imp" accept="application/json,.json" style="display:none">
    <div class="muted small" style="text-align:center;margin-top:8px">Entreno · v1.0 · tus datos se guardan solo en este móvil</div>
  </div>`;
}

const INC_OPTS = [1, 1.25, 2, 2.5, 4, 5, 7.5, 10];
function incView() {
  const keys = Object.keys(EX).filter((k) => !EX[k].bodyweight);
  return `<div class="screen">
    <div class="top"><button data-a="subBack" aria-label="Volver">${ic('left')}</button><span>Ajustes</span><span style="width:20px"></span></div>
    <div class="title">Incrementos de peso</div>
    <div class="muted small">Cuánto sube o baja la app el peso de cada ejercicio. Por defecto: barra 2,5 kg (necesita discos de 1,25), mancuernas 2 kg y máquinas 5 kg.</div>
    <div class="list">${keys.map((k) => `<div class="li"><div class="grow"><div>${esc(EX[k].name)}</div><div class="muted small">${EQUIP[EX[k].equip].label}</div></div>
      <div class="stp" style="width:132px;height:42px"><button data-a="inc" data-k="${k}" data-d="-1" style="height:42px">${ic('minus')}</button>
      <span style="flex:1;text-align:center;font-weight:600">${kgf(incrementFor(state, k))}</span>
      <button data-a="inc" data-k="${k}" data-d="1" style="height:42px">${ic('plus')}</button></div></div>`).join('')}</div>
  </div>`;
}

function subsView() {
  const on = state.settings.useFemoral;
  return `<div class="screen">
    <div class="top"><button data-a="subBack" aria-label="Volver">${ic('left')}</button><span>Ajustes</span><span style="width:20px"></span></div>
    <div class="title">Sustituciones</div>
    <div class="list"><div class="li"><div class="grow"><div>Usar curl femoral en máquina</div>
      <div class="muted small">En lugar del curl nórdico (fases base y rendimiento). Cada ejercicio guarda su propio historial.</div></div>
      <button class="sw ${on ? 'on' : ''}" data-a="femoral" aria-pressed="${on}" aria-label="Cambiar"></button></div></div>
  </div>`;
}

// ---------- Render ----------
function navBar() {
  const t = [['hoy', 'home', 'Hoy'], ['plan', 'calendar', 'Plan'], ['progreso', 'chart', 'Progreso'], ['ajustes', 'sliders', 'Ajustes']];
  return `<nav class="nav"><div class="in">${t.map(([k, i, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${ic(i)}${l}</button>`).join('')}</div></nav>`;
}

function dialogHtml() {
  const d = ui.dialog;
  if (!d) return '';
  return `<div class="overlay center"><div class="dialog">
    <div class="h2">${esc(d.title)}</div>${d.text ? `<div class="muted" style="font-size:14px">${esc(d.text)}</div>` : ''}
    <div style="display:flex;flex-direction:column;gap:8px">
      <button class="${d.danger ? 'ghost danger' : 'btn'}" data-a="dlgOk">${esc(d.okLabel || 'Aceptar')}</button>
      <button class="ghost" data-a="dlgCancel">${esc(d.cancelLabel || 'Cancelar')}</button></div></div></div>`;
}

function render() {
  const root = document.getElementById('app');
  let html;
  if (ui.view === 'session' && state.current) html = sessionView();
  else if (ui.view === 'summary' && state.current) html = summaryView();
  else if (ui.view === 'preview' && ui.preview) html = previewView() + navBar();
  else {
    ui.view = null;
    const v = { hoy: hoyView, plan: planView, progreso: progresoView, ajustes: ajustesView }[ui.tab];
    html = v() + navBar();
  }
  if (ui.toast) {
    html += `<div class="toast"><span>${esc(ui.toast.text)}</span>${ui.toast.actionLabel ? `<button class="link" data-a="toastAct" style="padding:0">${esc(ui.toast.actionLabel)}</button>` : ''}</div>`;
  }
  html += dialogHtml();
  root.innerHTML = html;
  if (ui.view === 'session') lockOn(); else lockOff();
}

// ---------- Acciones ----------
function itemFrom(d) { return { key: d.key, code: d.code, week: Number(d.week), date: d.date }; }

function askExit() {
  dialog({ title: '¿Salir de la sesión?', text: 'Tu progreso se guarda y puedes continuar desde Hoy.', okLabel: 'Salir', cancelLabel: 'Seguir entrenando',
    onOk: () => { ui.view = null; ui.tab = 'hoy'; } });
}

const A = {
  tab: (d) => { ui.tab = d.v; ui.view = null; ui.sub = null; ui.preview = null; render(); window.scrollTo(0, 0); },
  start: (d) => startSession(itemFrom(d)),
  preview: (d) => { ui.preview = itemFrom(d); ui.view = 'preview'; pushNav(); render(); window.scrollTo(0, 0); },
  back: () => { ui.view = null; ui.preview = null; render(); },
  resume: () => { ui.view = 'session'; pushNav(); render(); },
  week: (d) => { const w = Number(d.w); ui.openWeek = ui.openWeek === w ? -99 : w; render(); },

  exit: () => askExit(),
  list: () => { ui.showList = true; render(); },
  closeList: (d, el, e) => { if (e.target.closest('[data-stop]') && !el.matches('button')) return; ui.showList = false; render(); },
  goto: (d) => goStep(Number(d.k)),
  next: () => goStep(cur().step + 1),
  prev: () => goStep(cur().step - 1),
  finish: () => { const c = cur(); logOf(c.step).visited = true; ui.view = 'summary'; commit(); window.scrollTo(0, 0); },
  discard: () => dialog({ title: '¿Descartar la sesión?', text: 'Se borra lo que has apuntado en esta sesión. No se puede deshacer.', okLabel: 'Descartar', danger: true,
    onOk: () => { state.current = null; ui.view = null; ui.showList = false; ui.tab = 'hoy'; } }),
  backToSession: () => { ui.view = 'session'; render(); },
  saveSession: () => {
    const rec = buildRecord();
    state.sessions.push(rec);
    state.current = null; ui.view = null; ui.tab = 'hoy';
    commit(); window.scrollTo(0, 0); toast('Sesión guardada');
  },

  ck: (d) => { const lg = logOf(Number(d.i)); const k = Number(d.k); lg.checked = lg.checked.includes(k) ? lg.checked.filter((x) => x !== k) : [...lg.checked, k]; commit(); },

  stp: (d) => {
    const i = Number(d.i), lg = logOf(i), s = cur().steps[i];
    const dr = { ...draftFor(i) };
    const step = d.f === 'kg' ? incrementFor(state, s.key) : 1;
    let v = (dr[d.f] ?? (d.f === 'rir' ? s.rir ?? 2 : 0)) + Number(d.d) * step;
    v = Math.max(0, Math.round(v * 100) / 100);
    if (d.f === 'rir') v = Math.min(6, v);
    dr[d.f] = v; lg.draft = dr; commit();
  },
  editSet: (d) => { const i = Number(d.i), k = Number(d.k), lg = logOf(i); ui.editSet = k; lg.draft = { ...lg.sets[k] }; commit(); },
  delSet: (d) => { const lg = logOf(Number(d.i)); lg.sets.splice(Number(d.k), 1); lg.draft = null; ui.editSet = null; commit(); },
  logSet: (d) => {
    const i = Number(d.i), lg = logOf(i), s = cur().steps[i];
    const dr = { ...draftFor(i) };
    if (!(dr.reps > 0) && s.type !== 'dominadas') { toast('Pon las repeticiones'); return; }
    if (s.type === 'strength' && !(dr.kg > 0)) { toast('Pon el peso que has usado'); return; }
    if (ui.editSet !== null) { lg.sets[ui.editSet] = dr; ui.editSet = null; lg.draft = null; commit(); return; }
    lg.sets.push(dr); lg.draft = null;
    startRest(s.rest, `Descanso · ${s.restText}`);
    commit();
  },
  swap: (d) => {
    const i = Number(d.i);
    state.settings.useFemoral = !state.settings.useFemoral;
    const c = cur();
    const def = sessionFor(state, { key: c.key, code: c.code, week: c.week, date: c.date });
    if (def.steps.length === c.steps.length) { c.steps[i] = prepSteps([def.steps[i]])[0]; delete c.logs[i]; }
    commit(); toast(`Cambiado a ${stepName(c.steps[i]).toLowerCase()}`);
  },

  restAdd: (d) => { const r = cur().rest; if (r) { r.endsAt = Math.max(Date.now(), r.endsAt) + Number(d.d) * 1000; delete mem.restBuzzed[r.endsAt]; render(); save(state); } },
  restSkip: () => { cur().rest = null; commit(); },

  pwDone: (d) => { const i = Number(d.i), lg = logOf(i), s = cur().steps[i]; lg.done = (lg.done || 0) + 1; if (lg.done < s.sets) startRest(s.rest, `Descanso · ${s.rest} s`); commit(); },
  pwUndo: (d) => { const lg = logOf(Number(d.i)); lg.done = Math.max(0, (lg.done || 0) - 1); commit(); },

  holdStart: (d) => { const i = Number(d.i), s = cur().steps[i]; cur().rest = null; cur().hold = { step: i, endsAt: Date.now() + s.sec * 1000 }; buzz(120); commit(); },
  holdCancel: () => { cur().hold = null; commit(); },
  holdMark: (d) => finishHold(Number(d.i)),
  holdUndo: (d) => { const lg = logOf(Number(d.i)); lg.done = Math.max(0, (lg.done || 0) - 1); commit(); },

  swStart: (d) => { const c = cur(); c.rest = null; c.sw = { step: Number(d.i), startedAt: Date.now() }; commit(); },
  swStop: (d) => { const c = cur(); if (!c.sw) return; const t = (Date.now() - c.sw.startedAt) / 1000; c.sw = null; recordSprint(Number(d.i), Math.round(t * 100) / 100); },
  swSkip: (d) => recordSprint(Number(d.i), 0),
  swUndo: (d) => { const lg = logOf(Number(d.i)); lg.times.pop(); cur().rest = null; commit(); },

  rpe: (d) => {
    const lg = logOf(Number(d.i)), v = Number(d.v);
    if (d.r !== undefined) { lg.rpe = lg.rpe || []; lg.rpe[Number(d.r)] = v; } else lg.rpe = v;
    commit();
  },
  gtStart: (d) => { const c = cur(); c.rest = null; c.gt = { step: Number(d.i), startedAt: Date.now(), paused: 0, pausedAt: null }; mem.gtIdx = 0; buzz([250, 100, 250]); commit(); },
  gtPause: () => { const g = cur().gt; if (g && !g.pausedAt) g.pausedAt = Date.now(); commit(); },
  gtResume: () => { const g = cur().gt; if (g && g.pausedAt) { g.paused += Date.now() - g.pausedAt; g.pausedAt = null; } commit(); },
  gtStop: (d) => dialog({ title: '¿Terminar ahora?', text: 'Se marcará este bloque como hecho.', okLabel: 'Terminar', onOk: () => finishGuided(Number(d.i)) }),
  gtMark: (d) => finishGuided(Number(d.i)),

  dlgOk: () => { const d = ui.dialog; ui.dialog = null; d?.onOk?.(); commit(); },
  dlgCancel: () => { ui.dialog = null; render(); },
  toastAct: () => { const t = ui.toast; ui.toast = null; t?.onAction?.(); render(); },

  days: (d) => {
    state.settings.days = Number(d.v); commit();
    if (state.settings.days === 5 && weekInfo(planWeek(state)).cw < 3) toast('El viernes de pista aeróbica empieza en la fase base (semana 3)');
  },
  exam: () => {
    if (!state.exam.active) {
      const info = weekInfo(Math.max(0, planWeek(state)));
      dialog({ title: 'Activar modo exámenes', text: `El calendario se congela en: ${phaseLine(info)}. Tendrás 2 sesiones cortas por semana y una tercera opcional.`,
        okLabel: 'Activar', onOk: () => { setExamMode(state, true); } });
    } else {
      dialog({ title: 'Desactivar modo exámenes', text: 'Vuelves al plan donde lo dejaste. Si han pasado más de 3 semanas, retrocedes una semana para readaptarte.',
        okLabel: 'Desactivar', onOk: () => { const long = setExamMode(state, false); setTimeout(() => toast(long ? 'Vuelves una semana atrás para readaptarte' : 'De vuelta al plan'), 50); } });
    }
  },
  wake: () => { state.settings.wakeLock = !state.settings.wakeLock; commit(); },
  vib: () => { state.settings.vibrate = !state.settings.vibrate; if (state.settings.vibrate) buzz(200); commit(); },
  femoral: () => { state.settings.useFemoral = !state.settings.useFemoral; commit(); },
  sub: (d) => { ui.sub = d.v; pushNav(); render(); window.scrollTo(0, 0); },
  subBack: () => { ui.sub = null; render(); },
  inc: (d) => {
    const k = d.k, curv = incrementFor(state, k);
    let idx = INC_OPTS.indexOf(curv); if (idx < 0) idx = 3;
    idx = Math.min(INC_OPTS.length - 1, Math.max(0, idx + Number(d.d)));
    state.settings.increments = { ...state.settings.increments, [k]: INC_OPTS[idx] }; commit();
  },
  export: () => doExport(true),
  download: () => doExport(false),
  import: () => document.getElementById('imp')?.click(),
};

function recordSprint(i, t) {
  const c = cur(), s = c.steps[i], lg = logOf(i);
  lg.times.push(t);
  const total = totalOf(s), n = lg.times.length;
  if (n < total) {
    const endSeries = n % s.reps === 0;
    if (endSeries && s.seriesRest) startRest(s.seriesRest, 'Descanso entre series');
    else startRest(s.recovery, 'Recuperación');
  } else c.rest = null;
  commit();
}

function finishHold(i) {
  const c = cur();
  const idx = i ?? c.hold?.step;
  if (idx === undefined || idx === null) return;
  const s = c.steps[idx], lg = logOf(idx);
  lg.done = (lg.done || 0) + 1;
  c.hold = null;
  buzz([400, 150, 400]);
  const total = totalOf(s);
  if (lg.done < total && !(s.side && lg.done % 2 === 1)) startRest(s.rest, `Descanso · ${s.rest} s`);
  commit();
}

function finishGuided(i) {
  const c = cur(), lg = logOf(i);
  lg.done = true;
  if (c.gt && c.gt.step === i) c.gt = null;
  buzz([600, 200, 600]);
  commit();
}

async function doExport(share) {
  const f = exportFile(state);
  try {
    if (share && navigator.canShare && navigator.canShare({ files: [f] })) {
      await navigator.share({ files: [f], title: 'Copia de Entreno' });
    } else {
      const url = URL.createObjectURL(f);
      const a = document.createElement('a'); a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    }
    state.lastExport = Date.now(); commit(); toast('Copia exportada');
  } catch (e) {
    if (e.name !== 'AbortError') toast('No se pudo exportar la copia');
  }
}

// ---------- Eventos ----------
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = A[el.dataset.a];
  if (fn) fn(el.dataset, el, e);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  const f = el.dataset?.input;
  if (!f) {
    if (el.id === 'imp' && el.files?.[0]) {
      el.files[0].text().then((txt) => {
        try {
          const next = parseImport(txt);
          dialog({ title: 'Importar copia', text: `Se sustituirán los datos actuales por los de la copia (${next.sessions.length} sesiones).`, okLabel: 'Importar', danger: true,
            onOk: () => { state = next; setTimeout(() => toast('Copia importada'), 50); } });
        } catch (err) { toast(err.message || 'Archivo no válido'); }
      });
    }
    return;
  }
  if (f === 'draft') {
    const i = Number(el.dataset.i), lg = logOf(i);
    const dr = { ...draftFor(i) };
    dr[el.dataset.f] = el.value === '' && el.dataset.f === 'rir' ? null : num(el.value);
    lg.draft = dr; commit();
  } else if (f === 'note') { cur().note = el.value; save(state); }
  else if (f === 'progressKey') { ui.progressKey = el.value; render(); }
  else if (f === 'startDate' && el.value) { state.settings.startDate = el.value; commit(); toast('Fecha de inicio cambiada'); }
});

document.addEventListener('input', (e) => { if (e.target.dataset?.input === 'note' && state.current) { state.current.note = e.target.value; save(state); } });
document.addEventListener('focusin', (e) => { if (e.target.matches?.('.stp input')) setTimeout(() => e.target.select(), 0); });

// ---------- Temporizadores ----------
function tick() {
  const c = state.current;
  if (!c) return;
  const now = Date.now();
  if (c.rest) {
    const rem = (c.rest.endsAt - now) / 1000;
    const el = $('[data-rest]'); if (el) el.textContent = clock(rem);
    if (rem <= 0 && !mem.restBuzzed[c.rest.endsAt]) {
      mem.restBuzzed[c.rest.endsAt] = 1;
      if (rem > -3) buzz([400, 150, 400]);
      const l = $('[data-rest-label]'); if (l) l.textContent = 'Descanso terminado';
    }
  }
  if (c.sw) { const el = $('[data-sw]'); if (el) el.textContent = secf((now - c.sw.startedAt) / 1000); }
  if (c.hold) {
    const rem = (c.hold.endsAt - now) / 1000;
    const el = $('[data-hold]'); if (el) el.textContent = Math.max(0, Math.ceil(rem));
    if (rem <= 0) finishHold();
  }
  if (c.gt && !c.gt.pausedAt) {
    const st = guidedState(c.gt.step);
    if (st.idx >= st.phases.length) { finishGuided(c.gt.step); return; }
    if (mem.gtIdx !== st.idx) {
      const fresh = mem.gtIdx !== null;
      mem.gtIdx = st.idx;
      if (fresh) buzz(st.phases[st.idx].kind === 'work' ? [250, 100, 250] : [600]);
      if (ui.view === 'session') render();
      return;
    }
    const p = st.phases[st.idx], nx = st.phases[st.idx + 1];
    const secLeft = Math.ceil(st.rem);
    if (p.kind === 'rest' && nx?.kind === 'work' && secLeft <= 3 && secLeft > 0) {
      const k = `${st.idx}-${secLeft}`;
      if (!mem.gtBeep[k]) { mem.gtBeep[k] = 1; buzz(90); }
    }
    const t = $('[data-gt-time]'); if (t) t.textContent = clock(st.rem);
    const b = $('[data-gt-bar]'); if (b) b.style.width = Math.min(100, (st.el / st.total) * 100) + '%';
  }
}
setInterval(tick, 250);

// ---------- Pantalla encendida ----------
let wl = null, wlPending = false;
async function lockOn() {
  if (!state.settings.wakeLock || !('wakeLock' in navigator) || wl || wlPending || document.visibilityState !== 'visible') return;
  wlPending = true;
  try { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } catch (e) { /* sin permiso */ }
  wlPending = false;
}
function lockOff() { if (wl) { wl.release().catch(() => {}); wl = null; } }
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { if (ui.view === 'session') lockOn(); render(); }
});

// ---------- Botón atrás de Android ----------
function pushNav() { try { history.pushState({ n: Date.now() }, ''); } catch (e) { /* nada */ } }
window.addEventListener('popstate', () => {
  if (ui.dialog) { ui.dialog = null; render(); pushNav(); return; }
  if (ui.showList) { ui.showList = false; render(); pushNav(); return; }
  if (ui.view === 'session') { askExit(); pushNav(); return; }
  if (ui.view === 'summary') { ui.view = 'session'; render(); pushNav(); return; }
  if (ui.view === 'preview') { ui.view = null; ui.preview = null; render(); return; }
  if (ui.sub) { ui.sub = null; render(); }
});

// ---------- Service worker (modo sin conexión) ----------
// En el PC (localhost) solo se activa con ?sw=1, para que los cambios se vean al momento
const swOn = location.hostname !== 'localhost' || new URLSearchParams(location.search).has('sw');
if ('serviceWorker' in navigator && location.protocol !== 'file:' && swOn) {
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast('Hay una versión nueva', 'Actualizar', () => nw.postMessage('skipWaiting'));
        }
      });
    });
  }).catch(() => {});
  // Recarga solo al actualizar (no la primera vez que se instala)
  const hadController = !!navigator.serviceWorker.controller;
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (refreshing || !hadController) return; refreshing = true; location.reload(); });
}

// ---------- Arranque ----------
if (state.current && state.current.date === today()) { ui.view = 'session'; pushNav(); }
render();

// Para probar desde la consola del navegador
window.__entreno = { get state() { return state; }, set state(v) { state = v; save(state); render(); }, render };
