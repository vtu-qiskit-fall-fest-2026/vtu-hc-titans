"""Run QubitLab's first local quantum circuit simulation."""

from src.circuit import create_bell_circuit, simulate_bell_circuit


def main() -> None:
    """Print the Bell circuit description and its measurement results."""
    circuit = create_bell_circuit()
    simulation = simulate_bell_circuit()

    print("Bell circuit: H on qubit 0, CNOT from qubit 0 to qubit 1.")
    print(f"Measurements: {circuit.num_clbits} classical bits")
    print(f"Local Aer simulation ({simulation.shots} shots)")
    print("Counts:")
    for state, count in simulation.counts.items():
        print(f"  {state}: {count}")
    print("Observed probabilities:")
    for state, probability in simulation.probabilities.items():
        print(f"  {state}: {probability:.3f}")
    print("The Bell circuit should produce matching bit values (00 or 11).")


if __name__ == "__main__":
    main()
