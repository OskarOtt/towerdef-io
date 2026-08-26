import { useCallback, useEffect, useState } from "react";
import "./App.css";
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
import { towerDefById, AUTO_START_DELAY_MS } from "./game/constants";
import { TowerUpgradePanel } from "./components/TowerUpgradePanel";
import {
  emptyUpgrades,
  upgradeCost,
  sellValue,
  type UpgradeStat,
} from "./game/upgrades";

type Screen = "welcome" | "playing";

function App() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [hasSave] = useState<boolean>(() => hasSavedGame());
  const [state, setState] = useState<GameState>(
    () => loadGameState() ?? createNewGameState(),
  );
  const [speed, setSpeed] = useState(1);
  const [draggingDefId, setDraggingDefId] = useState<string | null>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [autoStart, setAutoStart] = useState(false);
  const [autoStartRemainingMs, setAutoStartRemainingMs] = useState<number | null>(null);

  const handleStartNew = useCallback(() => {
    const fresh = createNewGameState();
    setState(fresh);
    clearGameState();
    setScreen("playing");
  }, []);

  const handleResume = useCallback(() => {
    const saved = loadGameState();
    setState(saved ?? createNewGameState());
    setScreen("playing");
  }, []);

  // Autosave whenever state changes while playing.
  useEffect(() => {
    if (screen === "playing") {
      saveGameState(state);
    }
  }, [state, screen]);

  const running = screen === "playing" && !state.gameOver;
  useGameLoop(running, (dt) => {
    setState((prev) => stepGame(prev, dt * speed));
  });

  const handleStartWave = useCallback(() => {
    setState((prev) => startNextWave(prev));
  }, []);

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

  const handleDropTower = useCallback((row: number, col: number, defId: string) => {
    setState((prev) => {
      const def = towerDefById(defId);
      if (!def) return prev;
      if (prev.gold < def.cost) return prev;
      if (prev.towers.some((t) => t.row === row && t.col === col)) return prev;
      return {
        ...prev,
        gold: prev.gold - def.cost,
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

  const handleSellTower = useCallback((id: string) => {
    setState((prev) => {
      const tower = prev.towers.find((t) => t.id === id);
      if (!tower) return prev;
      return {
        ...prev,
        gold: prev.gold + sellValue(tower),
        towers: prev.towers.filter((t) => t.id !== id),
      };
    });
    setSelectedTowerId(null);
  }, []);

  const handleNewGameFromGameOver = useCallback(() => {
    clearGameState();
    setState(createNewGameState());
  }, []);

  return (
    <div className="app-root">
      <div className="crt-scanlines" />
      <header className="app-header">
        <span>&gt;&gt; TOWERDEF.IO_TERMINAL DEFENSE SYSTEM</span>
      </header>
      <main
        className={`app-main${screen === "welcome" ? " app-main-dimmed" : ""}`}
        onClick={() => handleSelectTower(null)}
      >
        <TowerShop gold={state.gold} onDragStateChange={setDraggingDefId} />
        <GameBoard
          state={state}
          onDropTower={handleDropTower}
          draggingTower={draggingDefId !== null}
          draggingDefId={draggingDefId}
          selectedTowerId={selectedTowerId}
          onSelectTower={handleSelectTower}
        />
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
            <div onClick={(e) => e.stopPropagation()}>
              <TowerUpgradePanel
                tower={state.towers.find((t) => t.id === selectedTowerId) ?? null}
                gold={state.gold}
                onUpgrade={(stat) => handleUpgradeTower(selectedTowerId, stat)}
                onSell={() => handleSellTower(selectedTowerId)}
                onClose={() => handleSelectTower(null)}
              />
            </div>
          )}
        </div>
      </main>
      {screen === "welcome" && (
        <WelcomeModal
          hasSave={hasSave}
          onStartNew={handleStartNew}
          onResume={handleResume}
        />
      )}
    </div>
  );
}

export default App;
