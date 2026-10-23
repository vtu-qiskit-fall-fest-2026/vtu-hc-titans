import type { SimulationResponse } from "../types";

export function BarChart({ result }: { result: SimulationResponse }) {
  const outcomes = Object.keys(result.counts).sort((left, right) => left.localeCompare(right));
  return (
    <div aria-label="Measured and theoretical outcome probabilities" className="bar-chart">
      {outcomes.map((outcome) => {
        const measured = (result.probabilities[outcome] ?? 0) * 100;
        const theory = (result.theoretical_probabilities[outcome] ?? 0) * 100;
        return (
          <div className="chart-row" key={outcome}>
            <code>{outcome}</code>
            <div
              aria-label={`${outcome}: measured ${measured.toFixed(1)} percent, theoretical ${theory.toFixed(1)} percent`}
              className="chart-track"
              role="img"
            >
              <span className="chart-measured" style={{ width: `${Math.min(measured, 100)}%` }} />
              <span className="chart-theory" style={{ left: `${Math.min(theory, 100)}%` }} />
            </div>
            <span className="chart-values">{measured.toFixed(1)}% <small>/ {theory.toFixed(1)}%</small></span>
          </div>
        );
      })}
      <div className="chart-legend">
        <span><i className="legend-observed" /> Measured</span>
        <span><i className="legend-theory" /> Theoretical</span>
      </div>
    </div>
  );
}
