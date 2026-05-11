# Backgammon (Длинные нарды) — Implementation Plan

**Status:** PLANNED — awaiting rules confirmation
**Created:** 2026-04-19
**Variant:** Long Backgammon (Russian/Caucasian). Short Backgammon is a future option.

---

## 0. Правила как опции в Settings

Все спорные правила — **тоглы/селекты в `BackgammonSettingsPanel`**. Есть **пресеты** (quick-select) + **кастом** (каждый флаг вручную).

### Пресеты
| Пресет | Голова | 6-блок | Кокс | Первый ход |
|---|---|---|---|---|
| **Classic** (default) | 1 + искл. 6-6/4-4/3-3 на 1-м ходу | Запрещён если ни одна фишка не прошла | Выкл | По броску 1 кости |
| **Strict** | 1, без исключений | Всегда запрещён | Вкл | По броску 1 кости |
| **Relaxed** | 1 + искл. на 1-м ходу | Всегда разрешён | Выкл | Белые первые |
| **Caucasian** | 1 + искл. на 1-м ходу | Классически | Вкл (тройной марс) | По броску 1 кости |
| **Custom** | любая комбинация | любая | любая | любая |

### Общее (не меняется)
| Правило | Значение |
|---|---|
| Направление | Обе стороны идут в одну сторону (против часовой) |
| Старт | Все 15 фишек на своей «голове» (белые на 24, чёрные на 12) |
| Пункт | Только один цвет на пункте, битья нет |
| Обязательство хода | Использовать обе кости если возможно; если только одну — обязан бо́льшую |
| Дубли | 4 субхода того же значения |
| Выигрыш | Обычный = 1 очко, Марс = 2, Кокс (если вкл) = 3 |

### Флаги `BackgammonRules`
```ts
interface BackgammonRules {
  // Голова
  headExceptionOnFirstDoubles: boolean;    // 6-6/4-4/3-3 → 2 фишки на первом ходу
  // 6-блок
  sixBlockRule: 'classical' | 'always-allowed' | 'always-forbidden';
  // Марс/кокс
  enableKokc: boolean;                     // кокс (домашний марс) = +1 очко
  // Старт
  firstMoveByDiceRoll: boolean;            // true: бросок на старт; false: белые всегда
  // Зарезервировано для расширений
  strictMaxDieRule: boolean;               // если только одну — обязан бо́льшую (всегда true в классике)
}
```

Пользователь меняет правила **до старта партии**; при смене — partial reset через `handleNewGame`.

---

## 1. Архитектура модулей

