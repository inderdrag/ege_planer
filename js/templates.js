// ШАБЛОНЫ ПО ИНФОРМАТИКЕ
// Копилка шаблонных решений на Python по номерам заданий ЕГЭ.
// Чтобы добавить новый номер или ещё один прототип — просто дополни
// объект INFO_TEMPLATES ниже и, если это новый номер, впиши его
// в INFO_TEMPLATE_ORDER в нужном месте.

const INFO_TEMPLATES = {
  '2': {
    title: 'Логические функции и таблицы истинности',
    prototypes: [
      {
        name: 'Прототип 1 (нулевые строки)',
        problem: 'Логическая функция F задаётся выражением ¬(x→w) ∨ (y→z) ∨ ¬y. Дан частично заполненный фрагмент таблицы истинности (неповторяющиеся строки, значения F — нули). Определить, какому столбцу соответствует каждая переменная.',
        codes: [
          { label: 'Через вложенные for', code: `print("x y z w")
for x in range(2):
    for y in range(2):
        for z in range(2):
            for w in range(2):
                # тут пишем функцию из задания
                f = (not (x <= w)) or (y <= z) or (not y)
                if not f:
                    print(x, y, z, w)` },
          { label: 'Через dict() и zip()', code: `def f(x, y, z, w):
    # тут пишем функцию из задания
    return (not (x <= w)) or (y <= z) or (not y)

from itertools import *

for a1, a2, a3, a4, a5, a6, a7 in product([0, 1], repeat=7):
    # составляем таблицу из задания
    t = [(a1, 1, a2, 0), (a3, 0, 1, a4), (a5, a6, 0, a7)]
    if len(t) == len(set(t)):
        for p in permutations("xyzw"):
            if [f(**dict(zip(p, s))) for s in t] == [0, 0, 0]:
                print(*p)` },
        ],
      },
      {
        name: 'Прототип 2 (единичные строки)',
        problem: 'Логическая функция F задаётся выражением (y→x) ∧ ¬z ∧ w. Фрагмент таблицы истинности содержит неповторяющиеся строки со значением F = 1.',
        codes: [
          { label: 'Через itertools', code: `print("x y z w")
from itertools import *
for x, y, z, w in product([0, 1], repeat=4):
    # тут пишем функцию из задания
    f = (y <= x) and (not z) and w
    if f:
        print(x, y, z, w)` },
          { label: 'Через dict() и zip()', code: `def f(x, y, z, w):
    # тут пишем функцию из задания
    return (y <= x) and (not z) and w

from itertools import *

for a1, a2, a3, a4, a5, a6 in product([0, 1], repeat=6):
    # составляем таблицу из задания
    t = [(1, 0, a1, a2), (1, 1, a3, a4), (a5, 1, 0, a6)]
    if len(t) == len(set(t)):
        for p in permutations("xyzw"):
            if [f(**dict(zip(p, s))) for s in t] == [1, 1, 1]:
                print(*p)` },
        ],
      },
      {
        name: 'Прототип 3 (2 функции — редкий, но встречается)',
        problem: 'Функции F1 = (w→z)≡(y→x) и F2 = (w→z)∧(¬x≡y). В отличие от прототипов 1-2, значения в таблице содержат и 0, и 1.',
        codes: [
          { label: 'Шаблон', code: `print("x y z w f1 f2")
from itertools import *
for x, y, z, w in product([0, 1], repeat=4):
    # тут пишем функции из задания
    f1 = (w <= z) == (y <= x)
    f2 = (w <= z) and ((not x) == y)
    print(x, y, z, w, int(f1), int(f2))` },
        ],
      },
    ],
  },

  '8': {
    title: 'Комбинаторика: перебор слов, кодов и чисел',
    prototypes: [
      {
        name: 'Прототип 1 (слова под номерами)',
        problem: 'Все пятибуквенные слова из букв Ф, О, К, У, С записаны в алфавитном порядке и пронумерованы. Найти номер слова с заданными условиями (без буквы Ф, ровно две буквы У).',
        codes: [
          { label: 'Через вложенные for', code: `num = 0
# сколько букв в словах, столько и вложенных for
# буквы в строке — в алфавитном порядке
for l1 in "КОСУФ":
    for l2 in "КОСУФ":
        for l3 in "КОСУФ":
            for l4 in "КОСУФ":
                for l5 in "КОСУФ":
                    w = l1 + l2 + l3 + l4 + l5
                    num += 1
                    # тут пишем условие из вопроса
                    if w.count('Ф') == 0 and w.count('У') == 2:
                        print(num)
                        # берём последний выведенный номер` },
        ],
      },
      {
        name: 'Прототип 2 (коды с ограничениями)',
        problem: 'Сергей составляет 6-буквенные коды из К, А, Л, И, Й с ограничениями на букву Й (не более раза, не первая/последняя, не рядом с И). Сколько различных кодов?',
        codes: [
          { label: 'Через itertools', code: `from itertools import *
k = 0
for w in product("КАЛИЙ", repeat=6):
    s = "".join(w)
    # тут расписываем все условия
    if s.count("Й") <= 1 and s[0] != "Й" and s[-1] != "Й" \\
       and "ЙИ" not in s and "ИЙ" not in s:
        k += 1
print(k)` },
        ],
      },
      {
        name: 'Прототип 3 (числа в системе счисления)',
        problem: 'Сколько чисел, восьмеричная запись которых состоит из пяти цифр, не начинается с нечётных, не оканчивается на 2 и 6, содержит не более двух цифр 7?',
        codes: [
          { label: 'Через itertools', code: `from itertools import *
k = 0
# задаём алфавит нужной системы счисления
for w in product('01234567', repeat=5):
    if w[0] not in '01357' and w[-1] not in '26' and \\
       w.count('7') <= 2:
        k += 1
print(k)` },
        ],
      },
      {
        name: 'Прототип 4 (перестановки букв слова)',
        problem: 'Оля переставляет буквы слова «ТИМАШЕВСК», выбирая слова с согласной в начале/конце и ровно двумя гласными подряд где-то внутри.',
        codes: [
          { label: 'Через permutations', code: `from itertools import *
gl = "АИЕ"
sogl = "ТМШВСК"
k = 0
for w in permutations("ТИМАШЕВСК"):
    s = ''.join(w)
    for i in range(1, len(s) - 3):
        if s[0] in sogl and s[-1] in sogl and s[i] in gl \\
           and s[i+1] in gl and s[i+2] in sogl:
            k += 1
print(k)` },
        ],
      },
    ],
  },

  '12': {
    title: 'Обработка строк алгоритмом «Редактор»',
    prototypes: [
      {
        name: 'Прототип 1 (прогон алгоритма на конкретной строке)',
        problem: 'Дана программа для Редактора с ПОКА/ЕСЛИ/заменить. Найти результат применения к строке из 100 цифр 9.',
        codes: [
          { label: 'Шаблон', code: `# тут собираем строку из задания
s = "9" * 100
# тут переписываем алгоритм из задания
while "33333" in s or "999" in s:
    if "33333" in s:
        s = s.replace("33333", "99", 1)
    else:
        s = s.replace("999", "3", 1)
print(s)` },
        ],
      },
      {
        name: 'Прототип 2 (исходная строка неизвестна)',
        problem: 'Известны итоговые количества цифр 1/2/3 после применения алгоритма — нужно перебором найти длину исходной строки.',
        codes: [
          { label: 'Шаблон', code: `for k1 in range(0, 50):
    for k2 in range(0, 50):
        for k3 in range(0, 50):
            s = "0" + "1" * k1 + "2" * k2 + "3" * k3 + "0"
            while "00" not in s:
                s = s.replace("01", "21022", 1)
                s = s.replace("02", "310", 1)
                s = s.replace("03", "230112", 1)
            if s.count("1") == 104 and s.count("2") == 39 \\
               and s.count("3") == 83:
                print(k1 + k2 + k3 + 2)
                exit()` },
        ],
      },
    ],
  },

  '13': {
    title: 'IP-адреса и маски сети',
    prototypes: [
      {
        name: 'Стандартный прототип',
        problem: 'Сеть задана IP-адресом и маской. Нужно посчитать IP-адреса сети, удовлетворяющие условию на количество единиц в двоичной записи. Шаблон подходит только для такого/похожего прототипа.',
        codes: [
          { label: 'Шаблон', code: `from ipaddress import *
k = 0
for ip in ip_network("112.160.0.0/255.240.0.0", 0):
    if bin(int(ip))[2:].count("1") % 3 != 0:
        k += 1
print(k)` },
        ],
      },
    ],
  },

  '14': {
    title: 'Системы счисления в арифметических выражениях',
    prototypes: [
      {
        name: 'Прототип 1 (сумма/количество цифр в выражении)',
        problem: 'Значение арифметического выражения записали в системе счисления с заданным основанием. Найти сумму (или количество) цифр, удовлетворяющих условию.',
        codes: [
          { label: 'Шаблон', code: `x = 3 * 289**2024 + 81 * 49**121 - 9 * 16**81 - 6011
s = 0
while x:
    d = x % 31
    if d <= 17:
        s += d
    x //= 31
print(s)` },
        ],
      },
      {
        name: 'Прототип 2 (найти x в выражении)',
        problem: 'Значение выражения 3^100 − x записали в троичной системе счисления. Найти наибольший x с заданным числом нулей в записи.',
        codes: [
          { label: 'Шаблон', code: `def tr(n):
    s = ""
    while n:
        s = str(n % 3) + s
        n //= 3
    return s

for x in range(2030, 0, -1):
    n = 3**100 - x
    s = tr(n)
    if s.count("0") == 5:
        print(x)
        break` },
        ],
      },
    ],
  },

  '15': {
    title: 'Логические выражения: тождественная истинность',
    prototypes: [
      {
        name: 'Прототип 1 (наибольший отрезок)',
        problem: 'Найти наибольшую длину отрезка A, при которой формула с отрезками P и Q тождественно истинна.',
        codes: [
          { label: 'Шаблон', code: `line = [0.5 * i for i in range(-1000, 1000)]
for x in line:
    P = 15 <= x <= 27
    Q = 30 <= x <= 45
    A = 1
    f = ((not P) or Q) <= (not A)
    if f:
        print(x)` },
        ],
      },
      {
        name: 'Прототип 2 (наименьший отрезок)',
        problem: 'Найти наименьшую длину отрезка A, при которой формула тождественно истинна.',
        codes: [
          { label: 'Шаблон', code: `line = [0.5 * i for i in range(-1000, 1000)]
for x in line:
    P = 25 <= x <= 98
    Q = 1 <= x <= 42
    A = 0
    f = Q <= (((not P) and Q) <= A)
    if not f:
        print(x)` },
        ],
      },
      {
        name: 'Прототип 3 (делители)',
        problem: 'Через ДЕЛ(n, m) найти наибольшее A, при котором логическое выражение о делимости тождественно истинно.',
        codes: [
          { label: 'Шаблон', code: `def Del(n, m):
    return n % m == 0

def f(x, A):
    return Del(x, 33) <= ((not Del(x, A)) <= (not Del(x, 242)))

for A in range(1, 1000):
    if all(f(x, A) for x in range(1, 1000)):
        print(A)` },
        ],
      },
      {
        name: 'Прототип 4 (поразрядная конъюнкция)',
        problem: 'Найти наименьшее A, при котором формула с поразрядной конъюнкцией (&) тождественно истинна.',
        codes: [
          { label: 'Шаблон', code: `def f(x, A):
    return (x & 2735 != 0) <= ((x & 1234 == 0) <= (x & A != 0))

for A in range(1, 10000):
    if all(f(x, A) for x in range(1, 10000)):
        print(A)
        break` },
        ],
      },
      {
        name: 'Прототип 5 (неравенства)',
        problem: 'Найти наименьшее неотрицательное A, при котором выражение с неравенствами тождественно истинно для всех x, y.',
        codes: [
          { label: 'Шаблон', code: `def f(x, y, A):
    return (x * y < A) or (x < y) or (9 < x)

for A in range(0, 1000):
    if all(f(x, y, A) for x in range(0, 1000)
           for y in range(0, 1000)):
        print(A)
        break` },
        ],
      },
    ],
  },

  '19-21': {
    title: 'Выигрышная стратегия (теория игр)',
    note: 'Шаблоны здесь почти всегда есть, но у каждого свои — единого варианта нет.',
    prototypes: [],
  },

  '23': {
    title: 'Рекурсивные функции исполнителя',
    prototypes: [
      {
        name: 'Прототип 1 (на увеличение)',
        problem: 'У исполнителя команды +1/+2/+3. Сколько программ переводят число 5 в 11 так, что траектория проходит через 7?',
        codes: [
          { label: 'Шаблон', code: `def f(x, y):
    if x > y:
        return 0
    if x == y:
        return 1
    return f(x + 1, y) + f(x + 2, y) + f(x + 3, y)

print(f(5, 7) * f(7, 11))` },
        ],
      },
      {
        name: 'Прототип 2 (на уменьшение)',
        problem: 'У исполнителя команды −2 и div 2. Сколько программ переводят 32 в 1 так, что траектория проходит через 14?',
        codes: [
          { label: 'Шаблон', code: `def f(x, y):
    if x < y:
        return 0
    if x == y:
        return 1
    return f(x - 2, y) + f(x // 2, y)

print(f(32, 14) * f(14, 1))` },
        ],
      },
    ],
  },
};

