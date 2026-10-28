"""
app.py  -  Flask backend for the Indian Tax Compliance Verification system.
Run:  python app.py   then open  http://127.0.0.1:5000
"""
from flask import Flask, jsonify, render_template, request

from logic_engine import DEFAULT_FACTS, DEFAULT_RULES, SYMBOLS, tt_entails

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/defaults")
def defaults():
    """Initial knowledge base taken from the project report."""
    return jsonify({"symbols": SYMBOLS, "rules": DEFAULT_RULES,
                    "facts": DEFAULT_FACTS, "query": "REF"})


@app.route("/api/verify", methods=["POST"])
def verify():
    data = request.get_json(silent=True) or {}
    rules = data.get("rules", [])
    facts = data.get("facts", {})
    query = data.get("query", "REF")

    # ---- validate input ----
    for r in rules:
        if r.get("if") not in SYMBOLS or r.get("then") not in SYMBOLS or "id" not in r:
            return jsonify({"error": "Invalid rule format"}), 400
    if query not in SYMBOLS:
        return jsonify({"error": "Invalid query symbol"}), 400
    facts = {s: facts.get(s) for s in SYMBOLS if isinstance(facts.get(s), bool)}

    result = tt_entails(rules, facts, query)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
