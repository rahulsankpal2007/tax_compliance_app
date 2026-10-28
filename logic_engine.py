"""
logic_engine.py
Propositional-logic model checker (Truth Table Enumeration / TT-Entails)
for Indian Tax Compliance Verification.

Propositions
    ITR : taxpayer has filed an Income Tax Return
    TDS : tax has been deducted at source
    REF : a tax refund is generated
"""
import itertools

SYMBOLS = ["ITR", "TDS", "REF"]

# Knowledge-base rules from the report (A => B  ==  not A or B)
DEFAULT_RULES = [
    {"id": "rule1", "if": "ITR", "then": "TDS",
     "text": "Filing an ITR implies tax was deducted at source"},
    {"id": "rule2", "if": "TDS", "then": "REF",
     "text": "Tax deducted at source (excess credit) implies a refund"},
]

# Ground facts: True / False / None (None = unknown / not asserted)
DEFAULT_FACTS = {"ITR": True, "TDS": None, "REF": None}


def implies(a, b):
    """A => B is equivalent to (not A) or B."""
    return (not a) or b


def evaluate_rules(model, rules):
    """Return {rule_id: bool} for one model (row of the truth table)."""
    return {r["id"]: implies(model[r["if"]], model[r["then"]]) for r in rules}


def evaluate_kb(model, rules, facts):
    """KB is true only if every active rule AND every ground fact holds."""
    rules_ok = all(evaluate_rules(model, rules).values())
    facts_ok = all(model[s] == v for s, v in facts.items() if v is not None)
    return rules_ok and facts_ok


def tt_entails(rules, facts, query, symbols=SYMBOLS):
    """
    Model checking by truth-table enumeration (2^n rows).
    Returns a dict with the verdict, counterexample and the full table.
    """
    if query not in symbols:
        raise ValueError(f"Unknown query symbol: {query}")

    rows, counterexample, kb_true_count = [], None, 0

    for combo in itertools.product([True, False], repeat=len(symbols)):
        model = dict(zip(symbols, combo))
        rule_results = evaluate_rules(model, rules)
        kb = evaluate_kb(model, rules, facts)
        q = model[query]

        if kb:
            kb_true_count += 1
            if not q and counterexample is None:
                counterexample = dict(model)

        rows.append({
            "model": model,
            "rules": rule_results,
            "kb": kb,
            "query": q,
            # A "bad" row: KB holds but the query fails -> breaks entailment
            "counterexample": bool(kb and not q),
        })

    return {
        "entails": counterexample is None,
        "inconsistent": kb_true_count == 0,   # KB has no model at all
        "kb_true_count": kb_true_count,
        "total_rows": len(rows),
        "counterexample": counterexample,
        "rows": rows,
        "symbols": list(symbols),
    }