// Порядок карточек в интерфейсе — новые номера дописывай сюда же
const INFO_TEMPLATE_ORDER = ['2', '8', '12', '13', '14', '15', '19-21', '23'];

// ==========================================================================
// ШПАРГАЛКИ ПО ОСТАЛЬНЫМ ПРЕДМЕТАМ
// Сами данные теперь живут в state.cheatsheets (data.js) — добавляются и
// удаляются прямо из интерфейса, для любого предмета. Эти константы остались
// только как исходный набор для информатики, которым state.cheatsheets.inf
// заполняется один раз при самом первом запуске (см. defaultCheatsheets()).
// ==========================================================================

// escapeHtml — общая, определена в render.js

let activeCheatSubject = 'inf'; // с информатики есть что показать сразу
let cheatSearchQuery = '';
// какая форма сейчас открыта: "<subjectId>:__new__" (новый номер),
// "<subjectId>:<номер>" (новый код к этому номеру) или null
let cheatFormOpenFor = null;
let cheatState = null; // ссылка на общий state — выставляется в renderTemplates()

function cheatBucket(state, subjectId) {
  if (!state.cheatsheets[subjectId]) state.cheatsheets[subjectId] = { order: [], items: {} };
  return state.cheatsheets[subjectId];
}

function cheatEntryFormEl(subjectId) {
  const wrap = document.createElement('div');
  wrap.className = 'cheat-form';
  wrap.innerHTML = `
    <div class="cheat-form__row">
      <input type="text" class="cheat-entry-form__num" placeholder="Номер (напр. 5 или 19-21)">
      <input type="text" class="cheat-entry-form__title" placeholder="Тема">
    </div>
    <div class="cheat-form__actions">
      <button type="button" class="cheat-entry-save" data-subject-id="${subjectId}">Сохранить</button>
      <button type="button" class="cheat-entry-cancel">Отмена</button>
    </div>`;
  return wrap;
}

