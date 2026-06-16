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
  notes: "",
});

const calcGameStats = (game) => {
  const made = game.shots.filter((s) => s.made);
  const missed = game.shots.filter((s) => !s.made);
  const pts = made.reduce((sum, s) => {
    const t = SHOT_TYPES.find((st) => st.id === s.type);
    return sum + (t ? t.pts : 0);
  }, 0);
  const fg = game.shots.filter((s) => s.type !== "ft");
  const fgMade = fg.filter((s) => s.made);
  const ftShots = game.shots.filter((s) => s.type === "ft");
  const ftMade = ftShots.filter((s) => s.made);
  return {
    pts,
    fga: fg.length,
    fgm: fgMade.length,
    fgPct: fg.length ? Math.round((fgMade.length / fg.length) * 100) : 0,
    fta: ftShots.length,
    ftm: ftMade.length,
    ftPct: ftShots.length ? Math.round((ftMade.length / ftShots.length) * 100) : 0,
    threeA: game.shots.filter((s) => s.type === "three").length,
    threeM: game.shots.filter((s) => s.type === "three" && s.made).length,
    reb: game.rebounds.off + game.rebounds.def,
    oreb: game.rebounds.off,
    dreb: game.rebounds.def,
    stl: game.steals,
    dfl: game.deflections,
    ast: game.assists,
    made: made.length,
    missed: missed.length,
  };
};

const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

export default function App() {
  const [view, setView] = useState("overview");
  const [activeSeason, setActiveSeason] = useState("summer_school");
  const [games, setGames] = useState([]);
  const [currentGame, setCurrentGame] = useState(null);
  const [editingGame, setEditingGame] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await window.storage.get("bball_games");
        if (r && r.value) setGames(JSON.parse(r.value));
      } catch {}
      setLoaded(true);
    };
    load();
  }, []);

  const save = useCallback(async (g) => {
    try {
      await window.storage.set("bball_games", JSON.stringify(g));
    } catch {}
  }, []);

  const updateGames = (g) => {
    setGames(g);
    save(g);
  };

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
    setCurrentGame(null);
    setView("history");
  };

  const deleteGame = (id) => {
    const updated = games.filter((g) => g.id !== id);
    updateGames(updated);
  };

  const seasonGames = (sid) => games.filter((g) => g.season === sid);

  if (!loaded) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--color-text-secondary)" }}>
        <i className="ti ti-loader" style={{ fontSize: 28 }} aria-hidden></i>
        <p>Loading your stats...</p>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 700, margin: "0 auto", padding: "1rem" }}>
      <h2 className="sr-only">Basketball Stats Tracker</h2>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#D85A30", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className="ti ti-ball-basketball" style={{ fontSize: 22, color: "#fff" }} aria-hidden></i>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>Player Stats Tracker</h1>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-secondary)" }}>Track performance across all seasons</p>
        </div>
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
            onClick={() => {
              if (n.id === "live" && !currentGame) startNewGame();
              else setView(n.id);
            }}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--border-radius-md)",
              border: view === n.id ? "1.5px solid #D85A30" : "0.5px solid var(--color-border-secondary)",
              background: view === n.id ? "rgba(216,90,48,0.08)" : "var(--color-background-primary)",
              color: view === n.id ? "#993C1D" : "var(--color-text-primary)",
              fontWeight: view === n.id ? 500 : 400,
              cursor: "pointer",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className={`ti ${n.icon}`} style={{ fontSize: 16 }} aria-hidden></i>
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
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: "var(--border-radius-md)",
                border: activeSeason === s.id ? `1.5px solid ${s.color}` : "0.5px solid var(--color-border-tertiary)",
                background: activeSeason === s.id ? `${s.color}18` : "var(--color-background-secondary)",
                color: activeSeason === s.id ? s.color : "var(--color-text-secondary)",
                fontWeight: activeSeason === s.id ? 500 : 400,
                cursor: "pointer",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <i className={`ti ${s.icon}`} style={{ fontSize: 15 }} aria-hidden></i>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* VIEWS */}
      {view === "overview" && <OverviewView games={seasonGames(activeSeason)} season={SEASONS.find((s) => s.id === activeSeason)} />}
      {view === "live" && (
        <LiveGameView
          game={currentGame}
          setGame={setCurrentGame}
          onFinish={finishGame}
          onCancel={() => { setCurrentGame(null); setView("history"); }}
          activeSeason={activeSeason}
        />
      )}
      {view === "history" && (
        <HistoryView
          games={seasonGames(activeSeason)}
          season={SEASONS.find((s) => s.id === activeSeason)}
          onDelete={deleteGame}
          onEdit={(g) => { setEditingGame(g); }}
          editingGame={editingGame}
          setEditingGame={setEditingGame}
          onSaveEdit={(g) => {
            const updated = [...games.filter((x) => x.id !== g.id), g];
            updateGames(updated);
            setEditingGame(null);
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "14px 16px" }}>
      <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 400 }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 500, color: "var(--color-text-primary)" }}>{value}</p>
      {sub && <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-text-tertiary)" }}>{sub}</p>}
    </div>
  );
}

