# QubitLab architecture

## Request flow

```text
Browser (React + TypeScript)
    │  /api/* requests (same origin during Vite development)
    ▼
Vite development proxy
    │  forwards to http://127.0.0.1:5000 by default
    ▼
Flask API (/backend)
    │  validates circuit payload and invokes local simulation
    ▼
Qiskit Aer simulator
```

The frontend does not calculate substitute outcomes. It renders successful
API responses and exposes API/network errors to the user. In development, Vite
proxies `/api` to the Flask server. Set `VITE_API_PROXY_TARGET` in
`frontend/.env` to override that destination; see [`.env.example`](../frontend/.env.example).

## Frontend responsibilities

- `src/App.tsx` selects Home (`/`), Builder (`/builder`), and Learn (`/learn`)
  pages and handles browser history navigation.
- `src/components/BuilderPage.tsx` loads API limits/examples and manages circuit
  editing and simulation state.
- `src/components/CircuitEditor.tsx`, `CircuitGrid.tsx`, and `GatePalette.tsx`
  implement gate selection, cell placement, CNOT control/target selection,
  measurements, and circuit settings.
- `src/components/ResultsDashboard.tsx` and `BarChart.tsx` render idle/loading/
  error/success states, counts, probabilities, diagram, and metadata.
- `src/pages/LearnPage.tsx` describes quantum concepts and maps guided experiment
  cards to example IDs supplied by `GET /api/examples`.
- `src/api.ts` implements the HTTP contract and preserves API error messages and
  details.

## API contract used

- `GET /api/info`: supported gates, limits, defaults, and bit order.
- `GET /api/examples`: `{ examples: [{ id, title, description, expected, circuit }] }`.
- `POST /api/simulate`: accepts qubit/classical-bit counts, shots, optional seed,
  gates, and measurements; returns status, backend, counts, observed and
  theoretical probabilities, metadata, and an optional ASCII diagram.
- API errors use an `error` object. The frontend displays its message and any
  details rather than silently replacing them.

Grid column placement is editor-only metadata. Before submission the frontend
sorts gates by column and removes that metadata, sending only the API-supported
gate fields (`name`, `target`, and optional `control`).

## Limitations

The backend executes locally with Qiskit Aer. The application does not claim to
run jobs on IBM Quantum or other physical hardware. In production, deployment
must provide an API proxy/reverse proxy or configure the serving environment
so `/api` reaches the Flask API; the Vite proxy is a development-server feature.
