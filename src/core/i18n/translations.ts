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
  'nav.brand': 'Game Portal',

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
  'settings.boardAppearance': 'Board Appearance',
  'settings.darkSquareColor': 'Dark squares color',

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

  // Navigation — checkers
  'nav.checkers': 'Checkers',

  // Navigation — go
  'nav.go': 'Go',

  // Go game
  'go.blackToMove': 'Black to move',
  'go.whiteToMove': 'White to move',
  'go.blackWins': 'Black wins',
  'go.whiteWins': 'White wins',
  'go.draw': 'Draw',
  'go.scoring': 'Marking dead stones…',
  'go.ended': 'Game over',
  'go.thinking': 'AI is thinking…',
  'go.pass': 'Pass',
  'go.passOneLeft': 'One more pass ends the game',
  'go.resign': 'Resign',
  'go.undo': 'Undo',
  'go.newGame': 'New game',
  'go.reviewBoard': 'Review board',
  'go.capturedByBlack': 'Captured by Black:',
  'go.capturedByWhite': 'Captured by White:',
  'go.moves': 'moves',
  'go.koActive': 'Ko is active — cannot recapture immediately',
  'go.reject.ko': 'Ko: cannot recapture immediately',
  'go.reject.suicide': 'Suicide is not allowed',
  'go.reject.occupied': 'That point is already occupied',
  'go.reject.outOfBounds': 'Off the board',
  'go.reject.gameEnded': 'The game has ended',
  'go.scoringTitle': 'Count the result',
  'go.scoringDeadStonesHint':
    'Click stones on the board to mark them as dead. Territory updates automatically.',
  'go.confirmResult': 'Confirm result',
  'go.resume': 'Resume play',
  'go.black': 'Black',
  'go.white': 'White',
  'go.territory': 'Territory',
  'go.stones': 'Stones',
  'go.prisoners': 'Prisoners',
  'go.komi': 'Komi',
  'go.total': 'Total',
  'go.you': 'You',
  'go.ai': 'AI',
  'go.readyToPlay': 'Ready to play',
  'go.victory': 'Victory!',
  'go.defeat': 'Defeat',
  'go.playAgain': 'Play again',
  'go.captured': 'captured',
  'go.noCaptures': 'No captures yet',
  'go.movePlay': 'Play',
  'go.movePass': 'Pass',
  'go.moveResign': 'Resign',
  'go.boardSize': 'Board size',
  'go.scoringRules': 'Scoring rules',
  'go.chinese': 'Chinese',
  'go.japanese': 'Japanese',
  'go.playouts': 'playouts',

  // Checkers game
  'checkers.readyToPlay': 'Ready to play',
  'checkers.whiteWins': 'White wins!',
  'checkers.blackWins': 'Black wins!',
  'checkers.draw': 'Draw',
  'checkers.drawTitle': 'Draw',
  'checkers.drawDesc': 'The game ended in a draw.',
  'checkers.victory': 'Victory!',
  'checkers.defeat': 'Defeat',
  'checkers.chainActive': 'Continue capturing!',

  // Home page
  'home.titleStart': 'Board Game',
  'home.titleAccent': 'Portal',
  'home.subtitle': 'Immersive 3D board games with AI opponents and beautiful animations',
  'home.chess.title': '3D Chess',
  'home.chess.description': 'Play against AI or a friend in an immersive 3D environment',
  'home.checkers.title': 'Checkers',
  'home.checkers.description': 'Russian draughts with AI opponent in a 3D environment',
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

  // Checkers Rules / Tutorial panel
  'checkersRules.title': 'Rules of Checkers',
  'checkersRules.open': 'Open rules',
  'checkersRules.close': 'Close rules',
  'checkersRules.chapter': 'Chapter',
  'checkersRules.next': 'Next',
  'checkersRules.prev': 'Previous',
  'checkersRules.ch.board.title': 'The Board & Setup',
  'checkersRules.ch.board.body':
    'Russian draughts is played on an 8×8 board. Only dark squares are used. Each player starts with 12 pieces (men) placed on the dark squares of their three nearest rows. White always moves first.',
  'checkersRules.ch.man.title': 'The Man',
  'checkersRules.ch.man.body':
    'A man moves one square diagonally forward — to the left or to the right. Men can only move onto empty dark squares. A man cannot move backward (unless capturing).',
  'checkersRules.ch.capture.title': 'Capturing',
  'checkersRules.ch.capture.body':
    'To capture, a man jumps diagonally over an adjacent opponent piece to an empty square beyond it. In Russian draughts, men can capture both forward AND backward.',
  'checkersRules.ch.chain.title': 'Chain Captures',
  'checkersRules.ch.chain.body':
    'If after a capture the same piece can capture again, it MUST continue jumping. Multiple captures in a row form a chain. Captured pieces are removed from the board only after the entire chain is complete.',
  'checkersRules.ch.forced.title': 'Forced Capture',
  'checkersRules.ch.forced.body':
    'If you can make a capture, you MUST capture — you cannot choose a simple move instead. The red arrow shows the mandatory capture; gray arrows show moves that are NOT allowed when a capture is available.',
  'checkersRules.ch.promotion.title': 'Promotion to King',
  'checkersRules.ch.promotion.body':
    'When a man reaches the opponent\'s back rank (the farthest row), it is promoted to a king (crowned). The king is visually distinct — it has a golden crown. Promotion happens immediately upon landing.',
  'checkersRules.ch.kingMove.title': 'King Movement',
  'checkersRules.ch.kingMove.body':
    'A king (crowned piece) can move any number of squares diagonally in any direction — like a bishop in chess. This makes the king a powerful piece. The highlighted squares show all possible destinations.',
  'checkersRules.ch.kingCapture.title': 'King Capture',
  'checkersRules.ch.kingCapture.body':
    'A king captures by jumping over an opponent piece at any distance along a diagonal. After the jump, the king can land on any empty square beyond the captured piece. This long-range capture is unique to Russian draughts.',
  'checkersRules.ch.winning.title': 'Winning the Game',
  'checkersRules.ch.winning.body':
    'You win by capturing all of your opponent\'s pieces OR by blocking them so they have no legal moves. A draw occurs if 40 moves pass without a capture (80 half-moves).',
  'checkersRules.ch.strategy.title': 'Strategy Tips',
  'checkersRules.ch.strategy.body':
    'Key principles:\n\n1) Control the center — central pieces have more options.\n2) Advance your men toward promotion — kings are much stronger.\n3) Keep your back rank occupied as long as possible — it prevents easy enemy promotions.\n4) Look for chain captures — one sequence can win multiple pieces.\n5) Avoid leaving isolated pieces that can be easily captured.',
};