function OverviewView({ games, season }) {
  if (games.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
        <i className="ti ti-clipboard-list" style={{ fontSize: 40, display: "block", marginBottom: 12 }} aria-hidden></i>
        <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>No games logged yet</p>
        <p style={{ fontSize: 14 }}>Start tracking games to see season averages here.</p>
      </div>
    );
  }

  const allStats = games.map(calcGameStats);
  const gp = games.length;

  const avgStat = (key) => (avg(allStats.map((s) => s[key]))).toFixed(1);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>Season averages</h2>
        <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{gp} game{gp !== 1 ? "s" : ""}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: "1.5rem" }}>
        <StatCard label="Points" value={avgStat("pts")} sub="per game" />
        <StatCard label="FG%" value={`${Math.round(avg(allStats.map((s) => s.fgPct)))}%`} sub={`${avgStat("fgm")}/${avgStat("fga")} avg`} />
        <StatCard label="3PT%" value={`${Math.round(avg(allStats.map((s) => s.threeA ? Math.round((s.threeM / s.threeA) * 100) : 0)))}%`} sub={`${avgStat("threeM")}/${avgStat("threeA")} avg`} />
        <StatCard label="FT%" value={`${Math.round(avg(allStats.map((s) => s.ftPct)))}%`} sub={`${avgStat("ftm")}/${avgStat("fta")} avg`} />
        <StatCard label="Rebounds" value={avgStat("reb")} sub={`${avgStat("oreb")} off / ${avgStat("dreb")} def`} />
        <StatCard label="Assists" value={avgStat("ast")} sub="per game" />
        <StatCard label="Steals" value={avgStat("stl")} sub="per game" />
        <StatCard label="Deflections" value={avgStat("dfl")} sub="per game" />
      </div>

      {/* Shot breakdown */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>Shot breakdown per game</h3>
        {SHOT_TYPES.map((st) => {
          const attempts = avg(allStats.map((s) => s[st.id + "A"] ?? games.reduce((tot, g) => tot + g.shots.filter((sh) => sh.type === st.id).length, 0) / gp));
          const made = avg(games.map((g) => g.shots.filter((sh) => sh.type === st.id && sh.made).length));
          const pct = attempts > 0 ? Math.round((made / attempts) * 100) : 0;
          const totalAttempts = games.reduce((tot, g) => tot + g.shots.filter((sh) => sh.type === st.id).length, 0);
          const totalMade = games.reduce((tot, g) => tot + g.shots.filter((sh) => sh.type === st.id && sh.made).length, 0);
          const realPct = totalAttempts > 0 ? Math.round((totalMade / totalAttempts) * 100) : 0;
          return (
            <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", width: 80, flexShrink: 0 }}>{st.label}</span>
              <div style={{ flex: 1, height: 6, background: "var(--color-background-secondary)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${realPct}%`, background: season.color, borderRadius: 3, transition: "width 0.4s" }} />
              </div>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", width: 80, textAlign: "right", flexShrink: 0 }}>
                {totalMade}/{totalAttempts} ({realPct}%)
              </span>
            </div>
          );
        })}
      </div>

      {/* Game log mini */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Recent games</h3>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ color: "var(--color-text-secondary)" }}>
              <th style={{ textAlign: "left", fontWeight: 400, paddingBottom: 8, width: "25%" }}>Date</th>
              <th style={{ textAlign: "left", fontWeight: 400, paddingBottom: 8, width: "25%" }}>Opponent</th>
              <th style={{ textAlign: "right", fontWeight: 400, paddingBottom: 8, width: "12%" }}>PTS</th>
              <th style={{ textAlign: "right", fontWeight: 400, paddingBottom: 8, width: "12%" }}>REB</th>
              <th style={{ textAlign: "right", fontWeight: 400, paddingBottom: 8, width: "12%" }}>AST</th>
              <th style={{ textAlign: "right", fontWeight: 400, paddingBottom: 8, width: "14%" }}>FG%</th>
            </tr>
          </thead>
          <tbody>
            {[...games].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).map((g) => {
              const s = calcGameStats(g);
              return (
                <tr key={g.id} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                  <td style={{ padding: "8px 0", color: "var(--color-text-secondary)" }}>{g.date}</td>
                  <td style={{ padding: "8px 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.opponent || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: 500, color: season.color }}>{s.pts}</td>
                  <td style={{ textAlign: "right" }}>{s.reb}</td>
                  <td style={{ textAlign: "right" }}>{s.ast}</td>
                  <td style={{ textAlign: "right", color: "var(--color-text-secondary)" }}>{s.fgPct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LiveGameView({ game, setGame, onFinish, onCancel, activeSeason }) {
  const [lastAction, setLastAction] = useState(null);

  if (!game) return null;

  const logShot = (type, made) => {
    const shot = { id: Date.now().toString(), type, made, time: new Date().toISOString() };
    setGame({ ...game, shots: [...game.shots, shot] });
    setLastAction(`${made ? "✓" : "✗"} ${SHOT_TYPES.find((s) => s.id === type).label}`);
    setTimeout(() => setLastAction(null), 1500);
  };

  const undoLast = () => {
    if (game.shots.length === 0) return;
    setGame({ ...game, shots: game.shots.slice(0, -1) });
  };

  const incStat = (key, sub) => {
    if (sub) {
      setGame({ ...game, rebounds: { ...game.rebounds, [sub]: game.rebounds[sub] + 1 } });
    } else {
      setGame({ ...game, [key]: game[key] + 1 });
    }
  };

  const decStat = (key, sub) => {
    if (sub) {
      setGame({ ...game, rebounds: { ...game.rebounds, [sub]: Math.max(0, game.rebounds[sub] - 1) } });
    } else {
      setGame({ ...game, [key]: Math.max(0, game[key] - 1) });
    }
  };

  const s = calcGameStats(game);
  const season = SEASONS.find((x) => x.id === game.season) || SEASONS[0];

  return (
    <div>
      {/* Game info bar */}
      <div style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", padding: "12px 16px", marginBottom: "1rem", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Date</label>
          <input type="date" value={game.date} onChange={(e) => setGame({ ...game, date: e.target.value })} style={{ fontSize: 13, width: "100%" }} />
        </div>
        <div style={{ flex: 2, minWidth: 160 }}>
          <label style={{ fontSize: 11, color: "var(--color-text-secondary)", display: "block", marginBottom: 4 }}>Opponent</label>
          <input type="text" value={game.opponent} onChange={(e) => setGame({ ...game, opponent: e.target.value })} placeholder="Opponent name" style={{ fontSize: 13, width: "100%" }} />
        </div>
      </div>

      {/* Live score bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", padding: "12px 16px", background: `${season.color}15`, borderRadius: "var(--border-radius-lg)", border: `0.5px solid ${season.color}40` }}>
        <div>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Points</p>
          <p style={{ margin: 0, fontSize: 36, fontWeight: 500, color: season.color }}>{s.pts}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>FG</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>{s.fgm}/{s.fga}</p>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{s.fgPct}%</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>Shots logged</p>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>{game.shots.length}</p>
        </div>
      </div>

      {/* Last action toast */}
      {lastAction && (
        <div style={{ textAlign: "center", marginBottom: 8, fontSize: 14, fontWeight: 500, color: lastAction.startsWith("✓") ? "var(--color-text-success)" : "var(--color-text-danger)", transition: "opacity 0.3s" }}>
          {lastAction}
        </div>
      )}

      {/* Shot tracking */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>Log a shot</h3>
          {game.shots.length > 0 && (
            <button onClick={undoLast} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <i className="ti ti-arrow-back-up" aria-hidden></i> Undo last
            </button>
          )}
        </div>
        {SHOT_TYPES.map((st) => {
          const att = game.shots.filter((s) => s.type === st.id).length;
          const made = game.shots.filter((s) => s.type === st.id && s.made).length;
          return (
            <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)", width: 90, flexShrink: 0 }}>{st.label}</span>
              <div style={{ display: "flex", gap: 8, flex: 1 }}>
                <button onClick={() => logShot(st.id, true)} style={{ flex: 1, padding: "10px 0", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-success)", color: "var(--color-text-success)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <i className="ti ti-check" aria-hidden></i> Make
                </button>
                <button onClick={() => logShot(st.id, false)} style={{ flex: 1, padding: "10px 0", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-danger)", color: "var(--color-text-danger)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
                  <i className="ti ti-x" aria-hidden></i> Miss
                </button>
              </div>
              <span style={{ fontSize: 12, color: "var(--color-text-secondary)", width: 60, textAlign: "right", flexShrink: 0 }}>{made}/{att}</span>
            </div>
          );
        })}
      </div>

      {/* Other stats */}
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem", marginBottom: "1rem" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 500 }}>Other stats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          {[
            { label: "Off. rebounds", key: "reb", sub: "off", val: game.rebounds.off },
            { label: "Def. rebounds", key: "reb", sub: "def", val: game.rebounds.def },
            { label: "Steals", key: "steals", val: game.steals },
            { label: "Deflections", key: "deflections", val: game.deflections },
            { label: "Assists", key: "assists", val: game.assists },
          ].map((item) => (
            <div key={item.label} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-secondary)" }}>{item.label}</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{item.val}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <button onClick={() => incStat(item.key, item.sub)} style={{ width: 30, height: 30, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 16, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <button onClick={() => decStat(item.key, item.sub)} style={{ width: 30, height: 30, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-primary)", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ fontSize: 13, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Notes (optional)</label>
        <textarea value={game.notes} onChange={(e) => setGame({ ...game, notes: e.target.value })} placeholder="Add game notes..." rows={2} style={{ width: "100%", fontSize: 13, borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", padding: "8px 12px", background: "var(--color-background-primary)", color: "var(--color-text-primary)", resize: "vertical", boxSizing: "border-box" }} />
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onFinish} style={{ flex: 2, padding: "12px 0", borderRadius: "var(--border-radius-md)", border: `1.5px solid ${season.color}`, background: season.color, color: "#fff", fontWeight: 500, cursor: "pointer", fontSize: 15 }}>
          Save game
        </button>
        <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-secondary)", background: "none", color: "var(--color-text-secondary)", cursor: "pointer", fontSize: 14 }}>
          Discard
        </button>
      </div>
    </div>
  );
}

function HistoryView({ games, season, onDelete, onEdit, editingGame, setEditingGame, onSaveEdit }) {
  const [expandedId, setExpandedId] = useState(null);

  const sorted = [...games].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-secondary)" }}>
        <i className="ti ti-history" style={{ fontSize: 40, display: "block", marginBottom: 12 }} aria-hidden></i>
        <p style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>No games yet this season</p>
        <p style={{ fontSize: 14 }}>Log your first game using "New game" above.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ margin: "0 0 1rem", fontSize: 16, fontWeight: 500, color: "var(--color-text-primary)" }}>Game log — {games.length} game{games.length !== 1 ? "s" : ""}</h2>
      {sorted.map((g) => {
        const s = calcGameStats(g);
        const isOpen = expandedId === g.id;
        return (
          <div key={g.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", marginBottom: 10, overflow: "hidden" }}>
            <div
              onClick={() => setExpandedId(isOpen ? null : g.id)}
              style={{ padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{g.opponent || "Unnamed game"}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{g.date}</span>
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 13, color: "var(--color-text-secondary)" }}>
                  <span style={{ color: season.color, fontWeight: 500 }}>{s.pts} pts</span>
                  <span>{s.fgm}/{s.fga} FG ({s.fgPct}%)</span>
                  <span>{s.reb} reb</span>
                  <span>{s.ast} ast</span>
                </div>
              </div>
              <i className={`ti ti-chevron-${isOpen ? "up" : "down"}`} style={{ fontSize: 16, color: "var(--color-text-secondary)" }} aria-hidden></i>
            </div>

            {isOpen && (
              <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", padding: "14px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 8, marginBottom: 14 }}>
                  {[
                    { l: "Points", v: s.pts },
                    { l: "FG", v: `${s.fgm}/${s.fga}` },
                    { l: "FG%", v: `${s.fgPct}%` },
                    { l: "3PT", v: `${s.threeM}/${s.threeA}` },
                    { l: "FT", v: `${s.ftm}/${s.fta}` },
                    { l: "Off. reb", v: s.oreb },
                    { l: "Def. reb", v: s.dreb },
                    { l: "Total reb", v: s.reb },
                    { l: "Assists", v: s.ast },
                    { l: "Steals", v: s.stl },
                    { l: "Deflections", v: s.dfl },
                  ].map((item) => (
                    <div key={item.l} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "8px 10px" }}>
                      <p style={{ margin: 0, fontSize: 10, color: "var(--color-text-secondary)" }}>{item.l}</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{item.v}</p>
                    </div>
                  ))}
                </div>

                {/* Shot breakdown */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--color-text-secondary)" }}>Shot breakdown</p>
                  {SHOT_TYPES.map((st) => {
                    const att = g.shots.filter((sh) => sh.type === st.id).length;
                    const made = g.shots.filter((sh) => sh.type === st.id && sh.made).length;
                    if (att === 0) return null;
                    const pct = att ? Math.round((made / att) * 100) : 0;
                    return (
                      <div key={st.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)", width: 80, flexShrink: 0 }}>{st.label}</span>
                        <div style={{ flex: 1, height: 5, background: "var(--color-background-secondary)", borderRadius: 3 }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: season.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", width: 70, textAlign: "right" }}>{made}/{att} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>

                {g.notes && (
                  <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--color-text-secondary)", fontStyle: "italic" }}>{g.notes}</p>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onDelete(g.id)} style={{ padding: "6px 14px", borderRadius: "var(--border-radius-md)", border: "0.5px solid var(--color-border-danger)", background: "var(--color-background-danger)", color: "var(--color-text-danger)", cursor: "pointer", fontSize: 13 }}>
                    <i className="ti ti-trash" aria-hidden></i> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
