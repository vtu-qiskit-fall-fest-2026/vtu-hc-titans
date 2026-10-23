export interface GateInfo {
  qubits: number;
  description: string;
}

export interface ApiLimits {
  max_qubits: number;
  max_clbits: number;
  max_gates: number;
  min_shots: number;
  max_shots: number;
  default_shots: number;
}

export interface ApiInfo {
  supported_gates: Record<string, GateInfo>;
  limits: ApiLimits;
  bit_order: string;
}

export interface GateOperation {
  name: string;
  target: number;
  control?: number;
  column?: number;
}

export interface Measurement {
  qubit: number;
  clbit: number;
}

export interface SimulationPayload {
  num_qubits: number;
  num_clbits: number;
  shots: number;
  seed?: number;
  gates: GateOperation[];
  measurements: Measurement[];
}

export interface CircuitExample {
  id: string;
  title: string;
  description: string;
  expected: string;
  circuit: SimulationPayload;
}

export interface SimulationResponse {
  status: string;
  backend: string;
  shots: number;
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  theoretical_probabilities: Record<string, number>;
  diagram?: string;
  metadata: {
    num_qubits: number;
    num_clbits: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorPayload {
  error?: string | { code?: string; message?: string; details?: unknown };
  message?: string;
  details?: unknown;
}
