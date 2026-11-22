// Plan de entrenamiento: ejercicios, sesiones por fase y semana, descargas, tests y modo exámenes.

export const EQUIP = {
  barra: { label: 'Barra', inc: 2.5 },
  mancuernas: { label: 'Mancuernas (por mano)', inc: 2 },
  maquina: { label: 'Máquina o polea', inc: 5 },
};

// Ejercicios con progresión de peso o de repeticiones
export const EX = {
  sentadilla: { name: 'Sentadilla trasera', equip: 'barra', start: 40 },
  rumano: { name: 'Peso muerto rumano', equip: 'barra', start: 50 },
  bulgara: { name: 'Sentadilla búlgara con mancuernas', equip: 'mancuernas', start: 8, side: 'por pierna' },
  femoral: { name: 'Curl femoral en máquina', equip: 'maquina', start: null },
  nordico: { name: 'Curl nórdico', bodyweight: true },
  gemelo: { name: 'Gemelo de pie', equip: 'maquina', start: null },
  press: { name: 'Press de banca con mancuernas', equip: 'mancuernas', start: 16 },
  jalon: { name: 'Jalón al pecho', equip: 'maquina', start: 50 },
  remo: { name: 'Remo con mancuerna a una mano', equip: 'mancuernas', start: 18, side: 'por lado' },
  militar: { name: 'Press militar sentado con mancuernas', equip: 'mancuernas', start: 12 },
  facepull: { name: 'Face pull en polea', equip: 'maquina', start: null },
  pallof: { name: 'Pallof press en polea', equip: 'maquina', start: null, side: 'por lado' },
  trapbar: { name: 'Peso muerto con barra hexagonal', equip: 'barra', start: 60 },
  zancada: { name: 'Zancada caminando con mancuernas', equip: 'mancuernas', start: 12, side: 'pasos por pierna' },
  zancadaLateral: { name: 'Zancada lateral con mancuernas', equip: 'mancuernas', start: null, side: 'por lado' },
  flexiones: { name: 'Flexiones', bodyweight: true },
  dominadas: { name: 'Dominadas + negativas', bodyweight: true },
};

export const DAY_NAMES = { L: 'Lunes', X: 'Miércoles', J: 'Jueves', V: 'Viernes', S: 'Sábado' };
export const DAY_INDEX = { L: 0, X: 2, J: 3, V: 4, S: 5 }; // 0 = lunes

// ---------- Calentamientos y vueltas a la calma ----------
const ck = (title, minutes, items) => ({
  type: 'checklist', title, minutes,
  items: items.map(([name, qty, note]) => ({ name, qty, note: note || '' })),
});

