# Phase 6 Implementation Plan: Evaluation

This document outlines the specific implementation steps for Phase 6: Evaluation. This phase establishes an automated framework using **Ragas** and **TruLens** to measure historical accuracy, retrieval relevance, and narrative quality.

---

## Step 1 — Python Environment & Structure
- **Directories to Create:**
  - `evaluation/`
  - `evaluation/dataset/`
  - `evaluation/traces/`
  - `evaluation/reports/`
- **Files to Create:**
  - `evaluation/requirements.txt` (ragas, trulens-eval, openai, pandas, python-dotenv)
- **Actions:**
  - Initialize a Python virtual environment (`venv`) within `evaluation/`.
  - Verify `pip install -r requirements.txt` succeeds.

**STOP HERE — await review**

## Step 2 — Golden Dataset Preparation
- **Files to Create:**
  - `evaluation/dataset/golden_set.json`
- **Logic:**
  - Manually draft 5–10 "Ground Truth" pairs (Query -> Historical Fact -> Sample Narrative).
  - These serve as the benchmark for "perfect" system performance.
  - Follow the Ragas schema: `{"question": "...", "ground_truth": "...", "context": [...]}`.

**STOP HERE — await review**

## Step 3 — Trace Export Service (Backend)
- **Files to Create:**
  - `server/src/services/evalService.ts`
- **Files to Modify:**
  - `server/src/services/narrativeService.ts` (or `graph.ts`)
- **Logic:**
  - Implement `exportTrace` to capture `question`, `contexts`, and `answer`.
  - Guard the export logic with `process.env.EVAL_MODE === 'true'`.
  - Resolve the export path to `evaluation/traces/latest_run.json` using `import.meta.url`.
  - Ensure it appends or manages a list of traces for batch evaluation.

**STOP HERE — await review**

## Step 4 — Ragas Scoring Script (Python)
- **Files to Create:**
  - `evaluation/main.py`
- **Logic:**
  - Load traces from `traces/latest_run.json`.
  - Initialize Ragas metrics: `faithfulness`, `answer_relevance`, and `context_precision`.
  - Run the evaluation and output a preliminary `summary.json`.

**STOP HERE — await review**

## Step 5 — TruLens & Synthetic Data
- **Files to Modify:**
  - `evaluation/main.py`
- **Logic:**
  - Integrate TruLens for "Grounding" and "Context Adherence" visualizations.
  - Configure the TruLens dashboard to launch on demand.
  - (Optional) Implement a script to generate `synthetic_set.json` using Ragas' generator against Phase 2 raw data.

**STOP HERE — await review**

## Step 6 — CLI Integration
- **Files to Modify:**
  - `package.json` (Root)
- **Logic:**
  - Add `eval` script: `npm run eval` which executes the Python scoring suite.
  - Add `eval:dashboard` script to launch the TruLens UI.
  - Ensure `EVAL_MODE` can be easily toggled for trace generation.

**STOP HERE — await review**

## Step 7 — Final Benchmarking & Done Criteria
- **Actions:**
  - Run the full pipeline against the Agent Swarm.
  - Verify scores meet the target thresholds (Precision > 0.7, Faithfulness > 0.8).
  - Document the baseline metrics in `evaluation/reports/baseline.md`.
  - Final validation: `lint + typecheck + tests` (to ensure `evalService` doesn't break the build).

**STOP HERE — await review**
