import { useState, FormEvent } from "react";

type Props = {
  onSubmit: (asin: string) => void;
  loading: boolean;
};

export function AsinForm({ onSubmit, loading }: Props) {
  const [asin, setAsin] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!asin.trim() || loading) return;
    onSubmit(asin.trim());
  };

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <label className="label">
        Amazon ASIN
        <input
          className="input"
          value={asin}
          onChange={(e) => setAsin(e.target.value)}
          placeholder="e.g., B07H65KP63"
        />
      </label>
      <p className="muted small">We fetch details, run Gemini, and save each run to history.</p>
      <button className="button" type="submit" disabled={loading || !asin.trim()}>
        {loading ? "Optimizing..." : "Optimize Listing"}
      </button>
    </form>
  );
}
