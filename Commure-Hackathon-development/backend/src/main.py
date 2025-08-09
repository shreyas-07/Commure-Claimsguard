import json
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from rule_validation import validate_batch, validate_claim
from fastapi import HTTPException
from typing import Dict, Any
from pathlib import Path
from genai import summarize_claim
import datastore
import uvicorn
app = FastAPI(title="CPT RAG Validator")

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Patient(BaseModel):
    reference: Optional[str] = None

class Claim(BaseModel):
    claim_id: str
    codes: List[str]
    modifier: Optional[str] = None
    patient: Optional[Patient] = None

class ClaimResponse(BaseModel):
    claim_id: str
    response_id: Optional[str]
    status: str
    outcome: str
    denied: bool
    denial_reasons: List[str]
    has_prior_auth: bool
    has_cob: bool
    procedure_codes: List[str]
    modifiers: List[str]
    diagnosis_codes: List[str]
    total_amount: float
    raw_claim: Dict[str, Any]
    raw_response: Optional[Dict[str, Any]]

SAMPLE_CLAIM_PATH = Path(__file__).parent / "sample_claim.json"
try:
    with open(SAMPLE_CLAIM_PATH) as f:
        sample_claims = json.load(f)
except FileNotFoundError:
    sample_claims = None

@app.post("/validate/batch")
def batch(claims: List[Claim]):
    df: pd.DataFrame = validate_batch([c.dict() for c in claims])
    df = df.where(pd.notnull(df), None)
    records = df.to_dict(orient="records")

    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for rec in records:
        cid = rec["claim_id"] or ""
        grouped.setdefault(cid, []).append(rec)

    out = {"claims": []}
    for cid, recs in grouped.items():
        approved = all(not r["result"].startswith("❌") for r in recs)
        claim_data = {
            "claim_id": cid,
            "approved": approved,
            "results": recs,
        }
        claim_data["summary"] = summarize_claim(claim_data)
        out["claims"].append(claim_data)

    return out

@app.post("/validate/single")
def single(claim: Claim):
    df = validate_claim(claim.dict())
    df = df.where(pd.notnull(df), None)
    records = df.to_dict(orient="records")
    print(records)
    approved = all(not r["result"].startswith("❌") for r in records)
    claim_data = {
        "claim_id": claim.claim_id or "",
        "approved": approved,
        "results": records,
    }
    claim_data["summary"] = summarize_claim(claim_data)
    return claim_data

@app.get("/claim/{claim_id}", response_model=ClaimResponse)
def get_claim(claim_id: str):
    if claim_id == sample_claims["claim_id"]:
        return sample_claims
    raise HTTPException(status_code=404, detail="Claim not found")

@app.get("/claims", response_model=List[ClaimResponse])
def get_all_claims():
    if sample_claims:
        return sample_claims
    raise HTTPException(status_code=404, detail="No claims found")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )