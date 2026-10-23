"""Build and simulate a first quantum circuit with Qiskit Aer."""

from dataclasses import dataclass

from qiskit import QuantumCircuit, transpile
from qiskit_aer import AerSimulator


@dataclass(frozen=True)
class SimulationResult:
    """Measurement results from a local circuit simulation."""

    shots: int
    counts: dict[str, int]
    probabilities: dict[str, float]


def create_bell_circuit() -> QuantumCircuit:
    """Create a two-qubit Bell circuit and measure both qubits."""
    circuit = QuantumCircuit(2, 2)
    circuit.h(0)
    circuit.cx(0, 1)
    circuit.measure([0, 1], [0, 1])
    return circuit


def simulate_bell_circuit(
    shots: int = 1024, seed: int | None = None
) -> SimulationResult:
    """Run the Bell circuit locally and return counts and observed probabilities."""
    if isinstance(shots, bool) or not isinstance(shots, int):
        raise TypeError("shots must be a positive integer.")
    if shots <= 0:
        raise ValueError("shots must be greater than zero.")

    circuit = create_bell_circuit()
    simulator = AerSimulator()
    compiled_circuit = transpile(circuit, simulator)
    result = simulator.run(
        compiled_circuit, shots=shots, seed_simulator=seed
    ).result()
    observed_counts = result.get_counts()
    counts = {
        format(state, "02b"): observed_counts.get(format(state, "02b"), 0)
        for state in range(4)
    }
    probabilities = {
        state: count / shots for state, count in counts.items()
    }
    return SimulationResult(
        shots=shots,
        counts=counts,
        probabilities=probabilities,
    )
