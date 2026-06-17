import { useState, useEffect, useCallback } from "react";

const SEASONS = [
  { id: "summer_school", label: "Summer School", icon: "ti-school", color: "#1D9E75" },
  { id: "summer_travel", label: "Summer Travel", icon: "ti-map-pin", color: "#378ADD" },
  { id: "winter_school", label: "Winter School", icon: "ti-snowflake", color: "#7F77DD" },
];

const SHOT_TYPES = [
  { id: "layup", label: "Layup", pts: 2 },
  { id: "mid", label: "Mid-range", pts: 2 },
  { id: "three", label: "3-pointer", pts: 3 },
  { id: "ft", label: "Free throw", pts: 1 },
  { id: "dunk", label: "Dunk", pts: 2 },
];

const defaultGame = () => ({
  id: Date.now().toString(),
  date: new Date().toISOString().split("T")[0],
  opponent: "",
  season: "summer_school",
  shots: [],
  rebounds: { off: 0, def: 0 },
  steals: 0,
  deflections: 0,
  assists: 0,
  turnovers: 0,
  notes: "",
});

const calcStats = (g) => {
  const made = g.shots.filter((s) => s.made);
  const fg = g.shots.filter((s) => s.type !== "ft");
  const fgM = fg.filter((s) => s.made);
  const ft = g.shots.filter((s) => s.type === "ft");
  const ftM = ft.filter((s) => s.made);
  const pts = made.reduce((sum, s) => {
    const t = SHOT_TYPES.find((x) => x.id === s.type);
    return sum + (t ? t.pts : 0);
  }, 0);
  return {
    pts,
    fga: fg.length,
    fgm: fgM.length,
    fgPct: fg.length ? Math.round((fgM.length / fg.length) * 100) : 0,
    fta: ft.length,
    ftm: ftM.length,
    ftPct: ft.length ? Math.round((ftM.length / ft.length) * 100) : 0,
    threeA: g.shots.filter((s) => s.type === "three").length,
    threeM: g.shots.filter((s) => s.type === "three" && s.made).length,
    reb: g.rebounds.off + g.rebounds.def,
    oreb: g.rebounds.off,
    dreb: g.rebounds.def,
    stl: g.steals,
    dfl: g.deflections,
    ast: g.assists,
    tov: g.turnovers || 0,
    astToRatio:
      (g.turnovers || 0) === 0
        ? g.assists > 0
          ? "∞"
          : "—"
        : (g.assists / g.turnovers).toFixed(1),
  };
};

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Storage helpers — works in Claude artifacts (window.storage) with localStorage fallback
async function storageGet(key) {
  if (window.storage) {
    try {
      const r = await window.storage.get(key);
      return r && r.value ? r.value : null;
    } catch (e) {}
  }
  try { return localStorage.getItem(key); } catch (e) {}
  return null;
}

async function storageSet(key, val) {
  if (window.storage) {
    try {
      const r = await window.storage.set(key, val);
      return !!r;
    } catch (e) {}
  }
  try { localStorage.setItem(key, val); return true; } catch (e) {}
  return false;
}

