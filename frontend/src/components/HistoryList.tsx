import type { OptimizationResult } from "../types/listing";

type Props = {
  asin?: string;
  items: OptimizationResult[];
  selectedTimestamp?: string;
  onSelect: (item: OptimizationResult) => void;
};

export function HistoryList({ asin, items, selectedTimestamp, onSelect }: Props) {
  if (!items.length) {
    return (
      <div className="card">
        <h2>History</h2>
        <p className="muted">No history for this ASIN yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h2>History</h2>
          <p className="muted">
            ASIN {asin || items[0].asin} • {items.length} run
            {items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <ul className="history-list">
        {items.map((item, idx) => {
          const isSelected = item.timestamp === selectedTimestamp;
          const isLatest = idx === 0;
          return (
            <li key={`${item.timestamp}-${idx}`}>
              <button
                className={`history-button${isSelected ? " active" : ""}`}
                type="button"
                onClick={() => onSelect(item)}
              >
                <div className="history-top">
                  <span className="run-label">
                    Run #{items.length - idx} — {new Date(item.timestamp).toLocaleString()}
                  </span>
                  <span className="tag-row">
                    {isLatest && <span className="tag">Latest</span>}
                    {isSelected && <span className="tag solid">Viewing</span>}
                  </span>
                </div>
                <div className="muted small">
                  Title: {item.optimized.title.slice(0, 90)}
                  {item.optimized.title.length > 90 ? "..." : ""}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
