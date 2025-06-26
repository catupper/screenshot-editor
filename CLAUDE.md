# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a screenshot editor web application built with React, TypeScript, and Vite. The application is designed to be hosted on GitHub Pages and provides functionality for editing and processing screenshots.

## Development Commands

- `pnpm run dev` - Start the development server with hot module replacement
- `pnpm run build` - Build for production (runs TypeScript compiler then Vite build)
- `pnpm run lint` - Run ESLint to check code quality
- `pnpm run preview` - Preview the production build locally

## Architecture

The application follows a standard React + Vite structure:

- **Entry Point**: `src/main.tsx` bootstraps the React application
- **Main Component**: `src/App.tsx` contains the primary UI layout with:
  - Header section for tools
  - Main canvas area (800x600) for image editing
  - Footer with export functionality
- **Styling**: Uses Bootstrap 5.3.7 for UI components and layout
- **Build Tool**: Vite with React plugin for fast development and optimized builds

The app is configured to include `crypto-js` in dependencies optimization, suggesting future cryptographic or hashing functionality.

## Key Technical Details

- Node.js version: 22.17.0 (via Volta)
- TypeScript configuration split into:
  - `tsconfig.app.json` for application code
  - `tsconfig.node.json` for build configuration
- ESLint configured for React and TypeScript
- Module type: ES modules


## 開発ログの記録
タスクを行うたびに、その開発記録をlogsディレクトリ下に日付の名前がついたファイルに記録してください。
例えばlogs/2025-06-25.md には
```md
## 軽微なリファクタリング
- as anyを使っているところをなくした。
- eslintでas anyを使ったらerrorになるようにした。

## TSK-1234
- Ctrl+C, Ctrl+V でクリップボードからキャンパスへの読み書きができるようにした。
- Testなしでつくったら、怒られた。今度からはTestを先につく量にする。
```
のようなものが書かれていくとよいです。
