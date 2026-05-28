# Phase 10 Plan: Ancestor Profile System & Personalized Narratives

> **Status: PLANNED** — Not yet started. This phase closes the gap between Heritage Odyssey as a history chatbot and Heritage Odyssey as an actual genealogy product. The `ancestor_profiles` table has been in the database since Phase 2 and has never been touched by the UI.

## 1. Objective

Give users the ability to create named ancestor profiles and generate narratives that are personally addressed to those ancestors. This is the feature that justifies calling Heritage Odyssey a "family history intelligence system" rather than a narrative generator.

Without this phase, every query is generic ("tell me about Polish immigrants in 1890 Chicago"). With this phase, queries can be contextualized ("tell me about Stanisław's journey from Galicia to Chicago"), and the LangGraph pipeline can reference the user's actual ancestor data.

---

## 2. Feature: Ancestor Profile CRUD

### 2.1 Schema

The `ancestor_profiles` table is already deployed:

```sql
ancestor_profiles (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birth_region text NOT NULL,
  era text NOT NULL,
  created_at timestamp NOT NULL
)
```

No schema migration needed for basic CRUD. If more fields are desired (ethnicity, destination region, notes), a Drizzle migration would add them.

### 2.2 New API Endpoints

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ancestors` | Required | Create a new ancestor profile. Body: `{ name, birthRegion, era }`. |
| `GET` | `/api/ancestors` | Required | List all ancestor profiles for the authenticated user. |
| `GET` | `/api/ancestors/:id` | Required | Get a single ancestor profile. |
| `PATCH` | `/api/ancestors/:id` | Required | Update a profile (name, birthRegion, era). Must belong to requesting user. |
| `DELETE` | `/api/ancestors/:id` | Required | Delete a profile. Must belong to requesting user. Cascade deletes linked saved narratives. |

### 2.3 Client: My Ancestors Panel

Add an "My Ancestors" entry point in the navigation (alongside the future "My Records" from Phase 9). Opens a modal or full-panel view:

- List of the user's ancestor profiles, each card showing: name, birth region, era.
- A "New Ancestor" button that opens a form (name, birth region, era — three fields, Victorian Register aesthetic).
- Edit (pencil icon) and Delete (trash icon) actions on each card.
- A "Narrate" button on each card that pre-populates the query input with a personalized prompt (see §3 below) and submits it.

Empty-state: "No ancestors in the registry yet. Add your first record to begin your odyssey."

---

## 3. Feature: Personalized Narrative Generation

### 3.1 The Problem

The current LangGraph researcher node takes a raw query string and searches Pinecone for matching historical context. The query is whatever the user typed — it has no knowledge of who the user's ancestor was.

### 3.2 The Solution

When a narrative request is tied to an ancestor profile, the server should enrich the query before passing it to the LangGraph pipeline:

```
Original query:      "Tell me about Polish immigrants"
Ancestor profile:    { name: "Stanisław Kowalski", birthRegion: "Galicia, Poland", era: "1880s" }
Enriched query:      "Tell me about Stanisław Kowalski, born in Galicia, Poland in the 1880s,
                      and the Polish immigrants who made a similar journey during that era."
```

This enrichment can be done in `narrativeService.ts` before calling `graph.invoke`. No LangGraph changes required.

The narrator agent's prompt should also be updated to address the ancestor by name when profile data is present, so the output sounds like: "Stanisław would have left Galicia in the bitter winter of 1883..." rather than "A Polish immigrant would have..."

### 3.3 Client: Query Pre-Population

The "Narrate" button on an ancestor card (§2.3) should:
1. Set a `selectedAncestor` state in the interaction layer.
2. Show a small "Narrating for: [Ancestor Name]" tag above the input bar.
3. On submit, pass the `ancestorId` to the narrative endpoint alongside the query.
4. Server enriches the query with the ancestor's profile data before running the pipeline.
5. Save the resulting narrative linked to that `ancestorId` in `saved_narratives`.

### 3.4 API Change

`POST /api/narrative/generate` and `POST /api/narrative/tts` should optionally accept `ancestorId` in the body. When present:
- Server fetches the ancestor profile and verifies it belongs to the authenticated user.
- Server enriches the query string before passing to LangGraph.
- On completion, the narrative is saved to `saved_narratives` with the `ancestorProfileId` set (no longer nullable via Phase 9's migration).

---

## 4. Saved Narratives: Linking to Ancestor Profiles

Phase 9 makes `ancestorProfileId` nullable to unblock saving narratives without a profile. Phase 10 completes the picture:

- Narratives generated via an ancestor profile card are saved with `ancestorProfileId` set.
- Ad-hoc narratives (no profile selected) are saved with `ancestorProfileId` null.
- The My Records panel (Phase 9) should show the ancestor name on cards where `ancestorProfileId` is set.

---

## 5. Unit Tests

- `POST /api/ancestors` — creates profile, returns 401 without auth, validates required fields.
- `GET /api/ancestors` — returns only the authenticated user's profiles, empty array for new users.
- `DELETE /api/ancestors/:id` — returns 404 if profile doesn't exist, 403 if it belongs to another user.
- `narrativeService` — query enrichment applies name/region/era when ancestor profile data is passed; raw query passes through unchanged when no profile data is provided.

---

## 6. Verification (Done Criteria)

- [ ] `POST /api/ancestors`, `GET /api/ancestors`, `PATCH /api/ancestors/:id`, and `DELETE /api/ancestors/:id` endpoints implemented, authenticated, and tested.
- [ ] "My Ancestors" panel functional: create, list, edit, delete ancestor profiles.
- [ ] "Narrate" button on ancestor card pre-populates query and passes `ancestorId` to the pipeline.
- [ ] `narrativeService` enriches the query with ancestor name, birth region, and era when `ancestorId` is provided.
- [ ] Narrator agent prompt updated to address the ancestor by name in the output.
- [ ] Narratives generated via an ancestor profile are saved with `ancestorProfileId` set.
- [ ] My Records panel (Phase 9) shows ancestor name on linked narrative cards.
- [ ] Unit tests for ancestor CRUD endpoints and query enrichment added and passing.