const WU = {
  piernas: () => ck('Calentamiento', 15, [
    ['Bici estática suave', '5 min', 'Que puedas hablar sin esfuerzo'],
    ['Movilidad de tobillo (rodilla a la pared)', '2 × 10 por lado', 'Talón pegado al suelo'],
    ["World's greatest stretch", '2 × 5 por lado', 'Lento y controlado'],
    ['Puente de glúteo', '2 × 12', 'Aprieta arriba 1 segundo'],
    ['Pasos laterales con banda elástica', '2 × 10 pasos por lado', 'Rodillas hacia fuera'],
    ['Saltitos de tobillo (pogo)', '2 × 15', 'Contacto corto con el suelo'],
  ]),
  superior: () => ck('Calentamiento', 12, [
    ['Remo ergómetro suave', '5 min', 'Ritmo cómodo'],
    ['Aperturas con banda elástica', '2 × 15', 'Brazos estirados, junta las escápulas'],
    ['Rotación externa con banda', '2 × 12 por lado', 'Codo pegado al cuerpo'],
    ['Flexiones escapulares', '2 × 10', 'Solo se mueven los omóplatos'],
    ['Series previas del press con mancuernas', '1 × 10 con 10 kg', 'Justo antes del press'],
  ]),
  pista: () => ck('Calentamiento', 20, [
    ['Trote suave', '8 min', 'Ritmo de conversación'],
    ['Balanceo de pierna adelante y atrás', '10 por lado', 'Apoyado en una valla'],
    ['Balanceo de pierna lateral', '10 por lado', 'Apoyado en una valla'],
    ['Zancada con giro de tronco', '5 por lado', 'Gira hacia la pierna de delante'],
    ['Skipping bajo', '2 × 20 m', 'Pasos cortos y rápidos'],
    ['Skipping alto', '2 × 20 m', 'Rodillas a la altura de la cadera'],
    ['Talones al glúteo', '2 × 20 m', 'Tobillo relajado'],
    ['Desplazamiento lateral', '2 × 20 m', '1 hacia cada lado'],
    ['Progresivos', '3 × 60 m', 'Al 60, 70 y 80 %. Vuelta andando'],
  ]),
  completo: () => ck('Calentamiento', 12, [
    ['Remo ergómetro suave', '5 min', 'Ritmo cómodo'],
    ['Movilidad de cadera 90/90', '2 × 6 por lado', 'Tronco recto'],
    ['Gato-camello', '2 × 8', 'Lento, vértebra a vértebra'],
    ['Aperturas con banda elástica', '2 × 15', 'Junta las escápulas'],
    ['Saltos de tijera', '2 × 20', 'Para subir pulsaciones'],
  ]),
  corto: () => ck('Calentamiento', 8, [
    ['Bici estática suave', '4 min', 'Ritmo cómodo'],
    ["World's greatest stretch", '1 × 5 por lado', 'Lento y controlado'],
    ['Aperturas con banda elástica', '1 × 15', 'Junta las escápulas'],
    ['Puente de glúteo', '1 × 12', 'Aprieta arriba 1 segundo'],
  ]),
  rodaje: () => ck('Calentamiento', 10, [
    ['Trote suave', '5 min', 'Ritmo de conversación'],
    ['Balanceo de pierna adelante y atrás', '10 por lado', ''],
    ['Balanceo de pierna lateral', '10 por lado', ''],
    ['Progresivos', '2 × 60 m', 'Vuelta andando'],
  ]),
};

const CD = {
  piernas: () => ck('Vuelta a la calma', 10, [
    ['Bici muy suave', '3 min'], ['Cuádriceps de pie', '30 s por lado'], ['Isquiotibiales', '30 s por lado'],
    ['Flexor de cadera (de rodillas)', '30 s por lado'], ['Glúteo (postura del 4)', '30 s por lado'],
    ['Gemelo en la pared', '30 s por lado'], ['Aductores en mariposa', '30 s'],
  ]),
  superior: () => ck('Vuelta a la calma', 8, [
    ['Bici muy suave', '3 min'], ['Pectoral en el marco de una puerta', '30 s por lado'],
    ['Dorsal apoyado en un banco', '30 s'], ['Hombro cruzado', '30 s por lado'],
    ['Tríceps', '30 s por lado'], ['Postura del niño', '30 s'],
  ]),
  pista: () => ck('Vuelta a la calma', 10, [
    ['Trote muy suave', '5 min'], ['Isquiotibiales', '30 s por lado'], ['Cuádriceps', '30 s por lado'],
    ['Flexor de cadera', '30 s por lado'], ['Gemelo', '30 s por lado'], ['Glúteo', '30 s por lado'],
    ['Aductores', '30 s por lado'],
  ]),
  completo: () => ck('Vuelta a la calma', 8, [
    ['Bici o remo muy suave', '3 min'], ['Isquiotibiales', '30 s por lado'], ['Cuádriceps', '30 s por lado'],
    ['Flexor de cadera', '30 s por lado'], ['Glúteo', '30 s por lado'], ['Aductores', '30 s'],
    ['Pectoral', '30 s por lado'], ['Dorsal', '30 s'],
  ]),
  corto: () => ck('Vuelta a la calma', 5, [
    ['Bici muy suave', '2 min'], ['Isquiotibiales', '30 s por lado'], ['Cuádriceps', '30 s por lado'],
    ['Pectoral', '30 s por lado'], ['Dorsal', '30 s'],
  ]),
  rodaje: () => ck('Vuelta a la calma', 8, [
    ['Andar', '5 min'], ['Isquiotibiales', '30 s por lado'], ['Cuádriceps', '30 s por lado'],
    ['Gemelo', '30 s por lado'], ['Flexor de cadera', '30 s por lado'], ['Glúteo', '30 s por lado'],
  ]),
};

