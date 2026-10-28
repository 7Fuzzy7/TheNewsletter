"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const REFRESH_MS = 60_000;

function timeAgo(iso, now) {
  if (!iso) return "";
  const diff = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  return `há ${Math.floor(diff / 86400)} d`;
}

export default function NewsFeed({ initial }) {
  const [data, setData] = useState(initial);
  const [pending, setPending] = useState(null); // dados novos aguardando o clique em "ver novas"
  const [region, setRegion] = useState("todas");
  const [source, setSource] = useState("todas");
  const [query, setQuery] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const knownIds = useRef(new Set(initial.items.map((n) => n.id)));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news", { cache: "no-store" });
      if (!res.ok) throw new Error("falha");
      const next = await res.json();
      setError(false);
      const hasNew = next.items.some((n) => !knownIds.current.has(n.id));
      if (hasNew) setPending(next);
      else setData((d) => ({ ...d, updatedAt: next.updatedAt, status: next.status }));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualização automática: só roda com a aba visível e atualiza ao voltar para ela.
  useEffect(() => {
    const tick = setInterval(() => {
      setNow(Date.now());
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(tick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const showPending = () => {
    if (!pending) return;
    pending.items.forEach((n) => knownIds.current.add(n.id));
    setData(pending);
    setPending(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const newCount = pending ? pending.items.filter((n) => !knownIds.current.has(n.id)).length : 0;

  const sources = useMemo(() => {
    const map = new Map();
    data.items.forEach((n) => map.set(n.sourceId, n.source));
    return [...map.entries()];
  }, [data.items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.items.filter(
      (n) =>
        (region === "todas" || n.region === region) &&
        (source === "todas" || n.sourceId === source) &&
        (!q || n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q))
    );
  }, [data.items, region, source, query]);

  const failed = data.status.filter((s) => !s.ok);
  const updated = new Date(data.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <section>
      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Região">
          {[
            ["todas", "Tudo"],
            ["brasil", "Brasil"],
            ["mundo", "Mundo"],
          ].map(([value, label]) => (
            <button
              key={value}
              role="tab"
              aria-selected={region === value}
              className={region === value ? "tab active" : "tab"}
              onClick={() => setRegion(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="filters">
          <input
            type="search"
            placeholder="Buscar nas notícias…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar notícias"
          />
          <select value={source} onChange={(e) => setSource(e.target.value)} aria-label="Fonte">
            <option value="todas">Todas as fontes</option>
            {sources.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="statusbar" aria-live="polite">
        <span>
          {loading ? "Atualizando…" : `Atualizado às ${updated}`} · renova a cada 1 min
        </span>
        <button className="link" onClick={refresh} disabled={loading}>
          Atualizar agora
        </button>
      </div>

      {error && <p className="notice warn">Não foi possível atualizar agora. Tentaremos de novo em instantes.</p>}
      {failed.length > 0 && (
        <p className="notice">Fontes indisponíveis no momento: {failed.map((f) => f.name).join(", ")}.</p>
      )}

      {pending && newCount > 0 && (
        <button className="newbanner" onClick={showPending}>
          ↑ {newCount} {newCount === 1 ? "nova notícia" : "novas notícias"}
        </button>
      )}

      {visible.length === 0 ? (
        <p className="empty">Nenhuma notícia encontrada com esses filtros.</p>
      ) : (
        <ul className="list">
          {visible.map((n, i) => (
            <li key={n.id} className={i === 0 && region === "todas" && source === "todas" && !query ? "card hero" : "card"}>
              <a href={n.link} target="_blank" rel="noopener noreferrer">
                {n.image && i < 12 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.image} alt="" loading="lazy" referrerPolicy="no-referrer" />
                )}
                <div className="body">
                  <div className="meta">
                    <span className="badge">{n.source}</span>
                    <span>{timeAgo(n.publishedAt, now)}</span>
                  </div>
                  <h2>{n.title}</h2>
                  {n.summary && <p>{n.summary}</p>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
