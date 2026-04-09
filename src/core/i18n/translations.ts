/** Supported UI languages. */
export type Locale = 'en' | 'ru';

/** Flat translation key → string mapping. */
export type TranslationDict = Record<string, string>;

/** English translations (fallback locale). */
const en: TranslationDict = {
  // Sidebar / nav
  'nav.portal': 'Portal',
  'nav.chess': 'Chess',
  'nav.statistics': 'Statistics',
  'nav.ready': 'Ready',
  'nav.brand': 'Chess Portal',

  // Buttons
  'btn.undo': 'Undo',
  'btn.newGame': 'New Game',
  'btn.cancel': 'Cancel',
  'btn.playNow': 'Play Now',
  'btn.comingSoon': 'Coming Soon',

  // Chess game status
  'chess.readyToPlay': 'Ready to play',
  'chess.you': 'You',
  'chess.ai': 'AI',
  'chess.white': 'White',
  'chess.black': 'Black',
  'chess.thinking': 'thinking',
  'chess.aiThinking': 'AI is thinking…',
  'chess.whiteToMove': 'White to move',
  'chess.blackToMove': 'Black to move',
  'chess.whiteInCheck': 'White in check!',
  'chess.blackInCheck': 'Black in check!',
  'chess.checkmateWhite': 'Checkmate! White wins',
  'chess.checkmateBlack': 'Checkmate! Black wins',
  'chess.stalemate': 'Stalemate — Draw',
  'chess.draw': 'Draw',
  'chess.resignedWhite': 'White wins by resignation',
  'chess.resignedBlack': 'Black wins by resignation',
  'chess.timeoutWhite': 'White wins on time',
  'chess.timeoutBlack': 'Black wins on time',
  'chess.moves': 'Moves',
  'chess.noCaptures': 'no captures',
  'chess.choosePromotion': 'Choose promotion',
  'chess.gameOver': 'Game over',
  'chess.victory': 'Victory',
  'chess.defeat': 'Defeat',
  'chess.drawTitle': 'Draw',
  'chess.playAgain': 'Play again',
  'chess.statBoxMoves': 'Moves',
  'chess.statBoxDuration': 'Time',

  // Settings panel
  'settings.title': 'Settings',
  'settings.gameMode': 'Game Mode',
  'settings.vsAI': 'vs AI',
  'settings.twoPlayers': '2 Players',
  'settings.playingAs': 'Playing as',
  'settings.whiteFirstHuman': 'White moves first — you start the game.',
  'settings.whiteFirstAI': 'White moves first — the AI starts.',
  'settings.aiDifficulty': 'AI Difficulty',
  'settings.depth': 'depth',
  'settings.timeControl': 'Time Control',
  'settings.preferences': 'Preferences',
  'settings.soundEffects': 'Sound effects',
  'settings.autoRotate': 'Auto-rotate board',
  'settings.language': 'Language',
  'settings.close': 'Close settings',
  'settings.openSettings': 'Open settings',

  // AI levels
  'ai.beginner': 'Beginner',
  'ai.amateur': 'Amateur',
  'ai.master': 'Master',
  'ai.grandmaster': 'Grandmaster',

  // Clock presets
  'clock.bullet': 'Bullet 1+0',
  'clock.blitz': 'Blitz 3+2',
  'clock.rapid': 'Rapid 10+5',
  'clock.classical': 'Classical 30+0',
  'clock.unlimited': 'Unlimited',

  // Home page
  'home.titleStart': 'Board Game',
  'home.titleAccent': 'Portal',
  'home.subtitle': 'Immersive 3D board games with AI opponents and beautiful animations',
  'home.chess.title': '3D Chess',
  'home.chess.description': 'Play against AI or a friend in an immersive 3D environment',
  'home.checkers.title': 'Checkers',
  'home.checkers.description': 'Classic checkers game with multiple board styles',
  'home.go.title': 'Go',
  'home.go.description': 'Ancient strategy game on a 19x19 board',

  // Stats page
  'stats.title': 'Statistics',
  'stats.subtitle': 'Track your performance across all games',
  'stats.played': 'Played',
  'stats.wins': 'Wins',
  'stats.losses': 'Losses',
  'stats.draws': 'Draws',
  'stats.empty': 'Play your first game to start tracking statistics.',
  'stats.history': 'Recent games',
  'stats.clear': 'Clear history',
  'stats.confirmClear': 'Clear all stored game history?',
  'stats.modeAI': 'vs AI',
  'stats.modeLocal': '2 Players',
  'stats.outcomeWin': 'Win',
  'stats.outcomeLoss': 'Loss',
  'stats.outcomeDraw': 'Draw',
  'stats.endCheckmate': 'checkmate',
  'stats.endStalemate': 'stalemate',
  'stats.endDraw': 'draw',
  'stats.endResigned': 'resigned',
  'stats.endTimeout': 'timeout',
  'stats.movesLabel': 'moves',

  // Rules / Tutorial panel
  'rules.title': 'Rules of Chess',
  'rules.open': 'Open rules',
  'rules.close': 'Close rules',
  'rules.chapter': 'Chapter',
  'rules.next': 'Next',
  'rules.prev': 'Previous',
  'rules.play': 'Play',
  'rules.pause': 'Pause',
  'rules.loop': 'Loop',
  'rules.exit': 'Exit tutorial',
  'rules.restart': 'Restart',
  'rules.ch.board.title': 'The Board & Setup',
  'rules.ch.board.body':
    'Chess is played on an 8×8 board. Each player starts with 16 pieces: 1 king, 1 queen, 2 rooks, 2 bishops, 2 knights, and 8 pawns. White always moves first. The queen stands on her own color: white queen on a light square, black queen on a dark square.',
  'rules.ch.king.title': 'The King',
  'rules.ch.king.body':
    'The king moves one square in any direction — horizontally, vertically, or diagonally. The king is the most important piece: you never capture it, but you must protect it at all costs. If the king has no legal escape from an attack — it is checkmate, and the game ends.',
  'rules.ch.queen.title': 'The Queen',
  'rules.ch.queen.body':
    'The queen is the strongest piece. She can move any number of squares in a straight line: horizontally, vertically, or diagonally. She combines the powers of a rook and a bishop. Use her wisely — losing the queen usually loses the game.',
  'rules.ch.rook.title': 'The Rook',
  'rules.ch.rook.body':
    'The rook moves any number of squares horizontally or vertically, but never diagonally. Rooks are strongest on open files and rows, and they cooperate well on the 7th rank.',
  'rules.ch.bishop.title': 'The Bishop',
  'rules.ch.bishop.body':
    'The bishop moves any number of squares diagonally. Each bishop stays on squares of a single color for the entire game. A pair of bishops working together is a powerful long-range weapon.',
  'rules.ch.knight.title': 'The Knight',
  'rules.ch.knight.body':
    'The knight moves in an L-shape: two squares in one direction, then one square perpendicular. The knight is the only piece that can jump over others. It is the trickiest piece for beginners — take a moment to visualize every move.',
  'rules.ch.pawn.title': 'The Pawn',
  'rules.ch.pawn.body':
    'Pawns move forward one square at a time, but on their first move they may advance two squares. Pawns capture diagonally, not forward. When a pawn reaches the last rank it must be promoted — usually to a queen.',
  'rules.ch.castling.title': 'Castling',
  'rules.ch.castling.body':
    'Castling is a special move that develops your rook and hides your king in one go. The king moves two squares toward a rook; the rook jumps over to the other side. Castling is only legal if neither piece has moved, the squares between them are empty, and the king is not in or passing through check.',
  'rules.ch.special.title': 'Promotion & En Passant',
  'rules.ch.special.body':
    'Promotion: when a pawn reaches the far rank, replace it with a queen, rook, bishop, or knight of the same color. En passant: if a pawn advances two squares past an adjacent enemy pawn, the enemy pawn may capture it as if it had moved only one square — but only on the very next move.',
  'rules.ch.check.title': 'Check, Checkmate, Stalemate',
  'rules.ch.check.body':
    'Check: the king is attacked and must escape. Checkmate: the king is attacked and there is no legal escape — the game ends. Stalemate: the side to move has no legal moves but is NOT in check — the game is a draw.',
  'rules.ch.principles.title': 'Opening Principles',
  'rules.ch.principles.body':
    'Three golden rules for the opening: 1) Control the center with pawns (e4 or d4). 2) Develop your knights and bishops early. 3) Castle quickly to protect your king. Avoid moving the same piece twice, and don\'t bring the queen out too early.',
  'rules.ch.sampleGame.title': "Sample Game: Scholar's Mate",
  'rules.ch.sampleGame.body':
    "A classic short game every beginner should know — both to play and to defend against. White targets the weak f7-square and delivers mate in just four moves: 1. e4 e5 2. Bc4 Nc6 3. Qh5 Nf6?? 4. Qxf7#. The lesson: always watch for threats against f7 (or f2)!",
};