```
src/games/backgammon/
├── engine/
│   ├── types.ts                      # Board, Point, Move, MoveSequence, DiceRoll, GameState
│   ├── constants.ts                  # BOARD_POINTS=24, STONES_PER_SIDE=15, HOME_START маппинги
│   ├── BackgammonEngine.ts           # applyMove, undoMove, validateSequence, isTerminal
│   ├── pathUtils.ts                  # nextPoint(color, from, pips) — единое направление
│   ├── diceUtils.ts                  # rollDice, enumeratePermutations, expandDoubles
│   ├── rules/
│   │   ├── headRule.ts               # canLeaveHead(state, moveIndex)
│   │   ├── blockRule.ts              # wouldCreateIllegal6Block(state, afterMove)
│   │   └── bearOffRule.ts            # canBearOff(state, color), validBearOffMove
│   ├── moveGenerator.ts              # generateLegalSequences(state, dice) → Move[][]
│   ├── evaluator.ts                  # pipCount, blockCount, exposure — used by AI
│   └── __tests__/
│       ├── pathUtils.test.ts
│       ├── headRule.test.ts
│       ├── blockRule.test.ts
│       ├── bearOffRule.test.ts
│       ├── moveGenerator.test.ts
│       └── BackgammonEngine.test.ts
├── ai/
│   ├── backgammonWorker.ts           # Web Worker — expectimax entry point
│   ├── BackgammonAIService.ts        # main-thread wrapper (promise API)
│   ├── expectimax.ts                 # expectimax with chance nodes
│   └── heuristic.ts                  # evaluation function
├── stores/
│   ├── useBackgammonStore.ts         # main game state + actions
│   ├── useBackgammonSettingsStore.ts # player color, AI level, rule toggles, clock preset
│   └── useBackgammonStatsStore.ts    # persisted per-game stats
├── hooks/
│   ├── useBackgammonGame.ts          # facade (same pattern as useGoGame)
│   ├── useBackgammonAI.ts            # AI turn driver
│   ├── useBackgammonSoundEffects.ts  # dice rattle, stone click, mars fanfare
│   └── useBackgammonClock.ts         # optional (Sprint 6)
├── config/
│   ├── aiLevels.ts                   # { easy: depth1, medium: depth2, hard: depth3 }
│   └── variants.ts                   # RULE_PRESETS (classic / strict / house rules)
└── components/
    ├── scene/
    │   ├── BackgammonBoard.tsx       # static board: 24 points, center bar, bear-off trays
    │   ├── BackgammonPoint.tsx       # triangle wedge (memoized)
    │   ├── BackgammonStone.tsx       # cylinder stone (memoized)
    │   ├── StoneStack.tsx            # stack of stones on a point
    │   ├── BearOffTray.tsx           # destination tray for borne-off stones
    │   ├── Dice3D.tsx                # rapier physics dice (reuse rapier bundle)
    │   ├── DiceRoller.tsx            # orchestrates rolling animation → final values
    │   ├── HoverHighlight.tsx        # highlight legal targets on point hover
    │   ├── BackgammonScene.tsx       # scene root
    │   └── BackgammonCameraRig.tsx
    └── ui/
        ├── BackgammonTopBar.tsx      # roll button, status, undo, pass, new, settings, rules
        ├── BackgammonPlayerCard.tsx  # name, color, home/bear-off counters, clock
        ├── BackgammonMoveHistory.tsx # sidebar: "R 5-3: 24/19 13/10"
        ├── BackgammonSettingsPanel.tsx
        ├── BackgammonRulesPanel.tsx  # tutorial (reuse Go panel pattern)
        ├── BackgammonEndGameDialog.tsx
        └── DiceBadge.tsx             # small dice indicator next to active player
```

Общий размер: ~45 файлов (~ примерно как Go).

---

## 2. Модель данных (types.ts)

```ts
export type StoneColor = 'w' | 'b';

/** One of 24 points on the board (0..23). */
export type PointIndex = number;

/** A single "sub-move": move one stone `pips` points from `from`. */
export interface SubMove {
  color: StoneColor;
  from: PointIndex | 'head';     // 'head' only for starting-point convenience
  to: PointIndex | 'off';         // 'off' = borne off the board
  pips: number;                   // which die value was used
}

/** A full turn = sequence of 2 or 4 (doubles) sub-moves. */
export type MoveSequence = SubMove[];

/** Dice roll. `values` always has 2 ints 1..6; doubles auto-expand to 4 on use. */
export interface DiceRoll {
  values: [number, number];
  /** Remaining die values to play this turn (length 2 or 4). */
  remaining: number[];
}

/** Point occupancy — only one color can stand on a point at a time. */
export interface PointState {
  color: StoneColor | null;
  count: number;                  // 0..15
}

/** Reason a turn ended without using all dice. */
export type TurnEndReason = 'used_all' | 'no_legal_moves' | 'partial_forced';

/** Game status. */
export type GameStatus =
  | 'idle'        // Before first roll
  | 'rolling'     // Dice animation in progress
  | 'choosing'    // Dice shown, player selecting moves
  | 'ai_thinking'
  | 'ended';

/** Victory classification. */
export type WinType = 'normal' | 'mars';    // kokc deferred to v2

/** Full observable game state. */
export interface BackgammonState {
  board: PointState[];            // length 24
  turn: StoneColor;
  dice: DiceRoll | null;
  moveHistory: HistoryEntry[];    // per-turn records with dice + sequence
  bornOff: { w: number; b: number };
  gameStatus: GameStatus;
  winner: StoneColor | null;
  winType: WinType | null;
  rules: BackgammonRules;
  /** True once either side has made their first non-starting move —
   *  controls the "6-6/4-4/3-3 lets you take 2 off the head" exception. */
  isFirstTurn: boolean;
  /** Per-turn: count of stones already taken from head this turn (0..2). */
  headTakenThisTurn: number;
  /** Selected source point awaiting destination. */
  selectedFrom: PointIndex | null;
}

export interface HistoryEntry {
  color: StoneColor;
  dice: [number, number];
  sequence: MoveSequence;
  turnNumber: number;
}

export interface BackgammonRules {
  headExceptionOnFirstDoubles: boolean;  // default true
  strict6BlockRule: 'classical' | 'always-allowed' | 'always-forbidden'; // default 'classical'
  enableKokc: boolean;                   // default false
  firstMoveByDiceRoll: boolean;          // default true
}
```