function cheatCodeFormEl(subjectId, num) {
  const wrap = document.createElement('div');
  wrap.className = 'cheat-form';
  wrap.innerHTML = `
    <input type="text" class="cheat-code-form__label" placeholder="Название варианта (необязательно)">
    <textarea class="cheat-code-form__problem" placeholder="Условие задачи (необязательно)" rows="2"></textarea>
    <textarea class="cheat-code-form__code" placeholder="Код или формула" rows="6"></textarea>
    <div class="cheat-form__actions">
      <button type="button" class="cheat-code-save" data-subject-id="${subjectId}" data-num="${num}">Сохранить</button>
      <button type="button" class="cheat-code-cancel">Отмена</button>
    </div>`;
  return wrap;
}

function buildTplCard(num, entry, subjectId) {
  const card = document.createElement('div');
  card.className = 'tpl-card';

  const headerRow = document.createElement('div');
  headerRow.className = 'tpl-card__header-row';

  const header = document.createElement('button');
  header.type = 'button';
  header.className = 'tpl-card__header';
  header.innerHTML = `<span class="tpl-card__num">№${num}</span><span class="tpl-card__title">${entry.title}</span>`;
  header.addEventListener('click', () => card.classList.toggle('tpl-card--open'));

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'tpl-card__del cheat-entry-del';
  delBtn.title = 'Удалить этот номер целиком';
  delBtn.textContent = '🗑';
  delBtn.dataset.subjectId = subjectId;
  delBtn.dataset.num = num;

  headerRow.appendChild(header);
  headerRow.appendChild(delBtn);

  const body = document.createElement('div');
  body.className = 'tpl-card__body';

  if (entry.note) {
    const note = document.createElement('p');
    note.className = 'tpl-note';
    note.textContent = entry.note;
    body.appendChild(note);
  }

  entry.prototypes.forEach((proto, protoIdx) => {
    const protoEl = document.createElement('div');
    protoEl.className = 'tpl-proto';
    const head = (proto.name ? `<div class="tpl-proto__name">${proto.name}</div>` : '')
      + (proto.problem ? `<div class="tpl-proto__problem">${proto.problem}</div>` : '');
    protoEl.innerHTML = head;

    proto.codes.forEach((c) => {
      const block = document.createElement('div');
      block.className = 'tpl-code';
      block.innerHTML = `
        <div class="tpl-code__bar">
          <span>${c.label}</span>
          <span class="tpl-code__bar-actions">
            <button type="button" class="tpl-code__copy">Копировать</button>
            <button type="button" class="tpl-code__del cheat-code-del" data-subject-id="${subjectId}" data-num="${num}" data-proto-idx="${protoIdx}" title="Удалить этот код">🗑</button>
          </span>
        </div>
        <pre><code>${escapeHtml(c.code)}</code></pre>`;
      block.querySelector('.tpl-code__copy').addEventListener('click', (ev) => {
        navigator.clipboard.writeText(c.code).then(() => {
          ev.target.textContent = 'Скопировано';
          setTimeout(() => { ev.target.textContent = 'Копировать'; }, 1500);
        });
      });
      protoEl.appendChild(block);
    });

    body.appendChild(protoEl);
  });

  if (cheatFormOpenFor === subjectId + ':' + num) {
    body.appendChild(cheatCodeFormEl(subjectId, num));
    card.classList.add('tpl-card--open');
  } else {
    const addCodeBtn = document.createElement('button');
    addCodeBtn.type = 'button';
    addCodeBtn.className = 'tpl-add-code cheat-code-add';
    addCodeBtn.textContent = '+ код';
    addCodeBtn.dataset.subjectId = subjectId;
    addCodeBtn.dataset.num = num;
    body.appendChild(addCodeBtn);
  }

  card.appendChild(headerRow);
  card.appendChild(body);
  return card;
}

