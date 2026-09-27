"use client";

import { useEffect, useState } from "react";

// governors: [{id, name}] — the full list to suggest from (already loaded
// client-side; alliances here are small enough that this is cheap).
export default function SearchBox({ governors, onPick, placeholder }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      const q = query.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        return;
      }
      const matches = (governors || [])
        .filter((g) => g.name.toLowerCase().includes(q) || g.id.includes(q))
        .slice(0, 8);
      setSuggestions(matches);
    }, 250);
    return () => clearTimeout(t);
  }, [query, governors]);

  return (
    <div className="relative">
      <div className="flex gap-3">
        <input
          className="flex-1 bg-panel2 border border-hairline rounded px-4 py-3 font-mono text-paper placeholder:text-steelDim focus:outline-none focus:border-brass"
          placeholder={placeholder || "Governor ID or name"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
        />
        <button
          className="bg-brass hover:bg-brassBright text-ink font-display tracking-wide px-6 py-3 rounded"
          onClick={() => {
            setOpen(false);
            onPick(query.trim());
          }}
        >
          SEARCH
        </button>
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-panel2 border border-hairline rounded shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((g) => (
            <button
              key={g.id}
              className="w-full text-left px-4 py-2 hover:bg-panel3 font-mono text-sm text-paper"
              onClick={() => {
                setQuery(g.name);
                setOpen(false);
                onPick(g.id);
              }}
            >
              {g.name} <span className="text-steelDim">({g.id})</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
