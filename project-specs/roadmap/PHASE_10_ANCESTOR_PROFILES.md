# Phase 10 Plan: Ancestor Profile System, Personalized Narratives & Extended User Profile

> **Status: PLANNED** — Not yet started. This phase closes the gap between Heritage Odyssey as a history chatbot and Heritage Odyssey as an actual genealogy product. The `ancestor_profiles` table has been in the database since Phase 2 and has never been touched by the UI. The `users` table currently stores only credentials — no identity beyond email.

## 1. Objective

Two parallel goals that belong together:

1. **Extended user profile** — The current auth system knows nothing about the person behind the credentials. A genealogy app in particular needs to know who the researcher is: their name, where they come from, what heritage they're tracing. This data will also progressively enrich the app experience (personalized sample queries, narrator context, future FamilySearch OAuth pre-fill).

2. **Ancestor profile CRUD + personalized narratives** — Give users the ability to create named ancestor profiles and generate narratives personally addressed to those ancestors. This is the feature that justifies calling Heritage Odyssey a "family history intelligence system" rather than a narrative generator.

---

## 2. Feature: Extended User Profile

### 2.1 Schema Migration

Extend the `users` table. All new columns are nullable for backward compatibility with existing rows; required fields are enforced at the API level for new signups.

```sql
-- Add to users table via Drizzle migration
ALTER TABLE users ADD COLUMN first_name     text;
ALTER TABLE users ADD COLUMN last_name      text;
ALTER TABLE users ADD COLUMN date_of_birth  date;
ALTER TABLE users ADD COLUMN birth_location text;         -- "County Cork, Ireland"
ALTER TABLE users ADD COLUMN current_location text;       -- "Cape Girardeau, MO"
ALTER TABLE users ADD COLUMN heritage_regions text[];     -- ["Ireland", "Poland/Galicia", "Germany"]
ALTER TABLE users ADD COLUMN research_interests text;     -- free text: surnames, periods, goals
ALTER TABLE users ADD COLUMN profile_complete boolean NOT NULL DEFAULT false;
```

**Field rationale:**
- `firstName` / `lastName` — required at signup for all new users (nullable in DB for backward compat).
- `dateOfBirth` — optional. Used to calculate approximate generation context ("your great-great-grandparents' era") in future phases.
- `birthLocation` — optional. Where the researcher was born, distinct from where their ancestors are from.
- `currentLocation` — optional. Useful for eventual FamilySearch OAuth pre-fill.
- `heritageRegions` — optional array, collected during onboarding or profile edit. This is the highest-value genealogy-specific field: knowing the user researches Irish and Polish ancestry allows the app to surface relevant sample queries, tune retrieval, and eventually scope FamilySearch searches. Stored as a PostgreSQL text array.
- `researchInterests` — optional free text. The user describes what they're trying to find: "tracking the Kowalski line from Galicia to Chicago, 1870–1920" or "Irish famine emigration, County Galway." Used as narrative context in Phase 11+.
- `profileComplete` — boolean flag, set to `true` once the user has filled in at least name + one heritage region. Drives the onboarding prompt (see §2.4).

### 2.2 Updated Signup Endpoint

`POST /api/auth/signup` extended body:

```typescript
{
  email: string;           // required
  password: string;        // required
  firstName: string;       // required
  lastName: string;        // required
  heritageRegions?: string[];  // optional at signup, prompted post-login
}
```

Returns the user object including the new fields. No change to the JWT shape.

### 2.3 New Profile Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/profile` | Required | Return the full user profile (all fields except `passwordHash`). |
| `PATCH` | `/api/auth/profile` | Required | Update optional profile fields. Body: any subset of `{ firstName, lastName, dateOfBirth, birthLocation, currentLocation, heritageRegions, researchInterests }`. |

The `PATCH` handler uses Drizzle's partial update — only the provided fields are written. Email and password are not patchable via this endpoint (separate flows, out of scope for Phase 10).

### 2.4 Client: Signup Form Update

Update `LoginScreen.tsx` registration path to collect `firstName` and `lastName` as required fields. The form should flow:

```
[Email]        [Password]
[First Name]   [Last Name]
               [Register →]
```

Heritage regions are not collected at signup — that friction belongs in the post-login onboarding prompt.

### 2.5 Client: Onboarding Prompt

After first login (detected via `profileComplete === false`), show a dismissible banner or modal:

> **Complete your Registry Profile**
> Help Heritage Odyssey personalize your research. Which heritage regions are you tracing?

