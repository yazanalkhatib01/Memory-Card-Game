# Memory Card Game

A clean and interactive Memory Card Game built with **HTML, CSS, and JavaScript**, focusing on game logic, UI responsiveness, and modular structure.

---

# Features

- Player name system (game unlocks after input)
- Memory-based card matching logic
- Optional timer mode (countdown / elapsed time)
- Retry system with visual indicators
- Hint system with cooldown
- Live statistics (moves, mistakes, misses)
- Win / Lose game states with overlay results
- Smooth animations and modern UI design

---

# How to Play

1. Enter your name to start the game
2. Flip cards and try to find matching pairs
3. Each move flips two cards
4. Match all pairs to win
5. Limited retries and optional timer add challenge

---

# Game Logic Overview

The game follows this lifecycle:

```text id="q9x1aa"
Init → Play → Match Check → Update State → End Game
```

### Core Flow:

- User input unlocks the game
- Cards are shuffled and rendered
- Player interacts by clicking cards
- System checks for matches
- Game ends when:
  - All pairs are matched (Win)
  - Timer ends or retries reach zero (Lose)

---

# Project Structure

## State Management

Handles all game data:

- cards
- moves
- mistakes
- retries
- timer

## UI Layer

Responsible for:

- Rendering cards
- Updating stats
- Displaying overlays

## Game Engine

Core functions:

- `initGame()`
- `onCardClick()`
- `checkMatch()`
- `endGame()`

## Utilities

Reusable helpers:

- shuffle function
- time formatting
- UI animations

---

# Timer System

- Optional feature
- Can work as:
  - Countdown timer
  - Elapsed time tracker

- Automatically ends game when time reaches zero

---

# Hint System

- Temporarily reveals all unmatched cards
- Includes cooldown period to prevent spam
- Automatically hides cards after short duration

---

# Technologies Used

- HTML5
- CSS3 (Flexbox + Grid + Animations)
- Vanilla JavaScript (ES6+)

---

# Possible Improvements

- Add difficulty levels (Easy / Medium / Hard)
- Add sound effects
- Add leaderboard system
- Convert into React / Angular version
- Add multiplayer mode
