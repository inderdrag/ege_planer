// ХРАНИЛИЩЕ ДАННЫХ
// Состояние приложения: предметы -> задания (с номером и уровнем усвоения)
// плюс сколько часов в неделю пользователь готов заниматься.
// Пока всё живёт в localStorage браузера — бэкенд не нужен.

const STORAGE_KEY = 'ege-planner-state';

// Чем хуже усвоена тема — тем больше "веса" она получит при распределении времени
const LEVEL_WEIGHT = { 'слабо': 3, 'средне': 2, 'сильно': 1 };

// Ближайшее 25 мая — используем как разумную дату по умолчанию,
// пока пользователь не укажет свою в поле "Дата экзамена"
function defaultExamDate() {
  const now = new Date();
  const year = now.getMonth() < 4 ? now.getFullYear() : now.getFullYear() + 1;
  return `${year}-05-25`;
}

function defaultState() {
  return {
    examDate: defaultExamDate(),
    weekOffset: 0, // 0 = текущая неделя, -1 = прошлая, +1 = следующая
    weeklyHours: 14,
    subjects: [
      {
        id: 'math', name: 'Математика', color: '#5B8DFF', bg: 'rgba(91,141,255,0.16)', icon: 'wave',
        currentScore: 55, targetScore: 80,
        // Полный список заданий профильной математики — 20 номеров, часть 1 (1-13) и часть 2 (14-20)
        tasks: [
          { id: 't1', number: 1, title: 'Планиметрия', level: 'средне' },
          { id: 't2', number: 2, title: 'Векторы', level: 'сильно' },
          { id: 't3', number: 3, title: 'Стереометрия', level: 'средне' },
          { id: 't4', number: 4, title: 'Начала теории вероятностей', level: 'средне' },
          { id: 't5', number: 5, title: 'Вероятности сложных событий', level: 'слабо' },
          { id: 't6', number: 6, title: 'Случайные величины и распределения', level: 'слабо' },
          { id: 't7', number: 7, title: 'Простейшие уравнения', level: 'сильно' },
          { id: 't8', number: 8, title: 'Вычисления и преобразования', level: 'средне' },
          { id: 't9', number: 9, title: 'Производная и первообразная', level: 'слабо' },
          { id: 't10', number: 10, title: 'Задачи с прикладным содержанием', level: 'средне' },
          { id: 't11', number: 11, title: 'Текстовые задачи', level: 'слабо' },
          { id: 't12', number: 12, title: 'Графики функций', level: 'средне' },
          { id: 't13', number: 13, title: 'Финансовая грамотность', level: 'средне' },
          { id: 't14', number: 14, title: 'Уравнения', level: 'средне' },
          { id: 't15', number: 15, title: 'Стереометрическая задача', level: 'слабо' },
          { id: 't16', number: 16, title: 'Неравенства', level: 'слабо' },
          { id: 't17', number: 17, title: 'Задача на моделирование', level: 'средне' },
          { id: 't18', number: 18, title: 'Планиметрическая задача', level: 'средне' },
          { id: 't19', number: 19, title: 'Задача с параметром', level: 'слабо' },
          { id: 't20', number: 20, title: 'Числа и их свойства', level: 'средне' },
        ],
      },
      {
        id: 'rus', name: 'Русский язык', color: '#FF8A5B', bg: 'rgba(255,138,91,0.16)', icon: 'pen',
        currentScore: 62, targetScore: 85,
        // Полный список заданий по русскому языку — 27 номеров (1-26 с кратким ответом + 27 сочинение)
        tasks: [
          { id: 'r1', number: 1, title: 'Средства связи предложений в микротексте', level: 'средне' },
          { id: 'r2', number: 2, title: 'Лексическое значение выделенного слова', level: 'средне' },
          { id: 'r3', number: 3, title: 'Характеристики текста', level: 'средне' },
          { id: 'r4', number: 4, title: 'Орфоэпические нормы', level: 'слабо' },
          { id: 'r5', number: 5, title: 'Паронимы и лексическая сочетаемость', level: 'слабо' },
          { id: 'r6', number: 6, title: 'Лексическая ошибка', level: 'средне' },
          { id: 'r7', number: 7, title: 'Морфологические нормы', level: 'средне' },
          { id: 'r8', number: 8, title: 'Синтаксические нормы', level: 'слабо' },
          { id: 'r9', number: 9, title: 'Правописание корней', level: 'средне' },
          { id: 'r10', number: 10, title: 'Приставки, Ъ/Ь, Ы/И после приставок', level: 'средне' },
          { id: 'r11', number: 11, title: 'Правописание суффиксов', level: 'слабо' },
          { id: 'r12', number: 12, title: 'Окончания и суффиксы глагольных форм', level: 'средне' },
          { id: 'r13', number: 13, title: 'НЕ/НИ', level: 'средне' },
          { id: 'r14', number: 14, title: 'Слитное, дефисное и раздельное написание', level: 'слабо' },
          { id: 'r15', number: 15, title: 'Н/НН', level: 'слабо' },
          { id: 'r16', number: 16, title: 'Пунктуация при однородных членах', level: 'средне' },
          { id: 'r17', number: 17, title: 'Пунктуация при обособлении', level: 'средне' },
          { id: 'r18', number: 18, title: 'Вводные конструкции, обращения, междометия', level: 'средне' },
          { id: 'r19', number: 19, title: 'Пунктуация в сложноподчинённом предложении', level: 'слабо' },
          { id: 'r20', number: 20, title: 'Сложное предложение с разными видами связи', level: 'слабо' },
          { id: 'r21', number: 21, title: 'Пунктуационный анализ', level: 'средне' },
          { id: 'r22', number: 22, title: 'Изобразительно-выразительные средства', level: 'средне' },
          { id: 'r23', number: 23, title: 'Содержание текста', level: 'сильно' },
          { id: 'r24', number: 24, title: 'Функционально-смысловые типы речи', level: 'средне' },
          { id: 'r25', number: 25, title: 'Лексический анализ большого текста', level: 'слабо' },
          { id: 'r26', number: 26, title: 'Средства связи предложений в большом тексте', level: 'средне' },
          { id: 'r27', number: 27, title: 'Сочинение-рассуждение по исходному тексту', level: 'слабо' },
        ],
      },
      {
        id: 'phys', name: 'Физика', color: '#3DDC97', bg: 'rgba(61,220,151,0.16)', icon: 'atom',
        currentScore: 48, targetScore: 75,
        // Полный список заданий по физике — 26 номеров, часть 1 (1-20) и часть 2 (21-26)
        tasks: [
          { id: 'p1', number: 1, title: 'Кинематика', level: 'средне' },
          { id: 'p2', number: 2, title: 'Динамика', level: 'средне' },
          { id: 'p3', number: 3, title: 'Законы сохранения в механике', level: 'слабо' },
          { id: 'p4', number: 4, title: 'Статика. Механические колебания и волны', level: 'слабо' },
          { id: 'p5', number: 5, title: 'Механика: анализ утверждений', level: 'средне' },
          { id: 'p6', number: 6, title: 'Механика: соответствие и изменение величин', level: 'средне' },
          { id: 'p7', number: 7, title: 'Молекулярная физика', level: 'средне' },
          { id: 'p8', number: 8, title: 'Термодинамика', level: 'слабо' },
          { id: 'p9', number: 9, title: 'Молекулярная физика и термодинамика: анализ утверждений', level: 'средне' },
          { id: 'p10', number: 10, title: 'Молекулярная физика и термодинамика: соответствие', level: 'средне' },
          { id: 'p11', number: 11, title: 'Электростатика. Постоянный ток', level: 'сильно' },
          { id: 'p12', number: 12, title: 'Магнитное поле. Электромагнитная индукция', level: 'слабо' },
          { id: 'p13', number: 13, title: 'Электромагнитные колебания и волны. Оптика', level: 'слабо' },
          { id: 'p14', number: 14, title: 'Электродинамика: анализ утверждений', level: 'средне' },
          { id: 'p15', number: 15, title: 'Электродинамика: соответствие и изменение величин', level: 'слабо' },
          { id: 'p16', number: 16, title: 'Физика атома и атомного ядра', level: 'средне' },
          { id: 'p17', number: 17, title: 'Квантовая физика: анализ и соответствие', level: 'слабо' },
          { id: 'p18', number: 18, title: 'Физические явления и закономерности', level: 'средне' },
          { id: 'p19', number: 19, title: 'Измерения и погрешности', level: 'слабо' },
          { id: 'p20', number: 20, title: 'Планирование эксперимента', level: 'слабо' },
          { id: 'p21', number: 21, title: 'Качественные задачи по электродинамике', level: 'средне' },
          { id: 'p22', number: 22, title: 'Расчётные задачи по механике', level: 'средне' },
          { id: 'p23', number: 23, title: 'Расчётные задачи по молекулярной физике и термодинамике', level: 'средне' },
          { id: 'p24', number: 24, title: 'Сложные задачи по молекулярной физике и термодинамике', level: 'слабо' },
          { id: 'p25', number: 25, title: 'Сложные задачи по электродинамике', level: 'слабо' },
          { id: 'p26', number: 26, title: 'Сложные задачи по механике с обоснованием модели', level: 'средне' },
        ],
      },
      {
        id: 'inf', name: 'Информатика', color: '#38D6D6', bg: 'rgba(56,214,214,0.16)', icon: 'code',
        currentScore: 50, targetScore: 80,
        // Полный список заданий по информатике — 27 номеров
        // (19-21 — одна тема "Выигрышная стратегия"/теория игр на три номера сразу)
        tasks: [
          { id: 'i1', number: 1, title: 'Анализ информационных моделей', level: 'средне' },
          { id: 'i2', number: 2, title: 'Построение таблиц истинности логических выражений', level: 'средне' },
          { id: 'i3', number: 3, title: 'Поиск информации в реляционных базах данных', level: 'средне' },
          { id: 'i4', number: 4, title: 'Кодирование и декодирование информации', level: 'средне' },
          { id: 'i5', number: 5, title: 'Анализ и построение алгоритмов для исполнителей', level: 'средне' },
          { id: 'i6', number: 6, title: 'Определение результатов работы простейших алгоритмов', level: 'сильно' },
          { id: 'i7', number: 7, title: 'Кодирование и декодирование информации. Передача информации', level: 'средне' },
          { id: 'i8', number: 8, title: 'Перебор слов и системы счисления', level: 'слабо' },
          { id: 'i9', number: 9, title: 'Работа с таблицами', level: 'средне' },
          { id: 'i10', number: 10, title: 'Организация компьютерных сетей. Адресация', level: 'слабо' },
          { id: 'i11', number: 11, title: 'Вычисление количества информации', level: 'средне' },
          { id: 'i12', number: 12, title: 'Выполнение алгоритмов для исполнителей', level: 'сильно' },
          { id: 'i13', number: 13, title: 'Оператор присваивания и ветвления. Перебор вариантов, построение дерева', level: 'слабо' },
          { id: 'i14', number: 14, title: 'Кодирование чисел. Системы счисления', level: 'средне' },
          { id: 'i15', number: 15, title: 'Преобразование логических выражений', level: 'слабо' },
          { id: 'i16', number: 16, title: 'Рекурсивные алгоритмы', level: 'слабо' },
          { id: 'i17', number: 17, title: 'Обработка числовой последовательности', level: 'средне' },
          { id: 'i18', number: 18, title: 'Робот-сборщик монет', level: 'средне' },
          { id: 'i19', number: '19-21', title: 'Выигрышная стратегия (теория игр)', level: 'слабо' },
          { id: 'i22', number: 22, title: 'Многопроцессорные системы', level: 'слабо' },
          { id: 'i23', number: 23, title: 'Алгоритмы обхода графа', level: 'слабо' },
          { id: 'i24', number: 24, title: 'Обработка символьных строк', level: 'средне' },
          { id: 'i25', number: 25, title: 'Обработка целочисленной информации', level: 'средне' },
          { id: 'i26', number: 26, title: 'Сортировка целочисленной информации', level: 'средне' },
          { id: 'i27', number: 27, title: 'Программирование', level: 'слабо' },
        ],
      },
    ],
    // отметки о выполнении по неделям: { "2026-09-21": { 0: true, 3: true }, ... }
    // ключ недели — дата понедельника (YYYY-MM-DD), ключ внутри — номер слота
    // задания в плане недели (0..5), а не id задания: так одно и то же
    // задание, выпавшее в неделе дважды, отмечается отдельно
    completions: {},
    // результаты занятий: { id, date, taskId, subjectId, solved, correct }
    // — из них автоматически считается уровень задания
    logs: [],
    // время по таймеру: { id, date, taskId, subjectId, minutes }
    sessions: [],
    // пробники: { id, date, subjectId, score }
    mocks: [],
    // выходные и болезни: { "2026-09-24": "off" | "sick" }
    daysOff: {},
    // замороженные планы недель (текущей и прошлых), чтобы уже прошедшие
    // дни не перемешивались при пересчёте уровней: { weekKey: [{subjectId, taskId}, ...] }
    plans: {},
    settings: { workMin: 25, breakMin: 5 },
    // шпаргалки/шаблоны по предметам — изначально сидируются из встроенных
    // в js/templates.js (INFO_TEMPLATES и т.д.), дальше это обычные данные:
    // можно добавлять новые номера и коды, можно удалять любые, включая
    // встроенные
    cheatsheets: defaultCheatsheets(),
  };
}

