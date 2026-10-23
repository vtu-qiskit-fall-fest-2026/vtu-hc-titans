# QubitLab

**Team:** VTU HC Titans

**Team ID:** VTU-QFF-HC-0065
**Problem statement:** Quantum Cloud Platform for Accessible Quantum Circuit Simulation and Execution

QubitLab is a beginner-friendly playground for building quantum circuits and
understanding their simulated measurement results. Users choose qubits, place
gates, map measurements to classical bits, select a shot count, and compare
observed counts with ideal probabilities.

## What it does

- Provides Home, Builder, and Learn pages.
- Includes short quantum concept notes and four guided circuit experiments on
  the Learn page; experiment circuits are loaded from matching API example IDs.
- Builds circuits with H, X, Y, Z, S, T, and CNOT gates using a click-to-place
  grid, with an eraser and two-click CNOT control/target placement.
- Loads circuits and explanations from the API examples endpoint.
- Sends simulation requests to the Flask API and displays counts,
  probabilities, a circuit diagram, and simulator metadata.
- Shows API/network failures rather than inventing results.
- Uses the simulator limits reported by the API to configure qubit and shot
  controls.

## Architecture

```text
React + Vite frontend  ->  Flask API  ->  Qiskit Aer local simulator
       /frontend             /backend          local execution
```

The Vite development server proxies `/api` requests to
`http://127.0.0.1:5000` by default. To override the proxy, copy
`frontend/.env.example` to `frontend/.env` and edit `VITE_API_PROXY_TARGET`.

## Supported gates

The builder presents the supported gates returned by `GET /api/info`:

| Gate | Description |
| --- | --- |
| H | Hadamard: changes basis and can create superposition |
| X | Pauli-X bit flip |
| Y | Pauli-Y bit and phase rotation |
| Z | Pauli-Z phase flip |
| S | S phase gate |
| T | T phase gate |
| CNOT / CX | Controlled X: flips the target when the control is 1 |

Actual gate availability and simulation limits are supplied by the running API.

## API

All endpoints are served by the Flask API and accessed from the frontend
through the Vite `/api` proxy.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/info` | Supported gates, qubit/bit/gate limits, shot limits/default, and bit order |
| `GET` | `/api/examples` | Named example circuits with descriptions and expected behavior |
| `POST` | `/api/simulate` | Run a circuit and return counts, measured/theoretical probabilities, metadata, and a diagram |

Example simulation request:

```json
{
  "num_qubits": 2,
  "num_clbits": 2,
  "shots": 1024,
  "gates": [
    { "name": "h", "target": 0 },
    { "name": "cx", "control": 0, "target": 1 }
  ],
  "measurements": [
    { "qubit": 0, "clbit": 0 },
    { "qubit": 1, "clbit": 1 }
  ]
}
```

Example successful response shape (counts and probabilities depend on the
circuit, shots, and optional seed):

```json
{
  "status": "success",
  "backend": "AerSimulator",
  "shots": 1024,
  "counts": { "00": 510, "11": 514 },
  "probabilities": { "00": 0.498, "11": 0.502 },
  "theoretical_probabilities": { "00": 0.5, "11": 0.5 },
  "metadata": { "num_qubits": 2, "num_clbits": 2 },
  "diagram": "q0: |0> --H--●--M\\nq1: |0> ------⊕--M"
}
```

The counts above illustrate the response format only; they are not a live or
promised simulation result. API errors use an `error` object with a message and may include a code and
details. The UI shows the message and each supplied detail.

## Setup and run

Requirements: Python and Node.js/npm. Run the backend and frontend in separate
terminals.

### Windows (PowerShell)

Terminal 1 — backend:

```powershell
cd backend
python app.py
```

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.
For an optional proxy override, copy `.env.example` to `.env` in `frontend`
before starting Vite.

### macOS / Linux

Terminal 1 — backend:

```bash
cd backend
python app.py
```

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173`.
For an optional proxy override, copy `.env.example` to `.env` in `frontend`
before starting Vite.

## Tests and build

See [docs/architecture.md](docs/architecture.md) for component and API
architecture and [docs/testing.md](docs/testing.md) for verification guidance.

Backend tests:

```bash
cd backend
python -m pytest -v
```

Frontend production build:

```bash
cd frontend
npm run build
```

## Limits and honest limitations

- The API is authoritative for maximum qubits, classical bits, gates, and shot
  ranges. The frontend reads these values from `/api/info`; it does not promise
  a limit independently of that response.
- Simulations run on the local Qiskit Aer simulator through the Flask API.
- QubitLab does not currently submit jobs to IBM Quantum or other real quantum
  hardware. The IBM Quantum name in the event/team footer is not a claim of a
  hardware connection.
- Measurement results are finite-shot samples. They can differ from ideal
  theoretical probabilities, especially at low shot counts.
- The frontend requires the Flask API to be running; it displays a connection
  error if the API cannot be reached and does not provide fallback results.

## License

See [LICENSE](LICENSE).
