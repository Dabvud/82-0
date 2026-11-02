// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { loadSources, parseCsv } from "../../scripts/lib/sources";

const folders: string[] = [];
afterEach(() => folders.splice(0).forEach(dir => rmSync(dir, { recursive: true, force: true })));

describe("parseCsv", () => {
  it("liest BOM, CRLF, Kommas, doppelte Anführungszeichen und Zeilenumbrüche in Feldern", () => {
    expect(parseCsv('\uFEFFid,name,note\r\n1,"Last, First","sagt ""ja"""\r\n2,Other,"zwei\nZeilen"\r\n'))
      .toEqual([
        { id: "1", name: "Last, First", note: 'sagt "ja"' },
        { id: "2", name: "Other", note: "zwei\nZeilen" },
      ]);
  });
});

describe("loadSources", () => {
  it("nimmt die größte Spielzahl, trennt NBA/BAA von ABA und ergänzt historische Liga-Lücken", () => {
    const dir = mkdtempSync(join(tmpdir(), "82-0-sources-"));
    folders.push(dir);
    const stats = "x2p_per_game,x2p_percent,x3p_per_game,x3p_percent,ft_per_game,fta_per_game,ft_percent,ast_per_game,tov_per_game,orb_per_game,drb_per_game,trb_per_game,stl_per_game,blk_per_game";
    writeFileSync(join(dir, "Player Per Game.csv"), `season,lg,player,player_id,team,pos,g,${stats}
1973,NBA,Example,example01,TOT,PG-SG,80,5,0.5,NA,NA,2,3,NA,4,NA,NA,NA,6,NA,NA
1973,NBA,Example,example01,AAA,PG,45,9,0.6,NA,NA,3,4,0.75,6,NA,NA,NA,7,NA,NA
1973,NBA,Example,example01,BBB,SG,35,8,0.6,NA,NA,3,4,0.75,6,NA,NA,NA,7,NA,NA
1974,NBA,Example,example01,2TM,PG,70,NA,NA,0,NA,NA,NA,0.7,NA,2,1,5,NA,1,0.5
1974,NBA,Example,example01,AAA,PG,40,9,0.6,0,NA,3,4,0.75,6,2,2,5,7,1,1
1974,ABA,Example,example01,ZZZ,PG,90,20,0.6,3,0.5,8,10,0.8,9,2,2,5,7,1,1
`);
    writeFileSync(join(dir, "Team Stats Per Game.csv"), `season,lg,team,${stats}
1974,NBA,League Average,40,0.5,0,NA,20,26,0.75,25,15,12,30,42,8,5
1973,NBA,League Average,39,0.49,NA,NA,19,25,0.74,24,NA,NA,NA,41,NA,NA
1973,ABA,League Average,99,0.9,3,0.4,20,26,0.75,25,15,12,30,42,8,5
1973,NBA,Some Team,99,0.9,3,0.4,20,26,0.75,25,15,12,30,42,8,5
`);
    writeFileSync(join(dir, "End of Season Teams.csv"), `season,lg,type,number_tm,player_id
1973,NBA,All-Defense,1st,example01
1974,NBA,All-Defense,2nd,example01
1974,ABA,All-Defense,1st,example01
1974,NBA,All-NBA,1st,example01
`);
    writeFileSync(join(dir, "Player Season Info.csv"), `season,lg,player,player_id
1972,ABA,Example,example01
1974,NBA,Example,example01
1973,NBA,Example,example01
1947,BAA,Old Player,old01
`);
    const sources = loadSources(dir);
    expect(sources.seasonsByPlayer.get("example01")).toEqual([
      { season: 1973, g: 80, x2p: 5, x2pPct: 0.5, x3p: null, x3pPct: null,
        ftm: 2, fta: 3, ftPct: 0, ast: 4, tov: null, orb: null, drb: null,
        trb: 6, stl: null, blk: null, allDef1: true, allDef2: false },
      { season: 1974, g: 70, x2p: null, x2pPct: 0, x3p: 0, x3pPct: null,
        ftm: null, fta: null, ftPct: 0.7, ast: null, tov: 2, orb: 1, drb: 5,
        trb: null, stl: 1, blk: 0.5, allDef1: false, allDef2: true },
    ]);
    expect(sources.league.get(1973)).toMatchObject({
      x2p: 39, x3p: null, x3pPct: null, tov: 15, orb: 12, drb: 30, stl: 8, blk: 5,
    });
    expect(sources.playerInfo.get("example01")).toEqual({ name: "Example", first: 1973, last: 1974 });
    expect(sources.playerInfo.get("old01")).toEqual({ name: "Old Player", first: 1947, last: 1947 });
  });
});
