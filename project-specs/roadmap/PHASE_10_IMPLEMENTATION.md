# Phase 10 Implementation: Ancestor Profile System & Extended User Profile

> **Status: READY** — Phase 9 is complete and CI is clean (62 tests passing, typecheck + lint green as of 2026-05-28). This document is the step-by-step execution guide for Phase 10.

---

## Current State Baseline

| Item | Current State |
| :--- | :--- |
| `users` schema | id, email, passwordHash, createdAt only |
| `ancestorProfiles` schema | id, userId, name, birthRegion, era, createdAt only |
| Shared `User` type | id, email, createdAt only |
| Shared `AncestorProfile` type | id, userId, name, birthRegion, era, createdAt only |
| `POST /api/auth/signup` | Accepts email + password only |
| Profile endpoints | None — only a stub `GET /api/profile` that returns `req.user` from the JWT |
| Ancestor CRUD endpoints | None |
| `narrativeService.ts` | `generateNarrative(query, userId?)` — no ancestor enrichment |
| `AgentState` | No ancestor context field |
| Narrator agent | Generic system prompt, no name-personalization |
| `POST /api/narrative/generate` | No `ancestorId` in body, no auto-save on completion |
| `GET /api/records` | Returns raw rows — no join to ancestor name |
| `useAuth.ts` | Stores token only, no user profile state |
| Client UI | No ancestors panel, no onboarding prompt, no profile settings |

---

## Step 1 — Database Schema Migration

**Files to modify:** `server/src/db/schema.ts`

Add imports for `boolean`, `date`, and `integer` (already present) to the existing import line. The `date` type from `drizzle-orm/pg-core` maps to PostgreSQL `date` and TypeScript `string` (YYYY-MM-DD format). For arrays, append `.array()` to a `text()` column.

**Changes to `users` table:**
```typescript
firstName: text('first_name'),
lastName: text('last_name'),
dateOfBirth: date('date_of_birth'),
birthLocation: text('birth_location'),
currentLocation: text('current_location'),
heritageRegions: text('heritage_regions').array(),
researchInterests: text('research_interests'),
profileComplete: boolean('profile_complete').notNull().default(false),
```

**Changes to `ancestorProfiles` table:**
```typescript
lastName: text('last_name'),
birthYear: integer('birth_year'),
deathYear: integer('death_year'),
originCountry: text('origin_country'),
destination: text('destination'),
relationship: text('relationship'),
notes: text('notes'),
```

**After editing schema.ts:**
```bash
cd server && npx drizzle-kit generate   # inspect the generated SQL before proceeding
cd server && npx drizzle-kit push       # applies migration to Neon
```

Verify the migration SQL adds nullable columns to both tables. The `profile_complete` column has a `DEFAULT false` constraint.

**Done criteria:** `drizzle-kit push` succeeds; new columns visible in Neon dashboard.

---

## Step 2 — Update Shared Types

**Files to modify:** `shared/types.d.ts`

**Extend `User`** — add all new profile fields as optional (nullable in DB, optional in TypeScript):
```typescript
export interface User {
  id: string;
  email: string;
  createdAt: string;
  firstName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  birthLocation?: string | null;
  currentLocation?: string | null;
  heritageRegions?: string[] | null;
  researchInterests?: string | null;
  profileComplete?: boolean;
}
```

**Extend `AncestorProfile`** — add new detail fields as optional:
```typescript
export interface AncestorProfile {
  id: string;
  userId: string;
  name: string;
  birthRegion: string;
  era: string;
  createdAt: string;
  lastName?: string | null;
  birthYear?: number | null;
  deathYear?: number | null;
  originCountry?: string | null;
  destination?: string | null;
  relationship?: string | null;
  notes?: string | null;
}
```

**Update `StreamNarrativeRequest`** — add optional ancestorId:
```typescript
export interface StreamNarrativeRequest {
  query: string;
  ancestorId?: string;
}
```

**Add new request interfaces:**
```typescript
export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  birthLocation?: string;
  currentLocation?: string;
  heritageRegions?: string[];
  researchInterests?: string;
}

export interface AncestorCreateRequest {
  name: string;
  birthRegion: string;
  era: string;
  lastName?: string;
  birthYear?: number;
  deathYear?: number;
  originCountry?: string;
  destination?: string;
  relationship?: string;
  notes?: string;
}
```

`AncestorUpdateRequest` is the same shape as `AncestorCreateRequest` but all fields optional — use `Partial<AncestorCreateRequest>` in the route rather than a separate interface.