### Ключевая деталь — единая система координат

Оба игрока движутся по одному кругу против часовой стрелки. Индексация пунктов **абсолютная** (0..23). У каждой стороны — своя «голова» (стартовый пункт) и «дом» (последние 6 пунктов перед выходом):

```
  12 11 10  9  8  7       6  5  4  3  2  1
+-------------------+   +-------------------+
|   white home      |   |   black home-tray |
| (black direction) |   |                   |
+-------------------+   +-------------------+
  13 14 15 16 17 18      19 20 21 22 23  0
```

- **Белые**: голова = 23 (индекс), дом = 0..5, выход = из 0 «вниз»
- **Чёрные**: голова = 11, дом = 12..17, выход = из 17 «вниз» (по кругу)

`pathUtils.nextPoint(color, from, pips)` инкапсулирует wrap-around и возвращает либо `PointIndex`, либо `'off'` (если сошёл с доски при bear-off).

---

## 3. Move Generator — сердце движка

Самая сложная часть. Для броска (d1, d2):
1. **Не дубль:** 2 субхода, порядок использования костей важен (разные легальные последовательности)
2. **Дубль (x,x):** 4 субхода, одинаковые значения, но порядок применения влияет на промежуточные состояния

### Алгоритм
```
generateLegalSequences(state, dice):
  permutations = dice is double ? [[d,d,d,d]] : [[d1,d2], [d2,d1]]
  results = []
  for each perm in permutations:
    dfs(state, perm, [], results)
  // Maximum-dice rule: if there's a sequence using both dice,
  // filter out shorter sequences. If only one can be used,
  // keep only sequences using the larger die.
  return filterByMaxUseRule(results)

dfs(state, remainingDice, currentSequence, results):
  if remainingDice is empty:
    results.push(currentSequence); return
  die = remainingDice[0]
  legalSubmoves = generateSubMoves(state, die)
  if legalSubmoves is empty:
    results.push(currentSequence); return // partial sequence
  for each sub in legalSubmoves:
    newState = applySubMove(state, sub)
    dfs(newState, remainingDice.tail, currentSequence + sub, results)

generateSubMoves(state, die):
  result = []
  for each point p with state.board[p].color == state.turn:
    to = nextPoint(state.turn, p, die)
    if !canLeaveHead(state, p) continue    // head rule
    if !canLand(state, to) continue        // enemy occupies
    after = applySubMove(state, {from:p, to, pips:die})
    if violates6BlockRule(after) continue  // block rule
    if to == 'off' && !canBearOff(state) continue
    result.push({from:p, to, pips:die})
  dedupe(result) // multiple stones on same point → identical sub-moves
```

### Оптимизации
- Дедупликация: если на пункте несколько фишек, все субходы с него идентичны → 1 экземпляр
- Мемоизация по ключу `(boardHash, dieValue)` внутри одного хода
- Ранний выход: если нашли хоть одну последовательность, использующую все кости — все укороченные можно отфильтровать лениво

### Тесты (критично)
- Голова: одна фишка за ход; исключение 6-6/4-4/3-3 на первом ходу
- 6-блок: легальный и нелегальный случаи
- Bear-off: граничные случаи (кость больше чем нужно, меньше чем нужно, максимальная фишка)
- Дубли: 4 субхода, правильные промежуточные состояния
- Правило максимума: если бросок 6-2 и только 2 можно использовать, но 6 — нет → нельзя; если только один — обязан 6

