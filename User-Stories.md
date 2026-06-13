# User Stories — Scribble Game

## Room System

### Public Matchmaking

As a player, I want to click a “Play” button so that I am automatically matched with other players in a public game without needing a room code.

### Private Room Creation

As a player, I want to create a private room so that I can play only with people I invite.

### Private Room Join via URL

As a player, I want to join a private room using a shared URL so that I can directly enter a specific game session.

### Room Persistence

As a player, I want the room to remain active after a game ends so that I can play another round without creating a new room.

---

## Player Experience

### Join Room

As a player, I want to join a room and see other connected players so that I know who I am playing with.

### Leave Room

As a player, I want to leave a room anytime so that I can exit the game freely.

### Reconnection

As a player, I want to reconnect after a disconnection so that I can continue the ongoing game session.

---

## Game Flow

### Game Start

As a host or system, I want the game to start when enough players join so that gameplay can begin automatically.

### Round System (3 Rounds Max)

As a player, I want the game to run for exactly 3 rounds so that the match has a clear endpoint.

### Time-Based Game Limit

As a system, I want the game to end after a maximum duration (around 10 minutes) so that matches do not run indefinitely.

### Turn Rotation

As a player, I want each player to get a turn to draw so that everyone participates equally.

### Game End

As a player, I want the game to end after all rounds are completed so that final results can be shown.

---

## Drawing System

### Real-Time Drawing

As a player, I want to see drawing updates instantly so that I can follow what is being drawn.

### Restricted Drawing Access

As a player, I want only the current drawer to be able to draw so that the game remains fair.

### Canvas Sync on Join

As a player joining mid-game, I want to see the current drawing state so that I am not out of sync.

### Clear Canvas

As the drawer, I want to clear the canvas so that I can restart my drawing if needed.

---

## Word System

### Word Selection

As the drawer, I want to choose from multiple word options so that I can pick what I want to draw.

### Hidden Word

As a guessing player, I want the word to remain hidden so that I must guess based on the drawing.

### Word Length Hint

As a player, I want to see the number of letters in the word so that I can guess more effectively.

### Progressive Letter Hints

As a player, I want letters to gradually appear over time so that I get assistance if I cannot guess early.

---

## Guessing System

### Submit Guess via Chat

As a player, I want to submit guesses through chat so that I can try to identify the drawing.

### Correct Guess Detection

As a system, I want to automatically detect correct guesses so that scoring happens instantly.

### Hidden Correct Answers

As a player, I want correct guesses to be hidden from others so that answers cannot be copied.

### Prevent Duplicate Scoring

As a system, I want to prevent players from scoring multiple times per round so that scoring remains fair.

---

## Scoring & Leaderboard

### Score Awarding

As a player, I want to earn points for correct guesses so that my performance is rewarded.

### Drawer Scoring

As a drawer, I want to earn points when others guess correctly so that drawing skill is rewarded.

### Live Scoreboard

As a player, I want to see updated scores during the game so that I can track progress.

### Final Leaderboard

As a player, I want to see final rankings after the game ends so that I know the winner.

---

## Post Game Experience

### End of Game Screen

As a player, I want to see a leaderboard when the game ends so that I can see final results.

### Rematch Option

As a player, I want to start a new game in the same room so that I can continue playing with the same group.

### Room Reset

As a system, I want to reset game state after each match so that a fresh game can start without creating a new room.

---

## System Rules

### Server Authoritative State

As a system, I want all game logic to be handled on the server so that cheating is prevented.

### Redis State Management

As a system, I want to store room and game state in Redis so that multiple backend instances can share data.

### Socket Event Communication

As a system, I want all game actions to be communicated via WebSockets so that gameplay is real-time.

### Rate Limiting

As a system, I want to limit chat and drawing events so that spam and abuse are prevented.

### Automatic Room Cleanup

As a system, I want inactive rooms to be cleaned up automatically so that resources are not wasted.
