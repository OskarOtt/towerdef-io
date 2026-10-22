import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { AchievementsModal } from "./components/AchievementsModal";
import { LeaderboardModal } from "./components/LeaderboardModal";
import { HowToPlayModal } from "./components/HowToPlayModal";
import { AchievementToast } from "./components/AchievementToast";
import { WelcomeModal } from "./components/WelcomeModal";
import { GameBoard } from "./components/GameBoard";
import { TowerShop } from "./components/TowerShop";
import { Hud } from "./components/Hud";
import type { GameState } from "./game/types";
import {
  createNewGameState,
  hasSavedGame,
  loadGameState,
  saveGameState,
  clearGameState,
} from "./game/storage";
import { stepGame, startNextWave, useGameLoop } from "./game/useGameLoop";
import { towerDefById, AUTO_START_DELAY_MS, STACKER_ID, STACKER_UPGRADE_COST } from "./game/constants";
import { canPlaceAt, towersAt } from "./game/stacking";
import {
  clearRun,
  loadLeaderboardName,
  normalizeName,
  saveLeaderboardName,
} from "./game/leaderboardStorage";
import { submitCurrentScore } from "./game/leaderboardSync";
import { TowerUpgradePanel } from "./components/TowerUpgradePanel";
import {
  emptyUpgrades,
  upgradeCost,
  sellValue,
  type UpgradeStat,
} from "./game/upgrades";
import {
  newlyUnlockedAchievements,
  type AchievementDefinition,
  type AchievementId,
} from "./game/achievements";
import {
  loadEarnedAchievements,
  saveEarnedAchievements,
} from "./game/achievementStorage";

type Screen = "welcome" | "playing";