**Done criteria:** `npm run typecheck` still passes after the type changes.

---

## Step 3 — Auth Controller: Signup + Profile Endpoints

**Files to modify:** `server/src/controllers/authController.ts`

**Update `signup`:**
- Accept `firstName` and `lastName` from `req.body` as required fields.
- Return 400 if either is missing.
- Include both in the `.values({...})` call to `db.insert(users)`.
- Include them in the `userResponse` object.

**Add `getProfile` handler:**
```typescript
export const getProfile = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return res.status(404).json({ message: 'User not found' });
  const { passwordHash: _, ...profile } = user;
  res.json(profile);
};
```

**Add `updateProfile` handler:**
- Parse `req.body` for any subset of profile fields (firstName, lastName, dateOfBirth, birthLocation, currentLocation, heritageRegions, researchInterests).
- Reject unknown fields silently (only spread the known keys into the update).
- Auto-compute `profileComplete`: set to `true` if after the update the user has at minimum `firstName` and at least one entry in `heritageRegions`. Use Drizzle's `eq(users.id, userId)` in the `.where()` clause.
- Return the updated user row (minus `passwordHash`).

**Note on `db.query.users`:** Drizzle's relational API (`db.query.users.findFirst`) only works when the query builder is initialized with a `schema` object. Confirm `server/src/db/index.ts` passes the schema — if it uses `drizzle(client, { schema })` already, no changes needed there.

**Done criteria:** `POST /api/auth/signup` without firstName returns 400. `GET /api/auth/profile` returns user data. `PATCH /api/auth/profile` updates only supplied fields.

---

## Step 4 — Wire New Auth + Ancestors Routes in app.ts

**Files to modify:** `server/src/app.ts`

1. Remove the placeholder route:
   ```typescript
   // DELETE THIS:
   app.get('/api/profile', authenticate, (req, res) => { res.json({ user: req.user }); });
   ```

2. Add profile routes (require `authenticate` middleware):
   ```typescript
   app.get('/api/auth/profile', authenticate, authController.getProfile);
   app.patch('/api/auth/profile', authenticate, authController.updateProfile);
   ```

3. Import and register the new ancestors router (created in Step 5):
   ```typescript
   import ancestorsRoutes from './routes/ancestorsRoutes.js';
   // ...
   app.use('/api', ancestorsRoutes);
   ```

**Done criteria:** `GET /api/auth/profile` returns 401 without token; `PATCH /api/auth/profile` updates profile; `/api/ancestors` routes respond correctly.

---

## Step 5 — New Ancestors Routes

**Files to create:** `server/src/routes/ancestorsRoutes.ts`

Model this on `recordsRoutes.ts`. Use Zod for input validation. All routes require `authenticate` middleware. The `userId` for every query comes from `req.user!.id`.

**Route summary:**

| Route | Validation | Logic |
| :--- | :--- | :--- |
| `POST /ancestors` | Zod: name + birthRegion + era required, rest optional | Insert row; return 201 + new record |
| `GET /ancestors` | None | Select all for userId, order by createdAt desc |
| `GET /ancestors/:id` | Param id present | findFirst by id + userId; 404 if not found |
| `PATCH /ancestors/:id` | Zod: all fields optional | findFirst to verify ownership (403 if userId mismatch); update only provided fields; return updated row |
| `DELETE /ancestors/:id` | Param id present | Delete where id + userId; 404 if nothing deleted; 204 on success |

Ownership check pattern for PATCH and DELETE: query by `id` first, then check `record.userId === req.user!.id`. Return 403 (not 404) when the record exists but belongs to a different user — this prevents user enumeration while still being semantically correct.

**Done criteria:** All five endpoints respond correctly; 403 returned when accessing another user's profile; Zod rejects missing required fields with 400.

---

## Step 6 — Extend AgentState

**Files to modify:** `server/src/agents/state.ts`

Add one new field at the end of `Annotation.Root({...})`:

```typescript
ancestorContext: Annotation<string | null>,
```

This field carries a pre-formatted narrator context string (built in narrativeService before `graph.invoke`). It is `null` for queries without an ancestor profile. The narrator node reads it to personalize its system prompt.

**Done criteria:** `npm run typecheck` passes; no existing tests broken.

---

## Step 7 — NarrativeService: Query Enrichment

**Files to modify:** `server/src/services/narrativeService.ts`

**Add helper function** (not exported — internal only):

