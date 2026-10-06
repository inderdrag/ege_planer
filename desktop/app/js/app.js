// ТОЧКА СБОРКИ: загружаем данные, рисуем интерфейс, слушаем действия пользователя.
// Стараемся перерисовывать только то, что реально изменилось —
// иначе поля ввода теряют фокус, а открытая панель предмета закрывается.

let state = loadState();

document.getElementById('hoursInput').value = state.weeklyHours;
document.getElementById('examDateInput').value = state.examDate;
document.getElementById('pomodoroWork').value = state.settings.workMin;
document.getElementById('pomodoroBreak').value = state.settings.breakMin;
renderAll(state);

// --- Вкладки "План" / "Шпаргалки" ---
function switchView(view) {
  const isPlan = view === 'plan';
  document.getElementById('viewPlan').hidden = !isPlan;
  document.getElementById('templatesView').hidden = isPlan;
  document.getElementById('tabPlan').classList.toggle('view-tab--active', isPlan);
  document.getElementById('tabTemplates').classList.toggle('view-tab--active', !isPlan);
  if (!isPlan) renderTemplates(state);
}
document.getElementById('tabPlan').addEventListener('click', () => switchView('plan'));
document.getElementById('tabTemplates').addEventListener('click', () => switchView('templates'));

// --- Дата экзамена: меняет только счётчик ---
document.getElementById('examDateInput').addEventListener('change', (e) => {
  if (!e.target.value) return;
  state.examDate = e.target.value;
  saveState(state);
  renderCountdown(state);
});

// --- Часов в неделю: меняет только расписание, панель предметов не трогаем ---
document.getElementById('hoursInput').addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val > 0) {
    state.weeklyHours = val;
    saveState(state);
    refreshSchedule(state);
  }
});

// --- Настройки помодоро: применяются к следующему запуску таймера ---
document.getElementById('pomodoroWork').addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val > 0) { state.settings.workMin = val; saveState(state); }
});
document.getElementById('pomodoroBreak').addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val) && val > 0) { state.settings.breakMin = val; saveState(state); }
});

// --- Переключение недель ---
document.getElementById('prevWeek').addEventListener('click', () => {
  state.weekOffset -= 1;
  saveState(state);
  refreshSchedule(state);
});
document.getElementById('nextWeek').addEventListener('click', () => {
  state.weekOffset += 1;
  saveState(state);
  refreshSchedule(state);
});

// --- Отметить задачу выполненной (привязано к конкретной неделе) ---
document.getElementById('weekGrid').addEventListener('change', (e) => {
  if (!e.target.classList.contains('task__check')) return;
  const taskId = e.target.dataset.taskId;
  const { weekKey } = currentWeekInfo(state);
  if (!state.completions[weekKey]) state.completions[weekKey] = {};
  state.completions[weekKey][taskId] = e.target.checked;

  // При отметке "выполнено" сразу спрашиваем результат — на нём
  // строится автоматический уровень усвоения. Отмену не логируем.
  if (e.target.checked) {
    let found = null;
    state.subjects.forEach((s) => s.tasks.forEach((t) => { if (t.id === taskId) found = { subject: s, task: t }; }));
    const solvedRaw = prompt('Сколько задач решил?');
    if (solvedRaw !== null && solvedRaw.trim() !== '') {
      const solved = Math.max(0, parseInt(solvedRaw, 10) || 0);
      if (solved > 0) {
        const correctRaw = prompt(`Сколько из ${solved} — правильно?`);
        if (correctRaw !== null) {
          const correct = Math.max(0, Math.min(solved, parseInt(correctRaw, 10) || 0));
          state.logs.push({
            id: 'log' + Date.now(), date: toISODate(new Date()),
            taskId, subjectId: found ? found.subject.id : null, solved, correct,
          });
          updateTaskLevelUI(taskId, state);
        }
      }
    }
  }

  saveState(state);
  refreshStats(state);

  const li = e.target.closest('.task');
  li.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.03)' }, { transform: 'scale(1)' }],
    { duration: 200, easing: 'ease-out' }
  );
});

// --- Выходной / болезнь: цикл "обычный день -> выходной -> болею -> обычный" ---
document.getElementById('weekGrid').addEventListener('click', (e) => {
  if (!e.target.classList.contains('day__off-btn')) return;
  const date = e.target.dataset.date;
  const current = state.daysOff[date] || '';
  const next = OFF_CYCLE[current];
  if (next) state.daysOff[date] = next;
  else delete state.daysOff[date];
  saveState(state);
  refreshSchedule(state);
});