const LEADERBOARD_SYNC_INTERVAL_MS = 5 * 60 * 1000;

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [hasSave] = useState<boolean>(() => hasSavedGame());
  const [state, setState] = useState<GameState>(
    () => loadGameState() ?? createNewGameState(),
  );
  const [speed, setSpeed] = useState(1);
  const [draggingDefId, setDraggingDefId] = useState<string | null>(null);
  // Tap-to-select-then-tap-to-place flow (used on touch devices where HTML5
  // drag-and-drop doesn't work reliably), independent from draggingDefId.
  const [selectedShopDefId, setSelectedShopDefId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [autoStartRemainingMs, setAutoStartRemainingMs] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardName, setLeaderboardName] = useState<string | null>(() =>
    loadLeaderboardName(),
  );
  const stateRef = useRef(state);
  const nameRef = useRef(leaderboardName);
  useEffect(() => {
    stateRef.current = state;
    nameRef.current = leaderboardName;
  }, [state, leaderboardName]);
  const lastSentRef = useRef<string | null>(null);
  const [earnedAchievementIds, setEarnedAchievementIds] = useState<AchievementId[]>(
    () => loadEarnedAchievements(),
  );
  const [achievementQueue, setAchievementQueue] = useState<AchievementDefinition[]>([]);
  const [achievementTimerFraction, setAchievementTimerFraction] = useState<number | null>(null);

  const handleStartNew = useCallback((name: string) => {
    saveLeaderboardName(name);
    setLeaderboardName(name);
    clearRun();
    lastSentRef.current = null;
    const fresh = createNewGameState();
    setState(fresh);
    clearGameState();
    setScreen("playing");
    setMenuOpen(false);
  }, []);

  const handleResume = useCallback((name: string | null) => {
    if (name) {
      saveLeaderboardName(name);
      setLeaderboardName(name);
      nameRef.current = name;
    }
    const saved = loadGameState();
    setState(saved ?? createNewGameState());
    setScreen("playing");
    setMenuOpen(false);
  }, []);

  // Autosave whenever state changes while playing.
  useEffect(() => {
    if (screen === "playing") {
      saveGameState(state);
    }
  }, [state, screen]);

  useEffect(() => {
    saveEarnedAchievements(earnedAchievementIds);
  }, [earnedAchievementIds]);

  useEffect(() => {
    if (screen !== "playing") return;
    const unlocked = newlyUnlockedAchievements(state, earnedAchievementIds);
    if (unlocked.length === 0) return;
    setEarnedAchievementIds((previous) => [
      ...previous,
      ...unlocked.map((achievement) => achievement.id),
    ]);
    setAchievementQueue((previous) => [...previous, ...unlocked]);
  }, [state, screen, earnedAchievementIds]);

  const activeAchievement = achievementQueue[0] ?? null;

  useEffect(() => {
    if (!activeAchievement) {
      setAchievementTimerFraction(null);
      return;
    }
    const durationMs = 5000;
    const startTime = performance.now();
    let raf = 0;
    const tick = () => {
      const remaining = Math.max(0, durationMs - (performance.now() - startTime));
      setAchievementTimerFraction(remaining / durationMs);
      if (remaining <= 0) {
        setAchievementQueue((previous) => previous.slice(1));
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [activeAchievement]);

  const running = screen === "playing" && !state.gameOver;
  useGameLoop(running, (dt) => {
    setState((prev) => stepGame(prev, dt * speed));
  });

  const handleStartWave = useCallback(() => {
    setState((prev) => startNextWave(prev));
  }, []);

  // Dev-only cheat: "+" grants 1000 gold. Stripped from production builds.
  useEffect(() => {
    if (!import.meta.env.DEV || screen !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "+") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      setState((prev) => ({ ...prev, gold: prev.gold + 1000 }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen]);

  // Autostart: while enabled and no wave is running, count down and then
  // kick off the next wave automatically. Cancels/resets whenever a wave
  // starts, autostart is turned off, or the game ends.
  useEffect(() => {
    if (!autoStart || screen !== "playing" || state.gameOver || state.waveInProgress) {
      setAutoStartRemainingMs(null);
      return;
    }
    const startTime = performance.now();
    setAutoStartRemainingMs(AUTO_START_DELAY_MS);
    let raf = 0;
    const tick = () => {
      const remaining = Math.max(0, AUTO_START_DELAY_MS - (performance.now() - startTime));
      setAutoStartRemainingMs(remaining);
      if (remaining <= 0) {
        handleStartWave();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoStart, screen, state.gameOver, state.waveInProgress, handleStartWave]);

  // Auto-disable autoStart when the tab is hidden (backgrounded/minimized),
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAutoStart((prev) => (prev ? false : prev));
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const handleDropTower = useCallback((row: number, col: number, defId: string) => {
    setState((prev) => {
      const def = towerDefById(defId);
      if (!def) return prev;
      if (prev.gold < def.cost) return prev;
      if (!canPlaceAt(prev.towers, row, col, defId)) return prev;
      return {
        ...prev,
        gold: prev.gold - def.cost,
        spentSinceWaveClear: true,
        godTowersPlaced: prev.godTowersPlaced + (defId === "god" ? 1 : 0),
        towers: [
          ...prev.towers,
          {
            id: `tower-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            defId,
            row,
            col,
            upgrades: emptyUpgrades(),
            totalSpent: def.cost,
            cooldown: 0,
          },
        ],
      };
    });
  }, []);

  const handleSelectTower = useCallback((id: string | null) => {
    setSelectedTowerId(id);
  }, []);

  const handleSelectShopDef = useCallback((defId: string | null) => {
    setSelectedShopDefId((prev) => (prev === defId ? null : defId));
  }, []);

  const handleTapPlaceTower = useCallback(
    (row: number, col: number) => {
      if (!selectedShopDefId) return;
      handleDropTower(row, col, selectedShopDefId);
      setSelectedShopDefId(null);
    },
    [selectedShopDefId, handleDropTower],
  );

  const handleUpgradeTower = useCallback((id: string, stat: UpgradeStat) => {
    setState((prev) => {
      const tower = prev.towers.find((t) => t.id === id);
      if (!tower) return prev;
      const def = towerDefById(tower.defId);
      if (!def) return prev;
      const cost = upgradeCost(def, tower.upgrades[stat]);
      if (prev.gold < cost) return prev;
      return {
        ...prev,
        gold: prev.gold - cost,
        spentSinceWaveClear: true,
        towers: prev.towers.map((t) =>
          t.id === id
            ? {
                ...t,
                upgrades: { ...t.upgrades, [stat]: t.upgrades[stat] + 1 },
                totalSpent: t.totalSpent + cost,
              }
            : t,
        ),
      };
    });
  }, []);

  const handleUpgradeStacker = useCallback((id: string) => {
    setState((prev) => {
      const tower = prev.towers.find((t) => t.id === id);
      if (!tower || tower.defId !== STACKER_ID || tower.stackUpgraded) return prev;
      if (prev.gold < STACKER_UPGRADE_COST) return prev;
      return {
        ...prev,
        gold: prev.gold - STACKER_UPGRADE_COST,
        spentSinceWaveClear: true,
        towers: prev.towers.map((t) =>
          t.id === id
            ? { ...t, stackUpgraded: true, totalSpent: t.totalSpent + STACKER_UPGRADE_COST }
            : t,
        ),
      };
    });
  }, []);

  const handleSellTower = useCallback((id: string) => {
    let sold = false;
    setState((prev) => {
      const tower = prev.towers.find((t) => t.id === id);
      if (!tower) return prev;
      if (tower.defId === STACKER_ID && towersAt(prev.towers, tower.row, tower.col).length > 2) {
        return prev;
      }
      sold = true;
      return {
        ...prev,
        gold: prev.gold + sellValue(tower),
        towers: prev.towers.filter((t) => t.id !== id),
      };
    });
    if (sold) setSelectedTowerId(null);
  }, []);

  const handleSetLeaderboardName = useCallback((name: string) => {
    const clean = normalizeName(name);
    if (!clean) return;
    saveLeaderboardName(clean);
    setLeaderboardName(clean);
    nameRef.current = clean;
    void submitCurrentScore(clean, stateRef.current);
  }, []);

  const handleUpdateScore = useCallback(() => {
    const snapshot = stateRef.current;
    return submitCurrentScore(nameRef.current, snapshot).then((result) => {
      if (result === "ok") lastSentRef.current = `${snapshot.wave}:${snapshot.killCount}`;
      return result;
    });
  }, []);

  // Push the score every few minutes while playing (and once on game over),
  // skipping when there is no leaderboard name or nothing changed.
  useEffect(() => {
    if (screen !== "playing") return;
    const send = () => {
      const s = stateRef.current;
      const key = `${s.wave}:${s.killCount}`;
      if (!nameRef.current || key === lastSentRef.current) return;
      void submitCurrentScore(nameRef.current, s).then((result) => {
        if (result === "ok") lastSentRef.current = key;
      });
    };
    const id = window.setInterval(send, LEADERBOARD_SYNC_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [screen]);

  useEffect(() => {
    if (screen === "playing" && state.gameOver && nameRef.current) {
      void handleUpdateScore();
    }
  }, [screen, state.gameOver, handleUpdateScore]);

  const handleNewGameFromGameOver = useCallback(() => {
    clearRun();
    lastSentRef.current = null;
    clearGameState();
    setState(createNewGameState());
  }, []);

  return (
    <div className="app-root">
      <div className="crt-scanlines" />
      <header className="app-header">
        <h1>&gt;&gt; TOWERDEF.IO_TERMINAL DEFENSE SYSTEM</h1>
        <div className="header-actions">
          <button
            className="term-btn term-btn-small header-how-to-play-btn"
            onClick={() => {
              setMenuOpen(false);
              setHowToPlayOpen(true);
            }}
          >
            [ HOW TO PLAY ]
          </button>
          <button
            className="term-btn term-btn-small header-leaderboard-btn"
            onClick={() => {
              setMenuOpen(false);
              setLeaderboardOpen(true);
            }}
          >
            [ LEADERBOARD ]
          </button>
          <button
            className="term-btn term-btn-small header-achievements-btn"
            onClick={() => {
              setMenuOpen(false);
              setAchievementsOpen(true);
            }}
          >
            [ ACHIEVEMENTS ]
          </button>
          <button className="term-btn term-btn-small" onClick={() => setMenuOpen(true)}>
            [ MENU ]
          </button>
        </div>
      </header>
      <main
        className={`app-main${screen === "welcome" ? " app-main-dimmed" : ""}`}
        onClick={() => handleSelectTower(null)}
      >
        <TowerShop
          gold={state.gold}
          onDragStateChange={setDraggingDefId}
          selectedDefId={selectedShopDefId}
          onSelectDef={handleSelectShopDef}
        />
        <div className="board-column">
          <GameBoard
            state={state}
            onDropTower={handleDropTower}
            draggingTower={draggingDefId !== null}
            draggingDefId={draggingDefId}
            selectedTowerId={selectedTowerId}
            onSelectTower={handleSelectTower}
            selectedShopDefId={selectedShopDefId}
            onTapPlaceTower={handleTapPlaceTower}
          />
          <div className="achievement-toast-slot">
            {activeAchievement && achievementTimerFraction !== null && (
              <AchievementToast
                achievement={activeAchievement}
                remainingFraction={achievementTimerFraction}
                onDismiss={() =>
                  setAchievementQueue((previous) => previous.slice(1))
                }
              />
            )}
          </div>
        </div>
        <div className="hud-column">
          <Hud
            gold={state.gold}
            lives={state.lives}
            wave={state.wave}
            killCount={state.killCount}
            waveInProgress={state.waveInProgress}
            gameOver={state.gameOver}
            speed={speed}
            autoStart={autoStart}
            autoStartFraction={
              autoStartRemainingMs !== null ? autoStartRemainingMs / AUTO_START_DELAY_MS : null
            }
            onStartWave={handleStartWave}
            onNewGame={handleNewGameFromGameOver}
            onSetSpeed={setSpeed}
            onToggleAutoStart={setAutoStart}
          />
          {selectedTowerId && (
            <div
              className="upgrade-panel-wrap"
              onClick={(e) => {
                e.stopPropagation();
                // On mobile this wrapper is a full-screen backdrop; a click
                // directly on the backdrop (not bubbled from the panel
                // itself) dismisses it, same as the other modals.
                if (e.target === e.currentTarget) handleSelectTower(null);
              }}
            >
              <TowerUpgradePanel
                tower={state.towers.find((t) => t.id === selectedTowerId) ?? null}
                cellTowers={(() => {
                  const sel = state.towers.find((t) => t.id === selectedTowerId);
                  return sel ? towersAt(state.towers, sel.row, sel.col) : [];
                })()}
                onSelectTab={handleSelectTower}
                onUpgradeStacker={() => handleUpgradeStacker(selectedTowerId)}
                gold={state.gold}
                onUpgrade={(stat) => handleUpgradeTower(selectedTowerId, stat)}
                onSell={() => handleSellTower(selectedTowerId)}
                onClose={() => handleSelectTower(null)}
              />
            </div>
          )}
        </div>
      </main>
      {(screen === "welcome" || menuOpen) && (
        <WelcomeModal
          hasSave={hasSave || screen === "playing"}
          initialName={leaderboardName}
          onStartNew={handleStartNew}
          onResume={handleResume}
        />
      )}
      {achievementsOpen && (
        <AchievementsModal
          earnedIds={earnedAchievementIds}
          onClose={() => setAchievementsOpen(false)}
        />
      )}
      {leaderboardOpen && (
        <LeaderboardModal
          name={leaderboardName}
          canSubmit={screen === "playing"}
          onSetName={handleSetLeaderboardName}
          onUpdateScore={handleUpdateScore}
          onClose={() => setLeaderboardOpen(false)}
        />
      )}
      {howToPlayOpen && <HowToPlayModal onClose={() => setHowToPlayOpen(false)} />}
      <details className="seo-info">
        <summary>About Towerdef.io</summary>
        <p>
          Towerdef.io is a free, no-download, no-signup browser tower defense game with a
          retro terminal/CRT theme. Place and upgrade towers, earn gold, and survive
          escalating enemy waves &mdash; see the{" "}
          <a href="/how-to-play.html">how to play guide</a> or the{" "}
          <a href="/towers.html">tower guide</a> for strategy tips.
        </p>
      </details>
      <footer className="app-footer">
        [ Made by{" "}
        <a href="https://www.oskott.com/" target="_blank" rel="noopener noreferrer">
          oskott
        </a>{" "}
        ]
      </footer>
    </div>
  );
}

export default App;
