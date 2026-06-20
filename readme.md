# InkGuess

InkGuess is a real-time multiplayer drawing and guessing game. The project is structured as a monorepo containing a React frontend and a NestJS backend.

## Architecture and Tech Stack

The application uses the following technology stack:

### Frontend (apps/frontend)
* React with TypeScript and Vite
* Zustand for real-time client state management
* TanStack Query with Axios for HTTP REST client-side queries
* Socket.IO Client for real-time WebSockets communication
* Vanilla CSS with a glassmorphic design theme

### Backend (apps/backend)
* NestJS (Node.js framework)
* Socket.IO Server for handling WebSocket events
* ioredis for Redis integration
* Automatic in-memory fallback store when local Redis is unavailable

### Database & State Layer (docker)
* Redis container config for room states, player lists, and stroke caching

---

## Directory Structure

```
InkGuess/
├── apps/
│   ├── frontend/         # React TypeScript Vite application
│   └── backend/          # NestJS Web Server and WebSocket gateway
├── docker/
│   └── docker-compose.yml # Docker config for Redis
├── User-Stories.md       # Target requirements
├── techStack             # Target stack specifications
└── README.md             # Project documentation (this file)
```

---

## Game Rules and Mechanics

1. Players join a room using a unique 4-letter room code.
2. The room host starts the game. The game runs for a maximum of 3 rounds.
3. Each turn, one player is selected as the drawer. The drawer chooses one of three randomly generated words.
4. The drawer draws on the canvas in real-time, while other players submit guesses through the chat.
5. Guessing players receive points based on how quickly they identify the word. The drawer receives bonus points when guessers get the word correct.
6. Letters of the word are progressively revealed as hints to guessing players during the drawing phase.
7. Correct answers are hidden in the public chat to prevent copying.
8. At the end of 3 rounds, final rankings are displayed on a podium leaderboard, and the host can trigger a rematch.

---

## API and WebSocket Reference

### HTTP REST Endpoints
* POST `/api/rooms` - Creates a new room and returns its unique code.
* GET `/api/rooms/check/:code` - Checks if a room with the specified code exists.
* GET `/api/rooms/:code` - Retrieves the current state of a room.

### Incoming WebSocket Events (Client to Server)
* `join-room` - Payload: `{ roomCode: string, playerName: string }`. Joins the player to the room session.
* `start-game` - Triggers game initiation (host only).
* `draw` - Payload: `StrokeData`. Broadcasts a stroke to all other players in the room and saves it in the database.
* `clear-canvas` - Clears the current drawing (drawer only).
* `select-word` - Payload: `{ word: string }`. Confirms word choice during selection phase (drawer only).
* `submit-guess` - Payload: `{ guess: string }`. Submits a guess.
* `request-rematch` - Resets scores and status to lobby for another game (host only).

### Outgoing WebSocket Events (Server to Client)
* `room-update` - Emits the full, updated room state (players, host, status, round).
* `timer-update` - Emits remaining turn seconds.
* `hint-update` - Emits the updated hint representation (e.g. "A _ _ _ E").
* `draw-stroke` - Syncs incoming strokes to client drawing canvas.
* `clear-canvas` - Signals clients to clear their canvas.
* `canvas-sync` - Sends the complete history of strokes to new players joining mid-game.
* `chat-message` - Distributes guess messages, system notices, and correct guess alerts.

---

## Installation and Execution Guide

Ensure Node.js (version 18 or higher) is installed on your local environment.

### 1. Database (Optional)
To run a local Redis container, start Docker and run:
```bash
docker compose -f docker/docker-compose.yml up -d
```
If Docker or Redis is not running, the NestJS backend will automatically warn you and fallback to using an in-memory Map data structure. The game will still work correctly.

### 2. Running Both Applications Concurrently
You can install dependencies and run both services simultaneously using the root package.json scripts.

First, install dependencies for all services:
```bash
npm run install:all
```

Then, run both the NestJS backend (port 3000) and the Vite frontend (port 5173) concurrently:
```bash
npm start
```


### 4. Testing Multiplayer
Open `http://localhost:5173` in multiple private or separate browser tabs. Enter distinct names in the login form to simulate different users joining, drawing, chatting, and scoring.
