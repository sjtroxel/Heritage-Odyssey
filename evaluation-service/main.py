from pathlib import Path
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / "server" / ".env", override=True)

from fastapi import FastAPI
from routers import health

app = FastAPI(title="Heritage Odyssey Eval Service")

app.include_router(health.router)