The prompt offers a set of common heritage tags the user can tap/click (e.g., Ireland, Poland, Germany, Italy, Scandinavia, Eastern Europe, Jewish diaspora, Scotland, Ukraine, Other) plus a free-text "research interests" field. On submit, calls `PATCH /api/auth/profile` and sets `profileComplete` to `true`. Dismissing without completing is allowed; the prompt does not reappear.

### 2.6 Client: Profile Settings Panel

Accessible from the nav (gear icon or user avatar placeholder). Opens a modal allowing the user to view and edit all optional profile fields at any time. Uses the same `PATCH /api/auth/profile` endpoint.

---

## 3. Feature: Ancestor Profile CRUD

### 3.1 Schema

The `ancestor_profiles` table (deployed Phase 2) currently has three user-facing fields: `name`, `birthRegion`, `era`. This phase extends it to support richer genealogy data and links it to the user's own `heritageRegions` context.

**Migration — expand `ancestor_profiles`:**

```sql
ALTER TABLE ancestor_profiles ADD COLUMN last_name       text;
ALTER TABLE ancestor_profiles ADD COLUMN birth_year      integer;
ALTER TABLE ancestor_profiles ADD COLUMN death_year      integer;
ALTER TABLE ancestor_profiles ADD COLUMN origin_country  text;          -- "Poland"
ALTER TABLE ancestor_profiles ADD COLUMN destination     text;          -- "Chicago, Illinois"
ALTER TABLE ancestor_profiles ADD COLUMN relationship    text;          -- "Great-great-grandfather"
ALTER TABLE ancestor_profiles ADD COLUMN notes           text;          -- free text
```

The existing `name`, `birthRegion`, and `era` columns are retained. The new columns are all nullable. The effective "full name" for a profile is `name || ' ' || last_name` when `last_name` is present.

**Rationale for each field:**
- `lastName` — most genealogy work is surname-first; keeping `name` as given name allows the combination `Stanisław Kowalski` without breaking existing data.
- `birthYear` / `deathYear` — specific years enable the narrator to say "in the winter of 1883" rather than "in the 1880s."
- `originCountry` — a cleaner, more queryable field than free-text `birthRegion` for routing to correct Pinecone context.
- `destination` — where the ancestor emigrated to; completes the migration arc for the narrative.
- `relationship` — "Great-great-grandmother" surfaces a personal connection in the narrative output.
- `notes` — open field for the user to paste in what they already know (census records, oral history, ship manifest data). Passed to the narrator as raw context.

### 3.2 New API Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ancestors` | Required | Create a new ancestor profile. Body: `{ name, birthRegion, era }` (minimum); all other fields optional. |
| `GET` | `/api/ancestors` | Required | List all ancestor profiles for the authenticated user. |
| `GET` | `/api/ancestors/:id` | Required | Get a single ancestor profile. |
| `PATCH` | `/api/ancestors/:id` | Required | Update any profile fields. Must belong to requesting user. |
| `DELETE` | `/api/ancestors/:id` | Required | Delete a profile. Must belong to requesting user. Cascade deletes linked `saved_narratives`. |

### 3.3 Client: My Ancestors Panel

Entry point in the navigation alongside "My Records." Opens a modal:

- List of ancestor profiles, each card showing: full name, birth region, relationship (if set), era/birth year.
- A **New Ancestor** button opening a two-step form:
  - Step 1 (required): Name, Birth Region, Era — the minimum needed to run a personalized narrative.
  - Step 2 (optional, "Add details later"): Last Name, Birth Year, Death Year, Origin Country, Destination, Relationship, Notes.
- Edit and Delete actions on each card.
- A **Narrate** button on each card that passes the ancestor profile to the interaction layer (see §4).

Empty state: *"No ancestors in the registry yet. Add your first record to begin your odyssey."*

---

## 4. Feature: Personalized Narrative Generation

### 4.1 Query Enrichment

When a narrative request is tied to an ancestor profile, `narrativeService.ts` enriches the query before passing it to LangGraph:

```
Original query:    "Tell me about Polish immigrants"
Ancestor profile:  {
  name: "Stanisław", lastName: "Kowalski",
  birthRegion: "Galicia, Poland", originCountry: "Poland",
  destination: "Chicago, Illinois",
  birthYear: 1861, era: "1880s",
  relationship: "Great-great-grandfather",
  notes: "Left after the 1881 harvest failure. Ship manifest shows arrival 1883."
}

Enriched query:    "Tell me about Stanisław Kowalski, born in Galicia, Poland around 1861,
                    who emigrated to Chicago, Illinois in the 1880s. He was the researcher's
                    great-great-grandfather. Additional family context: Left after the 1881
                    harvest failure. Ship manifest shows arrival 1883."
```

