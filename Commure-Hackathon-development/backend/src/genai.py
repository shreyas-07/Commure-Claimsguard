from groq import Groq

import os

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
print("Groq API Key:", GROQ_API_KEY)


def summarize_claim(claim: dict) -> str:
    violations = [
        r for r in claim["results"]
        if r["result"].strip().startswith("❌")
    ]
    if not violations:
        return "No billing violations detected."

    bullet_list = "\n".join(
        f"- {v['code1']} + {v['code2']} and modifier {v['modifier']}: {v['result']}" if v['code1'] is not None else v['result']
        for v in violations
    )

    prompt = (
        f"You are an expert in medical billing compliance.\n"
        f"Below are the billing rule violations for claim {claim['claim_id']}. "
        f"Each violation line indicates the modifier used and whether it is allowed or not.\n\n"
        f"{bullet_list}\n\n"
        "Provide a concise, factual summary of these violations, explicitly stating "
        "which modifiers are allowed and which are not for each violation, skip this line if no modifiers are specified in the information"
        "Do not introduce any information not present here."
    )

    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    return resp.choices[0].message.content
