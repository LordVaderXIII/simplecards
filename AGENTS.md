# Virtual Card Table PWA - Agents Guide

This repository contains a lightweight, mobile-friendly Progressive Web App (PWA) simulating a virtual card table. It uses a Node.js/Express backend for file-based persistence and a React frontend built with Vite.

## Project Structure

*   **Root**: Contains the Express server (`server.js`), Dockerfile, and global configuration.
*   **client/**: Contains the React application (Vite project).
*   **decks/**: (Generated) Stores deck JSON files and state files.
*   **.github/workflows/**: CI/CD configuration.

## Architecture & Conventions

*   **Backend**: Express.js.
    *   API endpoints are prefixed with `/api` (e.g., `/api/upload`, `/api/decks`).
    *   Data is persisted as JSON files in the `decks/` directory.
    *   Uses `multer` for CSV uploads and `csv-parser` for processing.
*   **Frontend**: React (Vite).
    *   Located in `client/`.
    *   Styling follows Apple's Human Interface Guidelines (HIG) via CSS variables.
    *   PWA features (manifest, service worker) are configured for iOS support.
    *   Uses `react-icons` for iconography.
*   **Docker**:
    *   Multi-stage build: Builds frontend, then serves with Node.js.
    *   Exposes port 3000.
    *   Persists data via volume mounting at `/app/decks`.

## Development Commands

*   **Install Dependencies**: `npm install && cd client && npm install`
*   **Start Dev Server**: `npm run dev` (Runs backend and frontend concurrently)
*   **Build Frontend**: `cd client && npm run build`
*   **Start Production Server**: `npm start` (Serves the `client/dist` folder)

## Testing & Verification

*   **Frontend Verification**: Use Playwright scripts to interact with the UI.
    *   Ensure to reset state via API (`POST /api/deck/:name/state`) before testing specific scenarios.
*   **API Testing**: Use `curl` to verify endpoints.
    *   Example: `curl http://localhost:3000/api/decks`

## Deployment

*   **Docker Hub**: Push images using the GitHub Actions workflow.
*   **Versioning**: Follow Semantic Versioning in `package.json`.