```typescript
function buildEnrichedQuery(query: string, profile: AncestorProfile): string {
  const fullName = [profile.name, profile.lastName].filter(Boolean).join(' ');
  const parts = [`Tell me about ${fullName}`];
  if (profile.birthRegion) parts.push(`born in ${profile.birthRegion}`);
  if (profile.birthYear) parts.push(`around ${profile.birthYear}`);
  if (profile.destination) parts.push(`who emigrated to ${profile.destination}`);
  if (profile.era) parts.push(`during the ${profile.era}`);
  if (profile.relationship) parts.push(`— the researcher's ${profile.relationship}`);
  let enriched = parts.join(', ') + '.';
  if (profile.notes) enriched += ` Additional family context: ${profile.notes}`;
  return enriched.includes(query.trim()) ? enriched : `${query}\n\n${enriched}`;
}
```

The last line preserves the user's original query wording while appending the structured ancestor context.

**Add helper for narrator context string** (passed through AgentState):

```typescript
function buildAncestorContext(profile: AncestorProfile): string {
  const fullName = [profile.name, profile.lastName].filter(Boolean).join(' ');
  const lines = [`Relationship: ${profile.relationship ?? 'ancestor'}`];
  lines.push(`Full Name: ${fullName}`);
  if (profile.birthYear) lines.push(`Born: ~${profile.birthYear}`);
  if (profile.birthRegion) lines.push(`Origin: ${profile.birthRegion}`);
  if (profile.destination) lines.push(`Destination: ${profile.destination}`);
  if (profile.notes) lines.push(`Notes: ${profile.notes}`);
  return lines.join('\n');
}
```

**Update function signatures** to accept optional profile:

```typescript
export async function generateNarrative(
  query: string,
  userId?: string,
  ancestorProfile?: AncestorProfile | null,
): Promise<string | HandoffPackage>

export async function* generateNarrativeStream(
  query: string,
  userId?: string,
  ancestorProfile?: AncestorProfile | null,
): AsyncGenerator<NarrativeEvent>
```

Inside both functions, before `graph.invoke` / `graph.stream`:
- If `ancestorProfile` is provided: `const effectiveQuery = buildEnrichedQuery(query, ancestorProfile)`
- Pass `effectiveQuery` as `query` in the state object
- Pass `ancestorContext: ancestorProfile ? buildAncestorContext(ancestorProfile) : null` in the state object

**Done criteria:** `generateNarrativeStream('test', undefined, null)` still passes the raw query through unchanged. With a profile, the graph state receives both the enriched query and the ancestor context string.

---

## Step 8 — Narrator Agent: Personalized Prompt

**Files to modify:** `server/src/agents/nodes/narrator.ts`

When `state.ancestorContext` is non-null, prepend a personalization section to the narrator's system prompt, before the existing instructions:

```
You are narrating for a specific ancestor. Profile:
${state.ancestorContext}

Address them by name in your narrative. Say "Stanisław would have experienced..." not "a Polish immigrant would have experienced...". Where family notes are provided, weave them in as documented fact.

---
```

Keep the existing system prompt content (fact-check, TTS optimization, paragraph preservation) intact after the separator. The personalization block only appears when `state.ancestorContext` is set.

**Done criteria:** A narrative generated with an ancestor profile mentions the ancestor by name; without a profile the output is unchanged.

---

## Step 9 — Update /api/narrative/generate: ancestorId + Auto-Save

**Files to modify:** `server/src/routes/voiceRoutes.ts`

In the `POST /api/narrative/generate` handler:

1. Extract `ancestorId` from `req.body` alongside `query`.
2. If `ancestorId` is present:
   - Import `db`, `ancestorProfiles`, `savedNarratives` from the db module.
   - Fetch the ancestor profile: `db.query.ancestorProfiles.findFirst(...)` where `id = ancestorId`.
   - If not found or `userId !== req.user!.id`, send 403 before opening the SSE connection.
   - Pass the profile to `generateNarrativeStream(query, userId, ancestorProfile)`.
3. In the event loop, capture the `complete` event's text.
4. After `res.end()`, if a `complete` event was captured and `userId` is present, auto-save:
   ```typescript
   await db.insert(savedNarratives).values({
     userId,
     query,
     contentText: completedText,
     ancestorProfileId: ancestorId ?? null,
   });
   ```
   Fire-and-forget pattern: wrap in a `.catch(logger.error)` so a save failure doesn't affect the SSE response.

**Done criteria:** Submitting with a valid `ancestorId` yields a personalized narrative; the saved record in the DB has `ancestorProfileId` set. Submitting without `ancestorId` behaves identically to current behavior.

---

## Step 10 — Update /api/records: Join Ancestor Name

**Files to modify:** `server/src/routes/recordsRoutes.ts`

Update the `GET /records` query to left-join `ancestor_profiles` and include the ancestor's name:

```typescript
const records = await db
  .select({
    id: savedNarratives.id,
    userId: savedNarratives.userId,
    ancestorProfileId: savedNarratives.ancestorProfileId,
    query: savedNarratives.query,
    contentText: savedNarratives.contentText,
    createdAt: savedNarratives.createdAt,
    ancestorName: sql<string | null>`
      CASE WHEN ${ancestorProfiles.name} IS NOT NULL
      THEN ${ancestorProfiles.name} || COALESCE(' ' || ${ancestorProfiles.lastName}, '')
      ELSE NULL END
    `.as('ancestor_name'),
  })
  .from(savedNarratives)
  .leftJoin(ancestorProfiles, eq(savedNarratives.ancestorProfileId, ancestorProfiles.id))
  .where(eq(savedNarratives.userId, userId))
  .orderBy(desc(savedNarratives.createdAt));
