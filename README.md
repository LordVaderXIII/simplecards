# Virtual Card Table PWA

A lightweight, mobile-friendly Progressive Web App (PWA) that simulates a virtual card table. It allows users to upload custom card decks via CSV, shuffle them, and draw cards one by one. Ideal for prototyping card games, flashcards, or playing simple card games on mobile devices.

## Features

*   **Custom Decks**: Upload decks using a simple CSV format.
*   **Persistent State**: The state of the deck (shuffled order, drawn cards) is saved automatically. You can close the app and come back to where you left off.
*   **Mobile Optimized**: Designed as a PWA with touch-friendly controls (tap to draw), dark mode support, and offline capabilities (when installed).
*   **Virtual Table**: Visualizes the deck as a stack. Tap to draw the next card.
*   **Interactive Actions**: Cards can have interactive elements like timers or dice rolls.

## Usage

### 1. Uploading a Deck

1.  Prepare a CSV file with your card data.
2.  On the home screen, click **"Upload CSV"**.
3.  Select your file.

#### CSV Format

The CSV file **must** use the following headers:

`deck_name,title,body,action_type,action_value,back_icon`

*   `deck_name`: (Required) The name of the deck. All rows with the same deck name are grouped together.
*   `title`: Text to display on the card face.
*   `body`: Description or body text (supports Markdown).
*   `action_type`: (Optional) Logic for the card. Supported values:
    *   `none` (default): Just text/image.
    *   `timer`: Displays a countdown timer.
    *   `dice`: Displays a dice roll button.
    *   `both`: Displays both timer and dice.
*   `action_value`: (Optional) Parameter for the action.
    *   For `timer`: Duration in seconds (e.g., `60`).
    *   For `dice`: Number of sides (e.g., `20`).
    *   For `both`: Comma-separated "seconds,sides" (e.g., `60,20`).
*   `back_icon`: (Optional) FontAwesome icon name for the card back (e.g., `fa-question`, `fa-dragon`).

**Example CSV:**

```csv
deck_name,title,body,action_type,action_value,back_icon
MyGame,Attack,Deals 5 damage,none,,fa-dragon
MyGame,Challenge,You have 10 seconds!,timer,10,fa-clock
MyGame,Luck,Roll a d20,dice,20,fa-dice
MyGame,Combo,Roll d6 in 30s,both,"30,6",fa-bolt
```

### 2. Playing

1.  Click on a deck name from the list.
2.  Tap the card stack to draw a card.
3.  Tap the **Undo/Reset** button (top right) to reshuffle the deck.

## Running Locally

### Prerequisites

*   Node.js (v18+)
*   npm

### Setup

1.  Install dependencies:
    ```bash
    npm run install-all
    ```

2.  Start the development server:
    ```bash
    npm run dev
    ```
    This runs the backend on port 3000 and the frontend via Vite.

3.  Build for production:
    ```bash
    npm run build
    npm start
    ```

## Docker

Build and run using Docker:

```bash
docker build -t virtual-card-table .
docker run -p 3000:3000 -v $(pwd)/decks:/app/decks virtual-card-table
```

The `/app/decks` volume is used to persist uploaded decks and game state.

## Tech Stack

*   **Frontend**: React, Vite, CSS Modules (Apple HIG style).
*   **Backend**: Node.js, Express, Multer (for uploads), CSV-Parser.
*   **Storage**: JSON files (local filesystem).