/** Russian translations. */
const ru: TranslationDict = {
  // Sidebar / nav
  'nav.portal': 'Портал',
  'nav.chess': 'Шахматы',
  'nav.statistics': 'Статистика',
  'nav.ready': 'Готово',
  'nav.brand': 'Игровой портал',

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
  'settings.boardAppearance': 'Вид доски',
  'settings.darkSquareColor': 'Цвет тёмных клеток',

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

  // Navigation — checkers
  'nav.checkers': 'Шашки',

  // Navigation — го
  'nav.go': 'Го',

  // Go game
  'go.blackToMove': 'Ход чёрных',
  'go.whiteToMove': 'Ход белых',
  'go.blackWins': 'Победа чёрных',
  'go.whiteWins': 'Победа белых',
  'go.draw': 'Ничья',
  'go.scoring': 'Отметьте мёртвые камни…',
  'go.ended': 'Игра окончена',
  'go.thinking': 'ИИ думает…',
  'go.pass': 'Пас',
  'go.passOneLeft': 'Ещё один пас — и партия окончена',
  'go.resign': 'Сдаться',
  'go.undo': 'Отмена',
  'go.newGame': 'Новая партия',
  'go.reviewBoard': 'Посмотреть доску',
  'go.capturedByBlack': 'Чёрные взяли:',
  'go.capturedByWhite': 'Белые взяли:',
  'go.moves': 'ходов',
  'go.koActive': 'Правило ко — мгновенный взятие запрещён',
  'go.reject.ko': 'Ко: немедленный взятие запрещён',
  'go.reject.suicide': 'Самоубийство запрещено',
  'go.reject.occupied': 'Точка уже занята',
  'go.reject.outOfBounds': 'За пределами доски',
  'go.reject.gameEnded': 'Партия завершена',
  'go.scoringTitle': 'Подсчёт результата',
  'go.scoringDeadStonesHint':
    'Нажмите на камни на доске, чтобы отметить их как мёртвые. Территория обновится автоматически.',
  'go.confirmResult': 'Подтвердить результат',
  'go.resume': 'Вернуться к игре',
  'go.black': 'Чёрные',
  'go.white': 'Белые',
  'go.territory': 'Территория',
  'go.stones': 'Камни',
  'go.prisoners': 'Пленники',
  'go.komi': 'Коми',
  'go.total': 'Итого',
  'go.you': 'Вы',
  'go.ai': 'ИИ',
  'go.readyToPlay': 'Готов к игре',
  'go.victory': 'Победа!',
  'go.defeat': 'Поражение',
  'go.playAgain': 'Играть снова',
  'go.captured': 'взято',
  'go.noCaptures': 'Пока нет захватов',
  'go.movePlay': 'Ход',
  'go.movePass': 'Пас',
  'go.moveResign': 'Сдача',
  'go.boardSize': 'Размер доски',
  'go.scoringRules': 'Правила подсчёта',
  'go.chinese': 'Китайские',
  'go.japanese': 'Японские',
  'go.playouts': 'розыгрышей',

  // Checkers game
  'checkers.readyToPlay': 'Готов к игре',
  'checkers.whiteWins': 'Победили белые!',
  'checkers.blackWins': 'Победили чёрные!',
  'checkers.draw': 'Ничья',
  'checkers.drawTitle': 'Ничья',
  'checkers.drawDesc': 'Партия завершилась вничью.',
  'checkers.victory': 'Победа!',
  'checkers.defeat': 'Поражение',
  'checkers.chainActive': 'Продолжайте взятие!',

  // Home page
  'home.titleStart': 'Портал',
  'home.titleAccent': 'настольных игр',
  'home.subtitle': 'Захватывающие 3D настольные игры с ИИ и красивыми анимациями',
  'home.chess.title': '3D Шахматы',
  'home.chess.description': 'Играйте против ИИ или друга в захватывающей 3D обстановке',
  'home.checkers.title': 'Шашки',
  'home.checkers.description': 'Русские шашки с ИИ-противником в 3D-окружении',
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

  // Checkers Rules / Tutorial panel
  'checkersRules.title': 'Правила шашек',
  'checkersRules.open': 'Открыть правила',
  'checkersRules.close': 'Закрыть правила',
  'checkersRules.chapter': 'Глава',
  'checkersRules.next': 'Далее',
  'checkersRules.prev': 'Назад',
  'checkersRules.ch.board.title': 'Доска и расстановка',
  'checkersRules.ch.board.body':
    'Русские шашки играются на доске 8×8. Используются только тёмные поля. У каждого игрока по 12 шашек, расставленных на тёмных полях трёх ближайших рядов. Белые ходят первыми.',
  'checkersRules.ch.man.title': 'Шашка',
  'checkersRules.ch.man.body':
    'Шашка ходит на одно поле по диагонали вперёд — влево или вправо. Шашки могут ходить только на пустые тёмные поля. Назад обычная шашка ходить не может (кроме взятия).',
  'checkersRules.ch.capture.title': 'Взятие',
  'checkersRules.ch.capture.body':
    'Для взятия шашка перепрыгивает по диагонали через соседнюю фигуру противника на пустое поле за ней. В русских шашках обычные шашки могут бить и вперёд, И назад.',
  'checkersRules.ch.chain.title': 'Цепочка взятий',
  'checkersRules.ch.chain.body':
    'Если после взятия та же шашка может взять ещё раз, она ОБЯЗАНА продолжить. Несколько взятий подряд образуют цепочку. Взятые шашки снимаются с доски только после завершения всей цепочки.',
  'checkersRules.ch.forced.title': 'Обязательное взятие',
  'checkersRules.ch.forced.body':
    'Если есть возможность взять, вы ОБЯЗАНЫ это сделать — нельзя выбрать простой ход вместо взятия. Красная стрелка показывает обязательное взятие; серые стрелки — ходы, которые запрещены при наличии взятия.',
  'checkersRules.ch.promotion.title': 'Превращение в дамку',
  'checkersRules.ch.promotion.body':
    'Когда шашка достигает последнего ряда противника, она превращается в дамку (коронуется). Дамка визуально отличается — у неё золотая корона. Превращение происходит сразу при попадании на последний ряд.',
  'checkersRules.ch.kingMove.title': 'Ход дамки',
  'checkersRules.ch.kingMove.body':
    'Дамка ходит на любое количество полей по диагонали в любом направлении — как слон в шахматах. Это делает дамку очень сильной фигурой. Подсвеченные поля показывают все возможные направления.',
  'checkersRules.ch.kingCapture.title': 'Взятие дамкой',
  'checkersRules.ch.kingCapture.body':
    'Дамка бьёт, перепрыгивая через фигуру противника на любом расстоянии по диагонали. После прыжка дамка может приземлиться на любое свободное поле за взятой фигурой. Это дальнобойное взятие — особенность русских шашек.',
  'checkersRules.ch.winning.title': 'Победа',
  'checkersRules.ch.winning.body':
    'Вы побеждаете, если взяли все шашки противника ИЛИ заблокировали их так, что у них нет ходов. Ничья наступает, если 40 ходов прошло без взятия (80 полуходов).',
  'checkersRules.ch.strategy.title': 'Стратегические советы',
  'checkersRules.ch.strategy.body':
    'Ключевые принципы:\n\n1) Контролируйте центр — центральные шашки имеют больше возможностей.\n2) Продвигайте шашки к превращению — дамки намного сильнее.\n3) Держите последний ряд занятым как можно дольше — это мешает противнику пройти в дамки.\n4) Ищите цепочки взятий — одна серия может выиграть несколько фигур.\n5) Избегайте изолированных шашек, которые легко взять.',
};

/** All translations indexed by locale. */
export const TRANSLATIONS: Record<Locale, TranslationDict> = { en, ru };

/** Human-readable names for each supported locale (used in the language picker). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
};