```

Import `sql` from `drizzle-orm` alongside the existing imports. This adds `ancestorName: string | null` to each record response without breaking existing records (they get `null`).

Update `shared/types.d.ts` `SavedNarrative` to add `ancestorName?: string | null`.

**Done criteria:** Existing records return `ancestorName: null`; records linked to an ancestor return the full name.

---

## Step 11 — Client: Update LoginScreen (Register Form + Design Refresh)

**Files to modify:** `client/src/components/LoginScreen.tsx`

Add `firstName` and `lastName` to the register form state. Layout:
```
[Email]         [Password]
[First Name]    [Last Name]
                [Register →]
```

Both fields are required (`required` attribute).

**Design refresh — login/signup is a task screen, not an ambiance screen:**
- Switch form labels, input text, and error messages from `font-spectral` to `font-sans` (Inter or system sans-serif). Spectral italic is beautiful in the narrative UI but works against legibility on a focused auth form.
- Keep `bg-paper` as the card background so the screen doesn't feel disconnected from the app.
- Keep brass for the submit button border/accent — preserves the visual thread back to the main UI.
- Simplify decorative copy: "Enter the Archive" → "Sign In", "Request Access" → "Create Account". The Victorian voice belongs in the app, not the door.
- Input fields: standard readable size (`text-sm` or `text-base`), no italic placeholder text.
- The overall card/panel can keep its `border-brass/20` frame — just the typography and copy inside shifts to functional.

Update the `handleRegister` submit to pass `firstName` and `lastName` to the `register()` call.

**Files to modify:** `client/src/hooks/useAuth.ts`

Update `register()` signature to `register(email, password, firstName, lastName)`. Pass all four fields in the signup request body.

**Done criteria:** Register form has four fields; submitting without firstName/lastName shows browser validation; server returns 400 if they bypass client validation.

---

## Step 12 — Client: Update useAuth (Profile State)

**Files to modify:** `client/src/hooks/useAuth.ts`

This is the largest client-side change. The hook currently stores only `token | null`. It needs to also store the full `User` object.

**Add to state:**
```typescript
interface AuthState {
  token: string | null;
  user: User | null;         // add
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

**Add `fetchProfile` helper** (called after login and after token refresh):
- `GET /api/auth/profile` with the current token in the Authorization header.
- On success: store the `User` object in state.

**Add `updateProfile(data: ProfileUpdateRequest)` function:**
- `PATCH /api/auth/profile` via `authFetch` (from `client/src/lib/api.ts`).
- On success: update local user state with the returned user.

**Expose from hook:** `{ ...state, user, login, register, logout, refresh, updateProfile }`.

**Done criteria:** After login, `user.profileComplete` is accessible in the component tree. `updateProfile()` persists to the server and updates local state.

---

## Step 13 — Client: Onboarding Prompt

**Files to create:** `client/src/components/OnboardingPrompt.tsx`

Shown when `user?.profileComplete === false` and `localStorage.getItem('onboarding_dismissed') !== 'true'`.

**Heritage region tag chips** (clickable toggles, multi-select):
- Ireland, Poland, Germany, Italy, Scandinavia, Eastern Europe, Jewish diaspora, Scotland, Ukraine, Other

**Research interests** — one `<textarea>` with Spectral italic styling, placeholder: *"e.g., the Kowalski line from Galicia to Chicago, 1870–1920"*

**On submit:** call `updateProfile({ heritageRegions, researchInterests })`. On success the hook auto-sets `profileComplete: true` if the server returns it.

**Dismiss without completing:** set `localStorage.setItem('onboarding_dismissed', 'true')`, hide the prompt. Does not reappear. Does not call updateProfile.

**Visual style:** Cast-iron modal with brass border, paper card interior. Title: *"Complete Your Registry Profile"* in Libre Baskerville. Body copy in Spectral.

**Where to render:** In `App.tsx`, after the main UI is shown and `!isLoading`, check the condition and render `<OnboardingPrompt />` as an overlay modal.

**Done criteria:** Prompt appears only on first login for new users. Dismissing once hides it permanently. Submitting updates user state and hides it.

---

## Step 14 — Client: Profile Settings Modal

**Files to create:** `client/src/components/ProfileSettingsModal.tsx`

Accessible from the app header — add a small user/settings icon (Lucide `Settings` or `User`) to the cast-iron header bar, visible only when authenticated.

**Modal content:** All optional profile fields in a form:
- First Name / Last Name (text inputs)
- Date of Birth (date input, styled)
- Birth Location / Current Location (text inputs)
- Heritage Regions (same tag chip UI as onboarding prompt)
- Research Interests (textarea)

Pre-populated from `useAuth().user` on open. On save, calls `updateProfile(data)`. On success, toast-style confirmation (*"Profile updated."* in Spectral italic) then close.

**Done criteria:** Existing profile data loads into the form. Partial saves update only provided fields. The form is accessible from the header at all times when logged in.

---

## Step 15 — Client: useAncestors Hook + My Ancestors Panel

**Files to create:** `client/src/hooks/useAncestors.ts`

Wraps `GET /api/ancestors`, `POST /api/ancestors`, `PATCH /api/ancestors/:id`, `DELETE /api/ancestors/:id`. Uses `authFetch` from `lib/api.ts`. Exposes: `{ ancestors, isLoading, createAncestor, updateAncestor, deleteAncestor }`.

**Files to create:** `client/src/components/MyAncestorsPanel.tsx`

Pattern: modeled after `MyRecordsPanel.tsx` — full-screen modal overlay, cast-iron header, paper body.

**List view:** Each ancestor card shows:
- Full name (name + lastName if present) — Libre Baskerville
- Relationship badge (brass border pill) if set
- Birth region + era line — Spectral small
- Three action buttons: **Edit** (pencil icon), **Delete** (trash icon), **Narrate** (plays icon)

**Create flow — two-step form:**
- Step 1 (required): Name, Birth Region, Era — the minimum to run a narrative. "Next →" button.
- Step 2 (optional): Last Name, Birth Year, Death Year, Origin Country, Destination, Relationship, Notes. "Add Later" link skips directly to save.
- On submit: calls `createAncestor(data)`.

**Edit:** Opens the same two-step form pre-populated, calls `updateAncestor(id, data)`.

**Delete:** Confirmation prompt (*"Remove [Name] from the Registry? This cannot be undone."*) before calling `deleteAncestor(id)`.

**Narrate button:** Calls a callback passed down from `App.tsx` / `InteractionLayer.tsx` — sets `selectedAncestor` in the interaction layer (see Step 16) and closes the panel.

**Entry point in App.tsx:** Add a "My Ancestors" nav item in the cast-iron header alongside the existing "My Records" button.

**Empty state:** *"No ancestors in the Registry yet. Add your first record to begin your odyssey."* (Spectral italic)

**Done criteria:** Full CRUD works. Narrate button closes the panel and populates the interaction layer context.

---

## Step 16 — Client: Interaction Layer Ancestor Context

**Files to modify:** `client/src/components/InteractionLayer.tsx`

**Add state:** `const [selectedAncestor, setSelectedAncestor] = useState<AncestorProfile | null>(null);`

Expose `setSelectedAncestor` so `App.tsx` can pass it down to `MyAncestorsPanel`'s Narrate button.

**Dismissible tag above input bar** — shown when `selectedAncestor !== null`:
```
[ Narrating for: Stanisław Kowalski  × ]
```
Styled as a brass-bordered pill in Spectral italic. The `×` clears `selectedAncestor`.

**On submit:** Pass `ancestorId: selectedAncestor?.id` in the body of `POST /api/narrative/generate` alongside `query`.

**After narrative completes:** Keep `selectedAncestor` set (user may want to generate another narrative for the same ancestor) but clear it if the user explicitly dismisses the tag.

**Done criteria:** Submitting with an ancestor selected yields a personalized narrative with the ancestor's name. The tag is visible and dismissible.

---

## Step 17 — Client: My Records Panel — Show Ancestor Name

**Files to modify:** `client/src/components/MyRecordsPanel.tsx`

Each record card that has a non-null `ancestorName` should show an ancestor attribution line below the query:
```
Narrated for: Stanisław Kowalski
```
Styled as `text-[10px] font-mono uppercase tracking-widest text-brass/70` (Registry stamp aesthetic).

Update the TypeScript type for the record objects to include `ancestorName?: string | null`.

**Done criteria:** Existing records without an ancestor show no change. Linked records display the ancestor name badge.

---

## Step 18 — Unit Tests

**Files to modify:** `server/tests/auth.test.ts`

Update the existing `POST /api/auth/signup` success test to include `firstName` and `lastName` in the request body and mock user. Add a new test:
- `should return 400 when firstName is missing`
- `should return 400 when lastName is missing`

**Files to create:** `server/tests/routes/profileRoutes.test.ts`

Test the new profile endpoints using the same mock pattern as `auth.test.ts` (mock `db`):
- `GET /api/auth/profile` → 401 without token; 200 + user object with token
- `PATCH /api/auth/profile` → 401 without token; updates only provided fields; ignores unknown fields; auto-sets `profileComplete: true` when name + heritageRegions both present

**Files to create:** `server/tests/routes/ancestorsRoutes.test.ts`

Mock `db` similarly. Test:
- `POST /api/ancestors` → 401 without auth; 400 when name/birthRegion/era missing; 201 with valid body
- `GET /api/ancestors` → returns only current user's profiles; returns `[]` for new user
- `PATCH /api/ancestors/:id` → 403 if belongs to another user; partial update applies only provided fields
- `DELETE /api/ancestors/:id` → 404 if not found; 403 if belongs to another user; 204 on success

**Files to modify:** `server/tests/services/narrativeService.test.ts`

Add query enrichment tests:
- `enriched query contains ancestor name and region when profile provided`
- `raw query passes through unchanged when no profile provided`
- `enriched query includes notes when notes are present`
- `enriched query includes destination when destination is present`

Use a `vi.fn()` spy on `graph.invoke` to assert the `query` field in the state object that gets passed in.

**Done criteria:** `npm run test` passes with the new tests included; total test count increases from 47 server tests.

---

## Sequence Recommendation

Work in this order to minimize broken intermediate states:

1. Steps 1–2 (schema + shared types) — foundation; nothing else compiles cleanly until these are done
2. Steps 3–5 (auth controller + routes) — backend-complete; testable via curl after Step 4
3. Steps 6–8 (AgentState + narrativeService + narrator) — pipeline enrichment; can unit-test in isolation
4. Steps 9–10 (voiceRoutes update + records join) — wires enrichment into the SSE endpoint
5. Step 18 (server tests) — write alongside or immediately after each server step
6. Steps 11–12 (LoginScreen + useAuth) — client auth foundation; must precede Steps 13–17
7. Steps 13–17 (UI components) — build in order; each component depends on the hook from Step 12

---

## Done Criteria (Phase Complete)

- [ ] Schema migration applied: `users` + 8 columns, `ancestor_profiles` + 7 columns
- [ ] `POST /api/auth/signup` requires firstName + lastName; 400 without them
- [ ] `GET /api/auth/profile` and `PATCH /api/auth/profile` implemented and tested
- [ ] `POST /api/ancestors`, `GET /api/ancestors`, `GET /api/ancestors/:id`, `PATCH /api/ancestors/:id`, `DELETE /api/ancestors/:id` all working and tested
- [ ] Signup form collects firstName + lastName
- [ ] Onboarding prompt shown once post-login when profileComplete is false
- [ ] Profile Settings modal accessible from header
- [ ] My Ancestors panel: list, two-step create, edit, delete all working
- [ ] "Narrate" button on ancestor card sets context in InteractionLayer
- [ ] "Narrating for: [Name]" tag shown and dismissible
- [ ] NarrativeService enriches query with all available ancestor fields
- [ ] Narrator agent prompt personalized when ancestorContext is set
- [ ] Auto-save on ancestor-linked narratives (ancestorProfileId set in DB)
- [ ] GET /api/records returns ancestorName on linked cards
- [ ] My Records panel shows ancestor name on linked cards
- [ ] All new/updated unit tests passing; `npm run typecheck` + `npm run lint` clean
