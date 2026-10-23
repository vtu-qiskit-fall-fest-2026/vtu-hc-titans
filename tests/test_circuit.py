"""Tests for QubitLab's first quantum circuit and simulator."""

import pytest

from src.circuit import create_bell_circuit, simulate_bell_circuit


def test_bell_circuit_has_expected_gates_and_measurements() -> None:
    circuit = create_bell_circuit()

    assert circuit.num_qubits == 2
    assert circuit.num_clbits == 2
    assert circuit.count_ops() == {"h": 1, "cx": 1, "measure": 2}


def test_simulation_returns_bell_counts_and_probabilities() -> None:
    simulation = simulate_bell_circuit(shots=128, seed=7)

    assert simulation.shots == 128
    assert sum(simulation.counts.values()) == 128
    assert set(simulation.counts) == {"00", "01", "10", "11"}
    assert simulation.counts["01"] == 0
    assert simulation.counts["10"] == 0
    assert sum(simulation.probabilities.values()) == pytest.approx(1.0)
    assert simulation.probabilities["01"] == 0.0
    assert simulation.probabilities["10"] == 0.0


@pytest.mark.parametrize("shots", [0, -1])
def test_simulation_rejects_non_positive_shot_counts(shots: int) -> None:
    with pytest.raises(ValueError, match="greater than zero"):
        simulate_bell_circuit(shots=shots)
