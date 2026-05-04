# Phase 6 Plan: Evaluation

## 1. Objective
Establish a rigorous, automated evaluation framework to measure the historical accuracy, retrieval relevance, and narrative quality of the Heritage Odyssey platform. Using **Ragas** and **TruLens**, we will quantify the "hallucination" risk and ensure the multi-agent swarm delivers trustworthy, emotionally resonant stories.

## 2. Architectural Decision: Language Boundary
**Decision:** We will implement the evaluation suite as a separate **Python-based offline process** managed within the `/evaluation` directory and invoked via `npm scripts` from the root.

**Reasoning:**
- **Library Maturity:** Ragas and TruLens are native to Python. While JS/TS ports exist, they lack the full feature set and community support of the original libraries.
- **Production Decoupling:** Evaluation is a development-time and CI/CD task. Running it as a separate process prevents Python dependencies from leaking into the Node.js production environment or the Railway deployment image.
- **Workflow:** The Node.js server will export "Trace Logs" (Inputs, Retrieved Contexts, and Final Narratives) to JSON/CSV files. The Python suite will consume these files, calculate scores, and output a JSON report that the developer can review.

**Requirements & Activation:**
- **Python Version:** 3.9 or higher is required for Ragas.
- **Environment:** Developers must create and activate a virtual environment (e.g., `python -m venv venv`) within the `evaluation/` directory before running the suite.
- **Eval Mode:** Trace logging is activated via the \`EVAL_MODE=true\` environment variable. The \`evalService.ts\` will only write traces to disk when this flag is enabled, ensuring no disk I/O overhead or trace leakage in production.

## 3. Evaluation Pipeline

### Step 1: Test Dataset Creation (\`evaluation/dataset/\`)
- **Golden Dataset:** A hand-curated set of 20 "Ground Truth" pairs (Query -> Historical Fact -> Sample Narrative).
- **Synthetic Dataset:** Use Ragas' synthetic test data generation to create 50+ additional query/context pairs from the raw data ingested in Phase 2.
- **Schema:**
  \`\`\`json
  {
    "question": "What were the conditions for Polish immigrants in 1890s Chicago?",
    "ground_truth": "Polish immigrants often lived in 'Prussian Poland' enclaves like West Town, working in meatpacking or steel mills...",
    "context": ["Source A: Ellis Island records...", "Source B: Chicago Historical Antiquity..."]
  }
  \`\`\`

### Step 2: Trace Export (\`server/src/services/evalService.ts\`)
- A service to intercept LangGraph runs during "eval mode" (\`EVAL_MODE=true\`).
- It captures the \`AgentState\` after each run, specifically:
  - \`query\` (Input)
  - \`historicalContext\` (Retrieved context)
  - \`finalScript\` (Generated answer)
- Data is saved to \`evaluation/traces/latest_run.json\`.

### Step 3: Scoring Logic (\`evaluation/main.py\`)
- **Ragas Metrics:**
  - \`faithfulness\`: Measures if the narrative is derived solely from the retrieved context (no hallucinations).
  - \`answer_relevance\`: Measures if the narrative actually addresses the user's query.
  - \`context_precision\`: Measures the quality of the Pinecone retrieval (Phase 2 integration).
- **TruLens Integration:**
  - Used for "Grounding" and "Context Adherence" visualizations.
  - Monitors the "latency vs. quality" trade-off for the Agent Swarm.

### Step 4: Report Generation
- The Python script outputs a \`summary.json\` and an HTML dashboard (via TruLens).
- A root-level command \`npm run eval\` will trigger the sequence: \`capture traces -> run python scorer -> display results\`.

## 4. Technical Implementation

### File Structure
\`\`\`
evaluation/
├── requirements.txt         # Ragas, TruLens, OpenAI, Pandas
├── main.py                  # Entry point for scoring
├── dataset/
│   ├── golden_set.json      # Manually curated
│   └── synthetic_set.json   # Generated
├── traces/
│   └── latest_run.json      # Exported from Node.js
└── reports/                 # Output directory
\`\`\`

### TypeScript/Node.js Interface
\`\`\`typescript
// server/src/services/evalService.ts
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

export interface EvalTrace {
  question: string;
  contexts: string[];
  answer: string;
}

export const exportTrace = async (trace: EvalTrace) => {
  if (process.env.EVAL_MODE === 'true') {
    // Because the server workspace uses NodeNext ESM modules, __dirname is not available. 
    // The trace file path must be resolved using import.meta.url.
    const tracePath = resolve(
      dirname(fileURLToPath(import.meta.url)), 
      '../../../evaluation/traces/latest_run.json'
    );
    // Append to tracePath
  }
};
\`\`\`

## 5. Implementation Steps
1.  **Environment Setup:** Create the \`evaluation/\` folder and \`venv\`. Install Ragas and TruLens.
2.  **Dataset Preparation:** Manually draft 5 "Golden" entries and run the Ragas synthetic generator on Phase 2 data.
3.  **Trace Export:** Implement \`evalService.ts\` in the server to log LangGraph outputs (guarded by \`EVAL_MODE\`).
4.  **Scoring Script:** Write \`main.py\` to calculate faithfulness and relevance scores.
5.  **Integration:** Add \`npm run eval\` to the root \`package.json\`.
6.  **Benchmarking:** Run the suite against the current Agent Swarm and document the baseline scores.

## 6. Verification (Done Criteria)
- [ ] Python virtual environment is set up and reproducible via \`requirements.txt\`.
- [ ] \`npm run eval\` successfully executes the full pipeline and prints scores to the console.
- [ ] Retrieval relevance (Context Precision) score is > 0.7.
- [ ] Answer faithfulness score is > 0.8 (indicating low hallucination).
- [ ] Evaluation reports are excluded from production builds via \`.gitignore\` or Docker config.
- [ ] A \`summary.json\` is generated containing metrics for at least 30 test cases.
