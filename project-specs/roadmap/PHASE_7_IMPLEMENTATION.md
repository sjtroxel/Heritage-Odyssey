# Phase 7 Implementation: UI Overhaul & Bug Fixes

This document defines the technical execution of the Phase 7 Polish plan.

## TRACK 1: BUG FIXES

### Step 1 — Fix index.css [x]
**Files to modify:** `client/src/index.css`
**Logic:** Remove all default `:root` and `body` boilerplate styles provided by Vite. Retain only the Tailwind directives. Replace brand colors with the Victorian palette.
- **Custom Properties:**
  - `--color-paper: #f4ece1`
  - `--color- ink: #1a1512`
  - `--color-cast-iron: #2d4a3e`
  - `--color-cast-iron-dark: #1e3329`
  - `--color-brass: #9a7b2f`
  - `--color-stone: #5c5651`
**Done Criteria:** No dark background or body-centering styles remain; the application uses the new palette base.

### Step 2 — Add Vite dev proxy [x]
**Files to modify:** `client/vite.config.ts`
**Logic:** Add a `server.proxy` block to route all `/api` requests to `http://localhost:3000` with `changeOrigin: true`.
**Done Criteria:** `fetch('/api/health')` from the browser returns 200 when both client and server are running.

### Step 3 — Wire VITE_API_URL [x]
**Files to create:** `client/src/lib/api.ts`
- Export `apiUrl(path: string): string` function.
- Logic: returns `import.meta.env.VITE_API_URL + path` if defined, else `path`.
**Files to modify:** `InteractionLayer.tsx`, `useAudioStream.ts`
- Replace hardcoded `/api/...` strings with `apiUrl('/api/...')`.
**Done Criteria:** All client-side fetch calls use the `apiUrl` utility.

### Step 4 — DB seed script [x]
**Files to create:** `server/src/db/seed.ts`
- Logic: Import `bcrypt`, `db` client, and `users` schema. Upsert a demo user:
  - email: `guest@heritage-odyssey.demo`
  - password: `guest-demo-2026` (hashed with `bcrypt`)
**Files to modify:** `server/package.json`
- Add `"db:seed": "tsx src/db/seed.ts"`
**Done Criteria:** Running `npm run db:seed -w server` creates the guest user without errors or duplicates.

### Step 5 — Auth state and JWT storage (frontend) [x]
**Files to create:** `client/src/hooks/useAuth.ts`
- Logic: Manage auth lifecycle. Check `localStorage` for token on mount. If missing, attempt `POST /api/auth/refresh`. Store access token in state/localStorage on success.
- Expose: `{ token, isAuthenticated, login, logout }`.
- `login(email, password)`: calls `/api/auth/login`.
- `logout()`: calls `/api/auth/logout`, clears local state.
**Files to modify:** `client/src/App.tsx` (or `main.tsx`)
- Wrap app in auth context or provide token to `InteractionLayer` and `useAudioStream`.
**Done Criteria:** Refreshing the page preserves login state via the refresh cookie.

### Step 6 — Login screen component [x]
**Files to create:** `client/src/components/LoginScreen.tsx`
- Logic: Render a full-centered Victorian "access request" panel on the paper background.
- UI: Libre Baskerville font, "Enter the Archive" button (guest login), and standard Sign In/Register forms.
**Files to modify:** `client/src/App.tsx`
- Conditionally render `LoginScreen` if `!isAuthenticated`.
**Done Criteria:** Clicking "Enter the Archive" authenticates the user and reveals the main app.

## TRACK 2: VISUAL OVERHAUL

### Step 7 — Global typography and base styles [x]
**Files to modify:** `client/index.html`
- Load Google Fonts: `Libre Baskerville` and `Spectral`.
**Files to modify:** `client/src/index.css`
- Set base `font-family` to `Spectral` in the `@theme` block.
**Done Criteria:** All body text renders in the `Spectral` font.

### Step 8 — Header redesign [x]
**Files to modify:** `client/src/App.tsx`
- Logic: Set background to `#2d4a3e` (cast iron), logo to `#9a7b2f` (brass) in `Libre Baskerville`. Add a subtle brass bottom border.
**Done Criteria:** Header aesthetic matches a Victorian government office nameplate.

### Step 9 — Hero section redesign [x]
**Files to modify:** `client/src/App.tsx`
- UI: Paper background (`#f4ece1`) with subtle noise texture. Large `Libre Baskerville` H1.
- Logic: Replace the gradient box with the "Archive Record Sample" panel (double border, cream background, Spectral italic sample text from `golden_set.json`).
**Done Criteria:** Hero section resembles a Victorian naturalist journal page.

### Step 10 — Interaction bar redesign [x]
**Files to modify:** `client/src/components/InteractionLayer.tsx`
- UI: Cast-iron-dark background with brass top border. Cream text input.
- Status strings: Update "Processing", "Transcribing", etc., to match the Victorian theme.
- Hint text: "Press & Hold Mic or Type to Search the Archive" (small caps Spectral).
**Done Criteria:** Interaction bar looks like an archivist's desk terminal.

### Step 11 — AudioVisualizer redesign [x]
**Files to modify:** `client/src/components/AudioVisualizer.tsx`
- Logic: Replace blue/gray colors with brass (`#9a7b2f`) for recording and cast-iron green (`#2d4a3e`) for playback.
**Done Criteria:** Visualizer colors align with the Victorian palette.

### Step 12 — Footer redesign [x]
**Files to modify:** `client/src/App.tsx`
- UI: Cast-iron background, paper text (60% opacity), brass logo.
- Copyright: "© 2026 Heritage Odyssey. Built for the AI Masterclass."
**Done Criteria:** Footer is a clean, dark-green Victorian band.

## TRACK 3: VERIFICATION

### Step 13 — Local end-to-end test
- Run `npm run dev`.
- Flow: LoginScreen -> Guest Login -> Main App -> Query -> Audio Playback.
- Document any failures.

### Step 14 — CI gate
- Run: `typecheck`, `lint`, `test`, `coverage`, `build`.
- All must pass before declaring Phase 7 complete.
