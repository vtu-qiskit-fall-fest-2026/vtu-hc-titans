import type {
  ApiInfo,
  ApiErrorPayload,
  CircuitExample,
  SimulationPayload,
  SimulationResponse,
} from "./types";

export class ApiRequestError extends Error {
  readonly details: string[];

  constructor(message: string, details: string[]) {
    super(message);
    this.name = "ApiRequestError";
    this.details = details;
  }
}

function detailsToStrings(details: unknown): string[] {
  if (typeof details === "string") return [details];
  if (Array.isArray(details)) return details.flatMap(detailsToStrings);
  if (details && typeof details === "object") {
    return Object.entries(details).flatMap(([key, value]) =>
      detailsToStrings(value).map((detail) => `${key}: ${detail}`),
    );
  }
  return details === undefined || details === null ? [] : [String(details)];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown network error.";
    throw new ApiRequestError(
      "Cannot reach the API. Is the backend running?",
      [`Network request failed: ${reason}`, "Start the Flask backend at http://127.0.0.1:5000 and try again."],
    );
  }

  const body = await response.text();
  if (response.status === 502) {
    throw new ApiRequestError(
      "Cannot reach the API. Is the backend running?",
      ["The Vite API proxy could not connect to Flask at http://127.0.0.1:5000. Start the backend and try again."],
    );
  }
  let data: unknown;
  try {
    data = body ? JSON.parse(body) : {};
  } catch {
    throw new ApiRequestError(
      `The QubitLab API returned an unreadable response (HTTP ${response.status}).`,
      [body || "The response body was empty."],
    );
  }

  if (!response.ok) {
    const errorBody =
      typeof data === "object" && data !== null
        ? (data as ApiErrorPayload)
        : {};
    const errorObject = typeof errorBody.error === "object" && errorBody.error !== null
      ? errorBody.error
      : undefined;
    const message =
      typeof errorBody.error === "string"
        ? errorBody.error
        : typeof errorObject?.message === "string"
          ? errorObject.message
        : typeof errorBody.message === "string"
          ? errorBody.message
          : `Request failed with HTTP ${response.status}.`;
    const details = detailsToStrings(errorObject?.details ?? errorBody.details);
    if (details.length === 0) details.push(`HTTP ${response.status}; the API did not provide additional details.`);
    if (errorObject?.code) details.unshift(`Error code: ${errorObject.code}`);
    throw new ApiRequestError(message, details);
  }

  return data as T;
}

export function getApiInfo(): Promise<ApiInfo> {
  return request<ApiInfo>("/api/info");
}

export async function getExamples(): Promise<CircuitExample[]> {
  const response = await request<{ examples: CircuitExample[] }>(
    "/api/examples",
  );
  return response.examples;
}

export function simulateCircuit(
  circuit: SimulationPayload,
): Promise<SimulationResponse> {
  return request<SimulationResponse>("/api/simulate", {
    method: "POST",
    body: JSON.stringify(circuit),
  });
}