// Сид для state.cheatsheets — читает встроенные константы из js/templates.js.
// Вызывается только из defaultState()/normalizeState(), то есть уже после
// того, как все <script> загрузились, так что INFO_TEMPLATES и т.п. к этому
// моменту точно определены, хотя templates.js физически подключается позже data.js
function defaultCheatsheets() {
  const empty = () => ({ order: [], items: {} });
  const seedInfo = (typeof INFO_TEMPLATES !== 'undefined')
    ? { order: INFO_TEMPLATE_ORDER.slice(), items: JSON.parse(JSON.stringify(INFO_TEMPLATES)) }
    : empty();
  return {
    math: empty(),
    rus: empty(),
    phys: empty(),
    inf: seedInfo,
  };
}

// Приводим любой сохранённый/импортированный объект к актуальному формату:
// недостающие поля берутся из значений по умолчанию
function normalizeState(saved) {
  const base = defaultState();
  const src = saved && typeof saved === 'object' ? saved : {};
  const merged = Object.assign({}, base, src);

  ['completions', 'daysOff', 'plans'].forEach((k) => {
    if (!merged[k] || typeof merged[k] !== 'object' || Array.isArray(merged[k])) merged[k] = {};
  });
  ['logs', 'sessions', 'mocks'].forEach((k) => {
    if (!Array.isArray(merged[k])) merged[k] = [];
  });
  merged.settings = Object.assign({}, base.settings, src.settings || {});
  if (typeof merged.weekOffset !== 'number') merged.weekOffset = 0;
  if (!merged.examDate) merged.examDate = base.examDate;
  if (!(merged.weeklyHours > 0)) merged.weeklyHours = base.weeklyHours;

  const subjects = Array.isArray(src.subjects) ? src.subjects : base.subjects;
  merged.subjects = subjects.map((s) => Object.assign(
    { currentScore: 0, targetScore: 80, icon: 'wave', tasks: [] }, s
  ));

  if (!merged.cheatsheets || typeof merged.cheatsheets !== 'object') merged.cheatsheets = defaultCheatsheets();
  ['math', 'rus', 'phys', 'inf'].forEach((id) => {
    const bucket = merged.cheatsheets[id];
    if (!bucket || typeof bucket !== 'object') { merged.cheatsheets[id] = { order: [], items: {} }; return; }
    if (!Array.isArray(bucket.order)) bucket.order = Object.keys(bucket.items || {});
    if (!bucket.items || typeof bucket.items !== 'object') bucket.items = {};
  });

  return merged;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (e) {
    console.warn('Не удалось прочитать сохранённые данные, беру значения по умолчанию', e);
  }
  return defaultState();
}

