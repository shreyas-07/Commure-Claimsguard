import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor, as_completed

import torch
import chromadb
from sentence_transformers import SentenceTransformer

# Configuration
RULES_FILE = Path("ncci_rules.json")
HISTORY_FILE = Path("claim_history.json")
COLLECTION_NAME = "ncci_rules"
BATCH_SIZE = 5000
EMBED_BATCH = 64
MAX_THREADS = 4
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Logging setup
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s:%(message)s")
logger = logging.getLogger(__name__)


def load_json(path: Path) -> Any:
    """Load JSON data or return empty list/dict on missing file."""
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        logger.warning("JSON file not found: %s", path)
        return [] if path.suffix == ".json" else {}


class TorchEmbedFn:
    """Chroma embedding function wrapper for SentenceTransformer."""
    def __init__(self, model: SentenceTransformer):
        self.model = model

    def __call__(self, input: List[str]) -> List[List[float]]:
        """Generate embeddings for texts under torch no_grad."""
        with torch.inference_mode():
            return self.model.encode(
                input,
                batch_size=EMBED_BATCH,
                convert_to_numpy=True,
                show_progress_bar=False,
            )


def initialize_chroma(rules: List[Dict[str, Any]]) -> chromadb.api.models.Collection:
    """Create/reset ChromaDB collection and ingest rule embeddings."""
    # Prepare data
    texts = [r["rule_text"] for r in rules]
    metadatas = [
        {key: r[key] for key in ("code1", "code2", "modifier_allowed", "modifier_indicator")} for r in rules
    ]
    ids = [f"rule_{i:06d}" for i in range(len(rules))]

    # Load model
    model = SentenceTransformer("all-MiniLM-L6-v2", device=DEVICE)
    model.to(DEVICE)
    model.eval()
    try:
        model.half()
        logger.info("Converted model to FP16.")
    except Exception:
        logger.info("FP16 not supported, using FP32.")

    # Setup Chroma
    client = chromadb.Client()
    if COLLECTION_NAME in [c.name for c in client.list_collections()]:
        client.delete_collection(COLLECTION_NAME)
    collection = client.create_collection(
        name=COLLECTION_NAME,
        embedding_function=TorchEmbedFn(model)
    )

    # Ingest batches
    def chunk(seq, size):
        for i in range(0, len(seq), size):
            yield seq[i : i + size]

    logger.info("Ingesting embeddings into ChromaDB...")
    with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
        futures = []
        for texts_batch in chunk(texts, BATCH_SIZE):
            idx = texts.index(texts_batch[0]) // BATCH_SIZE
            futures.append(
                executor.submit(
                    collection.add,
                    documents=texts_batch,
                    metadatas=list(chunk(metadatas, BATCH_SIZE))[idx],
                    ids=list(chunk(ids, BATCH_SIZE))[idx],
                    embeddings=model.encode(
                        texts_batch,
                        batch_size=EMBED_BATCH,
                        convert_to_numpy=True,
                    ),
                )
            )
        for f in as_completed(futures):
            logger.info("Batch upload complete.")
    logger.info("ChromaDB ingestion complete.")
    return collection


def search_rule(
    code1: str,
    code2: str
) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Find matching rule text and metadata via vector query or fallback."""
    resp = collection.query(
        query_texts=[f"{code1} with {code2}"],
        n_results=3,
        where={"code1": code1},
        include=["documents", "metadatas"]
    )
    docs, metas = resp["documents"][0], resp["metadatas"][0]
    for doc, meta in zip(docs, metas):
        if meta.get("code2") == code2:
            return doc, meta
    fallback = rules_map.get((code1, code2))
    if fallback:
        return fallback["rule_text"], fallback
    return None, None


def load_claim_history(path: Path) -> Dict[str, List[str]]:
    """Build patient reference to hcpcs_code history."""
    data = load_json(path)
    history: Dict[str, List[str]] = {}
    for claim in data:
        pat_ref = claim.get("raw_claim", {}).get("patient", {}).get("reference")
        hcpcs = claim.get("hcpcs_code")
        if pat_ref and hcpcs:
            history.setdefault(pat_ref, []).append(hcpcs)
    return history


def has_prior_claim_with_hcpcs(patient_reference: str, hcpcs_code: str) -> bool:
    """Return True if patient has prior claim of that hcpcs_code."""
    return hcpcs_code in claim_history.get(patient_reference, [])


# Global initialization
all_rules = load_json(RULES_FILE) or []
rules_map = {(r["code1"], r["code2"]): r for r in all_rules}
collection = initialize_chroma(all_rules)
claim_history = load_claim_history(HISTORY_FILE)