// ---------- Constructores de pasos ----------
const str = (key, sets, repMin, repMax, rir, rest, restText, note = '', extra = {}) =>
  ({ type: 'strength', key, sets, repMin, repMax, rir, rest, restText, note, ...extra });

const pw = (name, sets, reps, rest, note = '', extra = {}) =>
  ({ type: 'power', name, sets, reps, rest, note, ...extra });

const hold = (name, sets, sec, rest, note = '', side = true) =>
  ({ type: 'hold', name, sets, sec, rest, note, side });

const sprint = (name, o) => ({ type: 'sprint', name, rpe: true, seriesRest: 0, ...o });

// Intervalos guiados: bloques × repeticiones de trabajo/descanso
const intervals = (name, o) => ({ type: 'intervals', name, warmup: 0, reps: 1, setRest: 0, ...o });

const STATIONS = [
  { name: 'Swing con kettlebell', note: '16 kg (de prueba). El impulso sale de la cadera, no de los brazos' },
  { name: 'Remo ergómetro', note: 'Lo más fuerte que puedas mantener' },
  { name: 'Saltos laterales a una pierna (skater)', note: 'Cambio de dirección lateral, como en el pádel' },
  { name: 'Cuerdas de batalla', note: 'Ondas alternas' },
  { name: 'Escaladores', note: 'Cadera baja' },
];
const circuit = (rounds, work, rest, roundRest) =>
  ({ type: 'circuit', name: 'Circuito', rounds, work, rest, roundRest, stations: STATIONS, rpeTarget: 8 });

const PLACE = {
  acc20: 'Mide 20 m una vez y deja un cono',
  c5105: 'Centro: línea entre la calle 4 y la 5. Extremos: borde interior de la calle 1 y borde exterior de la calle 8',
  m30: 'Zona de relevos del 4×100: de la línea de entrada a la de salida',
  flying: 'Conos a 0, 20 y 40 m. Aceleras hasta el segundo cono y cronometras del segundo al tercero',
};

function rirFor(phase, week) {
  if (phase === 'vuelta') return 3;
  if (phase === 'base') return week <= 4 ? 3 : 2;
  return 2;
}

// ---------- Sesiones por día ----------
function lunes(phase, week, o) {
  const r = rirFor(phase, week);
  const nordic = (sets, min, max, fmin, fmax) => o.useFemoral
    ? str('femoral', sets, fmin, fmax, r, 90, '90 s', 'Bajada lenta, 3 segundos', { swap: 'nordico' })
    : { type: 'bodyweight', key: 'nordico', sets, repMin: min, repMax: max, rir: null, rest: 120, restText: '2 min',
      note: 'Talones sujetos. Baja lo más lento que puedas y frena con las manos al final', swap: 'femoral' };
  let main;
  if (phase === 'vuelta') {
    main = [
      pw('Salto al cajón', 3, 4, 90, 'Máxima intención al saltar y caída suave. Bájate andando'),
      str('sentadilla', 3, 8, 10, 3, 150, '2-3 min', 'Antes: barra vacía × 10 y 30 kg × 5'),
      str('rumano', 3, 6, 8, 3, 120, '2 min', 'Cadera atrás, barra pegada a las piernas'),
      str('bulgara', 3, 8, 10, 3, 90, '90 s', 'Tronco ligeramente inclinado'),
      str('femoral', 2, 10, 12, 3, 90, '90 s', 'Bajada lenta, 3 segundos'),
      hold('Plancha Copenhague (versión corta)', 2, 20, 45, 'Previene lesiones de aductor, muy típicas en fútbol'),
      str('gemelo', 2, 12, 15, 2, 60, '60 s', 'Pausa abajo y arriba', { rirText: '2-3' }),
      hold('Plancha lateral', 2, 30, 45, 'Cuerpo en línea recta'),
    ];
  } else if (phase === 'base') {
    main = [
      pw('Salto al cajón', 4, 4, 90, 'Cajón más alto. Caída suave y bájate andando'),
      str('sentadilla', 4, 6, 8, r, 150, '2-3 min', 'Series previas: barra vacía × 10 y 2 series progresivas × 5'),
      str('rumano', 4, 6, 8, r, 120, '2 min', 'Cadera atrás, barra pegada a las piernas'),
      str('bulgara', 3, 8, 10, r, 90, '90 s', 'Tronco ligeramente inclinado'),
      nordic(3, 4, 6, 10, 12),
      hold('Plancha Copenhague (versión corta)', 3, 25, 45, 'Previene lesiones de aductor'),
      str('gemelo', 3, 12, 15, r, 60, '60 s', 'Pausa abajo y arriba'),
      hold('Plancha lateral', 3, 35, 45, 'Cuerpo en línea recta'),
    ];
  } else {
    main = [
      pw('Salto horizontal a pies juntos', 4, 3, 90, 'Caída estable, aguanta 1 segundo'),
      pw('Saltos laterales a una pierna', 3, 4, 60, 'Cambio de dirección explosivo, como en el pádel', { side: true }),
      str('sentadilla', 4, 4, 6, r, 180, '3 min', 'Justo después de cada serie: 3 saltos verticales máximos'),
      str('rumano', 3, 6, 8, r, 120, '2 min', 'Cadera atrás, barra pegada a las piernas'),
      str('bulgara', 3, 6, 8, r, 90, '90 s', 'Tronco ligeramente inclinado'),
      nordic(3, 5, 7, 8, 10),
      hold('Plancha Copenhague (versión larga)', 3, 20, 45, 'Apoyo en el pie: más difícil'),
      str('gemelo', 3, 12, 15, r, 60, '60 s', 'Pausa abajo y arriba'),
      hold('Plancha lateral', 3, 40, 45, 'Cuerpo en línea recta'),
    ];
  }
  return { code: 'L', title: 'Piernas + saltos', subtitle: 'Fuerza de piernas, saltos y core', minutes: 75,
    steps: [WU.piernas(), ...main, CD.piernas()] };
}

function miercoles(phase, week) {
  const r = rirFor(phase, week);
  const elbow = 'Si notas el hormigueo hacia el meñique, para y apúntalo en las notas';
  let main, bike;
  if (phase === 'vuelta') {
    main = [
      str('press', 3, 10, 12, 3, 120, '2 min', elbow),
      str('jalon', 3, 6, 8, 3, 120, '2 min', 'Barra al pecho sin balancearte'),
      str('remo', 3, 8, 10, 3, 90, '90 s', 'Tira con el codo hacia la cadera'),
      str('militar', 3, 8, 10, 3, 90, '90 s', 'Sin arquear la espalda'),
      str('facepull', 2, 12, 15, 2, 60, '60 s', 'Salud del hombro', { rirText: '2-3' }),
      str('pallof', 2, 10, 12, null, 60, '60 s', 'Core que resiste el giro'),
    ];
    bike = intervals('Intervalos en bici', { warmup: 180, sets: 6, work: 30, rest: 90, workLabel: 'Fuerte', restLabel: 'Suave',
      rpeTarget: 8, desc: '6 × (30 s fuerte / 90 s suave)', note: 'Duro pero sosteniendo el ritmo en los 6 bloques' });
  } else if (phase === 'base') {
    const n = week === 3 ? 4 : week === 4 ? 5 : 6;
    main = [
      str('press', 4, 8, 10, r, 120, '2 min', elbow),
      str('jalon', 4, 6, 8, r, 120, '2 min', 'Barra al pecho sin balancearte'),
      str('remo', 3, 8, 10, r, 90, '90 s', 'Tira con el codo hacia la cadera'),
      str('militar', 3, 8, 10, r, 90, '90 s', 'Sin arquear la espalda'),
      str('facepull', 2, 12, 15, r, 60, '60 s', 'Salud del hombro'),
      str('pallof', 2, 10, 12, null, 60, '60 s', 'Core que resiste el giro'),
    ];
    bike = intervals('Intervalos en bici', { warmup: 180, sets: n, work: 180, rest: 120, workLabel: 'Fuerte (RPE 7-8)', restLabel: 'Suave',
      rpeTarget: 8, desc: `${n} × (3 min a RPE 7-8 / 2 min suave)`, note: 'Ritmo duro pero constante' });
  } else {
    const blocks = week <= 9 ? 2 : 3;
    main = [
      pw('Lanzamiento de balón medicinal de pecho contra la pared', 3, 5, 60, 'Explosivo, recoge y repite'),
      str('press', 4, 6, 8, r, 150, '2-3 min', elbow),
      str('jalon', 4, 5, 7, r, 120, '2 min', 'Barra al pecho sin balancearte'),
      str('remo', 3, 8, 10, r, 90, '90 s', 'Tira con el codo hacia la cadera'),
      str('militar', 3, 6, 8, r, 120, '2 min', 'Sin arquear la espalda'),
      str('facepull', 2, 12, 15, r, 60, '60 s', 'Salud del hombro'),
      str('pallof', 2, 10, 12, null, 60, '60 s', 'Core que resiste el giro'),
    ];
    bike = intervals('Intervalos en bici', { warmup: 180, sets: blocks, reps: 6, work: 30, rest: 30, setRest: 180,
      workLabel: 'Muy fuerte (RPE 9)', restLabel: 'Suave', rpeTarget: 9,
      desc: `${blocks} bloques de 6 × (30 s a RPE 9 / 30 s suave), 3 min entre bloques`, note: 'Lo más parecido al ritmo de un partido' });
  }
  return { code: 'X', title: 'Tren superior + intervalos', subtitle: 'Fuerza de tren superior y bici', minutes: 75,
    steps: [WU.superior(), ...main, bike, CD.superior()] };
}

