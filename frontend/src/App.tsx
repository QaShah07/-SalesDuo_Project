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

  const handleRun = async (asin: string) => {
    try {
      setLoading(true);
      setError(null);

      const result = await optimizeAsin(asin);
      setCurrent(result);

      const h = await getHistory(asin);
      setHistory(h);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.message || "Something went wrong");
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
          Enter an ASIN to fetch a sample product and see mock optimization.
          Later you will connect real scraping, AI, and MySQL.
        </p>
      </header>

      <main className="grid">
        <section>
          <AsinForm onSubmit={handleRun} loading={loading} />
          {error && <div className="error">{error}</div>}
          <ResultView result={current} />
        </section>
        <section>
          <HistoryList items={history} onSelect={handleSelectHistory} />
        </section>
      </main>
    </div>
  );
}

export default App;