import { useState } from "react";
import { AsinForm } from "./components/AsinForm";
import { ResultView } from "./components/ResultView";
import { HistoryList } from "./components/HistoryList";
import { optimizeAsin, getHistory } from "./api/optimize";
import type { OptimizationResult } from "./types/listing";

function App() {
  const [current, setCurrent] = useState<OptimizationResult | null>(null);
  const [history, setHistory] = useState<OptimizationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [asin, setAsin] = useState("");

  const handleRun = async (asin: string) => {
    try {
      setLoading(true);
      setError(null);
      setStatus(`Optimizing ${asin}...`);
      setAsin(asin);

      const result = await optimizeAsin(asin);
      setCurrent(result);
      setStatus("Optimization complete. Loading history...");
      const h = await getHistory(asin);
      setHistory(h);
      setStatus(`Showing ${h.length} run${h.length === 1 ? "" : "s"} for ${asin}.`);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Something went wrong");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: OptimizationResult) => {
    setCurrent(item);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>SalesDuo Amazon Listing Optimizer</h1>
        <p className="muted">
          Enter an ASIN to fetch the product, run Gemini optimization, and review previous runs.
        </p>
      </header>

      <main className="grid">
        <section>
          <AsinForm onSubmit={handleRun} loading={loading} />
          {status && <div className="status">{status}</div>}
          {error && <div className="error">{error}</div>}
          <ResultView result={current} />
        </section>
        <section>
          <HistoryList
            items={history}
            asin={asin}
            selectedTimestamp={current?.timestamp}
            onSelect={handleSelectHistory}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