function jueves(phase, week) {
  let main;
  const i1515 = (blocks, min, rpe) => intervals('Intermitente 15-15', { sets: blocks, reps: min * 2, work: 15, rest: 15, setRest: 180,
    workLabel: 'Rápido', restLabel: 'Trote suave', rpeTarget: rpe,
    desc: `${blocks} × ${min} min (15 s rápido / 15 s trote suave), 3 min entre bloques`, note: 'Imita el ritmo de un partido' });
  if (phase === 'vuelta') {
    main = [
      sprint('Aceleraciones', { series: 1, reps: 6, distance: '20 m', intensity: '90 %', recovery: 80, recoveryText: 'Vuelta andando + 60 s',
        place: PLACE.acc20, note: 'Salida con un pie adelantado, cuerpo inclinado los primeros pasos' }),
      sprint('Cambios de dirección 5-10-5', { series: 1, reps: 4, distance: '5-10-5', intensity: '90 %', recovery: 90, recoveryText: '90 s',
        place: PLACE.c5105, note: 'Toca la línea con la mano en cada giro' }),
      sprint('Sprints repetidos', { series: 2, reps: 5, distance: '30 m', intensity: '90 %', recovery: 25, recoveryText: '25 s', seriesRest: 240,
        place: PLACE.m30, note: 'El objetivo es que el último sprint se parezca al primero' }),
      i1515(2, 6, 8),
    ];
  } else if (phase === 'base') {
    main = [
      sprint('Aceleraciones', { series: 1, reps: 8, distance: '20 m', intensity: '95 %', recovery: 80, recoveryText: 'Vuelta andando + 60 s',
        place: PLACE.acc20, note: 'Salida con un pie adelantado, cuerpo inclinado los primeros pasos' }),
      sprint('Cambios de dirección 5-10-5', { series: 1, reps: 6, distance: '5-10-5', intensity: '90-95 %', recovery: 90, recoveryText: '90 s',
        place: PLACE.c5105, note: 'Toca la línea con la mano en cada giro' }),
      sprint('Sprints repetidos', { series: 3, reps: 5, distance: '30 m', intensity: '90 %', recovery: 25, recoveryText: '25 s', seriesRest: 240,
        place: PLACE.m30, note: 'El objetivo es que el último sprint se parezca al primero' }),
      i1515(2, week <= 4 ? 8 : 10, 8),
    ];
  } else {
    main = [
      sprint('Aceleraciones', { series: 1, reps: 6, distance: '20 m', intensity: '100 %', recovery: 80, recoveryText: 'Vuelta andando + 60 s',
        place: PLACE.acc20, note: 'Máxima velocidad desde parado' }),
      sprint('Sprint lanzado', { series: 1, reps: 5, distance: '20 + 20 m', intensity: '100 %', recovery: 150, recoveryText: '2-3 min',
        place: PLACE.flying, note: 'Velocidad máxima. Relajado en la zona rápida' }),
      sprint('Cambios de dirección 5-10-5', { series: 1, reps: 6, distance: '5-10-5', intensity: '100 %', recovery: 90, recoveryText: '90 s',
        place: PLACE.c5105, note: 'Cronométralo: es tu referencia de agilidad' }),
      sprint('Sprints repetidos', { series: 3, reps: 6, distance: '30 m', intensity: '100 %', recovery: 20, recoveryText: '20 s', seriesRest: 240,
        place: PLACE.m30, note: 'El objetivo es que el último sprint se parezca al primero' }),
      i1515(2, 8, 9),
    ];
  }
  return { code: 'J', title: 'Velocidad y sprints repetidos', subtitle: 'Pista', minutes: 75,
    steps: [WU.pista(), ...main, CD.pista()] };
}