// Перерисовать только список карточек (не трогая вкладки/поле поиска —
// иначе поиск терял бы фокус на каждой букве)
function renderCheatCards() {
  const host = document.getElementById('tplCards');
  if (!host || !cheatState) return;
  host.innerHTML = '';

  const bucket = cheatBucket(cheatState, activeCheatSubject);
  const q = cheatSearchQuery.trim().toLowerCase();
  const matched = bucket.order.filter((num) => {
    const entry = bucket.items[num];
    if (!entry) return false;
    if (!q) return true;
    return String(num).toLowerCase().includes(q) || entry.title.toLowerCase().includes(q);
  });

  if (matched.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tpl-empty';
    empty.textContent = q
      ? 'Ничего не нашлось по запросу.'
      : 'Пока пусто — добавь номер задания кнопкой ниже.';
    host.appendChild(empty);
  } else {
    matched.forEach((num) => host.appendChild(buildTplCard(num, bucket.items[num], activeCheatSubject)));
  }

  if (cheatFormOpenFor === activeCheatSubject + ':__new__') {
    host.appendChild(cheatEntryFormEl(activeCheatSubject));
  } else {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'tpl-add-entry cheat-entry-add';
    addBtn.textContent = '+ добавить номер';
    addBtn.dataset.subjectId = activeCheatSubject;
    host.appendChild(addBtn);
  }
}

// Вкладка целиком: переключатель предметов (по цветам из state.subjects) + поиск + карточки
function renderTemplates(state) {
  cheatState = state;
  const el = document.getElementById('templatesView');
  if (!el) return;

  el.innerHTML = `
    <div class="tpl-subject-tabs" id="tplSubjectTabs"></div>
    <input type="text" id="tplSearch" class="tpl-search" placeholder="Поиск по номеру или теме...">
    <div id="tplCards"></div>`;

  const tabsEl = document.getElementById('tplSubjectTabs');
  state.subjects.forEach((subject) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tpl-subject-tab' + (subject.id === activeCheatSubject ? ' tpl-subject-tab--active' : '');
    btn.style.setProperty('--tab-color', subject.color);
    btn.textContent = subject.name;
    btn.addEventListener('click', () => {
      activeCheatSubject = subject.id;
      cheatFormOpenFor = null;
      renderTemplates(state);
    });
    tabsEl.appendChild(btn);
  });

  const searchEl = document.getElementById('tplSearch');
  searchEl.value = cheatSearchQuery;
  searchEl.addEventListener('input', (e) => {
    cheatSearchQuery = e.target.value;
    renderCheatCards();
  });

  renderCheatCards();
}
