import type { SimulationPayload, SimulationResponse } from "../types";
import { BarChart } from "./BarChart";

export type ResultState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string; details: string[] }
  | { status: "success"; data: SimulationResponse };

function asciiDiagram(circuit: SimulationPayload): string {
  return Array.from({ length: circuit.num_qubits }, (_, qubit) => {
    const operations = circuit.gates
      .slice()
      .sort((left, right) => (left.column ?? 0) - (right.column ?? 0))
      .map((gate) => {
      if (gate.name.toLowerCase() === "cx") {
        if (gate.control === qubit) return "●";
        if (gate.target === qubit) return "⊕";
      }
      return gate.target === qubit ? gate.name.toUpperCase() : "──";
    });
    const measured = circuit.measurements.some((measurement) => measurement.qubit === qubit) ? "M" : "";
    return `q${qubit}: |0> ${operations.length ? operations.join("──") : "──"}${measured ? `──${measured}` : ""}`;
  }).join("\n");
}

export function ResultsDashboard({
  circuit,
  result,
}: {
  circuit: SimulationPayload;
  result: ResultState;
}) {
  if (result.status === "loading") {
    return <section aria-live="polite" className="panel results-panel result-loading" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <strong>Running your circuit…</strong>
      <p>Waiting for the simulator response.</p>
    </section>;
  }
  if (result.status === "error") {
    return <section aria-live="assertive" className="panel results-panel result-error-panel" role="alert">
      <h2>Simulation failed</h2>
      <p className="result-error-message">{result.message}</p>
      <h3>Error details</h3>
      <ul>{result.details.map((detail, index) => <li key={`${index}-${detail}`}>{detail}</li>)}</ul>
    </section>;
  }
  if (result.status === "idle") {
    return <section aria-live="polite" className="panel results-panel result-empty">
      <div className="result-placeholder-icon" aria-hidden="true"><span /><span /><span /></div>
      <h2>Results appear here</h2>
      <p>Place measurements on qubits, then run the circuit to see the simulator results.</p>
    </section>;
  }

  const data = result.data;
  const outcomes = Object.keys(data.counts).sort((left, right) => left.localeCompare(right));
  const metadata = Object.entries(data.metadata);
  return (
    <section aria-live="polite" className="panel results-panel success-results">
      <div className="panel-heading">
        <div><span className="step-number">03</span><h2>Results</h2></div>
        <span className="result-backend">{data.backend}</span>
      </div>
      <div className="result-summary">
        <div><strong>{data.shots.toLocaleString()}</strong><span>shots</span></div>
        <div><strong>{data.metadata.num_qubits}</strong><span>qubits</span></div>
        <div><strong>{outcomes.length}</strong><span>outcomes</span></div>
      </div>
      <div className="results-subheading"><h3>Measurement counts</h3></div>
      <div className="counts-table-wrap">
        <table className="counts-table">
          <thead><tr><th scope="col">Outcome</th><th scope="col">Count</th><th scope="col">Measured %</th><th scope="col">Theoretical %</th></tr></thead>
          <tbody>
            {outcomes.map((outcome) => (
              <tr key={outcome}>
                <th scope="row"><code>{outcome}</code></th>
                <td>{data.counts[outcome].toLocaleString()}</td>
                <td>{((data.probabilities[outcome] ?? 0) * 100).toFixed(1)}%</td>
                <td>{((data.theoretical_probabilities[outcome] ?? 0) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3 className="result-section-title">Outcome probabilities</h3>
      <BarChart result={data} />
      <h3 className="result-section-title">Circuit diagram (ASCII)</h3>
      <pre aria-label="ASCII circuit diagram" className="ascii-diagram">{data.diagram ?? asciiDiagram(circuit)}</pre>
      <h3 className="result-section-title">Simulation metadata</h3>
      <dl className="metadata-list">
        {metadata.map(([key, value]) => (
          <div key={key}><dt>{key.replace(/_/g, " ")}</dt><dd>{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd></div>
        ))}
      </dl>
      <div className="result-explanation">
        <span className="sparkle" aria-hidden="true">✳</span>
        <p>The rightmost bit is classical bit 0. With a finite number of shots, measured percentages can differ slightly from theoretical probabilities.</p>
      </div>
    </section>
  );
}