export default function App() {
  const [view, setView] = useState("overview");
  const [activeSeason, setActiveSeason] = useState("summer_school");
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  useEffect(() => {
    (async () => {
      const raw = await storageGet("bball_games");
      if (raw) {
        try { setGames(JSON.parse(raw)); } catch (e) {}
      }
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (g) => {
    setSaveStatus("saving");
    const ok = await storageSet("bball_games", JSON.stringify(g));
    setSaveStatus(ok ? "saved" : "error");
    setTimeout(() => setSaveStatus(null), 2200);
  }, []);

  const updateGames = (g) => { setGames(g); save(g); };

  const startNewGame = () => {
    const g = defaultGame();
    g.season = activeSeason;
    setCurrentGame(g);
    setView("live");
  };

  const finishGame = () => {
    if (!currentGame) return;
    const updated = [...games.filter((g) => g.id !== currentGame.id), currentGame];
    updateGames(updated);
    setActiveSeason(currentGame.season);
    setCurrentGame(null);
    setView("history");
  };

  const deleteGame = (id) => updateGames(games.filter((g) => g.id !== id));
  const seasonGames = (sid) => games.filter((g) => g.season === sid);

  if (!loaded)
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "#9a9a9a" }}>
        Loading your stats...
      </div>
    );

  const statusColor =
    saveStatus === "saved" ? "#1D9E75" : saveStatus === "error" ? "#e24b4a" : "#9a9a9a";
  const statusLabel =
    saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : saveStatus === "error" ? "Storage error ✗" : null;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 700, margin: "0 auto", padding: "1rem", background: "#111111", minHeight: "100vh", color: "#f0f0f0" }}>
      <h2 className="sr-only">Basketball Stats Tracker</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "0.5px solid rgba(255,255,255,0.08)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#D85A30", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-ball-basketball" style={{ fontSize: 22, color: "#fff" }} aria-hidden="true" />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "#f0f0f0" }}>Player Stats Tracker</h1>
          <p style={{ margin: 0, fontSize: 13, color: "#9a9a9a" }}>Track performance across all seasons</p>
        </div>
        {statusLabel && (
          <span style={{ fontSize: 12, color: statusColor, transition: "color 0.3s" }}>{statusLabel}</span>
        )}
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Season overview", icon: "ti-chart-bar" },
          { id: "live", label: currentGame ? "Live game" : "New game", icon: "ti-player-record" },
          { id: "history", label: "Game history", icon: "ti-history" },
        ].map((n) => (
          <button
            key={n.id}
            onClick={() => { if (n.id === "live" && !currentGame) startNewGame(); else setView(n.id); }}
            style={{ padding: "8px 16px", borderRadius: "8px", border: view === n.id ? "1.5px solid #D85A30" : "0.5px solid rgba(255,255,255,0.15)", background: view === n.id ? "rgba(216,90,48,0.08)" : "#1a1a1a", color: view === n.id ? "#D85A30" : "#f0f0f0", fontWeight: view === n.id ? 500 : 400, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
          >
            <i className={`ti ${n.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
            {n.label}
          </button>
        ))}
      </div>

      {/* Season tabs */}
      {view !== "live" && (
        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {SEASONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSeason(s.id)}
              style={{ flex: 1, padding: "8px 4px", borderRadius: "8px", border: activeSeason === s.id ? `1.5px solid ${s.color}` : "0.5px solid rgba(255,255,255,0.08)", background: activeSeason === s.id ? `${s.color}18` : "#242424", color: activeSeason === s.id ? s.color : "#9a9a9a", fontWeight: activeSeason === s.id ? 500 : 400, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <i className={`ti ${s.icon}`} style={{ fontSize: 15 }} aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
      )}

      {view === "overview" && <OverviewView games={seasonGames(activeSeason)} season={SEASONS.find((s) => s.id === activeSeason)} />}
      {view === "live" && <LiveGameView game={currentGame} setGame={setCurrentGame} onFinish={finishGame} onCancel={() => { setCurrentGame(null); setView("history"); }} />}
      {view === "history" && <HistoryView games={seasonGames(activeSeason)} season={SEASONS.find((s) => s.id === activeSeason)} onDelete={deleteGame} />}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "#242424", borderRadius: "8px", padding: "14px 16px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, color: "#9a9a9a" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 500, color: "#f0f0f0" }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#666" }}>{sub}</p>}
    </div>
  );
}

function OverviewView({ games, season }) {
  if (!games.length)
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9a9a9a" }}>
        <i className="ti ti-clipboard-list" style={{ fontSize: 40, display: "block", marginBottom: 12 }} aria-hidden="true" />
        <p style={{ fontWeight: 500, color: "#f0f0f0" }}>No games logged yet</p>
        <p style={{ fontSize: 14 }}>Start tracking games to see season averages here.</p>
      </div>
    );

  const allStats = games.map(calcStats);
  const gp = games.length;
  const avgStat = (k) => avg(allStats.map((s) => s[k])).toFixed(1);
  const totalAst = allStats.reduce((s, x) => s + x.ast, 0);
  const totalTov = allStats.reduce((s, x) => s + x.tov, 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500 }}>Season averages</h2>
        <span style={{ fontSize: 13, color: "#9a9a9a" }}>{gp} game{gp !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
        <StatCard label="Points" value={avgStat("pts")} sub="per game" />
        <StatCard label="FG%" value={`${Math.round(avg(allStats.map((s) => s.fgPct)))}%`} sub={`${avgStat("fgm")}/${avgStat("fga")} avg`} />
        <StatCard label="3PT%" value={`${Math.round(avg(allStats.map((s) => s.threeA ? Math.round((s.threeM / s.threeA) * 100) : 0)))}%`} sub={`${avgStat("threeM")}/${avgStat("threeA")} avg`} />
        <StatCard label="FT%" value={`${Math.round(avg(allStats.map((s) => s.ftPct)))}%`} sub={`${avgStat("ftm")}/${avgStat("fta")} avg`} />
        <StatCard label="Rebounds" value={avgStat("reb")} sub={`${avgStat("oreb")} off / ${avgStat("dreb")} def`} />
        <StatCard label="Assists" value={avgStat("ast")} sub="per game" />
        <StatCard label="Turnovers" value={avgStat("tov")} sub="per game" />
        <StatCard label="AST/TO" value={totalTov === 0 ? (totalAst > 0 ? "∞" : "—") : (totalAst / totalTov).toFixed(1)} sub="season total" />
        <StatCard label="Steals" value={avgStat("stl")} sub="per game" />
        <StatCard label="Deflections" value={avgStat("dfl")} sub="per game" />
      </div>

      <div style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Shot breakdown</h3>
        {SHOT_TYPES.map((st) => {
          const tot = games.reduce((s, g) => s + g.shots.filter((sh) => sh.type === st.id).length, 0);
          const mde = games.reduce((s, g) => s + g.shots.filter((sh) => sh.type === st.id && sh.made).length, 0);
          const pct = tot ? Math.round((mde / tot) * 100) : 0;
          return (
            <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#9a9a9a", width: 80, flexShrink: 0 }}>{st.label}</span>
              <div style={{ flex: 1, height: 6, background: "#242424", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: season.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, color: "#9a9a9a", width: 80, textAlign: "right", flexShrink: 0 }}>{mde}/{tot} ({pct}%)</span>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Recent games</h3>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ color: "#9a9a9a" }}>
              {["Date", "Opponent", "PTS", "REB", "AST", "FG%"].map((h, i) => (
                <th key={h} style={{ textAlign: i > 1 ? "right" : "left", fontWeight: 400, paddingBottom: 8, width: i === 0 ? "20%" : i === 1 ? "30%" : "12.5%" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...games].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((g) => {
              const s = calcStats(g);
              return (
                <tr key={g.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
                  <td style={{ padding: "8px 0", color: "#9a9a9a" }}>{g.date}</td>
                  <td style={{ padding: "8px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.opponent || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 500, color: season.color }}>{s.pts}</td>
                  <td style={{ textAlign: "right" }}>{s.reb}</td>
                  <td style={{ textAlign: "right" }}>{s.ast}</td>
                  <td style={{ textAlign: "right", color: "#9a9a9a" }}>{s.fgPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LiveGameView({ game, setGame, onFinish, onCancel }) {
  const [lastAction, setLastAction] = useState(null);
  if (!game) return null;

  const logShot = (type, made) => {
    const shot = { id: Date.now().toString(), type, made, time: new Date().toISOString() };
    setGame({ ...game, shots: [...game.shots, shot] });
    setLastAction(`${made ? "✓" : "✗"} ${SHOT_TYPES.find((s) => s.id === type).label}`);
    setTimeout(() => setLastAction(null), 1500);
  };

  const undoLast = () => { if (game.shots.length) setGame({ ...game, shots: game.shots.slice(0, -1) }); };

  const incStat = (key, sub) =>
    sub ? setGame({ ...game, rebounds: { ...game.rebounds, [sub]: game.rebounds[sub] + 1 } })
        : setGame({ ...game, [key]: game[key] + 1 });

  const decStat = (key, sub) =>
    sub ? setGame({ ...game, rebounds: { ...game.rebounds, [sub]: Math.max(0, game.rebounds[sub] - 1) } })
        : setGame({ ...game, [key]: Math.max(0, game[key] - 1) });

  const s = calcStats(game);
  const season = SEASONS.find((x) => x.id === game.season) || SEASONS[0];

  return (
    <div>
      <div style={{ background: "#242424", borderRadius: "12px", padding: "12px 16px", marginBottom: "1rem", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 11, color: "#9a9a9a", display: "block", marginBottom: 4 }}>Date</label>
          <input type="date" value={game.date} onChange={(e) => setGame({ ...game, date: e.target.value })} />
        </div>
        <div style={{ flex: 2, minWidth: 160 }}>
          <label style={{ fontSize: 11, color: "#9a9a9a", display: "block", marginBottom: 4 }}>Opponent</label>
          <input type="text" value={game.opponent} onChange={(e) => setGame({ ...game, opponent: e.target.value })} placeholder="Opponent name" />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", padding: "12px 16px", background: `${season.color}15`, borderRadius: "12px", border: `0.5px solid ${season.color}40` }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>Points</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 500, color: season.color }}>{s.pts}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>FG</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{s.fgm}/{s.fga}</p>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>{s.fgPct}%</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>3PT</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{s.threeM}/{s.threeA}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>AST/TO</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{s.astToRatio}</p>
        </div>
      </div>

      {lastAction && (
        <div style={{ textAlign: "center", marginBottom: 8, fontSize: 14, fontWeight: 500, color: lastAction.startsWith("✓") ? "#1D9E75" : "#e24b4a" }}>
          {lastAction}
        </div>
      )}

      <div style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Log a shot</h3>
          {game.shots.length > 0 && (
            <button onClick={undoLast} style={{ fontSize: 12, color: "#9a9a9a", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <i className="ti ti-arrow-back-up" aria-hidden="true" /> Undo last
            </button>
          )}
        </div>
        {SHOT_TYPES.map((st) => {
          const att = game.shots.filter((s) => s.type === st.id).length;
          const mde = game.shots.filter((s) => s.type === st.id && s.made).length;
          return (
            <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "#9a9a9a", width: 90, flexShrink: 0 }}>{st.label}</span>
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <button onClick={() => logShot(st.id, true)} style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", background: "rgba(29,158,117,0.15)", color: "#1D9E75", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <i className="ti ti-check" aria-hidden="true" /> Make
                </button>
                <button onClick={() => logShot(st.id, false)} style={{ flex: 1, padding: "10px 0", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", background: "rgba(226,75,74,0.15)", color: "#e24b4a", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <i className="ti ti-x" aria-hidden="true" /> Miss
                </button>
              </div>
              <span style={{ fontSize: 12, color: "#9a9a9a", width: 60, textAlign: "right", flexShrink: 0 }}>{mde}/{att}</span>
            </div>
          );
        })}
      </div>

      <div style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Other stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "Off. rebounds", key: "reb", sub: "off", val: game.rebounds.off },
            { label: "Def. rebounds", key: "reb", sub: "def", val: game.rebounds.def },
            { label: "Steals", key: "steals", val: game.steals },
            { label: "Deflections", key: "deflections", val: game.deflections },
            { label: "Assists", key: "assists", val: game.assists },
            { label: "Turnovers", key: "turnovers", val: game.turnovers || 0 },
          ].map((item) => (
            <div key={item.label} style={{ background: "#242424", borderRadius: "8px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "#9a9a9a" }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 500 }}>{item.val}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button onClick={() => incStat(item.key, item.sub)} style={{ width: 30, height: 30, borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", background: "#1a1a1a", cursor: "pointer", fontSize: 16, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", color: "#f0f0f0" }}>+</button>
                <button onClick={() => decStat(item.key, item.sub)} style={{ width: 30, height: 30, borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", background: "#1a1a1a", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", color: "#f0f0f0" }}>−</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: 13, color: "#9a9a9a", display: "block", marginBottom: 6 }}>Notes (optional)</label>
        <textarea value={game.notes} onChange={(e) => setGame({ ...game, notes: e.target.value })} placeholder="Add game notes..." rows={2} style={{ width: "100%", fontSize: 13, borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", padding: "8px 12px", background: "#1a1a1a", color: "#f0f0f0", resize: "vertical", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onFinish} style={{ flex: 2, padding: "12px 0", borderRadius: "8px", border: `1.5px solid ${season.color}`, background: season.color, color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 15 }}>
          Save game
        </button>
        <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: "8px", border: "0.5px solid rgba(255,255,255,0.15)", background: "none", color: "#9a9a9a", cursor: "pointer", fontSize: 14 }}>
          Discard
        </button>
      </div>
    </div>
  );
}

function HistoryView({ games, season, onDelete }) {
  const [expandedId, setExpandedId] = useState(null);
  const sorted = [...games].sort((a, b) => b.date.localeCompare(a.date));

  if (!sorted.length)
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9a9a9a" }}>
        <i className="ti ti-history" style={{ fontSize: 40, display: "block", marginBottom: 12 }} aria-hidden="true" />
        <p style={{ fontWeight: 500, color: "#f0f0f0" }}>No games yet this season</p>
        <p style={{ fontSize: 14 }}>Log your first game using "New game" above.</p>
      </div>
    );

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 500 }}>Game log — {games.length} game{games.length !== 1 ? "s" : ""}</h2>
      {sorted.map((g) => {
        const s = calcStats(g);
        const isOpen = expandedId === g.id;
        return (
          <div key={g.id} style={{ background: "#1a1a1a", border: "0.5px solid rgba(255,255,255,0.08)", borderRadius: "12px", marginBottom: 10, overflow: "hidden" }}>
            <div onClick={() => setExpandedId(isOpen ? null : g.id)} style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{g.opponent || "Unnamed game"}</span>
                  <span style={{ fontSize: 11, color: "#9a9a9a" }}>{g.date}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 13, color: "#9a9a9a" }}>
                  <span style={{ color: season.color, fontWeight: 500 }}>{s.pts} pts</span>
                  <span>{s.fgm}/{s.fga} FG ({s.fgPct}%)</span>
                  <span>{s.reb} reb</span>
                  <span>{s.ast} ast</span>
                  <span>{s.tov} to</span>
                </div>
              </div>
              <i className={`ti ti-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: 16, color: "#9a9a9a" }} aria-hidden="true" />
            </div>

            {isOpen && (
              <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.08)", padding: "14px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 14 }}>
                  {[
                    { l: "Points", v: s.pts }, { l: "FG", v: `${s.fgm}/${s.fga}` }, { l: "FG%", v: `${s.fgPct}%` },
                    { l: "3PT", v: `${s.threeM}/${s.threeA}` }, { l: "3PT%", v: `${s.threeA ? Math.round((s.threeM / s.threeA) * 100) : 0}%` },
                    { l: "FT", v: `${s.ftm}/${s.fta}` }, { l: "Off. reb", v: s.oreb }, { l: "Def. reb", v: s.dreb },
                    { l: "Total reb", v: s.reb }, { l: "Assists", v: s.ast }, { l: "Turnovers", v: s.tov },
                    { l: "AST/TO", v: s.astToRatio }, { l: "Steals", v: s.stl }, { l: "Deflections", v: s.dfl },
                  ].map((item) => (
                    <div key={item.l} style={{ background: "#242424", borderRadius: "8px", padding: "8px 10px" }}>
                      <p style={{ margin: 0, fontSize: 10, color: "#9a9a9a" }}>{item.l}</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{item.v}</p>
                    </div>
                  ))}
                </div>

                {SHOT_TYPES.map((st) => {
                  const att = g.shots.filter((sh) => sh.type === st.id).length;
                  const mde = g.shots.filter((sh) => sh.type === st.id && sh.made).length;
                  if (!att) return null;
                  const pct = Math.round((mde / att) * 100);
                  return (
                    <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#9a9a9a", width: 80, flexShrink: 0 }}>{st.label}</span>
                      <div style={{ flex: 1, height: 5, background: "#242424", borderRadius: 3 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: season.color, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#9a9a9a", width: 70, textAlign: "right" }}>{mde}/{att} ({pct}%)</span>
                    </div>
                  );
                })}

                {g.notes && <p style={{ margin: "10px 0", fontSize: 13, color: "#9a9a9a", fontStyle: "italic" }}>{g.notes}</p>}

                <button onClick={() => onDelete(g.id)} style={{ padding: "6px 14px", borderRadius: "8px", border: "0.5px solid rgba(226,75,74,0.4)", background: "rgba(226,75,74,0.15)", color: "#e24b4a", cursor: "pointer", fontSize: 13 }}>
                  <i className="ti ti-trash" aria-hidden="true" /> Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
