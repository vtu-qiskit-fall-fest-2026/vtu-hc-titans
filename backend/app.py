"""Flask API for building and simulating small Qiskit circuits locally."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from flask import Flask, jsonify, request
from qiskit import QuantumCircuit, transpile
from qiskit.exceptions import QiskitError
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
from qiskit_aer.aererror import AerError

app = Flask(__name__)

MAX_QUBITS = 8
MAX_GATES = 100
MAX_SHOTS = 8192
DEFAULT_SHOTS = 1024
MIN_SHOTS = 1

SUPPORTED_GATES = {
    "h": {"qubits": 1, "description": "Hadamard gate; creates superposition."},
    "x": {"qubits": 1, "description": "Pauli-X gate; flips the qubit."},
    "y": {"qubits": 1, "description": "Pauli-Y gate; flips the qubit and changes phase."},
    "z": {"qubits": 1, "description": "Pauli-Z gate; changes the phase of |1>."},
    "s": {"qubits": 1, "description": "S phase gate."},
    "t": {"qubits": 1, "description": "T phase gate."},
    "cx": {"qubits": 2, "description": "Controlled X (CNOT); flips target if control is 1."},
}


def _error(code: str, message: str, details: list[str], status: int = 400):
    return jsonify({"error": {"code": code, "message": message, "details": details}}), status


def _integer(value: Any, name: str, minimum: int, maximum: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be an integer.")
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}.")
    return value


def _examples() -> list[dict[str, Any]]:
    def payload(qubits, gates, shots=DEFAULT_SHOTS):
        return {
            "num_qubits": qubits,
            "num_clbits": qubits,
            "shots": shots,
            "gates": gates,
            "measurements": [{"qubit": i, "clbit": i} for i in range(qubits)],
        }

    return [
        {
            "id": "x-gate",
            "title": "Single-qubit X gate",
            "description": "Flip a qubit from |0> to |1> using X.",
            "expected": "The measured outcome is always 1.",
            "circuit": payload(1, [{"name": "x", "target": 0}]),
        },
        {
            "id": "hadamard",
            "title": "Hadamard and measurement",
            "description": "Put one qubit into an equal superposition.",
            "expected": "Outcomes 0 and 1 each have theoretical probability 50%.",
            "circuit": payload(1, [{"name": "h", "target": 0}]),
        },
        {
            "id": "bell-state",
            "title": "Bell state",
            "description": "Entangle two qubits using H followed by CNOT.",
            "expected": "Only 00 and 11 occur, with theoretical probability 50% each.",
            "circuit": payload(
                2,
                [{"name": "h", "target": 0}, {"name": "cx", "control": 0, "target": 1}],
            ),
        },
        {
            "id": "multi-qubit",
            "title": "Simple multi-qubit circuit",
            "description": "Explore a three-qubit circuit with a controlled operation.",
            "expected": "The first qubit is in superposition; the other two are correlated with it.",
            "circuit": payload(
                3,
                [
                    {"name": "h", "target": 0},
                    {"name": "cx", "control": 0, "target": 1},
                    {"name": "cx", "control": 1, "target": 2},
                ],
            ),
        },
    ]


def _parse_circuit(data: Any) -> tuple[QuantumCircuit, int, int, int]:
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    qubits = _integer(data.get("num_qubits"), "num_qubits", 1, MAX_QUBITS)
    clbits = _integer(data.get("num_clbits"), "num_clbits", 1, MAX_QUBITS)
    shots = _integer(data.get("shots", DEFAULT_SHOTS), "shots", MIN_SHOTS, MAX_SHOTS)
    seed = data.get("seed")
    if seed is not None:
        _integer(seed, "seed", 0, 2**32 - 1)

    gates = data.get("gates")
    measurements = data.get("measurements")
    if not isinstance(gates, list):
        raise ValueError("gates must be a list.")
    if len(gates) > MAX_GATES:
        raise ValueError(f"gates cannot contain more than {MAX_GATES} operations.")
    if not isinstance(measurements, list) or not measurements:
        raise ValueError("measurements must be a non-empty list.")

    circuit = QuantumCircuit(qubits, clbits)
    for index, gate in enumerate(gates):
        if not isinstance(gate, dict):
            raise ValueError(f"gates[{index}] must be an object.")
        name = gate.get("name")
        if not isinstance(name, str):
            raise ValueError(f"gates[{index}].name must be a string.")
        name = name.lower()
        if name == "cnot":
            name = "cx"
        if name not in SUPPORTED_GATES:
            raise ValueError(f"Unsupported gate '{name}' at gates[{index}].")
        target = _integer(gate.get("target"), f"gates[{index}].target", 0, qubits - 1)
        if name == "cx":
            control = _integer(gate.get("control"), f"gates[{index}].control", 0, qubits - 1)
            if control == target:
                raise ValueError(f"gates[{index}] control and target must differ.")
            circuit.cx(control, target)
        else:
            getattr(circuit, name)(target)

    seen_qubits: set[int] = set()
    seen_clbits: set[int] = set()
    mapping: list[tuple[int, int]] = []
    for index, measurement in enumerate(measurements):
        if not isinstance(measurement, dict):
            raise ValueError(f"measurements[{index}] must be an object.")
        qubit = _integer(measurement.get("qubit"), f"measurements[{index}].qubit", 0, qubits - 1)
        clbit = _integer(measurement.get("clbit"), f"measurements[{index}].clbit", 0, clbits - 1)
        if qubit in seen_qubits or clbit in seen_clbits:
            raise ValueError("Each qubit and classical bit may be measured at most once.")
        seen_qubits.add(qubit)
        seen_clbits.add(clbit)
        mapping.append((qubit, clbit))

    for qubit, clbit in mapping:
        circuit.measure(qubit, clbit)
    return circuit, shots, seed, clbits


@app.get("/api/info")
def api_info():
    return jsonify(
        {
            "supported_gates": SUPPORTED_GATES,
            "limits": {
                "max_qubits": MAX_QUBITS,
                "max_clbits": MAX_QUBITS,
                "max_gates": MAX_GATES,
                "min_shots": MIN_SHOTS,
                "max_shots": MAX_SHOTS,
                "default_shots": DEFAULT_SHOTS,
            },
            "bit_order": "The rightmost bit is classical bit 0.",
        }
    )


@app.get("/api/examples")
def api_examples():
    return jsonify({"examples": _examples()})


@app.post("/api/simulate")
def api_simulate():
    data = request.get_json(silent=True)
    try:
        circuit, shots, seed, clbits = _parse_circuit(data)
    except ValueError as exc:
        return _error("invalid_request", "Invalid circuit request.", [str(exc)])

    try:
        simulator = AerSimulator()
        compiled = transpile(circuit, simulator)
        result = simulator.run(compiled, shots=shots, seed_simulator=seed).result()
        raw_counts = result.get_counts()

        counts: dict[str, int] = defaultdict(int)
        for outcome, count in raw_counts.items():
            key = outcome.replace(" ", "").zfill(clbits)
            counts[key] += count

        states = [format(state, f"0{clbits}b") for state in range(2**clbits)]
        complete_counts = {state: counts.get(state, 0) for state in states}
        probabilities = {
            state: count / shots for state, count in complete_counts.items()
        }

        unmeasured = circuit.remove_final_measurements(inplace=False)
        statevector = Statevector.from_instruction(unmeasured)
        theoretical: dict[str, float] = defaultdict(float)
        measured_mapping = []
        for item in request.get_json()["measurements"]:
            measured_mapping.append((item["qubit"], item["clbit"]))
        for basis_index, probability in enumerate(statevector.probabilities()):
            classical_index = 0
            for qubit, clbit in measured_mapping:
                if (basis_index >> qubit) & 1:
                    classical_index |= 1 << clbit
            outcome = format(classical_index, f"0{clbits}b")
            theoretical[outcome] += float(probability)
        theoretical_probabilities = {
            state: theoretical.get(state, 0.0) for state in states
        }

        return jsonify(
            {
                "status": "success",
                "backend": "Qiskit AerSimulator (local)",
                "shots": shots,
                "counts": complete_counts,
                "probabilities": probabilities,
                "theoretical_probabilities": theoretical_probabilities,
                "metadata": {
                    "num_qubits": circuit.num_qubits,
                    "num_clbits": clbits,
                    "seed": seed,
                },
                "diagram": str(circuit.draw(output="text")),
            }
        )
    except (AerError, QiskitError, RuntimeError, ValueError) as exc:
        app.logger.exception("Circuit simulation failed")
        return _error(
            "simulation_failed",
            "The circuit could not be simulated.",
            [str(exc)],
            status=500,
        )


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