---

## 4. AI — Expectimax с Chance Nodes

### Эвристика (`heuristic.ts`)
```ts
evaluate(state, color) =
    W_PIP      * -pipDiff(color)             // бегущий pip count
  + W_BORNE    * bornOffDiff(color)          // вынесено
  + W_HOME     * stonesInHomeDiff(color)     // фишек в доме
  + W_BLOCKS   * blockCountDiff(color)       // пункты 2+ фишек
  + W_PRIME    * primeLengthBonus(color)     // длина "стены" блоков в доме
  + W_HEAD     * -stonesOnHead(color)        // штраф за застревание на голове
  + W_RACE     * raceBonus(color)            // если гонка — наращивать темп
```

Веса тюним экспериментально на self-play (в Sprint 4).

### Поиск
```
expectimax(state, depth, maximizing):
  if depth == 0 or terminal:
    return evaluate(state, aiColor)
  if isChanceNode(state):
    sum = 0
    for (d1,d2), prob in DICE_DISTRIBUTION:  // 21 уникальных бросков
      childState = {...state, dice: (d1,d2)}
      sum += prob * expectimax(childState, depth-1, !maximizing)
    return sum
  // decision node — choose move sequence
  best = maximizing ? -inf : +inf
  for seq in generateLegalSequences(state, state.dice):
    newState = applyFullSequence(state, seq)
    v = expectimax(newState, depth-1, !maximizing)
    best = maximizing ? max(best,v) : min(best,v)
  return best
```

### DICE_DISTRIBUTION
```ts
// 21 уникальных бросков, pair (a,b) где a<=b
// prob = 1/36 если a==b (дубль), 2/36 иначе
```

### Уровни сложности
| Уровень | Depth | Играется как |
|---|---|---|
| Easy | 1 (только свой ход + оценка) | Новичок |
| Medium | 3 (ход + бросок + ход противника) | Любитель |
| Hard | 5 + лучшая эвристика + rollout bonus на поздних стадиях | Уверенный любитель |

### Воркер
`backgammonWorker.ts` слушает `{type:'think', state, aiLevel}` → возвращает `{type:'result', sequence}`. Таймаут 8 секунд, tick-check каждые N узлов. Как `goWorker.ts` паттерн.

---

## 5. UI/3D — Сцена

### Доска (BackgammonBoard.tsx)
- Деревянная плита (PlaneGeometry + wood texture или простой материал)
- 24 треугольника-пункта: extrude geometry, чередование светлый/тёмный
- Центральная разделительная полоса (в длинных — просто визуальная линия, без бара)
- Два «подноса» справа для выноса (bear-off trays)
- Координаты пунктов: mapping `PointIndex → Vector3`

### Фишки (BackgammonStone.tsx)
- `CylinderGeometry` (высота 0.15, радиус 0.6)
- Два материала: белый/чёрный с лёгким рельефом сверху (как реальные шашки)
- `React.memo` — 30 экземпляров × 24 пункта

### StoneStack.tsx
- Рендерит стек фишек на пункте
- При count > 5 — показывает первые 5 + цифру "×N"
- Позиционирование по высоте: stone[i] → y = i * stoneHeight

### Dice Cup + Rapier ⭐⭐ — ключевая вау-фича

**Интерактивный стакан (кожаный стаканчик / dice cup)** — как в реальной игре: игрок берёт стакан мышкой/пальцем, трясёт его, переворачивает над доской, кубики высыпаются, катятся, останавливаются — на верхних гранях читаются значения.

Используем **уже загруженный** rapier-чанк от шахмат (2.2 MB WASM физика).

