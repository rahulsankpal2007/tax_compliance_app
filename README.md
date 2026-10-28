# Indian Tax Compliance Verification (Flask Web App)

Propositional-logic model checker using Truth Table Enumeration (TT-Entails).
Backend: Python + Flask. Frontend: HTML + CSS + JavaScript.

## Folder structure
```
tax_compliance_app/
├── app.py              # Flask server + REST API
├── logic_engine.py     # Model-checking logic (TT-Entails)
├── requirements.txt
├── templates/
│   └── index.html      # Frontend page
└── static/
    ├── css/style.css
    └── js/script.js
```

## Run in VS Code
1. Open the `tax_compliance_app` folder in VS Code (File > Open Folder).
2. Open the terminal (Ctrl + `) and create a virtual environment:
   ```
   python -m venv venv
   venv\Scripts\activate        # Windows
   source venv/bin/activate     # macOS / Linux
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Start the server:
   ```
   python app.py
   ```
5. Open http://127.0.0.1:5000 in your browser.

## Default scenario (from the report)
Rules: ITR => TDS, TDS => REF. Fact: ITR = True. Query: REF.
Result: KB entails REF (True).

Try: untick Rule 2 -> entailment fails and a counterexample is shown.
