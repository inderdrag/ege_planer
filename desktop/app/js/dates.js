// РАБОТА С ДАТАМИ
// Общие помощники для недель и дат, без привязки к предметной области —
// ими пользуются schedule.js, render.js и app.js.

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = воскресенье
  const diff = day === 0 ? -6 : 1 - day; // сдвигаем до понедельника
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISODate(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const tz = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tz * 60000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
}

function isSameDay(a, b) {
  return toISODate(a) === toISODate(b);
}

function daysBetween(fromDate, toDate) {
  const a = new Date(toISODate(fromDate));
  const b = new Date(toISODate(toDate));
  return Math.round((b - a) / 86400000);
}

const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

function formatWeekRange(monday) {
  const sunday = addDays(monday, 6);
  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} – ${sunday.getDate()} ${MONTHS_GEN[monday.getMonth()]}`;
  }
  return `${monday.getDate()} ${MONTHS_GEN[monday.getMonth()]} – ${sunday.getDate()} ${MONTHS_GEN[sunday.getMonth()]}`;
}

// Номер недели по ISO 8601 — просто удобный короткий номер,
// не привязан к дате начала подготовки (мы её не знаем)
function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// "YYYY-MM-DD" -> Date в локальном часовом поясе (без сдвигов из-за UTC)
function parseISODate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Короткий формат для подписей: "24.09"
function formatShortDate(iso) {
  const d = parseISODate(iso);
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');
}
