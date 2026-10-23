const PALETTE = ["h", "x", "y", "z", "s", "t", "cx", "erase"] as const;

export type GateTool = (typeof PALETTE)[number];

export function GatePalette({
  selected,
  supportedGates,
  onSelect,
}: {
  selected: GateTool;
  supportedGates: string[];
  onSelect: (tool: GateTool) => void;
}) {
  return (
    <div className="gate-palette" role="group" aria-label="Gate palette">
      {PALETTE.filter((tool) => tool === "erase" || supportedGates.includes(tool)).map((tool) => (
        <button
          aria-label={tool === "erase" ? "Eraser tool" : `${tool.toUpperCase()} gate tool`}
          aria-pressed={selected === tool}
          className={`palette-gate ${selected === tool ? "palette-gate-active" : ""} ${tool === "erase" ? "palette-eraser" : ""}`}
          key={tool}
          onClick={() => onSelect(tool)}
          type="button"
        >
          {tool === "erase" ? "⌫" : tool.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
