import type { ChangeEvent } from "react";
import type { ApiInfo, SimulationPayload } from "../types";
import { CircuitGrid } from "./CircuitGrid";
import { GatePalette, type GateTool } from "./GatePalette";

interface CircuitEditorProps {
  circuit: SimulationPayload;
  columnCount: number;
  editorNotice: string;
  info: ApiInfo | null;
  isRunning: boolean;
  maxGateColumn: number;
  onAddColumn: () => void;
  onCellClick: (qubit: number, column: number) => void;
  onClearCircuit: () => void;
  onClassicalBitsChange: (count: number) => void;
  onQubitCountChange: (count: number) => void;
  onResetCircuit: () => void;
  onRunSimulation: () => void;
  onSeedChange: (seed: string) => void;
  onShotsChange: (shots: number) => void;
  onToggleMeasurement: (qubit: number, checked: boolean) => void;
  onToolSelect: (tool: GateTool) => void;
  pendingControl: { qubit: number; column: number } | null;
  seed: string;
  selectedTool: GateTool;
  supportedGateNames: string[];
}

export function CircuitEditor({
  circuit,
  columnCount,
  editorNotice,
  info,
  isRunning,
  maxGateColumn,
  onAddColumn,
  onCellClick,
  onClearCircuit,
  onClassicalBitsChange,
  onQubitCountChange,
  onResetCircuit,
  onRunSimulation,
  onSeedChange,
  onShotsChange,
  onToggleMeasurement,
  onToolSelect,
  pendingControl,
  seed,
  selectedTool,
  supportedGateNames,
}: CircuitEditorProps) {
  return (
    <section aria-label="Circuit editor" className="panel editor-panel">
      <div className="panel-heading">
        <div><span className="step-number">01</span><h2>Configure circuit</h2></div>
        <span className="heading-caption">{circuit.gates.length}/{info?.limits.max_gates ?? "—"} GATES</span>
      </div>
      <div className="form-grid">
        <label className="field" htmlFor="qubit-count">
          <span>Qubits</span>
          <select
            id="qubit-count"
            disabled={!info}
            onChange={(event) => onQubitCountChange(Number(event.target.value))}
            value={circuit.num_qubits}
          >
            {Array.from({ length: info?.limits.max_qubits ?? 2 }, (_, index) => (
              <option key={index + 1} value={index + 1}>{index + 1}</option>
            ))}
          </select>
        </label>
        <label className="field" htmlFor="shots-count">
          <span>Shots <small>{info ? `${info.limits.min_shots}–${info.limits.max_shots}` : "API limits"}</small></span>
          <input
            id="shots-count"
            max={info?.limits.max_shots}
            min={info?.limits.min_shots}
            onChange={(event) => onShotsChange(event.target.value === "" ? 0 : Number(event.target.value))}
            step={1}
            type="number"
            value={circuit.shots}
          />
        </label>
      </div>
      <label className="field seed-input" htmlFor="simulation-seed">
        <span>Seed <small>Optional · repeatable results</small></span>
        <input id="simulation-seed" onChange={(event) => onSeedChange(event.target.value)} placeholder="Random" step={1} type="number" value={seed} />
      </label>
      {info && circuit.num_qubits > circuit.num_clbits && (
        <label className="field classical-bits" htmlFor="classical-count">
          <span>Classical bits</span>
          <select id="classical-count" onChange={(event) => onClassicalBitsChange(Number(event.target.value))} value={circuit.num_clbits}>
            {Array.from({ length: Math.min(info.limits.max_clbits, circuit.num_qubits) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
      )}

      <div className="section-divider" />
      <div className="subsection-heading"><h3>Choose a gate</h3><span>CLICK TO SELECT</span></div>
      <GatePalette onSelect={onToolSelect} selected={selectedTool} supportedGates={supportedGateNames} />
      <div aria-live="polite" className="editor-status" role="status">
        {pendingControl
          ? `CNOT control q${pendingControl.qubit} in column ${pendingControl.column + 1}; choose a target in the same column. Press Escape to cancel.`
          : editorNotice || "Select a gate, then click a cell in the circuit grid."}
      </div>
      <div className="grid-heading">
        <h3>Click a qubit cell to place the selected gate</h3>
        <button className="text-button" disabled={columnCount >= (info?.limits.max_gates ?? 32)} onClick={onAddColumn} type="button">+ Add column</button>
      </div>
      <CircuitGrid
        columnCount={Math.max(columnCount, maxGateColumn + 1)}
        gates={circuit.gates}
        numQubits={circuit.num_qubits}
        onCellClick={onCellClick}
        pendingControl={pendingControl?.qubit ?? null}
        selectedColumn={pendingControl?.column ?? 0}
        selectedTool={selectedTool}
      />

      <div className="section-divider" />
      <div className="subsection-heading">
        <h3>Measure each qubit</h3>
        <span>QUBIT → CLASSICAL BIT</span>
      </div>
      <div className="measurement-checkboxes">
        {Array.from({ length: circuit.num_qubits }, (_, qubit) => {
          const measured = circuit.measurements.some(({ qubit: index }) => index === qubit);
          const disabled = qubit >= circuit.num_clbits;
          return (
            <label className={`measurement-checkbox ${disabled ? "measurement-disabled" : ""}`} key={qubit}>
              <input
                checked={measured}
                disabled={disabled}
                onChange={(event: ChangeEvent<HTMLInputElement>) => onToggleMeasurement(qubit, event.target.checked)}
                type="checkbox"
              />
              <span className="checkbox-visual" aria-hidden="true" />
              <span>Measure q{qubit} <small>→ c{qubit}</small></span>
            </label>
          );
        })}
      </div>
      {circuit.num_qubits > circuit.num_clbits && <p className="field-hint">Increase classical bits to measure all qubits.</p>}

      <div className="configuration-preview">
        <h3>Configuration before running</h3>
        {circuit.gates.length ? (
          <ol>
            {circuit.gates.map((gate, index) => (
              <li key={`${gate.column}-${gate.name}-${index}`}>
                <span>Column {(gate.column ?? 0) + 1}</span>
                <strong>{gate.name.toUpperCase()}</strong>
                <span>{gate.name === "cx" ? `q${gate.control} → q${gate.target}` : `q${gate.target}`}</span>
              </li>
            ))}
          </ol>
        ) : <p>No gates placed yet; the qubits remain in the initial state.</p>}
        <p>{circuit.measurements.length} measurements · {circuit.shots} shots{seed.trim() ? ` · seed ${seed}` : " · random seed"}</p>
      </div>
      <div className="editor-actions">
        <button className="button button-secondary" disabled={!circuit.gates.length && !circuit.measurements.length} onClick={onClearCircuit} type="button">Clear circuit</button>
        <button className="button button-secondary" disabled={!info} onClick={onResetCircuit} type="button">Reset settings</button>
        <button className="button button-primary" disabled={!info || isRunning} onClick={onRunSimulation} type="button">
          {isRunning ? "Running…" : "Run simulation"} <span aria-hidden="true">↗</span>
        </button>
      </div>
    </section>
  );
}
