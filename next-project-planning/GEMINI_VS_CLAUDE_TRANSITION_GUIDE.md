# GEMINI_VS_CLAUDE_TRANSITION_GUIDE.md

*A reference for sjtroxel summarizing the transition from Claude Code to Gemini CLI, focusing on context management, memory, and workflow differences.*

---

## 1. Context Window Management (The "Claude Style" Protocol)

In Claude Code, you were used to manual restarts at 80% to avoid autocompacting. In Gemini CLI, we have configured the following:

- **Autocompression Disabled:** `model.compressionThreshold` is set to `1.0`. I will never automatically summarize or "compact" the chat history without your permission.
- **The 80% Advisory:** I will proactively monitor the footer usage percentage. When we hit **80%**, I will advise you to either run `/compress` (summarize current session) or restart the session (`exit` and restart).
- **Footer Visibility:** `ui.footer.hideContextPercentage` is set to `false`, so you can see the "gas gauge" at all times.

## 2. Memory & Persistence

Unlike Claude Code's built-in session memory, Gemini CLI uses a explicit 3-tier system:

- **`GEMINI.md` (Project Rules):** The primary source of truth for architecture, tech stack, and non-negotiables. Committed to Git.
- **`MEMORY.md` (Private Memory):** Personal notes, local setup, and to-do lists. Lives in `~/.gemini/tmp/` and is NOT committed to Git.
- **Global Personal Memory:** Your cross-project preferences (e.g., "TypeScript strict always").
- **Autonomous Updates:** I am empowered to update these files as we make decisions so that context is never "lost" when starting a new session.

## 3. Quota, Billing, and Models

### Model Comparison Table

| Claude Class | Claude Model | Gemini Class | Gemini Model | Recommended Use |
|---|---|---|---|---|
| **Opus** | Opus 3.5 | **Pro** | `gemini-3.1-pro` | Heavy reasoning, initial architecture |
| **Sonnet** | Sonnet 4.6 | **Pro/Balanced** | `gemini-3.1-pro` | **Daily Driver.** Best balance of speed/quality. |
| **Haiku** | Haiku 4.5 | **Flash** | `gemini-3.1-flash` | Mechanical tasks, simple scripts, tests |

**Strategy Note:** If you found Sonnet 4.6 worked well, `gemini-3.1-pro` is your best equivalent. We are currently using `gemini-3-flash-preview` for this initialization phase to preserve your daily quota while still maintaining high reasoning.

### Quota Recovery and Billing

If you hit 100% of your daily free quota:

1. **New Google Cloud Project:** For "Heritage Odyssey," we recommend creating a dedicated Google Cloud project to maintain clean billing separation and monitor costs specific to this application.
2. **Step-by-Step API Key Creation:**
   - Go to [Google AI Studio](https://aistudio.google.com/).
   - Click **"Get API key"** in the sidebar.
   - Click **"Create API key"**.
   - Create it in a new, dedicated Google Cloud Project.
   - Securely save the key in your environment variables.
3. **Switching Auth:** Use the **`/auth`** slash command within our active session to transition to your API key.
   - *Note:* Changing authentication modes via `/auth` does **not** reset our current chat memory; you can switch seamlessly without losing context.
4. **Cost Comparison:**

| Model | Input Cost / M tokens | Output Cost / M tokens | Note |
|---|---|---|---|
| **Gemini Flash (Paid)** | ~$0.075 | ~$0.30 | Token-based billing |
| **Claude Sonnet 4.6** | $3.00 | $15.00 | Pro: Flat $20/mo |

*Note: Claude Pro is a flat $20/month subscription, whereas Gemini API is usage-based.*

## 4. Workflow Non-Negotiables

- **NEVER Git:** I will never run `git commit` or `git push`. That is entirely your domain.
- **Spec-First:** We write the architecture and plan in a `.md` file in `project-specs/roadmap/` before touching any code.
- **Directness:** Concise responses. Results and decisions over narration and ceremony.
- **Wait for Signal:** Do NOT proceed to research, implementation, or architectural phases until sjtroxel gives the explicit "begin" or "proceed" instruction.
- **Documentation Maintenance:** I will proactively update this guide as our workflow evolves.
- **Active Project Name:** **Heritage Odyssey** (Family Migration & History Intelligence).
- **Current Status:** **PAUSED — Waiting for Authorization to Begin.**

---

*Last Updated: May 2, 2026*