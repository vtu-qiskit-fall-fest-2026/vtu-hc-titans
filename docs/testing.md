# Testing and verification

## Commands

Run frontend dependency installation and production build:

```bash
cd frontend
npm install
npm run build
```

Run backend tests and start the API in separate terminals:

```bash
cd backend
python -m pytest -v
```

```bash
cd backend
python app.py
```

With Flask running on `127.0.0.1:5000`, verify the API itself rather than
calling Aer directly:

```bash
curl http://127.0.0.1:5000/api/info
curl http://127.0.0.1:5000/api/examples
```

Submit the Bell request in [README.md](../README.md) to
`POST /api/simulate`. Check that only `00` and `11` occur in the returned
counts. For the frontend integration path, run `npm run dev`, load the Bell
example in Builder, run it, and inspect the returned counts, chart, diagram,
metadata, and error states.

## Verification record for this checkout

- Frontend: `npm run build` passed on 2026-10-23 using Vite 8.3.5 and TypeScript.
- Dependencies: `npm audit` reported zero vulnerabilities on 2026-10-23.
- Direct local Aer checks (not API checks), 4096 shots with seed 1234:
  - H on q0: `0: 2045`, `1: 2051`.
  - Bell circuit: `00: 2074`, `11: 2022`; no other outcomes.
  - X on q0 with two measured qubits: `01: 4096`.
- Backend pytest: not run successfully; the checkout had no `backend/` directory
  or `backend/app.py`.
- Live Flask API checks: not completed; `127.0.0.1:5000` refused connections
  because the backend was unavailable. Therefore the Bell outcome through the
  API and frontend-to-API integration remain unverified.

Direct Aer results establish simulator behavior only. They are not evidence
that the Flask API is running or returning the same response.
