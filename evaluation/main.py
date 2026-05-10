import os
import json
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

# Load environment variables from the evaluation directory's .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

def run_evaluation():
    """
    Loads traces from latest_run.json, runs Ragas evaluation,
    and saves the summary report.
    """
    base_dir = os.path.dirname(__file__)
    trace_path = os.path.join(base_dir, "traces/latest_run.json")
    report_path = os.path.join(base_dir, "reports/summary.json")

    # 1. Handle the case where latest_run.json is missing or empty
    if not os.path.exists(trace_path):
        print(f"Error: Trace file not found at {trace_path}")
        exit(1)

    try:
        with open(trace_path, "r") as f:
            data = json.load(f)
    except json.JSONDecodeError:
        print(f"Error: Failed to decode JSON from {trace_path}")
        exit(1)

    if not data or (isinstance(data, list) and len(data) == 0):
        print(f"Error: Trace file is empty.")
        exit(1)

    # 2. Prepare data for Ragas
    # Ragas expects: question, contexts, answer, ground_truth
    df = pd.DataFrame(data)
    
    # For smoke testing with golden_set.json, we might have ground_truth but no answer
    if "answer" not in df.columns and "ground_truth" in df.columns:
        df["answer"] = df["ground_truth"]
    
    # Validation of minimum required columns
    required = ["question", "contexts", "answer"]
    missing = [col for col in required if col not in df.columns]
    if missing:
        print(f"Error: Missing required columns in trace data: {missing}")
        exit(1)

    # Ensure contexts is a list of strings (Ragas requirement)
    df["contexts"] = df["contexts"].apply(lambda x: x if isinstance(x, list) else [x])
    df["question"] = df["question"].astype(str)
    df["answer"] = df["answer"].astype(str)
    if "ground_truth" in df.columns:
        df["ground_truth"] = df["ground_truth"].astype(str)

    # 3. Initialize Ragas metrics
    metrics = [
        faithfulness,
        answer_relevancy,
        context_precision
    ]

    # 4. Run evaluation
    print(f"Starting evaluation on {len(df)} samples...")
    
    try:
        # Convert to HuggingFace Dataset using from_list for better type stability
        dataset = Dataset.from_list(df.to_dict('records'))

        # Run evaluate()
        # This uses the OPENAI_API_KEY from environment (loaded via load_dotenv)
        result = evaluate(
            dataset,
            metrics=metrics,
        )

        # 5. Print summary to stdout
        print("\n=== Evaluation Score Summary ===")
        print(result)

        # 6. Write results to evaluation/reports/summary.json
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        # result is an EvaluationResult object, which behaves like a dict for scores
        summary_data = {
            "scores": dict(result),
            "sample_count": len(df)
        }
        
        with open(report_path, "w") as f:
            json.dump(summary_data, f, indent=2)
        
        print(f"\nResults successfully written to {report_path}")

    except Exception as e:
        print(f"Error during evaluation process: {e}")
        exit(1)

if __name__ == "__main__":
    run_evaluation()
