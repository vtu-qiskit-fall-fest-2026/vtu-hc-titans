import { useEffect, useState } from "react";
import { getExamples } from "../api";
import type { CircuitExample } from "../types";
import { RouteLink, SiteLayout, type AppRoute, type Navigate } from "../components/SiteLayout";

const experiments = [
  {
    id: "x-gate",
    title: "1. Single-qubit X gate",
    purpose: "See how a bit-flip gate changes |0⟩ to |1⟩.",
    steps: ["Load the example.", "Run the circuit.", "Compare the measured counts to the ideal output."],
    configuration: "One X gate on q0; measure q0 into c0.",
    theory: "The ideal measurement outcome is 1 with probability 100%.",
  },
  {
    id: "hadamard",
    title: "2. Hadamard and measurement",
    purpose: "Explore superposition and probabilistic measurement.",
    steps: ["Load the example.", "Run several shots.", "Notice the two outcomes and compare them with theory."],
    configuration: "One H gate on q0; measure q0 into c0.",
    theory: "The ideal probabilities for 0 and 1 are each 50%. Finite-shot counts can vary.",
  },
  {
    id: "bell-state",
    title: "3. Bell state: H + CNOT",
    purpose: "Create entanglement and observe correlated qubits.",
    steps: ["Load the example.", "Inspect H on q0 followed by CNOT q0 → q1.", "Measure both qubits."],
    configuration: "H(q0), CNOT(control q0, target q1), measure q0→c0 and q1→c1.",
    theory: "The ideal outcomes are 00 and 11, each with probability 50%; 01 and 10 have probability 0%.",
  },
  {
    id: "multi-qubit",
    title: "4. A simple multi-qubit circuit",
    purpose: "Follow how a sequence of gates affects several measured qubits.",
    steps: ["Load the example.", "Read the gate order in the configuration panel.", "Compare the outcome distribution with theory."],
    configuration: "A multi-qubit gate sequence and measurements as defined by the API example.",
    theory: "The API example lists its ideal expected behavior; shot counts are sampled and may differ.",
  },
] as const;

export function LearnPage({
  onNavigate,
  route,
}: {
  onNavigate: Navigate;
  route: AppRoute;
}) {
  const [examples, setExamples] = useState<CircuitExample[]>([]);
  const [examplesError, setExamplesError] = useState("");

  useEffect(() => {
    let active = true;
    getExamples().then(
      (items) => {
        if (active) setExamples(items);
      },
      (error: unknown) => {
        if (active) setExamplesError(error instanceof Error ? error.message : "Could not load examples.");
      },
    );
    return () => {
      active = false;
    };
  }, []);

  const exampleIds = new Set(examples.map(({ id }) => id));

  return (
    <SiteLayout onNavigate={onNavigate} route={route}>
      <main className="learn-page learn-content">
        <div className="eyebrow"><span /> LEARN AT YOUR OWN PACE</div>
        <h1>Quantum concepts,<br /><span>one gate at a time.</span></h1>
        <p className="learn-lede">A quantum circuit is a sequence of operations on qubits. Use these short notes and guided experiments to build an intuition for what the simulator measures.</p>

        <section aria-labelledby="concepts-title" className="concept-section">
          <div className="section-title-row"><span className="step-number">01</span><h2 id="concepts-title">Core concepts</h2></div>
          <div className="concept-grid">
            <article className="panel concept-card">
              <h3>Qubits and superposition</h3>
              <p>A qubit has basis states |0⟩ and |1⟩. Before measurement, its state can be a combination of both; the amplitudes determine the probabilities observed when measured.</p>
            </article>
            <article className="panel concept-card">
              <h3>Measurement and basis states</h3>
              <p>Measurement converts a quantum state into a classical result. In the computational basis, a measured qubit produces 0 or 1, with probabilities determined by its state.</p>
            </article>
            <article className="panel concept-card">
              <h3>Quantum gates</h3>
              <p>H creates an equal superposition from |0⟩. X swaps |0⟩ and |1⟩; Y and Z also change phase. S and T apply phase rotations. CNOT flips its target when its control is |1⟩.</p>
            </article>
            <article className="panel concept-card">
              <h3>Entanglement and Bell states</h3>
              <p>Entangled qubits share a joint state that cannot be described as independent single-qubit states. Applying H then CNOT to |00⟩ creates a Bell state with correlated measurement outcomes.</p>
            </article>
            <article className="panel concept-card">
              <h3>How a circuit is executed</h3>
              <p>The simulator starts with qubits in |0⟩, applies each gate in order, performs the requested measurements, and repeats the experiment for the selected number of shots.</p>
            </article>
            <article className="panel concept-card">
              <h3>Theory and finite shots</h3>
              <p>Theoretical probabilities describe the ideal circuit. A finite shot run samples those probabilities, so observed percentages can differ slightly and vary between runs.</p>
            </article>
          </div>
        </section>

        <section aria-labelledby="experiments-title" className="experiment-section">
          <div className="section-title-row"><span className="step-number">02</span><h2 id="experiments-title">Guided experiments</h2></div>
          {examplesError && <p aria-live="polite" className="learn-api-note">{examplesError} The learning notes remain available; loading a circuit requires the API example.</p>}
          <div className="experiment-grid">
            {experiments.map((experiment) => {
              const available = exampleIds.has(experiment.id);
              const example = examples.find(({ id }) => id === experiment.id);
              return (
                <article className="panel experiment-card" key={experiment.id}>
                  <div className="experiment-card-heading">
                    <span className="step-number">{experiment.id === "x-gate" ? "01" : experiment.id === "hadamard" ? "02" : experiment.id === "bell-state" ? "03" : "04"}</span>
                    <h3>{experiment.title.replace(/^\d+\.\s*/, "")}</h3>
                  </div>
                  <p className="experiment-purpose">{experiment.purpose}</p>
                  <h4>Steps</h4>
                  <ol>{experiment.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <div className="experiment-detail"><strong>Circuit</strong><span>{experiment.configuration}</span></div>
                  <div className="experiment-detail"><strong>Expected theory</strong><span>{example?.expected ?? experiment.theory}</span></div>
                  <RouteLink
                    className={`button ${available ? "button-primary" : "button-secondary"} experiment-load`}
                    onNavigate={onNavigate}
                    query={`?example=${encodeURIComponent(experiment.id)}`}
                    to="/builder"
                  >
                    Load in Builder <span aria-hidden="true">↗</span>
                  </RouteLink>
                  {!available && !examplesError && (
                    <small className="availability-note">
                      {examples.length ? "This example is not currently provided by the API." : "Waiting for the API example list."}
                    </small>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </SiteLayout>
  );
}
