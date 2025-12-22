#!/usr/bin/env python3
"""
Generate test data fixtures for development.
Run: python scripts/generate-test-data.py
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path

STATES = ["MI", "FL", "TX", "CA", "NY", "OH", "PA", "IL", "GA", "NC"]
STATUSES = ["pending", "approved", "denied", "in_review"]

def generate_source_records(count: int = 50) -> list[dict]:
    """Generate sample lending application records."""
    records = []

    for i in range(count):
        records.append({
            "id": i + 1,
            "external_id": f"P1L-{i + 1:06d}",
            "applicant_name": f"Test Applicant {i + 1}",
            "loan_amount": random.randint(100000, 500000),
            "property_state": random.choice(STATES),
            "status": random.choice(STATUSES),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 90))).isoformat() + "Z"
        })

    return records

def generate_enrichment_results(source_records: list[dict]) -> list[dict]:
    """Generate sample enrichment results."""
    results = []

    for record in source_records:
        credit_score = random.randint(580, 820)
        dti = round(random.uniform(0.2, 0.5), 2)
        property_value = int(record["loan_amount"] * random.uniform(1.05, 1.3))
        ltv = round(record["loan_amount"] / property_value, 3)

        if credit_score >= 720 and dti <= 0.35 and ltv <= 0.8:
            risk = "low"
        elif credit_score < 650 or dti > 0.43 or ltv > 0.95:
            risk = "high"
        else:
            risk = "medium"

        results.append({
            "source_id": record["id"],
            "credit_score": credit_score,
            "dti_ratio": dti,
            "property_value": property_value,
            "ltv_ratio": ltv,
            "risk_category": risk,
            "enriched_at": datetime.now().isoformat() + "Z"
        })

    return results

def main():
    output_dir = Path("tests/fixtures")
    output_dir.mkdir(parents=True, exist_ok=True)

    source_data = generate_source_records(50)
    with open(output_dir / "source_data.json", "w") as f:
        json.dump(source_data, f, indent=2)
    print(f"Generated {len(source_data)} source records")

    enrichment_data = generate_enrichment_results(source_data)
    with open(output_dir / "enrichment_results.json", "w") as f:
        json.dump(enrichment_data, f, indent=2)
    print(f"Generated {len(enrichment_data)} enrichment results")

if __name__ == "__main__":
    main()
