// АЛГОРИТМ СОСТАВЛЕНИЯ РАСПИСАНИЯ
//
// Правило: один учебный день — одно задание. В неделе 6 "слотов" (Пн-Сб),
// воскресенье свободно. Для каждого слота "вытягивается" пара предмет+задание —
// случайно, но с весом: слабые темы и слабые предметы выпадают чаще, поэтому
// одно и то же задание может повториться в течение недели (это осознанно).
//
// Выбор двухуровневый:
//   1) предмет — вес равен среднему "весу слабости" его заданий, чтобы предмет
//      с 27 заданиями не забивал неделю просто за счёт количества;
//   2) задание внутри предмета — вес по уровню (слабо 3 / средне 2 / сильно 1).
//   Уровень берётся из buildLevelMap(): либо выставленный вручную, либо
//   автоматически пересчитанный по результатам занятий.
//
// "Случайность" детерминирована датой недели: одна и та же неделя всегда даёт
// один и тот же расклад, а разные недели — разный.
//
// Чтобы прошедшие дни не перемешивались после пересчёта уровней, план текущей
// и прошлых недель ЗАМОРАЖИВАЕТСЯ (state.plans). Будущие недели всегда считаются
// заново — они подстраиваются под свежие уровни.
//
// Выходные/болезнь: слоты раскладываются по доступным дням по порядку. Если
// день отмечен как выходной — его задание сдвигается на следующий доступный
// день (при необходимости — на воскресенье). Если доступных дней стало меньше,
// чем заданий, задания делят день, а время на каждое уменьшается.

const STUDY_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const ALL_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const PICKS_PER_WEEK = STUDY_DAYS.length;

// Детерминированный генератор случайных чисел на основе строки-сида
function seededRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

// Взвешенный случайный выбор одного элемента массива { weight, ... }
function weightedPick(items, rand) {
  const total = items.reduce((sum, x) => sum + x.weight, 0) || 1;
  let r = rand() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function currentMondayKey() {
  return toISODate(startOfWeek(new Date()));
}

// Быстрый доступ к предмету и заданию по id задания
function buildTaskLookup(state) {
  const lookup = {};
  state.subjects.forEach((subject) => {
    subject.tasks.forEach((task) => {
      lookup[task.id] = { subject, task };
    });
  });
  return lookup;
}

// Вытягиваем count пар { subjectId, taskId }
function drawPicks(state, levelMap, seed, count) {
  const subjects = state.subjects.filter((s) => s.tasks.length > 0);
  if (subjects.length === 0) return [];

  const weightOf = (task) => LEVEL_WEIGHT[levelMap[task.id].level] || 2;
  const subjectChoices = subjects.map((s) => ({
    subject: s,
    weight: s.tasks.reduce((sum, t) => sum + weightOf(t), 0) / s.tasks.length,
  }));

  const rand = seededRandom(seed);
  const picks = [];
  for (let i = 0; i < count; i++) {
    const subject = weightedPick(subjectChoices, rand).subject;
    const task = weightedPick(subject.tasks.map((t) => ({ task: t, weight: weightOf(t) })), rand).task;
    picks.push({ subjectId: subject.id, taskId: task.id });
  }
  return picks;
}

// Превращаем сохранённые picks в актуальные: если задание удалили,
// на его месте (тот же слот!) появляется новое — так отметки не съезжают
function resolvePicks(state, levelMap, stored, weekKey) {
  const lookup = buildTaskLookup(state);
  const result = [];
  for (let i = 0; i < PICKS_PER_WEEK; i++) {
    const p = stored[i];
    if (p && lookup[p.taskId]) {
      result.push(p);
    } else {
      const fill = drawPicks(state, levelMap, weekKey + ':fill:' + i, 1);
      if (fill.length) result.push(fill[0]);
    }
  }
  return result;
}

// Прошлые и текущая недели — замороженные, будущие — считаются "вживую"
function getWeekPicks(state, levelMap, weekKey) {
  if (weekKey <= currentMondayKey()) {
    if (!state.plans[weekKey]) {
      state.plans[weekKey] = drawPicks(state, levelMap, weekKey, PICKS_PER_WEEK);
      saveState(state);
    }
    return resolvePicks(state, levelMap, state.plans[weekKey], weekKey);
  }
  return drawPicks(state, levelMap, weekKey, PICKS_PER_WEEK);
}

// Расписание недели: { mon: [ { subject, task, minutes, slot } ], ..., sun: [...] }
function generateSchedule(state, weekKey) {
  const schedule = {};
  ALL_DAYS.forEach((d) => { schedule[d] = []; });

  const levelMap = buildLevelMap(state);
  const picks = getWeekPicks(state, levelMap, weekKey || 'default');
  if (picks.length === 0) return schedule;

  // какие дни недели доступны для занятий (не выходной и не болезнь)
  const monday = parseISODate(weekKey);
  const available = ALL_DAYS.filter((_, i) => !state.daysOff[toISODate(addDays(monday, i))]);
  if (available.length === 0) return schedule;

  // слоты раскладываем по доступным дням по порядку; лишние (если дней
  // не хватило) делят день с другими заданиями
  const perDay = {};
  picks.forEach((pick, slot) => {
    const day = available[slot % available.length];
    (perDay[day] = perDay[day] || []).push({ pick, slot });
  });

  const lookup = buildTaskLookup(state);
  const baseMinutes = Math.max(15, Math.round((state.weeklyHours * 60) / PICKS_PER_WEEK / 5) * 5);

  ALL_DAYS.forEach((day) => {
    const list = perDay[day] || [];
    const minutes = list.length
      ? Math.max(15, Math.round(baseMinutes / list.length / 5) * 5)
      : 0;
    list.forEach(({ pick, slot }) => {
      const found = lookup[pick.taskId];
      schedule[day].push({ subject: found.subject, task: found.task, minutes, slot });
    });
  });

  return schedule;
}
