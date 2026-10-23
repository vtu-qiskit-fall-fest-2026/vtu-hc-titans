import type { GateOperation } from "../types";
import type { GateTool } from "./GatePalette";

interface CircuitGridProps {
  columnCount: number;
  gates: GateOperation[];
  numQubits: number;
  onCellClick: (qubit: number, column: number) => void;
  pendingControl: number | null;
  selectedColumn: number;
  selectedTool: GateTool;
}

function gateAt(gates: GateOperation[], qubit: number, column: number) {
  return gates.find(
    (gate) =>
      gate.column === column &&
      (gate.target === qubit || (gate.name === "cx" && gate.control === qubit)),
  );
}

export function CircuitGrid({
  columnCount,
  gates,
  numQubits,
  onCellClick,
  pendingControl,
  selectedColumn,
  selectedTool,
}: CircuitGridProps) {
  return (
    <div className="circuit-grid-scroll">
      <div
        aria-label="Circuit gate placement grid"
        className="circuit-grid"
        role="grid"
        style={{ gridTemplateColumns: `76px repeat(${columnCount}, minmax(58px, 1fr))` }}
      >
        <div className="grid-corner" role="columnheader">Qubit</div>
        {Array.from({ length: columnCount }, (_, column) => (
          <div
            aria-label={`Column ${column + 1}`}
            className={`grid-column-label ${selectedColumn === column ? "grid-column-selected" : ""}`}
            key={`header-${column}`}
            role="columnheader"
          >
            {column + 1}
          </div>
        ))}
        {Array.from({ length: numQubits }, (_, qubit) => (
          <div className="grid-row" key={qubit} role="row">
            <div className="grid-qubit-label" role="rowheader">q{qubit}</div>
            {Array.from({ length: columnCount }, (_, column) => {
              const gate = gateAt(gates, qubit, column);
              const isControl = gate?.name === "cx" && gate.control === qubit;
              const isPending = selectedTool === "cx" && pendingControl === qubit && column === selectedColumn;
              const content = gate
                ? gate.name === "cx"
                  ? isControl ? "●" : "⊕"
                  : gate.name.toUpperCase()
                : isPending ? "●" : "";
              const label = gate
                ? gate.name === "cx"
                  ? `CNOT ${isControl ? "control" : "target"} at qubit ${qubit}, column ${column + 1}`
                  : `${gate.name.toUpperCase()} gate at qubit ${qubit}, column ${column + 1}`
                : isPending
                  ? `CNOT control selected at qubit ${qubit}, column ${column + 1}`
                  : `Place ${selectedTool === "erase" ? "eraser" : selectedTool.toUpperCase()} at qubit ${qubit}, column ${column + 1}`;
              return (
                <div className="grid-cell-wrap" key={`${qubit}-${column}`} role="presentation">
                  <button
                    aria-label={label}
                    aria-pressed={Boolean(gate) || isPending}
                    className={[
                      "grid-cell",
                      gate ? "grid-cell-filled" : "",
                      gate?.name === "cx" ? "grid-cell-cnot" : "",
                      isPending ? "grid-cell-pending" : "",
                      selectedColumn === column ? "grid-cell-active-column" : "",
                    ].filter(Boolean).join(" ")}
                    onClick={() => onCellClick(qubit, column)}
                    role="gridcell"
                    type="button"
                  >
                    {content}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
