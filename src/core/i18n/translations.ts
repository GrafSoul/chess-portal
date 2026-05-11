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

  // Go tutorial / rules panel
  'goRules.title': 'Go Rules',
  'goRules.close': 'Close rules',
  'goRules.chapter': 'Chapter',
  'goRules.prev': 'Previous',
  'goRules.next': 'Next',
  'goRules.ch.board.title': 'The Board',
  'goRules.ch.board.body':
    'Go is played on a grid of lines. Stones are placed on the intersections — the points where lines cross — not inside the squares.\n\nThe standard board is 19x19, but beginners often start on 9x9. The marked dots (star points) are reference points.\n\nBlack always plays first.',
  'goRules.ch.placing.title': 'Placing Stones',
  'goRules.ch.placing.body':
    'Players take turns placing one stone of their color on any empty intersection.\n\nOnce placed, stones never move — they stay on the board until captured.\n\nYou may also pass your turn instead of placing a stone.',
  'goRules.ch.liberties.title': 'Liberties',
  'goRules.ch.liberties.body':
    'Every stone needs breathing room. The empty points directly adjacent (up, down, left, right) are called liberties.\n\nA stone in the center has 4 liberties. On the edge — 3. In the corner — only 2.\n\nThe green arrows show the 4 liberties of the center stone.',
  'goRules.ch.capture.title': 'Capturing Stones',
  'goRules.ch.capture.body':
    'When you fill the last liberty of an opponent\'s stone, it is captured and removed from the board.\n\nCaptured stones count as points for you at the end of the game.\n\nWatch the demonstration: Black fills the last liberty and captures the white stone.',
  'goRules.ch.groups.title': 'Groups',
  'goRules.ch.groups.body':
    'Stones of the same color that are directly adjacent (horizontally or vertically) form a group. Diagonal connections do not count.\n\nA group shares its liberties — all empty points adjacent to any stone in the group.\n\nTo capture a group, you must fill ALL of its liberties.',
  'goRules.ch.ko.title': 'The Ko Rule',
  'goRules.ch.ko.body':
    'Sometimes capturing creates a position where your opponent could immediately recapture, creating an infinite loop.\n\nThe ko rule prevents this: after capturing a single stone, your opponent cannot immediately recapture at that same point. They must play elsewhere first.\n\nThe forbidden point is marked with a red square on the board.',
  'goRules.ch.suicide.title': 'Suicide Rule',
  'goRules.ch.suicide.body':
    'You cannot place a stone where it would have zero liberties — unless that placement captures opponent stones.\n\nIn this example, the center point is surrounded by black stones. Placing a white stone there would be suicide (zero liberties) and is forbidden.\n\nBut if placing a stone captures enemy stones, it gains liberties from the capture and is legal.',
  'goRules.ch.territory.title': 'Territory',
  'goRules.ch.territory.body':
    'The goal of Go is to control more territory than your opponent.\n\nTerritory is the set of empty intersections that are completely surrounded by your stones. In this example, the left side is Black\'s territory and the right side is White\'s.\n\nThe highlighted points show each side\'s territory.',
  'goRules.ch.scoring.title': 'Scoring',
  'goRules.ch.scoring.body':
    'The game ends when both players pass consecutively. Then you count the score.\n\nChinese rules: your score = your territory + your stones on the board.\nJapanese rules: your score = your territory + captured stones.\n\nWhite receives komi (7.5 or 6.5 extra points) to compensate for Black going first.\n\nDuring scoring, players mark dead stones — groups that would inevitably be captured.',
  'goRules.ch.strategy.title': 'Basic Strategy',
  'goRules.ch.strategy.body':
    'Key principles for beginners:\n\n1. Corners first — it takes fewer stones to secure territory in corners.\n2. Then edges — sides are the next most efficient.\n3. Center last — the hardest place to hold territory.\n\nProtect your "eyes" — a group with two separate internal spaces (eyes) can never be captured.\n\nDon\'t try to save every stone — sometimes sacrificing stones gains you more territory elsewhere.',

  // Backgammon
  'nav.backgammon': 'Backgammon',
  'home.backgammon.title': 'Backgammon',
  'home.backgammon.description': 'Classic long backgammon',
  'backgammon.whiteToMove': 'White to move',
  'backgammon.blackToMove': 'Black to move',
  'backgammon.newGame': 'New game',
  'backgammon.resetConfirm': 'Start a new game?',
  'backgammon.roll': 'Roll dice',
  'backgammon.confirm': 'Confirm move',
  'backgammon.undo': '↩ Undo',
  'backgammon.rolling': 'Rolling…',
  'backgammon.yourTurn': 'Your turn',
  'backgammon.opponentTurn': "Opponent's turn",
  'backgammon.victory': 'Victory!',
  'backgammon.defeat': 'Defeat',
  'backgammon.mars': 'Mars!',
  'backgammon.playAgain': 'Play again',
  'backgammon.you': 'You',
  'backgammon.ai': 'AI',
  'backgammon.white': 'White',
  'backgammon.black': 'Black',
  'backgammon.aiThinking': 'Thinking…',
  'backgammon.choosePiece': 'Click a piece to move',
  'backgammon.resign': 'Resign',
  'backgammon.rules': 'Rules',
  'backgammon.review': 'Review board',
  'backgammon.bornOff': 'Born off',
  'backgammon.moveHistory': 'History',
  'backgammon.noMoves': 'No moves yet',
  'backgammon.settingsTitle': 'Settings',
  'backgammon.gameMode': 'Game mode',
  'backgammon.modeAI': 'vs AI',
  'backgammon.modeLocal': '2 players',
  'backgammon.playerColor': 'Your color',
  'backgammon.aiLevel': 'AI level',
  'backgammon.levelEasy': 'Easy',
  'backgammon.levelMedium': 'Medium',
  'backgammon.levelHard': 'Hard',
  'backgammon.rulesPreset': 'Rules preset',
  'backgammon.presetClassic': 'Classic',
  'backgammon.presetStrict': 'Strict',
  'backgammon.presetRelaxed': 'Relaxed',
  'backgammon.presetCaucasian': 'Caucasian',
  'backgammon.presetCustom': 'Custom',
  'backgammon.applyNewGame': 'Apply & New Game',
  'backgammon.headException': 'Head exception on first doubles',
  'backgammon.sixBlockRule': 'Six-block rule',
  'backgammon.blockClassical': 'Classical',
  'backgammon.blockAlwaysAllowed': 'Always allowed',
  'backgammon.blockAlwaysForbidden': 'Always forbidden',
  'backgammon.enableKokc': 'Kokc (triple win)',
  'backgammon.firstMoveByDice': 'First move by dice roll',
  'backgammon.strictMaxDie': 'Must use larger die when forced',
  'backgammon.kokc': 'Kokc!',

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
  'home.go.description': 'Ancient strategy game on a 9×9 or 19×19 board',

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
  'stats.endNoMoves': 'no moves',
  'stats.endPassed': 'two passes',
  'stats.endCompleted': 'bear-off',
  'stats.movesLabel': 'moves',
  'stats.tabChess': 'Chess',
  'stats.tabCheckers': 'Checkers',
  'stats.tabGo': 'Go',
  'stats.tabBackgammon': 'Nardi',

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

  // Backgammon Rules / Tutorial panel
  'backgammonRules.title': 'Rules of Long Backgammon',
  'backgammonRules.close': 'Close rules',
  'backgammonRules.chapter': 'Chapter',
  'backgammonRules.prev': 'Previous',
  'backgammonRules.next': 'Next',

  'backgammonRules.ch.board.title': 'The Board',
  'backgammonRules.ch.board.body':
    "Long Backgammon (Dlinnye nardy) is played on a board with 24 points arranged in a ring.\n\nThe board is divided into four quadrants of 6 points each:\n- White's home (points 0-5) - bottom-right\n- White's outer (points 6-11)\n- Black's outer (points 12-17)\n- Black's home (points 18-23)\n\nBoth players have 15 checkers. The goal is to move all your checkers around the ring and bear them off before your opponent.",

  'backgammonRules.ch.setup.title': 'Starting Setup',
  'backgammonRules.ch.setup.body':
    "At the start, all 15 white checkers are stacked on point 23 (White Head), and all 15 black checkers are stacked on point 11 (Black Head).\n\nBoth players move their checkers counter-clockwise around the board — from their head, through the opponent's home, through the outer quadrants, and into their own home.",

  'backgammonRules.ch.movement.title': 'Movement Direction',
  'backgammonRules.ch.movement.body':
    'White moves from point 23 → 0 (counter-clockwise, decreasing indices).\nBlack moves from point 11 → 0, then wraps: 23 → 12 (also counter-clockwise).\n\nOn your turn you roll two dice. Each die moves one checker that many points forward. You must use both dice if legally possible. With doubles, you get four moves of that value instead of two.',

  'backgammonRules.ch.dice.title': 'Using the Dice',
  'backgammonRules.ch.dice.body':
    'You roll two dice. Each die value is one sub-move — move one checker by that many points.\n\nYou can use both values on the same checker or on two different checkers. Doubles give four moves of that value.\n\nYou must use as many dice as legally possible. If only one die can be played, you must play the larger value if it is playable, otherwise the smaller one.',

  'backgammonRules.ch.nohit.title': 'One Color Per Point',
  'backgammonRules.ch.nohit.body':
    'Unlike Western backgammon, Long Backgammon has NO hitting.\n\nA point occupied by even one opponent checker is completely blocked — you cannot land on it.\n\nThis means your strategy is about building primes (rows of occupied points) to slow the opponent, not about hitting single blots.',

  'backgammonRules.ch.head.title': 'The Head Rule',
  'backgammonRules.ch.head.body':
    'On any turn, you may move only ONE checker off your head (the starting point: 23 for white, 11 for black).\n\nException: on the very first move of the game, if your dice result requires it, you may move TWO checkers off the head.',

  'backgammonRules.ch.blocking.title': 'The Blocking Rule',
  'backgammonRules.ch.blocking.body':
    "You may never form a continuous block of 6 or more points if doing so would completely trap all of your opponent's checkers behind it — i.e., none of their checkers have yet passed your 6-block.\n\nA prime of 6 is legal as long as at least one opponent checker is already on the other side of it.",

  'backgammonRules.ch.bearoff.title': 'Bearing Off',
  'backgammonRules.ch.bearoff.body':
    'Once all 15 of your checkers have entered your home quadrant (points 0–5 for white, 18–23 for black), you may start bearing off.\n\nTo bear off, roll a die and remove a checker from the corresponding point. If the exact point is empty, you must move a checker from a higher point (if possible) or remove from the highest occupied point.',

  'backgammonRules.ch.winning.title': 'Winning & Scoring',
  'backgammonRules.ch.winning.body':
    'The first player to bear off all 15 checkers wins.\n\nIf the loser has not borne off a single checker, the winner scores a Mars (double points).\n\nKokc (triple score) applies if the loser has no checkers in their home AND the winner has already borne some off — check your settings for the exact variant in use.',

  'backgammonRules.ch.strategy.title': 'Basic Strategy',
  'backgammonRules.ch.strategy.body':
    "Key principles for Long Backgammon:\n\n1) Race efficiently — move checkers out of the head early and spread them across the board.\n2) Build primes — a row of blocked points near the opponent's path slows their progress significantly.\n3) Timing — don't race ahead so fast that you create a 6-block before the opponent has passed it (illegal).\n4) Bear off cleanly — keep your home board balanced so you can use any dice result.\n5) Watch for Mars — if you're far ahead, play for a double-score win.",

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

  // Go tutorial / rules panel
  'goRules.title': 'Правила Го',
  'goRules.close': 'Закрыть правила',
  'goRules.chapter': 'Глава',
  'goRules.prev': 'Назад',
  'goRules.next': 'Далее',
  'goRules.ch.board.title': 'Доска',
  'goRules.ch.board.body':
    'Го играется на сетке из линий. Камни ставятся на пересечения — точки, где линии пересекаются, — а не внутрь клеток.\n\nСтандартная доска 19×19, но новичкам удобнее начинать на 9×9. Отмеченные точки (хоси) — ориентиры на доске.\n\nЧёрные всегда ходят первыми.',
  'goRules.ch.placing.title': 'Размещение камней',
  'goRules.ch.placing.body':
    'Игроки по очереди ставят один камень своего цвета на любое свободное пересечение.\n\nПоставленный камень никогда не двигается — он остаётся на месте, пока не будет захвачен.\n\nВместо хода можно спасовать (пропустить ход).',
  'goRules.ch.liberties.title': 'Свободы (дыхания)',
  'goRules.ch.liberties.body':
    'Каждому камню нужно пространство для «дыхания». Пустые точки, непосредственно прилегающие (вверх, вниз, влево, вправо), называются свободами.\n\nКамень в центре имеет 4 свободы. На краю — 3. В углу — только 2.\n\nЗелёные стрелки показывают 4 свободы центрального камня.',
  'goRules.ch.capture.title': 'Захват камней',
  'goRules.ch.capture.body':
    'Когда вы заполняете последнюю свободу камня противника, он захватывается и убирается с доски.\n\nЗахваченные камни приносят вам очки в конце партии.\n\nСмотрите демонстрацию: чёрные заполняют последнюю свободу и захватывают белый камень.',
  'goRules.ch.groups.title': 'Группы',
  'goRules.ch.groups.body':
    'Камни одного цвета, стоящие рядом по горизонтали или вертикали, образуют группу. Диагональное соединение не считается.\n\nГруппа делит свободы — все пустые точки, прилегающие к любому камню в группе.\n\nЧтобы захватить группу, нужно заполнить ВСЕ её свободы.',
  'goRules.ch.ko.title': 'Правило ко',
  'goRules.ch.ko.body':
    'Иногда захват создаёт позицию, в которой противник мог бы немедленно отбить камень, создавая бесконечный цикл.\n\nПравило ко это предотвращает: после захвата одиночного камня противник не может сразу же отбить на том же месте. Сначала он должен сходить в другом месте.\n\nЗапрещённая точка отмечается красным квадратом на доске.',
  'goRules.ch.suicide.title': 'Правило самоубийства',
  'goRules.ch.suicide.body':
    'Нельзя ставить камень туда, где у него будет ноль свобод — если только этот ход не приводит к захвату камней противника.\n\nВ этом примере центральная точка окружена чёрными камнями. Поставить белый камень туда — самоубийство (ноль свобод), это запрещено.\n\nНо если постановка камня захватывает вражеские камни, он получает свободы от захвата — и ход разрешён.',
  'goRules.ch.territory.title': 'Территория',
  'goRules.ch.territory.body':
    'Цель Го — контролировать больше территории, чем противник.\n\nТерритория — это пустые пересечения, полностью окружённые вашими камнями. В этом примере левая сторона — территория чёрных, правая — белых.\n\nВыделенные точки показывают территорию каждой стороны.',
  'goRules.ch.scoring.title': 'Подсчёт очков',
  'goRules.ch.scoring.body':
    'Партия заканчивается, когда оба игрока спасуют подряд. Затем подсчитываются очки.\n\nКитайские правила: ваш счёт = ваша территория + ваши камни на доске.\nЯпонские правила: ваш счёт = ваша территория + захваченные камни.\n\nБелые получают коми (7,5 или 6,5 дополнительных очков) в качестве компенсации за то, что чёрные ходят первыми.\n\nПри подсчёте игроки отмечают мёртвые камни — группы, которые неизбежно были бы захвачены.',
  'goRules.ch.strategy.title': 'Базовая стратегия',
  'goRules.ch.strategy.body':
    'Ключевые принципы для начинающих:\n\n1. Сначала углы — для захвата территории в углах нужно меньше камней.\n2. Затем края — стороны доски следующие по эффективности.\n3. Центр в последнюю очередь — там сложнее всего удержать территорию.\n\nЗащищайте свои «глаза» — группа с двумя отдельными внутренними пространствами (глазами) не может быть захвачена.\n\nНе пытайтесь спасти каждый камень — иногда жертва камней приносит больше территории в другом месте.',

  // Backgammon
  'nav.backgammon': 'Нарды',
  'home.backgammon.title': 'Нарды',
  'home.backgammon.description': 'Классические длинные нарды',
  'backgammon.whiteToMove': 'Ход белых',
  'backgammon.blackToMove': 'Ход чёрных',
  'backgammon.newGame': 'Новая партия',
  'backgammon.resetConfirm': 'Начать новую партию?',
  'backgammon.roll': 'Бросить кубики',
  'backgammon.confirm': 'Завершить ход',
  'backgammon.undo': '↩ Отмена',
  'backgammon.rolling': 'Бросок…',
  'backgammon.yourTurn': 'Ваш ход',
  'backgammon.opponentTurn': 'Ход соперника',
  'backgammon.victory': 'Победа!',
  'backgammon.defeat': 'Поражение',
  'backgammon.mars': 'Марс!',
  'backgammon.playAgain': 'Новая партия',
  'backgammon.you': 'Вы',
  'backgammon.ai': 'ИИ',
  'backgammon.white': 'Белые',
  'backgammon.black': 'Чёрные',
  'backgammon.aiThinking': 'Думаю…',
  'backgammon.choosePiece': 'Нажмите на фишку для хода',
  'backgammon.resign': 'Сдаться',
  'backgammon.rules': 'Правила',
  'backgammon.review': 'Посмотреть доску',
  'backgammon.bornOff': 'Выбито',
  'backgammon.moveHistory': 'История',
  'backgammon.noMoves': 'Ходов пока нет',
  'backgammon.settingsTitle': 'Настройки',
  'backgammon.gameMode': 'Режим игры',
  'backgammon.modeAI': 'Против ИИ',
  'backgammon.modeLocal': '2 игрока',
  'backgammon.playerColor': 'Ваш цвет',
  'backgammon.aiLevel': 'Уровень ИИ',
  'backgammon.levelEasy': 'Новичок',
  'backgammon.levelMedium': 'Любитель',
  'backgammon.levelHard': 'Мастер',
  'backgammon.rulesPreset': 'Правила',
  'backgammon.presetClassic': 'Классика',
  'backgammon.presetStrict': 'Строгие',
  'backgammon.presetRelaxed': 'Мягкие',
  'backgammon.presetCaucasian': 'Кавказские',
  'backgammon.presetCustom': 'Пользовательские',
  'backgammon.applyNewGame': 'Применить и начать',
  'backgammon.headException': 'Исключение заставы при первом дубле',
  'backgammon.sixBlockRule': 'Правило шести',
  'backgammon.blockClassical': 'Классическое',
  'backgammon.blockAlwaysAllowed': 'Всегда разрешено',
  'backgammon.blockAlwaysForbidden': 'Всегда запрещено',
  'backgammon.enableKokc': 'Коц (тройной выигрыш)',
  'backgammon.firstMoveByDice': 'Право первого хода по кубику',
  'backgammon.strictMaxDie': 'Обязательное правило большего кубика',
  'backgammon.kokc': 'Коц!',

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
  'home.go.description': 'Древняя стратегическая игра на доске 9×9 или 19×19',

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
  'stats.endNoMoves': 'нет ходов',
  'stats.endPassed': 'два паса',
  'stats.endCompleted': 'выбивание',
  'stats.movesLabel': 'ходов',
  'stats.tabChess': 'Шахматы',
  'stats.tabCheckers': 'Шашки',
  'stats.tabGo': 'Го',
  'stats.tabBackgammon': 'Нарды',

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

  // Backgammon Rules / Tutorial panel
  'backgammonRules.title': 'Правила длинных нард',
  'backgammonRules.close': 'Закрыть правила',
  'backgammonRules.chapter': 'Глава',
  'backgammonRules.prev': 'Назад',
  'backgammonRules.next': 'Далее',

  'backgammonRules.ch.board.title': 'Доска',
  'backgammonRules.ch.board.body':
    'Длинные нарды играются на доске с 24 пунктами, расположенными по кругу.\n\nДоска делится на четыре квадранта по 6 пунктов:\n• Дом белых (пункты 0–5) — правый нижний\n• Внешний стол белых (пункты 6–11)\n• Внешний стол чёрных (пункты 12–17)\n• Дом чёрных (пункты 18–23)\n\nУ каждого игрока 15 шашек. Цель — провести все шашки вокруг доски и вывести их за борт раньше соперника.',

  'backgammonRules.ch.setup.title': 'Начальная расстановка',
  'backgammonRules.ch.setup.body':
    'В начале игры все 15 белых шашек стоят на пункте 23 (голова белых), а все 15 чёрных — на пункте 11 (голова чёрных).\n\nОба игрока двигают шашки против часовой стрелки: от головы через дом соперника, через внешний стол и в свой дом.',

  'backgammonRules.ch.movement.title': 'Направление движения',
  'backgammonRules.ch.movement.body':
    'Белые движутся с пункта 23 → 0 (против часовой стрелки, убывающие индексы).\nЧёрные движутся с пункта 11 → 0, затем переходят: 23 → 12 (тоже против часовой стрелки).\n\nВ свой ход вы бросаете два кубика. Каждый кубик — один ход одной шашки на соответствующее количество пунктов. Оба кубика нужно использовать, если это возможно. При дублях вы делаете четыре хода вместо двух.',

  'backgammonRules.ch.dice.title': 'Использование кубиков',
  'backgammonRules.ch.dice.body':
    'Вы бросаете два кубика. Каждое выпавшее число — один под-ход: передвиньте одну шашку на столько пунктов вперёд.\n\nМожно использовать оба числа для одной шашки или для двух разных. При дублях выполняются четыре хода с одинаковым значением.\n\nВы обязаны использовать как можно больше кубиков. Если можно сыграть только один — играйте больший, а если он недоступен — меньший.',

  'backgammonRules.ch.nohit.title': 'Один цвет на пункте',
  'backgammonRules.ch.nohit.body':
    'В отличие от коротких нард, в длинных нардах нет рубки шашек.\n\nПункт, занятый даже одной шашкой соперника, полностью закрыт — вы не можете на него встать.\n\nВся стратегия строится на создании «баров» (заборов из закрытых пунктов), замедляющих соперника, а не на сбивании шашек.',

  'backgammonRules.ch.head.title': 'Правило головы',
  'backgammonRules.ch.head.body':
    'За один ход разрешается снять с головы (стартовый пункт: 23 для белых, 11 для чёрных) только ОДНУ шашку.\n\nИсключение: в самый первый ход партии при выпадении дубля, требующего двух шашек с головы, разрешается снять две.',

  'backgammonRules.ch.blocking.title': 'Правило блокировки',
  'backgammonRules.ch.blocking.body':
    'Запрещено строить непрерывный забор из 6 и более пунктов, если он полностью отрезает все шашки соперника — то есть ни одна из них ещё не прошла за этот забор.\n\nЗабор из 6 пунктов разрешён, если хотя бы одна шашка соперника уже находится по другую сторону от него.',

  'backgammonRules.ch.bearoff.title': 'Выбрасывание с доски',
  'backgammonRules.ch.bearoff.body':
    'Как только все 15 ваших шашек попали в ваш дом (пункты 0–5 для белых, 18–23 для чёрных), можно начинать выбрасывание.\n\nДля выбрасывания бросьте кубики и снимайте шашку с соответствующего пункта. Если нужного пункта нет, двигайте шашку с более дальнего пункта или снимайте с наибольшего занятого.',

  'backgammonRules.ch.winning.title': 'Победа и счёт',
  'backgammonRules.ch.winning.body':
    'Побеждает тот, кто первым выбросит все 15 шашек с доски.\n\nЕсли проигравший не выбросил ни одной шашки — это Марс (двойной счёт).\n\nКоц (тройной счёт) засчитывается, если у проигравшего нет шашек в своём доме, а победитель уже часть выбросил — уточните в настройках, какой вариант правил используется.',

  'backgammonRules.ch.strategy.title': 'Основы стратегии',
  'backgammonRules.ch.strategy.body':
    'Ключевые принципы длинных нард:\n\n1) Гоните вперёд — снимайте шашки с головы как можно раньше и распределяйте их по доске.\n2) Стройте заборы — ряд закрытых пунктов на пути соперника сильно тормозит его движение.\n3) Считайте темп — не уходите так далеко вперёд, чтобы забор из 6 пунктов отрезал все шашки соперника (это запрещено).\n4) Выбрасывайте эффективно — держите дом сбалансированным, чтобы использовать любой результат кубика.\n5) Играйте на Марс — если вы сильно опережаете соперника, стремитесь к двойному счёту.',

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