#### Сценарий взаимодействия
1. **Idle**: стакан стоит на краю доски, перевёрнутый вверх дном (отверстием вниз) или вверх — конфигурируемо; возле кнопки «Готов бросать»
2. **Grab (pointerdown)**:
   - Стакан становится `kinematicPositionBased` и подхватывается курсором (с оффсетом от точки клика)
   - Внутри стакана 2 кубика — `dynamic RigidBody`, уже обрабатываются физикой, но ограничены стенками и дном стакана (верх тоже «заткнут» невидимым cap-коллайдером)
   - На курсор: raycasting камеры → плоскость на высоте Y=1.2 → туда ставим стакан
3. **Shake (pointermove)**:
   - Аккумулятор дельты: посчитали модуль скорости курсора за последние 200ms
   - Если скорость > порога → стакан дрожит (стан: add noise rotation, трение о курсор)
   - Кубики внутри получают импульсы пропорционально тряске (`applyImpulseAtPoint` в случайные точки)
   - Звук: приглушённое «тук-тук-тук» костей о стенки (WebAudio, частота пропорциональна скорости тряски)
4. **Flip + Release (pointerup)**:
   - Последняя дельта курсора + направление → вычисляется вектор «выкидывания»
   - Стакан переключается в `dynamic` → получает угловой импульс → опрокидывается отверстием вниз
   - Cap-коллайдер (крышка) отключается → кубики высыпаются
   - Стакан «улетает» обратно на стартовую позицию через 800ms (Framer Motion на wrapper) или падает рядом
5. **Roll**: кубики катятся по доске, сталкиваются со стенками подноса, замирают
6. **Settle detection**: `useFrame` проверяет `linvel.length() < 0.05 && angvel.length() < 0.05` **стабильно 300ms** (hysteresis на оба кубика)
7. **Read faces**: из кватерниона кубика вычисляем мировую ось +Y, находим ближайшую из 6 face-normals (dot-product argmax) → число 1..6
8. **Transition**: store получает `onDiceSettled([d1,d2])` → status = 'choosing', `diceRemaining = [d1,d2]` (или `[d,d,d,d]` для дубля)

#### Альтернативные режимы (для разных устройств)
- **Desktop mouse**: классический grab+shake+flip, как выше
- **Touch/mobile**: `onTouchMove` с акселерометром как бонус (`DeviceMotionEvent` — трясёшь **телефон** → трясёшь стакан!) — доступно только после `DeviceMotionEvent.requestPermission()` на iOS
- **Quick-roll**: кнопка «Быстрый бросок» рядом → сразу физика без стакана (для тех кто спешит)
- **Accessibility**: кнопка «Бросить» работает как shortcut без мышки — стакан автоматически трясётся 500ms и опрокидывается

#### Компоненты
```tsx
<DiceRoller>
  <Physics gravity={[0,-9.81,0]}>
    <BoardFloor />              // статичный пол-коллайдер (доска)
    <DiceTray />                // 4 статичные стенки подноса
    <DiceCup                    // сам стакан
      onGrab={...}
      onShake={intensity => ...}
      onRelease={throwVector => ...}
      dice={[d1Ref, d2Ref]}
    />
    <Dice3D bodyRef={d1Ref} />
    <Dice3D bodyRef={d2Ref} />
  </Physics>
</DiceRoller>
```

#### Стакан (DiceCup.tsx)
- Модель: cylinder без верхней крышки + тонкое дно (можно hollow через 4 стенки + дно, проще для коллайдеров)
- Материал: dark leather texture (или просто тёмный с roughness 0.8)
- Коллайдеры: 4-6 `CuboidCollider` стенки + 1 дно + 1 съёмный «cap» сверху
- Drag-handle: `onPointerDown/Move/Up` прямо на mesh

#### Детали анимации кубиков
- **Материал**: белый (слоновая кость) с чёрными пипками; roughness 0.35
- **Точки**: маленькие сферы-«пипки» как child меши (cleaner, без текстур) — скейл 0.08, тёмный матовый материал
- **Тень**: `castShadow` на кубиках, `receiveShadow` на поверхности доски
- **Размер**: ~0.6 × 0.6 × 0.6 единиц, помещаются по 2 в стакан диаметром 0.9
- **Звук падения**: click/clack при каждом первом ударе о доску, затухающий rattle при катке

