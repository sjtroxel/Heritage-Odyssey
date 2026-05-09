# ChronoQuizzr — LinkedIn Blog Post #1

**Status:** Draft 2026-05-09. Not yet published.
**Series:** Post 1 of 4. See `BLOG_SERIES_PLAN_MAY_2026.md`.
**Live app:** https://chrono-quizzr.vercel.app

---

## The Post (paste into LinkedIn as-is)

> Built a historical-events GeoGuessr where Claude writes each clue and a second Claude tries to break it. If the attacker identifies the location, the clue is rewritten.
>
> The problem: text-clue GeoGuessr is harder to specify than the satellite-image kind. Every clue has to be solvable but cannot name the place.
>
> The Chronicler Engine runs every clue through a Generate → Attack → Rewrite loop:
>
> - A Generator agent (Claude Haiku) drafts a clue from a real historical event.
> - An Adversary reads the clue and tries to name the location.
> - If the Adversary succeeds, the Generator gets the failure signal and rewrites. Up to 3 retries; events that fail all 3 are dropped.
>
> A single critic pass changes the output. Without the Adversary, the Generator's first drafts tend to name the city. With it, you get clues like "In a narrow street of an old Austro-Hungarian city, a young nationalist fired the shots that ignited a continental war."
>
> 5 rounds per game, Haversine-distance scoring, 25,000 points max. True coordinates are stripped server-side, so the answer cannot be sniffed in DevTools.
>
> Stack: React 19, TypeScript, Leaflet, Express, Claude Haiku, Vercel + Railway. 71 tests across 5 layers.
>
> Play it: chrono-quizzr.vercel.app
>
> #AIEngineering #LLMs #TypeScript #OpenToWork

---

## Length Check

- **Word count:** ~210 words (target was ~200; on spec)
- **Character count:** ~1,330 chars (well under LinkedIn's 3,000 cap)
- **Hook line cut-point:** "Built a historical-events GeoGuessr where Claude writes each clue and a second Claude tries to break it." = ~110 chars. Under the typical "...see more" truncation point (~210 chars on desktop, ~140 on mobile), so the full first sentence is visible before the cut. Good.

---

## Video

**File:** `Recording 2026-05-09 094327.mp4` (in this same folder)
**Duration:** 42 seconds
**Audio:** silent (correct choice — most LinkedIn feed-scrollers have sound off; ChronoQuizzr's UI is text-on-screen anyway, so nothing is lost)
**Format:** MP4, 24 MB (well under LinkedIn's 5 GB / 10 min native-video cap)

### Why video, not a still image

Native video gets stronger algorithmic lift than stills on the 2026 LinkedIn feed, and this particular clip has a genuine climax frame at ~32–33s that justifies the watch. The result reveal lands with both pins on the same Caribbean island, a 125.5 km gap, and a 4,696-point score. Proximity-but-not-perfect tells the product story far better than a single screenshot could.

### What the video shows (timeline)

- **0–28s** — gameplay loop: clue text renders ("1791 — A midnight gathering in a forested ravine on a Caribbean sugar plantation island..."), player reads, zooms into the Caribbean, places guess pin near Port-au-Prince. The "dead air" mid-clue is intentional — it is the player's thinking time and the viewer's parallel reading time.
- **~30s** — submit triggers the map's zoom-out reveal animation and the result panel slides in.
- **~32–33s — the climax frame.** Gold target pin lands on Cap-Français (true location: Bois Caïman, site of the 1791 Haitian slave uprising), the player's blue pin sits near Port-au-Prince ~125 km south, and the right panel reads "4,696 pts / 125.5 km from the true location" with a running total of 9,098 / 25,000.
- **~38s** — the next round's clue auto-loads (1191, the Levantine siege one), implicitly demonstrating session continuity.
- **Bonus product feature shown:** dual theme system — Inky Night (dark) during gameplay, Aged Map (parchment) for the reveal. Two features demonstrated in one clip.

### LinkedIn upload notes

- Upload as **native video** via LinkedIn's "Add a video" button when composing the post. Do not link to a hosted file.
- LinkedIn auto-picks a thumbnail from an early frame. The auto-pick is usually fine; if you want to override, the right thumbnail would be the **~32s climax frame** (we've already deleted the extracted PNG, but it's regeneratable from the source file with `ffmpeg -ss 32 -i "Recording 2026-05-09 094327.mp4" -frames:v 1 thumbnail.png` if needed).
- Mobile feed-viewers see roughly a 1:1 crop of the video. The right-side score panel is the most important content; with this 16:9-ish recording it may get tightened on mobile, but the climax frame is centered enough that the key elements should survive. Don't re-shoot for post #1 — upload as-is and see how it lands.

---

## Draft Notes (why these choices)

**Why lead with the Adversary loop, not the gameplay description?**
The post is for recruiters who can read code. The most signal-rich detail in this codebase is the two-agent verification pipeline — it shows judgment about how to deal with LLM output quality. Leading with "I built a quiz game" would bury the technical signal. Leading with "Claude attacks Claude" is concrete and specific in the first 100 chars.

**Why mention "without the Adversary, the Generator's first drafts tend to name the city"?**
Concrete contrast is the most efficient way to convey *why* the architecture exists. The example clue (the Franz Ferdinand assassination one) is from your real `events.json`, so it's not fabricated.

**Why the "stripped server-side, cannot be sniffed in DevTools" line?**
Recruiters who have actually shipped web apps will recognize that detail as someone who thought about a real attack vector. It is a small line but it punches above its weight.

**Why no GitHub link in the body?**
The deploy link is the strongest CTA — it sends a recruiter directly into a working artifact in 1 click. A GitHub link would split attention. Your LinkedIn Featured section already shows the GitHub side. The deploy URL is more compelling for a feed post.

**Hashtag choices:**
4 specific tags. `#AIEngineering` and `#LLMs` are the recruiter-search anchors. `#TypeScript` catches the stack-filtered searches. `#OpenToWork` is the universal job-signal flag. Skipped `#GenerativeAI` (too broad), `#ReactJS` (no recruiter actively searching for React for an AI Engineer role), and `#FullStack` (positions you toward web-dev rather than AI engineering, which is the wrong lane for this series).

**AI-tells stripped:**
- No em dashes (used arrow `→` and parentheses instead).
- No emojis.
- No "I'm thrilled to share" opening.
- No "Selected Projects:" template header.
- No "no LangChain" framing.
- Hook is concrete and specific in the first sentence; doesn't lead with abstract claims.

---

## Publish Log

- **Drafted:** 2026-05-09
- **Posted:** _TBD_
- **Inbound notes:** _TBD — fill in after posting if any recruiter inbound or notable engagement_
