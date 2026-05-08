# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start Metro bundler
yarn start

# Run on Android
yarn android

# Run on iOS
yarn ios

# Lint
yarn lint

# Tests
yarn test

# Run a single test file
yarn test path/to/test.tsx
```

## Architecture

This is a React Native drag-and-drop grid reordering app. All logic lives in three files:

- [App.tsx](App.tsx) — Root component. Holds the list of items, renders a horizontal `ScrollView` with pages. Each page is a 3-column × 4-row grid. Contains pagination dot animation.
- [src/Item.tsx](src/Item.tsx) — Individual draggable cell. Implements long-press (500 ms, 10 px min distance) pan gesture via `react-native-gesture-handler`. Drives scale + translate animations with `react-native-reanimated`. Handles cross-page edge auto-scroll.
- [src/Layout.ts](src/Layout.ts) — Pure layout logic as Reanimated worklets. Exports `useLayout` hook and four worklet functions: `calIndex` (collision detection), `calPosition` (assigns x/y to all items), `move` (reorders during drag), `setPosition` (finalizes after drop).

### Key data model

Each item carries an `Offset` object of Reanimated `SharedValue`s (11 fields): `originalOrder`, `order`, `originalPage`, `page`, `width`, `height`, `rowHeight`, `x`, `y`, `originalX`, `originalY`. All position mutation happens on the Reanimated worklet thread.

### Grid layout constants

- 3 columns per row, 4 rows per page → 12 items per page
- Container width is 75% of screen width

### Important constraints

- `react-native-reanimated/plugin` **must** remain first (or only) plugin in `babel.config.js` — Reanimated requires it.
- All functions in `Layout.ts` that run inside gesture callbacks must carry the `'worklet'` directive.
- ESLint enforces double quotes in JSX but single quotes everywhere else (see `.prettierrc.js` vs `.eslintrc.js`). Max line length is 120.