#### Low-perf fallback
Если FPS < 30 за первую секунду тряски → прерываем физ-симуляцию, показываем final-грани через CSS-анимацию (Framer Motion rotate + translate). Определение: `useFrame` замер dt, скользящее среднее.

#### Seeded режим
Для отладки и тестов — параметр `?seed=42` в URL → детерминированная физика (фиксированный сид для импульсов и начальных состояний кубиков). Полезно для воспроизведения багов.

#### Детали анимации
- **Заход (wind-up)**: кулачок / рука не нужна — кубики просто появляются и бросаются. Можно добавить маленький «pop»-масштаб (0 → 1) за 100ms через Framer Motion (на враппере)
- **Звук**: drum-roll + stick-clack при ударе о доску (`useBackgammonSoundEffects`: WebAudio, процедурный шум + короткий click)
- **Материал**: белый кубик с тёмными точками, subtle ambient occlusion (`MeshStandardMaterial` + roughness 0.4)
- **Точки на гранях**: либо `TextureLoader` (6 картинок), либо процедурно — маленькие сферы-«пипки» как child меши (cleaner, без текстур)
- **Тень**: `castShadow` на кубиках, `receiveShadow` на поверхности доски → кубики отбрасывают реальную тень во время полёта

#### Повторяемость / Fallback
- **Fixed seed для AI** (опционально, для отладки): параметр `?seed=42` в URL → детерминированная физика
- **Low-perf fallback**: если FPS < 30 за первую секунду броска → прерываем физ-симуляцию, показываем final grани через CSS-анимацию rotate/translate (Framer Motion). Задетектим через `useFrame` delta.

#### Компоненты
```
<DiceRoller>              // orchestrator
  <Physics gravity={[0,-9.81,0]}>
    <BoardFloor />        // коллайдер-стол
    <DiceTray />          // 4 стенки (невидимые коллайдеры)
    <Dice3D bodyRef={d1} color="white" />
    <Dice3D bodyRef={d2} color="white" />
  </Physics>
</DiceRoller>
```

#### Таблица анимаций кубиков
| Фаза | Длительность | Что |
|---|---|---|
| `idle` | — | Нет кубиков на сцене |
| `spawning` | 100ms | Scale 0 → 1, появление |
| `flying` | 600-1200ms | Физика: полёт, отскоки |
| `settling` | 200-400ms | Физика затухает |
| `settled` | 300ms hysteresis | Проверка остановки |
| `displayed` | до конца хода | Кубики лежат с считанными значениями, оверлей UI поверх |
| `fading` | 300ms | Scale 1 → 0 при передаче хода |

**Итог:** каждый бросок занимает 1.5-2 сек максимум, с возможностью пропустить (двойной клик = мгновенный результат с физикой отключённой).

### Highlight
- При hover на пункте с фишками своего цвета → подсветка пункта + все легальные destinations для неиспользованных костей
- При выборе source → destination клики

### Камера
- Перспективная, зафиксированная сверху-сбоку (изометрия)
- `BackgammonCameraRig` с лёгким orbit (как у Go)

---

## 6. Store (useBackgammonStore.ts)

```ts
interface BackgammonStore extends BackgammonState {
  // Actions
  rollDice(): void;                         // generates dice, sets status → 'rolling'
  onDiceSettled(values: [number,number]): void; // from Dice3D — transitions → 'choosing'
  selectFrom(p: PointIndex): void;
  executeSubMove(to: PointIndex | 'off', die: number): void;
  undoLastSubMove(): void;
  confirmTurn(): void;                      // commits currentSequence, switches turn, records history
  resign(color?: StoneColor): void;
  resetGame(): void;
  setGameMode(mode: 'ai' | 'local'): void;
}
```

Важный нюанс: игрок **может делать субходы последовательно и откатывать их** до подтверждения хода. Храним `pendingSequence: SubMove[]` — commit по кнопке «Завершить ход» или автоматически когда `remaining.length === 0` и других ходов нет.

---

## 7. Статистика (useBackgammonStatsStore.ts)