// ==========================================================================
// ТАЙМЕР ЗАНЯТИЯ (ПОМОДОРО)
// Состояние таймера живёт только в памяти вкладки (не в state/localStorage) —
// это текущий процесс, а не данные для сохранения. В state попадает только
// итог — сколько минут реально отработано (state.sessions).
// ==========================================================================
let timer = null; // { taskId, subjectId, label, phase, remaining, workedSeconds, paused, intervalId }

function startTimer(taskId, subjectId, label) {
  stopTimerNow(); // если что-то уже шло — сохраняем и начинаем заново
  timer = {
    taskId, subjectId, label,
    phase: 'work',
    remaining: state.settings.workMin * 60,
    workedSeconds: 0,
    paused: false,
    intervalId: null,
  };
  timer.intervalId = setInterval(tickTimer, 1000);
  renderTimerBar(timer);
}

function tickTimer() {
  if (!timer || timer.paused) return;
  timer.remaining -= 1;
  if (timer.phase === 'work') timer.workedSeconds += 1;

  if (timer.remaining <= 0) {
    if (timer.phase === 'work') {
      logTimerSession();
      timer.phase = 'break';
      timer.remaining = state.settings.breakMin * 60;
    } else {
      finishTimer();
      return;
    }
  }
  renderTimerBar(timer);
}

function logTimerSession() {
  if (!timer) return;
  const minutes = Math.round(timer.workedSeconds / 60);
  if (minutes > 0) {
    state.sessions.push({
      id: 'ses' + Date.now(), date: toISODate(new Date()),
      taskId: timer.taskId, subjectId: timer.subjectId, minutes,
    });
    saveState(state);
    refreshStats(state);
  }
  timer.workedSeconds = 0;
}

function finishTimer() {
  if (timer && timer.intervalId) clearInterval(timer.intervalId);
  timer = null;
  renderTimerBar(null);
}

function stopTimerNow() {
  if (!timer) return;
  logTimerSession();
  clearInterval(timer.intervalId);
  timer = null;
  renderTimerBar(null);
}

document.getElementById('weekGrid').addEventListener('click', (e) => {
  const btn = e.target.closest('.task__play');
  if (!btn) return;
  const taskId = btn.dataset.taskId;
  const subjectId = btn.dataset.subjectId;
  let label = '';
  state.subjects.forEach((s) => s.tasks.forEach((t) => { if (t.id === taskId) label = s.name + ' №' + t.number; }));
  startTimer(taskId, subjectId, label || 'Занятие');
});

document.getElementById('timerBar').addEventListener('click', (e) => {
  if (e.target.id === 'timerPause') {
    if (!timer) return;
    timer.paused = !timer.paused;
    renderTimerBar(timer);
  }
  if (e.target.id === 'timerStop') stopTimerNow();
});

// --- Записать результат занятия вручную (кнопка "+" у задания в списке предметов) ---
document.getElementById('subjectsNav').addEventListener('click', (e) => {
  if (!e.target.classList.contains('subject-task-log')) return;
  e.stopPropagation();
  const taskId = e.target.dataset.taskId;
  let found = null;
  state.subjects.forEach((s) => s.tasks.forEach((t) => { if (t.id === taskId) found = { subject: s, task: t }; }));
  if (!found) return;

  const solvedRaw = prompt(`«${found.task.title}» — сколько задач решил?`);
  if (solvedRaw === null || solvedRaw.trim() === '') return;
  const solved = Math.max(0, parseInt(solvedRaw, 10) || 0);
  if (solved === 0) return;
  const correctRaw = prompt(`Сколько из ${solved} — правильно?`);
  if (correctRaw === null) return;
  const correct = Math.max(0, Math.min(solved, parseInt(correctRaw, 10) || 0));

  state.logs.push({
    id: 'log' + Date.now(), date: toISODate(new Date()),
    taskId, subjectId: found.subject.id, solved, correct,
  });
  saveState(state);
  updateTaskLevelUI(taskId, state);
});

