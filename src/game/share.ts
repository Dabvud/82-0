import type { SeasonLog } from "./season";
import type { Player } from "./types";

const surname = (player: Player): string => {
  const parts = player.name.trim().split(/\s+/);
  if (parts.length > 1 && /^(?:Jr\.?|Sr\.?|II|III|IV|V)$/i.test(parts.at(-1)!)) parts.pop();
  return parts.at(-1) ?? player.name;
};

export function shareText(n: number | null, log: SeasonLog, lineup: Player[]): string {
  const emoji = log.wins === 82 ? "💯" : log.wins >= 74 ? "🏆" : "🏀";
  const lines = [`82-0${n === null ? "" : ` #${n}`} · ${log.wins}-${log.losses} ${emoji}`,
    lineup.map(surname).join(", ")];
  for (const event of log.events) {
    if (event.kind === "trade") lines.push(`🔁 Trade: ${surname(event.out)} → ${surname(event.in)}`);
    if (event.kind === "bankrupt") {
      const games = log.games.filter(game => game.game <= event.afterGame);
      const wins = games.filter(game => game.win).length;
      lines.push(`💸 Pleite bei ${wins}-${games.length - wins}`);
    }
  }
  return [...lines, "https://dabvud.github.io/82-0/"].join("\n");
}