function viernes(phase, week) {
  const min = phase === 'base' ? (week === 3 ? 25 : week === 4 ? 30 : 35) : 30;
  const prog = phase === 'base' ? 4 : 6;
  return { code: 'V', title: 'Pista aeróbica', subtitle: 'Rodaje y progresivos', minutes: 50,
    steps: [WU.rodaje(),
      intervals('Rodaje continuo', { sets: 1, work: min * 60, rest: 0, workLabel: 'Rodaje a RPE 5-6', restLabel: '', rpeTarget: 6,
        desc: `${min} min a ritmo de conversación (RPE 5-6)`, note: 'Suave: mañana toca cuerpo completo' }),
      pw('Progresivos de técnica', prog, 1, 60, '80 m acelerando poco a poco. Vuelta andando', { unit: '80 m' }),
      CD.rodaje()] };
}

function sabado(phase, week) {
  const r = rirFor(phase, week);
  let main, circ;
  const dom = { type: 'dominadas', key: 'dominadas', sets: 3, rest: 120, restText: '2 min',
    note: 'Negativas: sube con un salto desde un banco y baja en unos 4 segundos' };
  const flex = { type: 'bodyweight', key: 'flexiones', sets: 3, repMin: 10, repMax: 15, rir: 3, rest: 90, restText: '90 s',
    note: 'Cuerpo recto. Si molesta el codo, apúntalo' };
  if (phase === 'vuelta') {
    main = [
      pw('Lanzamiento rotacional de balón medicinal contra la pared', 3, 5, 60, 'Balón de 4-6 kg. Gira desde la cadera', { side: true }),
      str('trapbar', 3, 6, 8, 3, 150, '2-3 min', 'Empuja el suelo y mantén el pecho alto'),
      dom,
      str('zancada', 3, 8, 10, 3, 90, '90 s', 'Rodilla alineada con el pie'),
      flex,
    ];
    circ = circuit(3, 40, 20, 90);
  } else if (phase === 'base') {
    main = [
      pw('Lanzamiento rotacional de balón medicinal contra la pared', 3, 6, 60, 'Balón de 4-6 kg. Gira desde la cadera', { side: true }),
      str('trapbar', 4, 6, 8, r, 150, '2-3 min', 'Empuja el suelo y mantén el pecho alto'),
      dom,
      str('zancada', 3, 8, 10, r, 90, '90 s', 'Rodilla alineada con el pie'),
      { ...flex, rir: r },
    ];
    circ = week <= 4 ? circuit(4, 40, 20, 90) : circuit(4, 45, 15, 90);
  } else {
    main = [
      pw('Lanzamiento rotacional de balón medicinal contra la pared', 3, 6, 60, 'Balón más pesado que en la fase base', { side: true }),
      str('trapbar', 4, 4, 6, r, 180, '3 min', 'Empuja el suelo y mantén el pecho alto'),
      dom,
      str('zancadaLateral', 3, 8, 10, r, 90, '90 s', 'Empieza con algo menos de peso que en la zancada caminando'),
      { ...flex, rir: r },
    ];
    circ = week <= 9 ? circuit(4, 45, 15, 60) : circuit(5, 45, 15, 60);
  }
  return { code: 'S', title: 'Cuerpo completo + circuito', subtitle: 'Fuerza y alta intensidad', minutes: 75,
    steps: [WU.completo(), ...main, circ, CD.completo()] };
}