Зеркалим `useGoStatsStore`:
```ts
interface BackgammonGameRecord {
  id, finishedAt, mode, aiLevel?,
  endReason: 'won' | 'mars' | 'resigned' | 'timeout',
  outcome: 'win' | 'loss' | null,
  winner: StoneColor | null,
  playerColor: StoneColor,
  variant: 'long',            // зарезервировано под short в v2
  moveCount, durationMs,
  /** Сколько фишек противник успел вывести (0 → марс). */
  opponentBornOff: number,
}
```

Добавится 4-я вкладка в `StatsPage`.

---

## 8. i18n

Добавить в `translations.ts` ключи:
- `nav.backgammon` — «Нарды» / «Backgammon»
- `backgammon.title`, `backgammon.subtitle`
- `backgammon.roll`, `backgammon.confirm`, `backgammon.undo`, `backgammon.resign`
- `backgammon.yourTurn`, `backgammon.aiThinking`, `backgammon.rolling`
- `backgammon.mars`, `backgammon.win`, `backgammon.bornOff`
- `backgammon.rules.*` (~10 глав туториала)
- `stats.tabBackgammon`, `stats.endMars`
- `home.backgammon.title`, `home.backgammon.description`

RU и EN параллельно.

---

## 9. Роутинг и лендинг

- `src/core/types/common.ts` → добавить `ROUTES.BACKGAMMON = '/backgammon'`
- `src/pages/BackgammonPage.tsx` — тонкий orchestrator (как `GoPage`)
- `src/pages/lazy.ts` → `LazyBackgammonPage` + preload
- `src/app/Router.tsx` → новый Route
- `src/core/components/layout/Sidebar.tsx` → иконка кубиков 🎲
- `src/pages/HomePage.tsx` → карточка «Нарды»

---

## 10. Спринты (детально)

### ✅ Sprint 0 — Rules confirmation (0.5 дня)
- Пользователь подтверждает правила (см. § 0)
- Фиксируем в `decisionLog.md`
- Создаём `progress.md` запись «Backgammon: PLANNED»

### 🔨 Sprint 1 — Engine + Rules (2-3 дня)
**Файлы:** `engine/types.ts`, `constants.ts`, `pathUtils.ts`, `diceUtils.ts`, `rules/*`, `moveGenerator.ts`, `BackgammonEngine.ts`, `evaluator.ts`
**Тесты:** 50-70 unit tests
**Acceptance:**
- `rollDice()` возвращает корректные `[1..6, 1..6]`
- `generateLegalSequences(startState, [3,5])` возвращает все валидные последовательности для первого хода
- Правило головы работает: нельзя снять 2-ю фишку кроме 6-6/4-4/3-3 первого хода
- 6-блок режется когда противник не прошёл
- Bear-off срабатывает только когда все 15 в доме
- Марс детектится: опп == 0 вынесенных
- `npm run build ✅ npm run lint ✅ npm test ✅`

### 🎨 Sprint 2 — 3D MVP (2 дня)
**Файлы:** `BackgammonBoard`, `BackgammonPoint`, `BackgammonStone`, `StoneStack`, `BearOffTray`, `BackgammonScene`, `BackgammonCameraRig`, `useBackgammonStore` (базовый), `BackgammonPage` (минимальный), роутинг, Sidebar, Home
**Acceptance:**
- Открывается `/backgammon`, видна 3D-доска со стартовой позицией
- Клик по своей фишке → подсветка пункта
- Store хранит состояние, можно сбросить игру

### 🎲 Sprint 3 — Dice + Turn Flow (2-3 дня)
**Файлы:** `Dice3D`, `DiceRoller`, `HoverHighlight`, расширение store (rollDice, selectFrom, executeSubMove, undoLastSubMove, confirmTurn)
**Acceptance:**
- Кнопка «Бросить» — кубики падают через физику rapier, оседают, считываются значения
- Клик на свою фишку → показываются destination-пункты для каждой неиспользованной кости
- Клик на destination → фишка двигается, кость «потрачена»
- Undo откатывает последний субход
- «Завершить ход» коммитит и передаёт ход
- Ход авто-пропускается если нет легальных ходов

