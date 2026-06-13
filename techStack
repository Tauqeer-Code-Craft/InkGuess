#  InkGuess — Tech Stack

This document defines the technology stack used to build InkGuess, a real-time multiplayer drawing and guessing game.

---

##  Frontend

The frontend is responsible for rendering the game UI, canvas drawing, chat, and real-time updates.

### Core Stack

* **React** — UI framework for building interactive components
* **TypeScript** — type safety and maintainability
* **Vite** — fast build tool and dev server

### Real-Time Communication

* **Socket.IO Client** — handles real-time communication with backend

### Drawing System

* Native **HTML Canvas API**

  * Used for real-time drawing
  * Lightweight and high-performance

### State Management

* **Zustand** (recommended)

  * Simple global state management for:

    * player state
    * room state
    * game state

---

##  Backend

The backend handles game logic, room management, scoring, and real-time events.

### Core Stack

* **NestJS (Node.js + TypeScript)**

  * Modular architecture
  * Built-in WebSocket support
  * Scalable structure

### Real-Time Layer

* **Socket.IO**

  * Room-based communication
  * Event-driven architecture
  * Built-in reconnection support

---

##  Game State & Data Layer

InkGuess uses Redis as the primary state store.

### Redis Usage

* Room state management
* Player tracking
* Score storage
* Current word storage
* Hint (revealed letters) tracking
* Canvas stroke storage
* Temporary session data

### Key Characteristics

* In-memory speed
* TTL-based cleanup
* No heavy persistent database required for MVP

---

##  Scaling Layer (Future Ready)

To support multiple backend instances:

* **Redis Pub/Sub**
* **Socket.IO Redis Adapter**

This ensures:

* Cross-server room communication
* Horizontal scaling support

---

##  Optional Persistence Layer (Future)

Not required for MVP, but can be added later:

* **PostgreSQL**

  * User accounts
  * Game history
  * Statistics
  * Leaderboards

---

##  Infrastructure

### Development

* Node.js runtime
* Docker (optional for local setup)

### Production (recommended)

* Nginx (reverse proxy)
* Docker containers
* VPS (e.g., DigitalOcean / Hetzner / AWS)

---

##  Communication Protocol

All real-time communication happens via:

* **Socket.IO events**

Examples:

* `join-room`
* `start-game`
* `draw`
* `guess`
* `hint-update`
* `score-update`
* `game-end`

---

##  Design Principles

* Server is the **single source of truth**
* Client is **render-only + input sender**
* Redis stores **ephemeral game state**
* WebSockets handle **real-time sync**
* No client-side trust for scoring or word validation

---

##  Summary

InkGuess is built with a lightweight but scalable stack:

* Fast frontend (React + Canvas)
* Structured backend (NestJS)
* Real-time engine (Socket.IO)
* High-speed state layer (Redis)

Designed to scale from MVP to production without architectural rewrites.