// --- Пробник: добавить балл предмета -> обновить график и текущий балл ---
document.getElementById('subjectsNav').addEventListener('click', (e) => {
  if (!e.target.classList.contains('subject-mock-add')) return;
  e.stopPropagation();
  const subject = state.subjects.find((s) => s.id === e.target.dataset.subjectId);
  if (!subject) return;
  const raw = prompt(`Пробник по предмету «${subject.name}» — сколько баллов набрал (0-100)?`);
  if (raw === null || raw.trim() === '') return;
  const score = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));

  state.mocks.push({ id: 'mock' + Date.now(), date: toISODate(new Date()), subjectId: subject.id, score });
  syncScoresFromMocks(state);
  saveState(state);
  updateSubjectMockUI(subject, state);
});

// --- Изменить уровень усвоения задания вручную (пока не накопилось авто-данных) ---
document.getElementById('subjectsNav').addEventListener('change', (e) => {
  if (!e.target.classList.contains('subject-task-row__level')) return;
  const id = e.target.dataset.taskId;
  state.subjects.forEach((s) => s.tasks.forEach((t) => {
    if (t.id === id) t.level = e.target.value;
  }));
  saveState(state);
  refreshSchedule(state);
});

// --- Текущий / целевой балл -> точечное обновление, без перерисовки панели ---
document.getElementById('subjectsNav').addEventListener('input', (e) => {
  const isCurrent = e.target.classList.contains('subject-score-current');
  const isTarget = e.target.classList.contains('subject-score-target');
  if (!isCurrent && !isTarget) return;
  const subject = state.subjects.find((s) => s.id === e.target.dataset.subjectId);
  if (!subject) return;
  const val = Math.max(0, Math.min(100, parseInt(e.target.value, 10) || 0));
  if (isCurrent) subject.currentScore = val;
  else subject.targetScore = val;
  saveState(state);
  updateSubjectScoreUI(subject);
});

// ==========================================================================
// ЗАДАНИЯ: форма добавления/редактирования вместо окон prompt(), + удаление
// ==========================================================================
document.getElementById('subjectsNav').addEventListener('click', (e) => {
  // Открыть форму добавления
  if (e.target.classList.contains('subject-task-add')) {
    e.stopPropagation();
    taskFormState = { subjectId: e.target.dataset.subjectId, taskId: null };
    renderSidebar(state);
    return;
  }
  // Открыть форму редактирования
  if (e.target.classList.contains('subject-task-edit')) {
    e.stopPropagation();
    taskFormState = { subjectId: e.target.dataset.subjectId, taskId: e.target.dataset.taskId };
    renderSidebar(state);
    return;
  }
  // Удалить задание
  if (e.target.classList.contains('subject-task-del')) {
    e.stopPropagation();
    const subject = state.subjects.find((s) => s.id === e.target.dataset.subjectId);
    const task = subject && subject.tasks.find((t) => t.id === e.target.dataset.taskId);
    if (!task) return;
    if (confirm(`Удалить задание №${task.number} «${task.title}»?`)) {
      subject.tasks = subject.tasks.filter((t) => t.id !== task.id);
      saveState(state);
      renderAll(state);
    }
    return;
  }
  // Отмена формы
  if (e.target.classList.contains('task-form__cancel')) {
    e.stopPropagation();
    taskFormState = null;
    renderSidebar(state);
    return;
  }
  // Сохранить форму (добавление или редактирование)
  if (e.target.classList.contains('task-form__save')) {
    e.stopPropagation();
    const form = e.target.closest('.task-form');
    const subjectId = e.target.dataset.subjectId;
    const taskId = e.target.dataset.taskId;
    const numberRaw = form.querySelector('.task-form__number').value.trim();
    const title = form.querySelector('.task-form__title').value.trim();
    const level = form.querySelector('.task-form__level').value;
    if (!title) { alert('Укажи тему задания'); return; }
    const number = numberRaw === '' ? '?' : (isNaN(Number(numberRaw)) ? numberRaw : Number(numberRaw));
    const subject = state.subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    if (taskId) {
      const task = subject.tasks.find((t) => t.id === taskId);
      if (task) { task.number = number; task.title = title; task.level = level; }
    } else {
      subject.tasks.push({ id: 't' + Date.now(), number, title, level });
    }
    taskFormState = null;
    saveState(state);
    renderAll(state);
  }
});

// --- Добавить предмет ---
document.getElementById('addSubjectBtn').addEventListener('click', () => {
  const name = prompt('Название предмета:');
  if (!name) return;
  const palette = ['#5B8DFF', '#FF8A5B', '#3DDC97', '#38D6D6', '#B98CFF', '#FFC24B'];
  const color = palette[state.subjects.length % palette.length];
  state.subjects.push({
    id: 's' + Date.now(), name, color, bg: color + '29', icon: 'wave',
    currentScore: 0, targetScore: 80, tasks: [],
  });
  saveState(state);
  renderAll(state);
});

