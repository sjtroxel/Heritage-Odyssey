# Phase 7 Plan: UI Overhaul & Pre-Deployment Polish

## 1. Objective
Phase 7 serves as the final "aesthetic and functional bridge" before production deployment. It transforms the current generic AI SaaS boilerplate into a visually evocative, historically grounded portfolio piece while resolving critical architectural blockers that would otherwise impede a successful launch.

## 2. Known Bugs to Fix

### a. CSS Conflict (Vite Boilerplate vs. Tailwind)
The current `client/src/index.css` contains default Vite/Boilerplate styles that aggressively override the Tailwind theme.
- **Issue:** `:root` properties set a dark background (`#242424`) and light text, while `body` uses `display: flex` and `place-items: center`, which centers the entire application incorrectly and conflicts with the `App.tsx` layout.
- **Fix:** Purge all non-essential boilerplate CSS, ensuring Tailwind's `@theme` and utility classes have full control over the layout and global styles.

### b. Missing Vite Proxy
The `client/vite.config.ts` currently lacks a server proxy configuration.
- **Issue:** All frontend requests to `/api/*` (transcription, streaming, auth) result in 404 errors during local development because they are directed at the Vite dev server instead of the Express backend.
- **Fix:** Add a `server.proxy` block to `vite.config.ts` to redirect `/api` requests to `http://localhost:3000`.

### c. Auth Wall & Missing UI Flow
The backend voice and narrative routes strictly require JWT authentication via the `authenticate` middleware, but the frontend lacks any login or signup interface.
- **Issue:** Users cannot interact with the agent swarm because all API calls return `401 Unauthorized`.
- **Fix:** Implement a "Guest Access" flow. Keep `authenticate` middleware on all protected routes. Seed a demo user (`guest@heritage-odyssey.demo` / `guest-demo-2026`) via a new DB seed script at `server/src/db/seed.ts`. Add a thematically styled login screen (Victorian "access request" panel) that appears if no valid JWT is present, offering one-click "Enter the Archive" guest login and standard Register/Sign In options.

### d. VITE_API_URL Not Wired
The frontend currently uses relative paths (e.g., `fetch('/api/...')`), which will fail when deployed in a split-environment (Vercel frontend calling a Railway backend).
- **Issue:** Hardcoded paths prevent the frontend from finding the API in production.
- **Fix:** Implement an environment-aware API utility that uses `import.meta.env.VITE_API_URL` when defined, ensuring seamless transitions between local development and production.

## 3. UI/UX Design Vision: "The Victorian Record Office"

**Era Anchor:** 1850s–1920s. The aesthetic references the mechanical era of history-keeping: Edison laboratories, Victorian botanical gardens, telegraph offices, census ledger halls, naturalist field journals, and newspaper broadsheets.

### Color Palette: Mechanical Era
- **Background (Primary):** `#f4ece1` (Aged ivory/cream)
- **Text (Primary):** `#1a1512` (Deep iron ink)
- **Accent Primary (Cast Iron Green):** `#2d4a3e`. This is the dominant accent (Victorian park bench, aged cast iron signage). Replaces all uses of indigo/blue from prior phases.
- **Accent Secondary (Edison Brass):** `#9a7b2f`. Aged brass hardware, filament warmth, engraved nameplates.
- **Stone (Secondary Text):** `#5c5651` (Weathered limestone)

### Typography: Historical Handoff
- **Headings:** `Libre Baskerville` (Based on 18th-century types)
- **Body/UI:** `Spectral` (Sophisticated, high-readability serif)
- **Loading via:** Google Fonts `<link>` tag in `client/index.html`.

### The Hero Placeholder Section
Replace the current gradient box with a styled "Archive Record Sample" panel:
- **Look:** Cream background, double-rule border in cast-iron green.
- **Content:** A short example narrative passage in Spectral, formatted as a transcribed archival entry (sample text from `evaluation/dataset/golden_set.json`).

### Icons
- **Library:** Keep Lucide.
- **Style:** All icons use Cast Iron Green (`#2d4a3e`) with a stroke-width of `1.25` to `1.5`.

### Status & Feedback States
Telegraph ticker style with simple CSS opacity fade-in animations:
- **Processing:** "Querying the Archive..."
- **Transcribing:** "Transcribing the Record..."
- **Generating:** "Consulting the Registry..."
- **Error:** "Record Unreadable — Please Retry"

### The Interaction Bar
- **Look:** Dark cast-iron green background (`#1e3329`) with Edison brass (`#9a7b2f`) border-top.
- **Input:** Cream text on dark green, serif placeholder text.
- **Mic Button:** Styled as a brass telegraph key.

### Mobile-First Layout
- **Base (375px):** Single column, full-width sections stacked. The archive panel replaces the gradient box above the fold. Interaction bar docks to the bottom at full width.
- **Desktop (md+):** Archive panel gains left/right margins; hero text scales up. No two-column layout unless functionally required.

## 4. Scope Boundaries
- **OUT of Scope:** New backend agent logic, new API endpoints, Playwright E2E suites, or load testing (these belong in Phase 8).
- **IN Scope:** UI overhaul, bug fixes (CSS, Proxy, Auth UI, API URL), and refining the `AudioVisualizer` to match the new aesthetic.

## 5. Definition of Done
- [x] Vite dev proxy successfully routes `/api` calls to the local backend.
- [x] All boilerplate Vite/CSS conflicts are removed; UI is 100% Tailwind-controlled.
- [x] Authentication flow exists and allows users to access voice/narrative routes.
- [ ] The "Victorian Record Office" UI is fully implemented and responsive (375px to Desktop).
- [x] API calls use the `VITE_API_URL` environment variable logic.
- [ ] `AudioVisualizer` and interaction states match the new historical theme.
- [ ] Full local user flow (Auth -> Input -> Synthesis -> Audio) is functional and bug-free.