function tests() {
  return { code: 'T', title: 'Tests', subtitle: 'Velocidad, agilidad y sprints repetidos', minutes: 60,
    steps: [WU.pista(),
      sprint('Test · sprint 30 m', { series: 1, reps: 2, distance: '30 m', intensity: '100 %', recovery: 180, recoveryText: '3 min',
        place: PLACE.m30, note: 'Dos intentos. Cuenta el mejor', test: 'sprint30', rpe: false }),
      sprint('Test · 5-10-5', { series: 1, reps: 2, distance: '5-10-5', intensity: '100 %', recovery: 180, recoveryText: '3 min',
        place: PLACE.c5105, note: 'Dos intentos. Cuenta el mejor', test: 'agility', rpe: false }),
      sprint('Test · 6 × 30 m', { series: 1, reps: 6, distance: '30 m', intensity: '100 %', recovery: 20, recoveryText: '20 s',
        place: PLACE.m30, note: 'Descansa 5 min antes de empezar. Máximo en cada sprint', test: 'rsa', rpe: false }),
      CD.pista()] };
}

const BUILDERS = { L: lunes, X: miercoles, J: jueves, V: viernes, S: sabado };

// ---------- Descarga ----------
function deload(session) {
  const half = (n) => Math.max(1, Math.ceil(n / 2));
  const steps = session.steps.map((s) => {
    const c = { ...s, deload: true };
    switch (s.type) {
      case 'strength': case 'bodyweight': case 'dominadas':
        c.sets = Math.min(2, half(s.sets)); if (s.rir !== null && s.type !== 'dominadas') { c.rir = 4; c.rirText = '4'; } break;
      case 'hold': c.sets = Math.min(2, half(s.sets)); break;
      case 'power': c.sets = half(s.sets); break;
      case 'sprint':
        if (s.series > 1) c.series = half(s.series); else c.reps = half(s.reps);
        c.intensity = '85-90 %'; break;
      case 'intervals':
        if (s.sets > 1) c.sets = half(s.sets); else if (s.reps > 1) c.reps = half(s.reps); else c.work = Math.round(s.work / 2);
        c.desc = s.desc + ' · descarga: la mitad'; break;
      case 'circuit': c.rounds = half(s.rounds); break;
    }
    return c;
  });
  return { ...session, steps, subtitle: 'Descarga · ' + session.subtitle, deload: true };
}

// ---------- Calendario del ciclo ----------
// Semana 0 arranque · 1-2 vuelta · 3-6 base · 7 descarga · 8-11 rendimiento · 12 descarga (+ tests)
export function weekInfo(w) {
  if (w < 0) return { week: w, phase: 'antes', label: 'Antes de empezar', cycle: 1, cw: w };
  let cycle = 1, cw = w;
  if (w > 12) { cycle = 2 + Math.floor((w - 13) / 10); cw = 3 + ((w - 13) % 10); }
  let phase, label;
  if (cw === 0) { phase = 'vuelta'; label = 'Semana 0 · arranque'; }
  else if (cw <= 2) { phase = 'vuelta'; label = 'Fase de vuelta'; }
  else if (cw <= 6) { phase = 'base'; label = 'Fase base'; }
  else if (cw === 7) { phase = 'descarga'; label = 'Descarga'; }
  else if (cw <= 11) { phase = 'rend'; label = 'Fase de rendimiento'; }
  else { phase = 'descarga'; label = 'Descarga + tests'; }
  return { week: w, cw, cycle, phase, label, base: cw === 7 ? 'base' : cw === 12 ? 'rend' : phase };
}

export function daysForWeek(w, days) {
  const info = weekInfo(w);
  if (info.phase === 'antes') return [];
  const list = ['L', 'X', 'J', 'S'];
  if (days === 5 && info.cw >= 3) list.splice(3, 0, 'V');
  return list;
}

export function buildSession(w, code, opts = {}) {
  const info = weekInfo(w);
  if ((info.cw === 2 && info.cycle === 1 || info.cw === 12) && code === 'J') return tests();
  if (info.phase === 'descarga') {
    const refWeek = info.cw === 7 ? 6 : 11;
    return deload(BUILDERS[code](info.base, refWeek, opts));
  }
  return BUILDERS[code](info.phase, info.cw, opts);
}