// ==========================================================================
// ШПАРГАЛКИ: добавление/удаление номеров и кодов прямо из интерфейса
// ==========================================================================
document.getElementById('templatesView').addEventListener('click', (e) => {
  const t = e.target;

  if (t.classList.contains('cheat-entry-add')) {
    cheatFormOpenFor = t.dataset.subjectId + ':__new__';
    renderCheatCards();
    return;
  }
  if (t.classList.contains('cheat-entry-cancel')) {
    cheatFormOpenFor = null;
    renderCheatCards();
    return;
  }
  if (t.classList.contains('cheat-entry-save')) {
    const subjectId = t.dataset.subjectId;
    const form = t.closest('.cheat-form');
    const num = form.querySelector('.cheat-entry-form__num').value.trim();
    const title = form.querySelector('.cheat-entry-form__title').value.trim();
    if (!num || !title) { alert('Укажи номер и тему'); return; }
    const bucket = cheatBucket(state, subjectId);
    if (bucket.items[num]) { alert('Такой номер уже есть в списке'); return; }
    bucket.items[num] = { title, prototypes: [] };
    bucket.order.push(num);
    cheatFormOpenFor = subjectId + ':' + num; // сразу откроем форму добавления кода
    saveState(state);
    renderCheatCards();
    return;
  }

  if (t.classList.contains('cheat-code-add')) {
    cheatFormOpenFor = t.dataset.subjectId + ':' + t.dataset.num;
    renderCheatCards();
    return;
  }
  if (t.classList.contains('cheat-code-cancel')) {
    cheatFormOpenFor = null;
    renderCheatCards();
    return;
  }
  if (t.classList.contains('cheat-code-save')) {
    const subjectId = t.dataset.subjectId;
    const num = t.dataset.num;
    const form = t.closest('.cheat-form');
    const label = form.querySelector('.cheat-code-form__label').value.trim() || 'Шаблон';
    const problem = form.querySelector('.cheat-code-form__problem').value.trim();
    const code = form.querySelector('.cheat-code-form__code').value;
    if (!code.trim()) { alert('Вставь код или формулу'); return; }
    const bucket = cheatBucket(state, subjectId);
    const entry = bucket.items[num];
    if (!entry) return;
    entry.prototypes.push({ name: label, problem, codes: [{ label, code }] });
    cheatFormOpenFor = null;
    saveState(state);
    renderCheatCards();
    return;
  }

  if (t.classList.contains('cheat-entry-del')) {
    const subjectId = t.dataset.subjectId;
    const num = t.dataset.num;
    const bucket = cheatBucket(state, subjectId);
    const entry = bucket.items[num];
    if (!entry) return;
    if (confirm(`Удалить номер ${num} («${entry.title}») со всеми кодами?`)) {
      delete bucket.items[num];
      bucket.order = bucket.order.filter((n) => n !== num);
      saveState(state);
      renderCheatCards();
    }
    return;
  }
  if (t.classList.contains('cheat-code-del')) {
    const subjectId = t.dataset.subjectId;
    const num = t.dataset.num;
    const idx = parseInt(t.dataset.protoIdx, 10);
    const bucket = cheatBucket(state, subjectId);
    const entry = bucket.items[num];
    if (!entry) return;
    if (confirm('Удалить этот код?')) {
      entry.prototypes.splice(idx, 1);
      saveState(state);
      renderCheatCards();
    }
  }
});

// ==========================================================================
// ЭКСПОРТ / ИМПОРТ ДАННЫХ
// ==========================================================================
document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ege-planner-${toISODate(new Date())}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => {
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', (e) => {
  const file = e.target.files[0];
  e.target.value = ''; // чтобы можно было выбрать тот же файл ещё раз
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = normalizeState(parsed);
      saveState(state);
      document.getElementById('hoursInput').value = state.weeklyHours;
      document.getElementById('examDateInput').value = state.examDate;
      document.getElementById('pomodoroWork').value = state.settings.workMin;
      document.getElementById('pomodoroBreak').value = state.settings.breakMin;
      taskFormState = null;
      renderAll(state);
      alert('Данные импортированы');
    } catch (err) {
      alert('Не удалось прочитать файл — это точно экспорт из этого приложения?');
    }
  };
  reader.readAsText(file);
});