### 🤖 Sprint 4 — AI (Expectimax) (2-3 дня)
**Файлы:** `backgammonWorker.ts`, `BackgammonAIService.ts`, `useBackgammonAI.ts`, `expectimax.ts`, `heuristic.ts`, `config/aiLevels.ts`
**Acceptance:**
- В режиме vs AI: после хода игрока AI бросает и делает последовательность за 1-5 секунд
- Easy/Medium/Hard ощутимо отличаются силой
- AI не нарушает правила (тестовый матч 100 игр self-play: 0 нарушений)
- Таймаут 8 секунд (worker прерывается)

### 💎 Sprint 5 — UI/UX (2 дня)
**Файлы:** `BackgammonTopBar`, `BackgammonPlayerCard`, `BackgammonMoveHistory`, `BackgammonSettingsPanel`, `BackgammonEndGameDialog`, `DiceBadge`
**Acceptance:**
- Шапка с статусом, Undo/Roll/Confirm/New Game/Settings/Rules
- Карточки игроков: цвет, имя, сколько вынесено, чьё сейчас, часы (если вкл)
- История ходов: `R 5-3: 24/19 13/10` формат
- Settings: AI level, цвет игрока, правила-тоглы (6-block strictness и т.д.)
- End-game: выиграл / проиграл / МАРС (удвоение)

### 📊 Sprint 6 — Stats + Clock (1-2 дня)
**Файлы:** `useBackgammonStatsStore.ts`, `BackgammonClockManager.ts`, `useBackgammonClock.ts`, обновление `StatsPage`
**Acceptance:**
- Игры записываются в `backgammon-stats` localStorage
- 4-я вкладка в `StatsPage` со сводкой и историей
- Марс отображается бейджем в истории
- Опциональный clock (как у Go): byo-yomi / Fischer / unlimited

### 📚 Sprint 7 — Tutorial (1 день)
**Файлы:** `backgammonChapters.ts`, `BackgammonRulesPanel.tsx`, `useBackgammonTutorialStore.ts` (лайт-версия без интерактива для начала)
**Главы:**
1. Доска и направление
2. Кости
3. Правило головы
4. Блоки и пункты
5. 6-блок и правило прохода
6. Вынос фишек (bear-off)
7. Марс
8. Стратегия: гонка vs контакт
9. Тактика блокирования
10. Эндшпиль

### ✨ Sprint 8 — Polish + Mobile (1-2 дня)
- Hover preview (подсветка возможных целей при наведении на source)
- `React.memo` на всех 3D компонентах (Stone, Point, StoneStack)
- Accessibility: `role="dialog"`, `aria-live` на статус, ESC закрывает модалки
- Mobile: collapsible history, icon-only кнопки на md:
- Responsive: камера чуть ближе на маленьких экранах
- RU/EN переводы — финальный проход

**Итого:** ~14-18 дней плотной работы, ~45 файлов, ~5000 строк кода (оценка по Go).

---

## 11. Риски и меры

| Риск | Вероятность | Митигация |
|---|---|---|
| Move generator взрывается комбинаторно | Средняя | Дедупликация, мемоизация, тесты на сложных позициях |
| Физика Rapier проседает на слабых устройствах | Средняя | Фолбэк: если FPS < 30 → CSS/Framer анимация кубиков |
| Expectimax depth 3 — таймаут | Низкая | Tick-check каждые 1024 узла, ранний cut, memoization |
| Правило 6-блока — неочевидные edge-cases | Средняя | Покрыть 15+ тестов, обсудить крайние случаи с пользователем |
| Марс-детекция ошибается | Низкая | Simple rule: winner.bornOff == 15 AND loser.bornOff == 0 |
| Bundle size (rapier уже в чанке) | Низкая | Rapier уже загружается для шахмат → переиспользуем |

---

## 12. Что нужно от пользователя для старта

1. **Подтверждение правил** из § 0 (или корректировки)
2. **Начинаем со Sprint 1** (Engine) — пошагово, с подтверждением после каждого спринта
3. **Между спринтами:** билд + тесты + лint должны быть зелёные
