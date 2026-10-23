# QubitLab

**Team:** VTU HC Titans
**Team ID:** VTU-QFF-HC-0065
**Demo link:** TODO

## Team members

| Name | Role |
| --- | --- |
| TODO | TODO |
| TODO | TODO |
| TODO | TODO |

## Problem statement

**Quantum Cloud Platform for Accessible Quantum Circuit Simulation and Execution**

Beginners need an approachable way to construct quantum circuits, run
simulations, and interpret measurement outcomes without requiring immediate
access to quantum hardware.

## Solution

QubitLab is a beginner-friendly circuit playground. The React frontend lets
users choose qubits and shots, place gates, select measurements, load guided
examples, and compare observed measurement counts with theoretical
probabilities. A Flask API validates requests and runs circuits locally using
Qiskit Aer. The Learn page introduces quantum concepts and provides four
guided experiments.

The app reports API failures instead of fabricating a result. It does not
submit work to physical quantum hardware.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| API | Python, Flask |
| Circuit SDK | Qiskit |
| Local simulator | Qiskit Aer |
| Testing | pytest, TypeScript compiler, Vite production build |

## Architecture

```text
React + Vite frontend  →  Flask API  →  Qiskit Aer local simulator
       /frontend             /backend          local execution
```

The browser calls the API through `/api`. Vite proxies those requests to
`http://127.0.0.1:5000` during development. The API validates circuit settings
and gate/measurement inputs before running the local simulator. See
[docs/architecture.md](docs/architecture.md).

## Supported gates

The Builder uses the gate set advertised by `GET /api/info`:

| Gate | Beginner description |
| --- | --- |
| H | Hadamard; creates superposition from a basis state |
| X | Pauli-X; flips 0 and 1 |
| Y | Pauli-Y; flips and changes phase |
| Z | Pauli-Z; changes phase |
| S | S phase gate |
| T | T phase gate |
| CNOT / CX | Controlled X; flips the target when its control is 1 |

## API endpoints

The frontend depends on these configuration, example, and simulation endpoints.
`GET /api/health` is the documented readiness probe; its availability should
be confirmed against the backend deployment before relying on it.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Optional service readiness probe |
| `GET` | `/api/info` | Supported gates, limits, defaults, and bit order |
| `GET` | `/api/examples` | Example circuits, descriptions, and expected behavior |
| `POST` | `/api/simulate` | Validate and simulate a circuit |

Example Bell circuit request:

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

Example success response shape (counts are illustrative, not a live result):

```json
{
  "status": "success",
  "backend": "AerSimulator",
  "shots": 1024,
  "counts": { "00": 510, "11": 514 },
  "probabilities": { "00": 0.498, "11": 0.502 },
  "theoretical_probabilities": { "00": 0.5, "11": 0.5 },
  "metadata": { "num_qubits": 2, "num_clbits": 2 },
  "diagram": "q0: |0> --H--●--M\nq1: |0> ------⊕--M"
}
```

Errors are returned in an `error` object and can include a code, message, and
details. The frontend displays the message and supplied details.

## Limits and honest limitations

- Maximum **8 qubits**, **8192 shots**, and **100 gates**.
- Mid-circuit measurement is not supported; measurements are applied at the
  end of a circuit.
- Simulation runs locally with Qiskit Aer through the Flask API. It is not a
  cloud quantum execution service.
- No real IBM Quantum hardware is used. IBM Quantum is mentioned only in the
  event context, not as a hardware integration claim.
- Finite-shot observed frequencies can differ slightly from ideal theoretical
  probabilities.
- A running backend is required. The frontend does not create fallback or
  fake results if the API is unreachable.

## Setup and run

Requirements: Python with the backend dependencies installed, and Node.js/npm.
Run backend and frontend in separate terminals.

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

Open the Vite URL, normally `http://localhost:5173`.

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

Open the Vite URL, normally `http://localhost:5173`.

For local environment configuration, copy `.env.example` to `.env` in the
repository root. To change the Vite API proxy destination, copy
`frontend/.env.example` to `frontend/.env` and change
`VITE_API_PROXY_TARGET`.

## Tests

Backend:

```bash
cd backend
python -m pytest -v
```

Frontend production build:

```bash
cd frontend
npm install
npm run build
```

See [docs/testing.md](docs/testing.md) for test scope and known verification
limitations. See [docs/screenshots/README.md](docs/screenshots/README.md) for
the requested demo screenshots.

## License

See [LICENSE](LICENSE).