// ==========================================================================
// АВТОМАТИЧЕСКИЙ УРОВЕНЬ ЗАДАНИЙ
// По результатам занятий (сколько решил / сколько верно) считаем точность
// по заданию и переводим её в уровень «слабо / средне / сильно».
// Новые результаты весят больше старых, поэтому уровень растёт вместе с тобой.
// Пока решено меньше MIN_SOLVED_FOR_AUTO задач — остаётся уровень, выставленный вручную.
// ==========================================================================
const MIN_SOLVED_FOR_AUTO = 3;   // минимум решённых задач, чтобы доверять статистике
const LOG_MEMORY = 5;            // сколько последних занятий учитываем
const LOG_DECAY = 0.7;           // во сколько раз каждое более раннее занятие "весит" меньше
const ACC_WEAK = 0.5;            // точность ниже 50% — слабо
const ACC_STRONG = 0.8;          // точность от 80% — сильно

function levelFromAccuracy(acc) {
  if (acc < ACC_WEAK) return 'слабо';
  if (acc < ACC_STRONG) return 'средне';
  return 'сильно';
}

// Возвращает { [taskId]: { level, auto, accuracy, total } } для всех заданий
function buildLevelMap(state) {
  const byTask = {};
  state.logs.forEach((l) => {
    (byTask[l.taskId] = byTask[l.taskId] || []).push(l);
  });

  const map = {};
  state.subjects.forEach((subject) => {
    subject.tasks.forEach((task) => {
      // логи добавляются по порядку, поэтому "новые сначала" = перевёрнутый массив
      const logs = (byTask[task.id] || []).slice().reverse();
      const total = logs.reduce((sum, l) => sum + l.solved, 0);
      let level = task.level;
      let auto = false;
      let accuracy = null;

      if (total >= MIN_SOLVED_FOR_AUTO) {
        let num = 0;
        let den = 0;
        logs.slice(0, LOG_MEMORY).forEach((l, i) => {
          const w = Math.pow(LOG_DECAY, i);
          num += w * l.correct;
          den += w * l.solved;
        });
        if (den > 0) {
          accuracy = num / den;
          level = levelFromAccuracy(accuracy);
          auto = true;
        }
      }
      map[task.id] = { level, auto, accuracy, total };
    });
  });
  return map;
}

// Последний пробник по предмету (по дате; при равных датах — добавленный позже)
function latestMock(state, subjectId) {
  let best = null;
  state.mocks.forEach((m) => {
    if (m.subjectId !== subjectId) return;
    if (!best || m.date >= best.date) best = m;
  });
  return best;
}

// «Текущий балл» предмета берём из последнего пробника (если пробники есть)
function syncScoresFromMocks(state) {
  state.subjects.forEach((s) => {
    const m = latestMock(state, s.id);
    if (m) s.currentScore = m.score;
  });
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Не удалось сохранить данные', e);
  }
}
