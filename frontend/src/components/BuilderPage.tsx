import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError, getApiInfo, getExamples, simulateCircuit } from "../api";
import type { ApiInfo, CircuitExample, GateOperation, SimulationPayload } from "../types";
import { CircuitEditor } from "./CircuitEditor";
import { ResultsDashboard, type ResultState } from "./ResultsDashboard";
import { RouteLink, SiteLayout, type AppRoute, type Navigate } from "./SiteLayout";
import type { GateTool } from "./GatePalette";

interface PendingControl {
  qubit: number;
  column: number;
}

const EMPTY_RESULT: ResultState = { status: "idle" };

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

function detailsFor(error: unknown): string[] {
  if (error instanceof ApiRequestError) return error.details;
  if (error instanceof Error) return [error.message];
  return ["No additional details are available."];
}

export function BuilderPage({
  onNavigate,
  route,
}: {
  onNavigate: Navigate;
  route: AppRoute;
}) {
  const [info, setInfo] = useState<ApiInfo | null>(null);
  const [infoError, setInfoError] = useState("");
  const [examples, setExamples] = useState<CircuitExample[]>([]);
  const [examplesError, setExamplesError] = useState("");
  const [examplesLoaded, setExamplesLoaded] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [circuit, setCircuit] = useState<SimulationPayload>({
    num_qubits: 2,
    num_clbits: 2,
    shots: 1024,
    gates: [],
    measurements: [],
  });
  const [seed, setSeed] = useState("");
  const [selectedTool, setSelectedTool] = useState<GateTool>("h");
  const [selectedExample, setSelectedExample] = useState("");
  const [columnCount, setColumnCount] = useState(4);
  const [pendingControl, setPendingControl] = useState<PendingControl | null>(null);
  const [editorNotice, setEditorNotice] = useState("");
  const [result, setResult] = useState<ResultState>(EMPTY_RESULT);
  const loadedExampleQuery = useRef<string | null>(null);

  const updateCircuit = useCallback((next: Partial<SimulationPayload>) => {
    setCircuit((current) => ({ ...current, ...next }));
    setResult(EMPTY_RESULT);
  }, []);

  const applyExample = useCallback((example: CircuitExample) => {
    const columns = example.circuit.gates.map((gate, index) => ({
      ...gate,
      column: index,
    }));
    const maxQubits = info?.limits.max_qubits ?? example.circuit.num_qubits;
    const maxClbits = info?.limits.max_clbits ?? example.circuit.num_clbits;
    const numQubits = Math.min(example.circuit.num_qubits, maxQubits);
    const numClbits = Math.min(example.circuit.num_clbits, maxClbits);
    const shots = Math.max(
      info?.limits.min_shots ?? 1,
      Math.min(example.circuit.shots, info?.limits.max_shots ?? example.circuit.shots),
    );
    setCircuit({
      ...example.circuit,
      num_qubits: numQubits,
      num_clbits: numClbits,
      shots,
      gates: columns.filter((gate) => gate.target < numQubits && (gate.control === undefined || gate.control < numQubits)),
      measurements: example.circuit.measurements.filter(({ qubit, clbit }) => qubit < numQubits && clbit < numClbits),
    });
    setSeed(example.circuit.seed === undefined ? "" : String(example.circuit.seed));
    setColumnCount(Math.max(4, columns.length));
    setPendingControl(null);
    setSelectedTool("h");
    setEditorNotice(`${example.title} loaded. ${example.description} Expected: ${example.expected}`);
    setResult(EMPTY_RESULT);
  }, [info]);

  useEffect(() => {
    let active = true;
    setInfo(null);
    setInfoError("");
    setExamplesError("");
    setExamplesLoaded(false);
    void getApiInfo().then(
      (apiInfo) => {
        if (!active) return;
        setInfo(apiInfo);
        setCircuit((current) => ({
          ...current,
          num_qubits: Math.min(current.num_qubits, apiInfo.limits.max_qubits),
          num_clbits: Math.min(current.num_clbits, apiInfo.limits.max_clbits),
          shots: apiInfo.limits.default_shots,
        }));
      },
      (error: unknown) => {
        if (active) setInfoError(messageFor(error));
      },
    );
    void getExamples().then(
      (items) => {
        if (active) setExamples(items);
      },
      (error: unknown) => {
        if (active) setExamplesError(messageFor(error));
      },
    ).finally(() => {
      if (active) setExamplesLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [retryKey]);

  useEffect(() => {
    const requestedId = new URLSearchParams(window.location.search).get("example");
    if (!requestedId || !info || !examplesLoaded || loadedExampleQuery.current === requestedId) return;
    const example = examples.find(({ id, title }) =>
      id.toLowerCase() === requestedId.toLowerCase() ||
      (requestedId.toLowerCase() === "bell" && /bell/i.test(`${id} ${title}`)),
    );
    if (example) {
      applyExample(example);
      setSelectedExample(example.id);
    } else {
      setEditorNotice(`The API did not provide the requested example "${requestedId}".`);
    }
    loadedExampleQuery.current = requestedId;
    window.history.replaceState(null, "", "/builder");
  }, [applyExample, examples, examplesLoaded, info]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && pendingControl) {
        setPendingControl(null);
        setEditorNotice("CNOT placement cancelled.");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pendingControl]);

  const supportedGateNames = Object.keys(info?.supported_gates ?? {});
  const maxGateColumn = circuit.gates.reduce((max, gate) => Math.max(max, gate.column ?? 0), -1);

  const onCellClick = useCallback((qubit: number, column: number) => {
    const occupant = circuit.gates.find((gate) =>
      gate.column === column &&
      (gate.target === qubit || (gate.name.toLowerCase() === "cx" && gate.control === qubit)),
    );
    if (selectedTool === "erase") {
      if (occupant) {
        updateCircuit({ gates: circuit.gates.filter((gate) => gate !== occupant) });
        setEditorNotice(`${occupant.name.toUpperCase()} removed from column ${column + 1}.`);
      }
      return;
    }
    if (!info || circuit.gates.length >= info.limits.max_gates) {
      setEditorNotice(`The gate limit is ${info?.limits.max_gates ?? 0}. Remove a gate before adding another.`);
      return;
    }
    if (selectedTool === "cx") {
      if (!pendingControl) {
        if (occupant) {
          setEditorNotice("Choose an empty cell for the CNOT control.");
          return;
        }
        setPendingControl({ qubit, column });
        setEditorNotice(`CNOT control set to q${qubit}. Choose its target in column ${column + 1}, or press Escape to cancel.`);
        return;
      }
      if (pendingControl.column !== column) {
        setEditorNotice(`Choose the CNOT target in column ${pendingControl.column + 1}. Press Escape to cancel.`);
        return;
      }
      if (pendingControl.qubit === qubit) {
        setEditorNotice("A CNOT control and target must be different qubits.");
        return;
      }
      if (occupant) {
        setEditorNotice("The CNOT target cell is occupied. Choose an empty qubit cell.");
        return;
      }
      const gate: GateOperation = { name: "cx", control: pendingControl.qubit, target: qubit, column };
      updateCircuit({ gates: [...circuit.gates, gate] });
      setPendingControl(null);
      setEditorNotice(`CNOT added in column ${column + 1}: q${gate.control} → q${qubit}.`);
      return;
    }
    if (occupant) {
      setEditorNotice("That cell already contains a gate. Select the eraser to remove it first.");
      return;
    }
    updateCircuit({
      gates: [...circuit.gates, { name: selectedTool, target: qubit, column }],
    });
    setEditorNotice(`${selectedTool.toUpperCase()} added to q${qubit}, column ${column + 1}.`);
  }, [circuit.gates, info, pendingControl, selectedTool, updateCircuit]);

  function chooseTool(tool: GateTool) {
    setSelectedTool(tool);
    setPendingControl(null);
    setEditorNotice(tool === "cx"
      ? "CNOT selected. Click its control qubit, then its target in the same column."
      : tool === "erase"
        ? "Eraser selected. Click a gate to remove it."
        : `${tool.toUpperCase()} selected. Click a qubit row to place it.`);
  }

  function changeQubitCount(numQubits: number) {
    if (!info) return;
    const numClbits = Math.min(circuit.num_clbits, numQubits, info.limits.max_clbits);
    updateCircuit({
      num_qubits: numQubits,
      num_clbits: numClbits,
      gates: circuit.gates.filter((gate) => gate.target < numQubits && (gate.control === undefined || gate.control < numQubits)),
      measurements: circuit.measurements.filter(({ qubit, clbit }) => qubit < numQubits && clbit < numClbits),
    });
    setPendingControl(null);
  }

  function changeClassicalBits(numClbits: number) {
    updateCircuit({
      num_clbits: numClbits,
      measurements: circuit.measurements.filter(({ clbit }) => clbit < numClbits),
    });
  }

  function toggleMeasurement(qubit: number, checked: boolean) {
    const measurements = circuit.measurements.filter((item) => item.qubit !== qubit);
    if (checked) measurements.push({ qubit, clbit: qubit });
    updateCircuit({ measurements });
  }

  function clearCircuit() {
    updateCircuit({ gates: [], measurements: [] });
    setPendingControl(null);
    setSelectedExample("");
    setEditorNotice("Gates and measurements cleared.");
  }

  function resetCircuit() {
    if (!info) return;
    const numQubits = Math.min(2, info.limits.max_qubits);
    setCircuit({
      num_qubits: numQubits,
      num_clbits: Math.min(numQubits, info.limits.max_clbits),
      shots: info.limits.default_shots,
      gates: [],
      measurements: [],
    });
    setSeed("");
    setSelectedExample("");
    setSelectedTool("h");
    setPendingControl(null);
    setColumnCount(4);
    setEditorNotice("Circuit settings reset.");
    setResult(EMPTY_RESULT);
  }

  async function runSimulation() {
    setResult(EMPTY_RESULT);
    if (!info) return;
    if (circuit.measurements.length === 0) {
      setResult({
        status: "error",
        message: "Add at least one measurement before running the circuit.",
        details: ["The simulation API requires at least one qubit-to-classical-bit measurement mapping."],
      });
      return;
    }
    if (!Number.isInteger(circuit.shots) || circuit.shots < info.limits.min_shots || circuit.shots > info.limits.max_shots) {
      setResult({
        status: "error",
        message: "Shots must be within the simulator limits.",
        details: [`Choose an integer between ${info.limits.min_shots} and ${info.limits.max_shots}.`],
      });
      return;
    }
    if (seed.trim() !== "" && !Number.isSafeInteger(Number(seed))) {
      setResult({
        status: "error",
        message: "Seed must be a whole number.",
        details: ["Leave the seed empty for a random simulator seed, or enter a safe integer."],
      });
      return;
    }
    setResult({ status: "loading" });
    try {
      const payload: SimulationPayload = {
        ...circuit,
        gates: [...circuit.gates]
          .sort((left, right) => (left.column ?? 0) - (right.column ?? 0))
          .map(({ column: _column, ...gate }) => gate),
        ...(seed.trim() ? { seed: Number(seed) } : {}),
      };
      const data = await simulateCircuit(payload);
      setResult({ status: "success", data });
    } catch (error) {
      setResult({
        status: "error",
        message: messageFor(error),
        details: detailsFor(error),
      });
    }
  }

  function changeShots(shots: number) {
    updateCircuit({ shots });
  }

  function changeSeed(value: string) {
    setSeed(value);
    setResult(EMPTY_RESULT);
  }

  return (
    <SiteLayout onNavigate={onNavigate} route={route}>
      <main className="builder-page">
        <div className="builder-heading">
          <div>
            <div className="eyebrow"><span /> CIRCUIT PLAYGROUND</div>
            <h1>Build your circuit.</h1>
            <p>Choose a gate, click a qubit, and measure to see what the simulator returns.</p>
          </div>
          <span aria-live="polite" className={`connection ${info ? "online" : "offline"}`}>
            <span className="status-dot" />{info ? "Simulator connected" : "Connecting to simulator"}
          </span>
        </div>

        {infoError && (
          <div aria-live="assertive" className="notice error-notice" role="alert">
            <span className="notice-icon">!</span>
            <span><strong>Simulator unavailable</strong>{infoError}</span>
            <button className="button button-secondary" onClick={() => setRetryKey((value) => value + 1)} type="button">Retry</button>
          </div>
        )}

        <div className="builder-layout">
          <CircuitEditor
            circuit={circuit}
            columnCount={columnCount}
            editorNotice={editorNotice}
            info={info}
            isRunning={result.status === "loading"}
            maxGateColumn={maxGateColumn}
            onAddColumn={() => setColumnCount((count) => count + 1)}
            onCellClick={onCellClick}
            onClearCircuit={clearCircuit}
            onClassicalBitsChange={changeClassicalBits}
            onQubitCountChange={changeQubitCount}
            onResetCircuit={resetCircuit}
            onRunSimulation={runSimulation}
            onSeedChange={changeSeed}
            onShotsChange={changeShots}
            onToggleMeasurement={toggleMeasurement}
            onToolSelect={chooseTool}
            pendingControl={pendingControl}
            seed={seed}
            selectedTool={selectedTool}
            supportedGateNames={supportedGateNames}
          />

          <aside className="builder-sidebar">
            <section className="panel examples-panel">
              <div className="panel-heading">
                <div><span className="step-number">02</span><h2>Examples</h2></div>
              </div>
              <label className="field example-select-label" htmlFor="example-select">
                <span>Load an example circuit</span>
                <select
                  id="example-select"
                  onChange={(event) => {
                    const example = examples.find(({ id }) => id === event.target.value);
                    if (example) {
                      setSelectedExample(example.id);
                      applyExample(example);
                    } else {
                      setSelectedExample("");
                    }
                  }}
                  value={selectedExample}
                >
                  <option value="">Choose an example…</option>
                  {examples.map((example) => <option key={example.id} value={example.id}>{example.title}</option>)}
                </select>
              </label>
              {examplesError && <p aria-live="assertive" className="inline-error" role="alert">{examplesError}</p>}
              {selectedExample && examples.find(({ id }) => id === selectedExample) && (
                <div className="example-details">
                  <p>{examples.find(({ id }) => id === selectedExample)?.description}</p>
                  <p><strong>Expected:</strong> {examples.find(({ id }) => id === selectedExample)?.expected}</p>
                </div>
              )}
              {!examplesError && examples.length === 0 && examplesLoaded && <p className="examples-empty">No examples were provided by the API.</p>}
            </section>
            <ResultsDashboard circuit={circuit} result={result} />
            <div className="notice builder-bit-order">
              <span className="note-icon" aria-hidden="true">i</span>
              <p>The rightmost bit in a result string represents classical bit 0.</p>
            </div>
          </aside>
        </div>
        <RouteLink className="tutorial-link builder-learn-link" onNavigate={onNavigate} to="/learn">
          New to quantum gates? Explore tutorials <span aria-hidden="true">↗</span>
        </RouteLink>
      </main>
    </SiteLayout>
  );
}
