// Startdatei: führt make-pool aus (vite-node übergibt den Skriptnamen nicht, daher getrennt).
import { main } from "../make-pool";

main(process.argv.slice(2));