/** Russian translations. */
const ru: TranslationDict = {
  // Sidebar / nav
  'nav.portal': 'Портал',
  'nav.chess': 'Шахматы',
  'nav.statistics': 'Статистика',
  'nav.ready': 'Готово',
  'nav.brand': 'Шахматный портал',

  // Buttons
  'btn.undo': 'Отменить',
  'btn.newGame': 'Новая игра',
  'btn.cancel': 'Отмена',
  'btn.playNow': 'Играть',
  'btn.comingSoon': 'Скоро',

  // Chess game status
  'chess.readyToPlay': 'Готов к игре',
  'chess.you': 'Вы',
  'chess.ai': 'ИИ',
  'chess.white': 'Белые',
  'chess.black': 'Чёрные',
  'chess.thinking': 'думает',
  'chess.aiThinking': 'ИИ думает…',
  'chess.whiteToMove': 'Ход белых',
  'chess.blackToMove': 'Ход чёрных',
  'chess.whiteInCheck': 'Белым шах!',
  'chess.blackInCheck': 'Чёрным шах!',
  'chess.checkmateWhite': 'Мат! Победили белые',
  'chess.checkmateBlack': 'Мат! Победили чёрные',
  'chess.stalemate': 'Пат — Ничья',
  'chess.draw': 'Ничья',
  'chess.resignedWhite': 'Белые выиграли (соперник сдался)',
  'chess.resignedBlack': 'Чёрные выиграли (соперник сдался)',
  'chess.timeoutWhite': 'Белые выиграли по времени',
  'chess.timeoutBlack': 'Чёрные выиграли по времени',
  'chess.moves': 'Ходы',
  'chess.noCaptures': 'нет взятий',
  'chess.choosePromotion': 'Выберите фигуру',
  'chess.gameOver': 'Партия окончена',
  'chess.victory': 'Победа',
  'chess.defeat': 'Поражение',
  'chess.drawTitle': 'Ничья',
  'chess.playAgain': 'Сыграть снова',
  'chess.statBoxMoves': 'Ходов',
  'chess.statBoxDuration': 'Время',

  // Settings panel
  'settings.title': 'Настройки',
  'settings.gameMode': 'Режим игры',
  'settings.vsAI': 'против ИИ',
  'settings.twoPlayers': '2 игрока',
  'settings.playingAs': 'Играю за',
  'settings.whiteFirstHuman': 'Белые ходят первыми — вы начинаете.',
  'settings.whiteFirstAI': 'Белые ходят первыми — начинает ИИ.',
  'settings.aiDifficulty': 'Сложность ИИ',
  'settings.depth': 'глубина',
  'settings.timeControl': 'Контроль времени',
  'settings.preferences': 'Параметры',
  'settings.soundEffects': 'Звуковые эффекты',
  'settings.autoRotate': 'Автоповорот доски',
  'settings.language': 'Язык',
  'settings.close': 'Закрыть настройки',
  'settings.openSettings': 'Открыть настройки',

  // AI levels
  'ai.beginner': 'Новичок',
  'ai.amateur': 'Любитель',
  'ai.master': 'Мастер',
  'ai.grandmaster': 'Гроссмейстер',

  // Clock presets
  'clock.bullet': 'Пуля 1+0',
  'clock.blitz': 'Блиц 3+2',
  'clock.rapid': 'Рапид 10+5',
  'clock.classical': 'Классика 30+0',
  'clock.unlimited': 'Без времени',

  // Home page
  'home.titleStart': 'Портал',
  'home.titleAccent': 'настольных игр',
  'home.subtitle': 'Захватывающие 3D настольные игры с ИИ и красивыми анимациями',
  'home.chess.title': '3D Шахматы',
  'home.chess.description': 'Играйте против ИИ или друга в захватывающей 3D обстановке',
  'home.checkers.title': 'Шашки',
  'home.checkers.description': 'Классические шашки с разными стилями досок',
  'home.go.title': 'Го',
  'home.go.description': 'Древняя стратегическая игра на доске 19×19',

  // Stats page
  'stats.title': 'Статистика',
  'stats.subtitle': 'Отслеживайте свои результаты во всех играх',
  'stats.played': 'Сыграно',
  'stats.wins': 'Победы',
  'stats.losses': 'Поражения',
  'stats.draws': 'Ничьи',
  'stats.empty': 'Сыграйте первую игру, чтобы начать отслеживать статистику.',
  'stats.history': 'Недавние партии',
  'stats.clear': 'Очистить историю',
  'stats.confirmClear': 'Удалить всю историю партий?',
  'stats.modeAI': 'против ИИ',
  'stats.modeLocal': '2 игрока',
  'stats.outcomeWin': 'Победа',
  'stats.outcomeLoss': 'Поражение',
  'stats.outcomeDraw': 'Ничья',
  'stats.endCheckmate': 'мат',
  'stats.endStalemate': 'пат',
  'stats.endDraw': 'ничья',
  'stats.endResigned': 'сдался',
  'stats.endTimeout': 'время',
  'stats.movesLabel': 'ходов',

  // Rules / Tutorial panel
  'rules.title': 'Правила шахмат',
  'rules.open': 'Открыть правила',
  'rules.close': 'Закрыть правила',
  'rules.chapter': 'Глава',
  'rules.next': 'Далее',
  'rules.prev': 'Назад',
  'rules.play': 'Играть',
  'rules.pause': 'Пауза',
  'rules.loop': 'Цикл',
  'rules.exit': 'Выйти из обучения',
  'rules.restart': 'Сначала',
  'rules.ch.board.title': 'Доска и начальная позиция',
  'rules.ch.board.body':
    'Шахматы играются на доске 8×8. У каждого игрока по 16 фигур: 1 король, 1 ферзь, 2 ладьи, 2 слона, 2 коня и 8 пешек. Белые всегда ходят первыми. Ферзь ставится на поле своего цвета: белый — на светлое, чёрный — на тёмное.',
  'rules.ch.king.title': 'Король',
  'rules.ch.king.body':
    'Король ходит на одно поле в любом направлении — по горизонтали, вертикали или диагонали. Король — самая важная фигура: его нельзя взять, но нужно защищать любой ценой. Если у короля нет хода, а он под нападением — это мат, игра окончена.',
  'rules.ch.queen.title': 'Ферзь',
  'rules.ch.queen.body':
    'Ферзь — самая сильная фигура. Ходит на любое число полей по прямой: по горизонтали, вертикали или диагонали. Объединяет в себе возможности ладьи и слона. Берегите ферзя — его потеря часто равна поражению.',
  'rules.ch.rook.title': 'Ладья',
  'rules.ch.rook.body':
    'Ладья ходит на любое число полей по горизонтали или вертикали, но никогда по диагонали. Ладьи сильнее всего на открытых линиях и седьмой горизонтали, а две ладьи вместе — грозная сила.',
  'rules.ch.bishop.title': 'Слон',
  'rules.ch.bishop.body':
    'Слон ходит на любое число полей по диагонали. Каждый слон всю партию остаётся на полях одного цвета. Пара слонов — мощное дальнобойное оружие, особенно в открытых позициях.',
  'rules.ch.knight.title': 'Конь',
  'rules.ch.knight.body':
    'Конь ходит буквой «Г»: два поля в одну сторону и одно перпендикулярно. Конь — единственная фигура, которая может перепрыгивать через другие. Самая хитрая фигура для новичка — перед каждым ходом мысленно представляйте себе траекторию.',
  'rules.ch.pawn.title': 'Пешка',
  'rules.ch.pawn.body':
    'Пешка ходит на одно поле вперёд, но с начальной позиции может сделать ход на два поля. Бьёт пешка только по диагонали, не прямо. Дойдя до последней горизонтали, пешка обязана превратиться — обычно в ферзя.',
  'rules.ch.castling.title': 'Рокировка',
  'rules.ch.castling.body':
    'Рокировка — специальный ход, который развивает ладью и прячет короля одновременно. Король перемещается на два поля в сторону ладьи, а ладья перепрыгивает через него. Рокировка возможна только если ни король, ни ладья ещё не ходили, поля между ними пусты, и король не под шахом и не проходит через шах.',
  'rules.ch.special.title': 'Превращение и взятие на проходе',
  'rules.ch.special.body':
    'Превращение: достигнув последней горизонтали, пешка превращается в ферзя, ладью, слона или коня своего цвета. Взятие на проходе: если пешка проходит на два поля мимо соседней вражеской пешки, та может взять её «на проходе», как если бы она сделала обычный ход на одно поле — но только СЛЕДУЮЩИМ ходом.',
  'rules.ch.check.title': 'Шах, мат, пат',
  'rules.ch.check.body':
    'Шах: король под нападением и должен уйти. Мат: король под нападением, и спасения нет — игра окончена. Пат: у игрока нет ни одного хода, но король НЕ под шахом — ничья.',
  'rules.ch.principles.title': 'Принципы дебюта',
  'rules.ch.principles.body':
    'Три золотых правила начала партии: 1) Контролируйте центр пешками (e4 или d4). 2) Развивайте коней и слонов как можно раньше. 3) Делайте рокировку, чтобы защитить короля. Не ходите одной фигурой дважды в дебюте и не выводите ферзя слишком рано.',
  'rules.ch.sampleGame.title': 'Пример: детский мат',
  'rules.ch.sampleGame.body':
    'Классическая короткая партия, которую должен знать каждый новичок — и чтобы сыграть, и чтобы не попасться. Белые атакуют слабое поле f7 и ставят мат в четыре хода: 1. e4 e5 2. Сc4 Кc6 3. Фh5 Кf6?? 4. Ф:f7#. Урок: всегда следите за угрозами по полю f7 (или f2)!',
};

/** All translations indexed by locale. */
export const TRANSLATIONS: Record<Locale, TranslationDict> = { en, ru };

/** Human-readable names for each supported locale (used in the language picker). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};