// ---------- Modo exámenes ----------
function findStep(phase, week, code, key, opts) {
  return BUILDERS[code](phase, week, opts).steps.find((s) => s.key === key || s.name === key);
}

export function buildExam(n, w, opts = {}) {
  const info = weekInfo(Math.max(0, w));
  let phase = info.phase === 'descarga' ? info.base : info.phase;
  let week = info.phase === 'descarga' ? (info.cw === 7 ? 6 : 11) : info.cw;
  if (phase === 'antes') { phase = 'vuelta'; week = 1; }
  const pick = (code, key, sets) => ({ ...findStep(phase, week, code, key, opts), sets });
  if (n === 1) {
    return { code: 'E1', title: 'Exámenes · cuerpo completo', subtitle: 'Modo exámenes', minutes: 45, exam: true,
      steps: [WU.corto(), pick('L', 'sentadilla', 3), pick('X', 'press', 3), pick('X', 'jalon', 3),
        { ...hold('Plancha Copenhague', 2, 20, 45, 'Previene lesiones de aductor') }, circuit(2, 40, 20, 90), CD.corto()] };
  }
  if (n === 2) {
    return { code: 'E2', title: 'Exámenes · cuerpo completo + cardio', subtitle: 'Modo exámenes', minutes: 45, exam: true,
      steps: [WU.corto(), pick('S', 'trapbar', 3), pick('X', 'remo', 3), pick('X', 'militar', 3), pick('S', 'dominadas', 3),
        intervals('Intervalos en bici', { sets: 5, work: 60, rest: 60, workLabel: 'Fuerte (RPE 8)', restLabel: 'Suave', rpeTarget: 8,
          desc: '5 × (1 min fuerte / 1 min suave)', note: '10 minutos en total' }), CD.corto()] };
  }
  return { code: 'E3', title: 'Exámenes · carrera (opcional)', subtitle: 'Modo exámenes', minutes: 45, exam: true,
    steps: [WU.pista(),
      sprint('Sprints repetidos', { series: 2, reps: 5, distance: '30 m', intensity: '90 %', recovery: 25, recoveryText: '25 s', seriesRest: 240,
        place: PLACE.m30, note: 'El objetivo es que el último sprint se parezca al primero' }),
      intervals('Intermitente 15-15', { sets: 1, reps: 16, work: 15, rest: 15, workLabel: 'Rápido', restLabel: 'Trote suave', rpeTarget: 8,
        desc: '8 min (15 s rápido / 15 s trote suave)', note: 'Imita el ritmo de un partido' }),
      CD.pista()] };
}

// Lista de pasos de un intervalo guiado: [{label, sec, kind}]
export function intervalPhases(s) {
  const out = [];
  if (s.warmup) out.push({ label: 'Suave para entrar en calor', sec: s.warmup, kind: 'rest' });
  for (let b = 0; b < s.sets; b++) {
    for (let r = 0; r < s.reps; r++) {
      const tag = s.reps > 1 ? `bloque ${b + 1} de ${s.sets} · ${r + 1}/${s.reps}` : (s.sets > 1 ? `${b + 1} de ${s.sets}` : '');
      out.push({ label: s.workLabel, sec: s.work, kind: 'work', tag });
      const lastRep = r === s.reps - 1, lastSet = b === s.sets - 1;
      if (lastRep && lastSet) break;
      if (lastRep && s.setRest) out.push({ label: 'Descanso entre bloques', sec: s.setRest, kind: 'rest' });
      else if (s.rest) out.push({ label: s.restLabel, sec: s.rest, kind: 'rest', tag });
    }
  }
  return out;
}

export function circuitPhases(s) {
  const out = [];
  for (let r = 0; r < s.rounds; r++) {
    s.stations.forEach((st, i) => {
      out.push({ label: st.name, sec: s.work, kind: 'work', tag: `vuelta ${r + 1} de ${s.rounds} · estación ${i + 1}/${s.stations.length}`, round: r });
      const last = i === s.stations.length - 1;
      if (!last) out.push({ label: 'Cambio: ' + s.stations[i + 1].name, sec: s.rest, kind: 'rest', round: r });
      else if (r < s.rounds - 1) out.push({ label: 'Descanso entre vueltas', sec: s.roundRest, kind: 'rest', round: r });
    });
  }
  return out;
}
