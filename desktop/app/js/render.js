// ОТРИСОВКА
// Превращаем данные (state + расписание) в HTML. Здесь не принимается
// никаких решений — только показывается то, что посчитали schedule.js и dates.js.

const DOW = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const OFF_LABELS = { off: 'Выходной', sick: 'Болею' };
const OFF_CYCLE = { '': 'off', off: 'sick', sick: '' }; // клик переключает по кругу

const ICONS = {
  wave: '<path d="M4 16c3-8 6-8 8 0s5 8 8 0"/>',
  pen: '<path d="M4 20l4-1 10-10a2.1 2.1 0 0 0-3-3L5 16l-1 4z"/>',
  atom: '<circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><ellipse cx="12" cy="12" rx="9" ry="3.6"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)"/>',
  code: '<polyline points="9,8 4,12 9,16"/><polyline points="15,8 20,12 15,16"/>',
};

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.wave}</svg>`;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- Текущая неделя (зависит от state.weekOffset) ---
function currentWeekInfo(state) {
  const monday = startOfWeek(addDays(new Date(), state.weekOffset * 7));
  return { monday, weekKey: toISODate(monday) };
}

// --- Круговой индикатор дней до экзамена ---
function renderCountdown(state) {
  const days = daysBetween(new Date(), new Date(state.examDate));
  const shown = Math.max(days, 0);
  document.getElementById('countdownNumber').textContent = shown;
  document.getElementById('countdownLabel').textContent = days >= 0 ? 'дней до старта' : 'экзамен уже прошёл';

  const ring = document.getElementById('countdownRingProgress');
  const circumference = 2 * Math.PI * 52;
  const fraction = Math.max(0, Math.min(1, 1 - shown / 365));
  ring.style.strokeDasharray = `${circumference}`;
  ring.style.strokeDashoffset = `${circumference * (1 - fraction)}`;
}

// --- Баллы предмета: подпись и доля заполнения мини-шкалы ---
function scorePct(subject) {
  if (!subject.targetScore) return 0;
  return Math.max(0, Math.min(100, Math.round((subject.currentScore / subject.targetScore) * 100)));
}

function scoreGapText(subject) {
  const gap = subject.targetScore - subject.currentScore;
  return gap <= 0 ? 'цель достигнута 🎯' : `не хватает ${gap} баллов`;
}

function updateSubjectScoreUI(subject) {
  const gapEl = document.querySelector(`[data-gap-for="${subject.id}"]`);
  if (gapEl) gapEl.textContent = scoreGapText(subject);
  const fillEl = document.querySelector(`[data-fill-for="${subject.id}"]`);
  if (fillEl) fillEl.style.width = scorePct(subject) + '%';
}

// --- Мини-график пробников: баллы во времени + линия цели ---
function renderMockChart(subject, mocks) {
  const list = (mocks || [])
    .filter((m) => m.subjectId === subject.id)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));

  if (list.length === 0) {
    return '<div class="mock-empty">Пока нет пробников</div>';
  }

  const w = 100, h = 56, pad = 6;
  const y = (score) => h - pad - (Math.max(0, Math.min(100, score)) / 100) * (h - pad * 2);
  const stepX = list.length > 1 ? (w - pad * 2) / (list.length - 1) : 0;
  const points = list.map((m, i) => [pad + i * stepX, y(m.score)]);
  const pathD = 'M' + points.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L');
  const dots = points.map(([x, yy]) => `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="2.4" fill="${subject.color}"></circle>`).join('');
  const targetY = y(subject.targetScore).toFixed(1);
  const last = list[list.length - 1];

  return `
    <svg class="mock-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">
      <line x1="${pad}" y1="${targetY}" x2="${w - pad}" y2="${targetY}" class="mock-chart__target"/>
      <path d="${pathD}" fill="none" stroke="${subject.color}" stroke-width="2"/>
      ${dots}
    </svg>
    <div class="mock-chart__last">последний: ${last.score} (${formatShortDate(last.date)})</div>`;
}

function updateSubjectMockUI(subject, state) {
  const chartHost = document.querySelector(`[data-mockchart-for="${subject.id}"]`);
  if (chartHost) chartHost.innerHTML = renderMockChart(subject, state.mocks);
  updateSubjectScoreUI(subject);
  const curInput = document.querySelector(`.subject-score-current[data-subject-id="${subject.id}"]`);
  if (curInput) curInput.value = subject.currentScore;
}

// --- Ячейка уровня задания: авто-бейдж (если данных достаточно) или ручной select ---
function levelCellHTML(task, info) {
  if (info && info.auto) {
    const pct = Math.round(info.accuracy * 100);
    const dotClass = info.level === 'слабо' ? 'weak' : info.level === 'сильно' ? 'strong' : 'mid';
    return `<span class="task-level-auto" data-levelcell-for="${task.id}" title="Уровень посчитан автоматически по ${info.total} решённым задачам">
      <span class="task-level-auto__dot task-level-auto__dot--${dotClass}"></span>${info.level} · ${pct}%
    </span>`;
  }
  return `<span data-levelcell-for="${task.id}">
    <select class="subject-task-row__level" data-task-id="${task.id}">
      <option value="слабо"${task.level === 'слабо' ? ' selected' : ''}>слабо</option>
      <option value="средне"${task.level === 'средне' ? ' selected' : ''}>средне</option>
      <option value="сильно"${task.level === 'сильно' ? ' selected' : ''}>сильно</option>
    </select>
  </span>`;
}

function updateTaskLevelUI(taskId, state) {
  const cell = document.querySelector(`[data-levelcell-for="${taskId}"]`);
  if (!cell) return;
  let foundTask = null;
  state.subjects.forEach((s) => s.tasks.forEach((t) => { if (t.id === taskId) foundTask = t; }));
  if (!foundTask) return;
  const info = buildLevelMap(state)[taskId];
  cell.outerHTML = levelCellHTML(foundTask, info);
}

// --- Форма добавления/редактирования задания (вместо окон prompt()) ---
// taskFormState — какая форма сейчас открыта: { subjectId, taskId } | null (taskId = null для добавления)
let taskFormState = null;

function taskFormHTML(subjectId, task) {
  const number = task ? task.number : '';
  const title = task ? task.title : '';
  const level = task ? task.level : 'средне';
  return `
    <div class="task-form">
      <div class="task-form__row">
        <input type="text" class="task-form__number" placeholder="№ (напр. 7 или 19-21)" value="${escapeHtml(number)}">
        <input type="text" class="task-form__title" placeholder="Тема задания" value="${escapeHtml(title)}">
      </div>
      <div class="task-form__row">
        <select class="task-form__level">
          <option value="слабо"${level === 'слабо' ? ' selected' : ''}>слабо</option>
          <option value="средне"${level === 'средне' ? ' selected' : ''}>средне</option>
          <option value="сильно"${level === 'сильно' ? ' selected' : ''}>сильно</option>
        </select>
        <div class="task-form__actions">
          <button type="button" class="task-form__save" data-subject-id="${subjectId}" data-task-id="${task ? task.id : ''}">Сохранить</button>
          <button type="button" class="task-form__cancel">Отмена</button>
        </div>
      </div>
    </div>`;
}

// --- Боковая панель: предметы, задания, баллы, пробники ---
function renderSidebar(state) {
  const nav = document.getElementById('subjectsNav');
  nav.innerHTML = '';
  const levelMap = buildLevelMap(state);

  state.subjects.forEach((subject) => {
    const wrap = document.createElement('div');
    wrap.className = 'subject-block';

    const chip = document.createElement('button');
    chip.className = 'subject-chip';
    chip.type = 'button';
    chip.style.setProperty('--chip-color', subject.color);
    chip.style.setProperty('--chip-bg', subject.bg);
    chip.innerHTML = `
      <span class="subject-chip__icon">${iconSvg(subject.icon)}</span>
      <span class="subject-chip__info">
        ${subject.name}
        <span class="subject-chip__score-track"><span class="subject-chip__score-fill" data-fill-for="${subject.id}" style="width:${scorePct(subject)}%"></span></span>
      </span>`;
    chip.addEventListener('click', () => wrap.classList.toggle('subject-block--open'));

    const taskPanel = document.createElement('div');
    taskPanel.className = 'subject-tasks';

    subject.tasks.forEach((task) => {
      // Если сейчас редактируем именно это задание — показываем форму вместо строки
      if (taskFormState && taskFormState.subjectId === subject.id && taskFormState.taskId === task.id) {
        const formHost = document.createElement('div');
        formHost.innerHTML = taskFormHTML(subject.id, task);
        taskPanel.appendChild(formHost.firstElementChild);
        return;
      }
      const row = document.createElement('div');
      row.className = 'subject-task-row';
      row.innerHTML = `
        <span class="subject-task-row__num">№${task.number}</span>
        <span class="subject-task-row__title" title="${escapeHtml(task.title)}">${task.title}</span>
        ${levelCellHTML(task, levelMap[task.id])}
        <button type="button" class="subject-task-log" data-task-id="${task.id}" title="Записать результат занятия">+</button>
        <button type="button" class="subject-task-edit" data-subject-id="${subject.id}" data-task-id="${task.id}" title="Редактировать">✎</button>
        <button type="button" class="subject-task-del" data-subject-id="${subject.id}" data-task-id="${task.id}" title="Удалить">🗑</button>`;
      taskPanel.appendChild(row);
    });

    // Форма добавления нового задания — показываем вместо кнопки "+ задание"
    if (taskFormState && taskFormState.subjectId === subject.id && taskFormState.taskId === null) {
      const formHost = document.createElement('div');
      formHost.innerHTML = taskFormHTML(subject.id, null);
      taskPanel.appendChild(formHost.firstElementChild);
    } else {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'subject-task-add';
      addBtn.textContent = '+ задание';
      addBtn.dataset.subjectId = subject.id;
      taskPanel.appendChild(addBtn);
    }

    const scores = document.createElement('div');
    scores.className = 'subject-scores';
    scores.innerHTML = `
      <label>Текущий
        <input type="number" min="0" max="100" class="subject-score-current" data-subject-id="${subject.id}" value="${subject.currentScore}">
      </label>
      <label>Цель
        <input type="number" min="0" max="100" class="subject-score-target" data-subject-id="${subject.id}" value="${subject.targetScore}">
      </label>
      <span class="subject-scores__gap" data-gap-for="${subject.id}">${scoreGapText(subject)}</span>`;
    taskPanel.appendChild(scores);

    const mocks = document.createElement('div');
    mocks.className = 'subject-mocks';
    mocks.innerHTML = `
      <div class="subject-mocks__head">
        <span>Пробники</span>
        <button type="button" class="subject-mock-add" data-subject-id="${subject.id}">+ пробник</button>
      </div>
      <div class="subject-mocks__chart" data-mockchart-for="${subject.id}">${renderMockChart(subject, state.mocks)}</div>`;
    taskPanel.appendChild(mocks);

    wrap.appendChild(chip);
    wrap.appendChild(taskPanel);
    if (taskFormState && taskFormState.subjectId === subject.id) wrap.classList.add('subject-block--open');
    nav.appendChild(wrap);
  });
}

// --- Сетка недели ---
function renderWeek(schedule, state, monday, weekKey) {
  document.getElementById('weekTitleNum').textContent = `Неделя ${isoWeekNumber(monday)}`;
  document.getElementById('weekTitleRange').textContent = formatWeekRange(monday);

  const grid = document.getElementById('weekGrid');
  grid.innerHTML = '';

  const doneMap = (state.completions && state.completions[weekKey]) || {};
  const today = new Date();

  DAY_KEYS.forEach((dayKey, idx) => {
    const dateObj = addDays(monday, idx);
    const iso = toISODate(dateObj);
    const isToday = isSameDay(dateObj, today);
    const offState = state.daysOff[iso] || '';

    const section = document.createElement('section');
    section.className = 'day'
      + (dayKey === 'sun' ? ' day--weekend' : '')
      + (isToday ? ' day--today' : '')
      + (offState ? ' day--off' : '');

    const badge = isToday ? '<span class="day__badge">сегодня</span>' : '';
    const offBtnLabel = OFF_LABELS[offState] || '···';
    const title = document.createElement('h3');
    title.className = 'day__title';
    title.innerHTML = `${DOW[idx]} <span class="day__date">${dateObj.getDate()}</span>${badge}
      <button type="button" class="day__off-btn day__off-btn--${offState || 'none'}" data-date="${iso}" title="Отметить выходной/болезнь">${offBtnLabel}</button>`;
    section.appendChild(title);

    const list = document.createElement('ul');
    list.className = 'task-list';

    const dayTasks = schedule[dayKey] || [];
    if (dayTasks.length === 0) {
      const emptyLabel = OFF_LABELS[offState] || 'День отдыха';
      list.innerHTML = `<li class="task task--empty"><span class="task__text task__text--muted">${emptyLabel}</span></li>`;
    } else {
      dayTasks.forEach((t) => {
        const li = document.createElement('li');
        li.className = 'task';
        li.style.setProperty('--task-color', t.subject.color);
        const checked = doneMap[t.task.id] ? ' checked' : '';
        li.innerHTML = `
          <label>
            <input type="checkbox" class="task__check" data-task-id="${t.task.id}"${checked}>
            <span class="task__box"></span>
            <span class="task__text">${t.subject.name} №${t.task.number}: ${t.task.title} · ${t.minutes} мин</span>
          </label>
          <button type="button" class="task__play" data-task-id="${t.task.id}" data-subject-id="${t.subject.id}" title="Запустить помодоро">▶</button>`;
        list.appendChild(li);
      });
    }

    section.appendChild(list);
    grid.appendChild(section);
  });
}

// --- Статистика недели: сколько минут реально отработано по предмету ---
// Если по предмету есть реальные сессии таймера за эту неделю — используем их
// (это и есть "реальное отработанное время"); иначе — грубая оценка по галочкам.
function computeWeeklyStats(schedule, state, weekKey) {
  const doneMap = (state.completions && state.completions[weekKey]) || {};
  const monday = parseISODate(weekKey);
  const sunday = addDays(monday, 6);

  const bySubject = {};
  state.subjects.forEach((s) => {
    bySubject[s.id] = { id: s.id, name: s.name, color: s.color, planned: 0, done: 0, timed: false };
  });

  DAY_KEYS.forEach((dayKey) => {
    (schedule[dayKey] || []).forEach((entry) => {
      const bucket = bySubject[entry.subject.id];
      if (bucket) bucket.planned += entry.minutes;
    });
  });

  (state.sessions || []).forEach((ses) => {
    const bucket = bySubject[ses.subjectId];
    if (!bucket) return;
    const d = parseISODate(ses.date);
    if (d < monday || d > sunday) return;
    bucket.done += ses.minutes;
    bucket.timed = true;
  });

  DAY_KEYS.forEach((dayKey) => {
    (schedule[dayKey] || []).forEach((entry) => {
      const bucket = bySubject[entry.subject.id];
      if (!bucket || bucket.timed) return;
      if (doneMap[entry.task.id]) bucket.done += entry.minutes;
    });
  });

  return Object.values(bySubject);
}

function renderStats(stats) {
  const el = document.getElementById('weekStats');
  if (!el) return;
  el.innerHTML = '<div class="week-stats__title">Отработано за неделю</div>';
  stats.forEach((s) => {
    const pct = s.planned > 0 ? Math.min(100, Math.round((s.done / s.planned) * 100)) : 0;
    const row = document.createElement('div');
    row.className = 'stat-row';
    row.innerHTML = `
      <span class="stat-row__name">${s.name}</span>
      <div class="stat-row__track"><div class="stat-row__fill" style="width:${pct}%; background:${s.color}"></div></div>
      <span class="stat-row__value">${s.done} / ${s.planned} мин${s.timed ? ' ⏱' : ''}</span>`;
    el.appendChild(row);
  });
}

// --- Плашка таймера занятия (помодоро) ---
function renderTimerBar(timer) {
  const bar = document.getElementById('timerBar');
  if (!bar) return;
  if (!timer) {
    bar.hidden = true;
    bar.innerHTML = '';
    return;
  }
  bar.hidden = false;
  bar.className = 'timer-bar timer-bar--' + timer.phase;
  const mm = String(Math.floor(timer.remaining / 60)).padStart(2, '0');
  const ss = String(timer.remaining % 60).padStart(2, '0');
  bar.innerHTML = `
    <span class="timer-bar__phase">${timer.phase === 'work' ? '🎯 Работа' : '☕ Перерыв'}</span>
    <span class="timer-bar__label">${escapeHtml(timer.label)}</span>
    <span class="timer-bar__clock">${mm}:${ss}</span>
    <button type="button" id="timerPause">${timer.paused ? '▶' : '⏸'}</button>
    <button type="button" id="timerStop">✕</button>`;
}

// --- Сборка: пересчитать расписание + сетку + статистику для текущей недели ---
function refreshSchedule(state) {
  const { monday, weekKey } = currentWeekInfo(state);
  const schedule = generateSchedule(state, weekKey);
  renderWeek(schedule, state, monday, weekKey);
  renderStats(computeWeeklyStats(schedule, state, weekKey));
  return { schedule, weekKey };
}

function refreshStats(state) {
  const { weekKey } = currentWeekInfo(state);
  const schedule = generateSchedule(state, weekKey);
  renderStats(computeWeeklyStats(schedule, state, weekKey));
}

function renderAll(state) {
  renderCountdown(state);
  renderSidebar(state);
  refreshSchedule(state);
}
