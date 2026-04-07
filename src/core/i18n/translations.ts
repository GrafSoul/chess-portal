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
};

/** All translations indexed by locale. */
export const TRANSLATIONS: Record<Locale, TranslationDict> = { en, ru };

/** Human-readable names for each supported locale (used in the language picker). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};
