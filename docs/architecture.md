# QubitLab architecture

## Components and data flow

```text
Browser
  React + TypeScript circuit builder
      │ GET /api/info, GET /api/examples, POST /api/simulate
      ▼
  Vite development proxy (/api → http://127.0.0.1:5000)
      ▼
  Flask API (/backend)
      │ validate request and construct Qiskit circuit
      ▼
  Qiskit Aer local simulator
      │ counts, probabilities, diagram, metadata
      └──────────────────────────────→ Flask → frontend results view
```

The frontend requests API limits and supported gates from `GET /api/info`, then
uses them to constrain Builder controls. It obtains guided circuits from
`GET /api/examples`. The Builder submits `num_qubits`, `num_clbits`, `shots`,
optional `seed`, ordered `gates`, and `measurements` to `POST /api/simulate`.
The API response provides observed counts/probabilities, theoretical
probabilities, metadata, and a diagram for display.

Grid column positions are local editor metadata. Before submission, the
frontend orders gates by column and sends only API gate properties:
`name`, `target`, and optional `control`.

## Validation

### Frontend validation

- Qubit and shot controls are constrained by values returned by `/api/info`.
- Shot counts and optional seed are checked for valid integer values before
  submission.
- Measurement checkboxes map qubit `i` to classical bit `i`.
- CNOT placement requires two distinct, empty qubit cells in the same column.
- The frontend reports network failures, API error messages, and supplied error
  details; it does not synthesize simulation results.

### API/backend validation

The Flask API is the authority for request validation and the hard limits:
maximum 8 qubits, 8192 shots, and 100 gates. It must reject unsupported gate
names, invalid qubit/control/target indexes, invalid measurement mappings, and
requests exceeding its circuit/shot limits before simulation. Mid-circuit
measurement is not supported. The backend source was not present in the
checkout used to write these docs, so these validation behaviors have not been
independently inspected here.

## Deployment boundary

Vite's proxy is for development. A production deployment needs a reverse proxy
or equivalent server configuration forwarding `/api` to Flask. QubitLab uses
Qiskit Aer locally; it does not connect to IBM Quantum hardware.