This enrichment is done in `narrativeService.ts` before `graph.invoke`. No changes to the LangGraph graph itself.

### 4.2 Narrator Agent Prompt Update

When profile data is present, the narrator agent's system prompt includes:

> You are narrating for [Relationship] **[Full Name]** (born ~[birthYear], [birthRegion]). Address them by name. Say "Stanisław would have..." not "a Polish immigrant would have...". Where the researcher has provided notes, weave them in as if they are documented fact.

When no profile is selected, the narrator prompt is unchanged (generic voice, no name).

### 4.3 Client: Ancestor Context in the Interaction Layer

The "Narrate" button on an ancestor card should:
1. Set a `selectedAncestor` state in the interaction layer.
2. Show a dismissible tag above the input bar: *"Narrating for: Stanisław Kowalski ×"*
3. On submit, pass `ancestorId` to `POST /api/narrative/generate`.
4. Server enriches the query and runs the pipeline.
5. Resulting narrative is saved with `ancestorProfileId` set.

### 4.4 API Change

`POST /api/narrative/generate` optionally accepts `ancestorId` in the body. When present:
- Server fetches the ancestor profile and verifies it belongs to the authenticated user.
- Server enriches the query string before passing to LangGraph.
- On completion, narrative is auto-saved to `saved_narratives` with `ancestorProfileId` set.

---

## 5. My Records: Show Ancestor Name on Linked Cards

The My Records panel (Phase 9) should be updated to display the ancestor name on cards where `ancestorProfileId` is non-null. This requires either joining `saved_narratives` to `ancestor_profiles` in the `GET /api/records` query, or including a `ancestorName` field in the saved record response.

---

## 6. Unit Tests

- `POST /api/auth/signup` — firstName/lastName now required; returns 400 when missing.
- `PATCH /api/auth/profile` — updates only provided fields; ignores unknown fields; returns 401 without auth.
- `POST /api/ancestors` — creates profile with minimum fields; optional fields nullable; returns 401 without auth; validates required fields.
- `GET /api/ancestors` — returns only the authenticated user's profiles; empty array for new users.
- `PATCH /api/ancestors/:id` — partial update applies only provided fields; returns 403 if profile belongs to another user.
- `DELETE /api/ancestors/:id` — returns 404 if not found; 403 if belongs to another user.
- `narrativeService` query enrichment — enriched query contains ancestor name/region/era when profile data is passed; raw query passes through unchanged when no profile data is provided; notes are included when present.

---

## 7. Future-Phase Use of Profile Data

Fields collected in this phase feed directly into later phases:

- **Phase 11 (FamilySearch)** — `heritageRegions` and `originCountry` can be used to scope FamilySearch API searches. The `researchInterests` text can be parsed or passed as context to the researcher agent.
- **Phase 12 (Eval service)** — `heritageRegions` can be used to generate targeted golden-set queries for the evaluation suite rather than generic test queries.
- **Phase 13 (Migration map)** — `birthRegion`, `destination`, `birthYear` from ancestor profiles become the data points that the map renders as route annotations.

---

## 8. Verification (Done Criteria)

- [ ] Schema migration applied: `users` extended with 8 new profile columns; `ancestor_profiles` extended with 7 new detail columns.
- [ ] `POST /api/auth/signup` requires `firstName` and `lastName`; existing users unaffected.
- [ ] `GET /api/auth/profile` and `PATCH /api/auth/profile` implemented and tested.
- [ ] Signup form collects first name and last name.
- [ ] Onboarding prompt (heritage regions + research interests) shown once post-login when `profileComplete === false`.
- [ ] Profile Settings panel accessible from nav; all optional fields editable.
- [ ] `POST /api/ancestors`, `GET /api/ancestors`, `GET /api/ancestors/:id`, `PATCH /api/ancestors/:id`, and `DELETE /api/ancestors/:id` endpoints implemented, authenticated, and tested.
- [ ] My Ancestors panel functional: two-step create form, list, edit, delete.
- [ ] "Narrate" button on ancestor card passes `ancestorId` to the pipeline and shows the "Narrating for:" tag in the interaction layer.
- [ ] `narrativeService` enriches query with all available ancestor fields (name, region, era, birth year, destination, relationship, notes).
- [ ] Narrator agent prompt updated to address the ancestor by name when profile data is present.
- [ ] Auto-save on ancestor-linked narratives (with `ancestorProfileId` set).
- [ ] My Records panel shows ancestor name on linked narrative cards.
- [ ] Unit tests for signup, profile CRUD, ancestor CRUD, and query enrichment all passing.
