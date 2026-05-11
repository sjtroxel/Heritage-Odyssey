import os
import json
import argparse
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision

# Load environment variables from the evaluation directory's .env file
env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

# Disable OTEL tracing to use Select lenses with TruVirtual in 2.8.0
os.environ["TRULENS_OTEL_TRACING"] = "0"

def ingest_to_trulens(data):
    """
    Ingests trace data into TruLens for Grounding and Context Adherence metrics.
    """
    try:
        from trulens_eval import Tru, Feedback, OpenAI, Select
        from trulens.apps.virtual import TruVirtual, VirtualRecord
    except ImportError as e:
        print(f"Skipping TruLens ingestion: {e}")
        return

    tru = Tru()
    # OpenAI provider will use OPENAI_API_KEY from environment
    provider = OpenAI()

    # 1. Groundedness Feedback (Grounding)
    # Select.RecordCalls.retrieve.rets.collect() aggregates the list of contexts
    f_groundedness = (
        Feedback(provider.groundedness_measure_with_cot_reasons, name="Groundedness")
        .on(Select.RecordCalls.retrieve.rets.collect())
        .on_output()
    )

    # 2. Context Adherence (Context Relevance)
    f_context_relevance = (
        Feedback(provider.context_relevance_with_cot_reasons, name="Context Adherence")
        .on_input()
        .on(Select.RecordCalls.retrieve.rets.collect())
    )

    virtual_app = TruVirtual(
        app_id="HeritageOdyssey",
        feedbacks=[f_groundedness, f_context_relevance]
    )

    print(f"Ingesting {len(data)} records to TruLens...")
    record_ids = []
    for entry in data:
        # Construct VirtualRecord with list of calls for 'retrieve'
        calls = {
            Select.RecordCalls.retrieve: [
                {
                    "args": {"query": entry["question"]},
                    "rets": entry["contexts"]
                }
            ]
        }
        
        v_record = VirtualRecord(
            main_input=entry["question"],
            main_output=entry.get("answer", entry.get("ground_truth")),
            calls=calls
        )
        record = virtual_app.add_record(v_record)
        record_ids.append(record.record_id)
    
    print("TruLens ingestion complete. Waiting for feedback functions to complete...")
    tru.wait_for_feedback_results(
        record_ids=record_ids,
        feedback_names=["Groundedness", "Context Adherence"],
        timeout=120  # Increased timeout for 12 records
    )
    print("TruLens evaluations finished.")

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
    print(f"Starting Ragas evaluation on {len(df)} samples...")
    
    try:
        dataset = Dataset.from_list(df.to_dict('records'))

        result = evaluate(
            dataset,
            metrics=metrics,
        )

        # 5. Print summary to stdout
        print("\n=== Ragas Evaluation Score Summary ===")
        print(result)

        # 6. Write results to evaluation/reports/summary.json
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        summary_data = {
            "scores": dict(result),
            "sample_count": len(df)
        }
        
        with open(report_path, "w") as f:
            json.dump(summary_data, f, indent=2)
        
        print(f"\nResults successfully written to {report_path}")

        # 7. Ingest into TruLens
        ingest_to_trulens(data)

    except Exception as e:
        print(f"Error during evaluation process: {e}")
        exit(1)
    
    # Give background feedback threads time to settle before exit
    import time
    print("Waiting 15s for background processes to settle...")
    time.sleep(15)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Heritage Odyssey Evaluation Suite")
    parser.add_argument("--dashboard", action="store_true", help="Launch TruLens Dashboard")
    args = parser.parse_args()

    if args.dashboard:
        try:
            from trulens_eval import Tru
            # Ensure venv bin is in PATH for streamlit
            venv_bin = str(Path(__file__).parent / "venv" / "bin")
            if os.path.exists(venv_bin) and venv_bin not in os.environ["PATH"]:
                os.environ["PATH"] = venv_bin + os.pathsep + os.environ["PATH"]
            
            print("Launching TruLens Dashboard...")
            Tru().run_dashboard()
        except ImportError:
            print("Error: trulens_eval not installed. Run pip install -r requirements.txt")
    else:
        run_evaluation()
