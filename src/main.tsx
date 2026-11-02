import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import type { GameData } from "./app-data";
import { BUDGET, LUXURY_LINE, PLAYERS, TEAMS } from "./data";
import "./styles.css";
import { captureInstallPrompt } from "./install";

captureInstallPrompt();

const data: GameData = { pool: PLAYERS, teams: TEAMS, budget: BUDGET, luxuryLine: LUXURY_LINE };

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App data={data} />
  </StrictMode>,
);
