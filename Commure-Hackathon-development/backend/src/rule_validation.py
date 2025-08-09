import itertools
from typing import Any, Dict, List, Optional, Tuple, Protocol
import pandas as pd

from datastore import search_rule, has_prior_claim_with_hcpcs


class ValidationRule(Protocol):
    """Protocol for validation rules."""
    def validate(
        self,
        code_pair: Optional[Tuple[str, str]],
        modifier: Optional[str],
        claim: Dict[str, Any]
    ) -> Optional[str]:
        ...


def is_valid_modifier(mod: Optional[str], valid_mods: set) -> bool:
    """Check if modifier is in allowed set."""
    return bool(mod and mod in valid_mods)


class PTPValidationRule:
    """Validate pairwise CPT rules from NCCI."""
    def validate(
        self,
        code_pair: Optional[Tuple[str, str]],
        modifier: Optional[str],
        claim: Dict[str, Any]
    ) -> Optional[str]:
        if not code_pair:
            return None
        code1, code2 = code_pair
        txt, meta = search_rule(code1, code2)
        if not txt:
            return None
        valid_mods = set(meta.get("modifier_indicator", "").split(","))
        if meta.get("modifier_allowed", False):
            if is_valid_modifier(modifier, valid_mods):
                return f"✅ '{modifier}' valid — {txt}"
            allowed = ", ".join(sorted(valid_mods)) or "None"
            return f"❌ Invalid modifier '{modifier}'. Allowed: {allowed} — {txt}"
        if modifier:
            return f"❌ Modifier not allowed for {code1}+{code2} — {txt}"
        return f"✅ No modifier required — {txt}"


class GlobalDuplicationRule:
    """Validate one-time HCPCS duplication per patient."""
    GLOBAL_CODE = "G0438"

    def validate(
        self,
        code_pair: Optional[Tuple[str, str]],
        modifier: Optional[str],
        claim: Dict[str, Any]
    ) -> Optional[str]:
        patient = claim.get("patient", {}) or {}
        ref = patient.get("reference")
        if not ref:
            return None
        if self.GLOBAL_CODE in claim.get("codes", []) and \
           has_prior_claim_with_hcpcs(ref, self.GLOBAL_CODE):
            return (f"❌ Procedure {self.GLOBAL_CODE} already billed for "
                    f"patient {ref}")
        return None


def validate_pairwise(
    codes: List[str],
    modifier: Optional[str],
    claim: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Run pairwise rules across all code combinations."""
    handlers: List[ValidationRule] = [PTPValidationRule()]
    results: List[Dict[str, Any]] = []
    for code1, code2 in itertools.combinations(codes, 2):
        errors: List[str] = []
        for handler in handlers:
            msg = handler.validate((code1, code2), modifier, claim)
            if msg and msg.startswith("❌"):
                errors.append(msg)
        result = ", ".join(errors) if errors else "✅ No pair rule errors found"
        results.append({
            "claim_id": claim.get("claim_id", ""),
            "code1": code1,
            "code2": code2,
            "modifier": modifier,
            "result": result
        })
    return results


def validate_single_rules(
    codes: List[str],
    modifier: Optional[str],
    claim: Dict[str, Any]
) -> List[Dict[str, Any]]:
    """Run single-code rules (e.g., duplication) for a claim."""
    handlers: List[ValidationRule] = [GlobalDuplicationRule()]
    errors: List[str] = []
    for handler in handlers:
        msg = handler.validate(None, modifier, claim)
        if msg and msg.startswith("❌"):
            errors.append(msg)
    result = ", ".join(errors) if errors else "✅ No single rule errors found"
    return [{
        "claim_id": claim.get("claim_id", ""),
        "modifier": modifier,
        "result": result
    }]


def validate_claim(claim: Dict[str, Any]) -> pd.DataFrame:
    """Validate a single claim dict and return a DataFrame of results."""
    codes = claim.get("codes", []) or []
    modifier = claim.get("modifier")
    rows = validate_pairwise(codes, modifier, claim) + \
           validate_single_rules(codes, modifier, claim)
    return pd.DataFrame(rows)


def validate_batch(claims: List[Dict[str, Any]]) -> pd.DataFrame:
    """Validate multiple claims and concatenate their result frames."""
    dfs = [validate_claim(c) for c in claims]
    return pd.concat(dfs, ignore_index=True)
