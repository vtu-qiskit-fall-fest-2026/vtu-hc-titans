# Testing and verification

## Frontend

From the repository root:

```bash
cd frontend
npm install
npm run build
npm audit
```

The build type-checks the TypeScript project and produces the Vite production
bundle. Run the dev server with the Flask API available to check live integration:

```bash
npm run dev
```

The Vite proxy forwards `/api` to `http://127.0.0.1:5000` unless
`VITE_API_PROXY_TARGET` overrides it.

## Backend

Run backend tests from the backend directory:

```bash
cd backend
python -m pytest -v
```

Start the Flask API for integration checks in a separate terminal:

```bash
cd backend
python app.py
```

The API health/config and example endpoints can be checked at
`http://127.0.0.1:5000/api/info` and `/api/examples`. From the frontend, submit
circuits through Builder and inspect returned counts, probabilities, diagram,
and metadata.

## Useful circuit checks

With both services running, compare returned results against expected ideal
behavior (finite shots cause sampling variation):

- H on q0 and measure q0: outcomes 0 and 1 should each be near 50%.
- Bell state H(q0), CNOT(q0, q1), measure both: only 00 and 11 should occur,
  near 50% each.
- X on q0 in a two-qubit circuit with q0→c0 and q1→c1: the measured string
  should be 01 with probability 100% under the documented bit ordering.

These are validation expectations, not hard-coded frontend results.
