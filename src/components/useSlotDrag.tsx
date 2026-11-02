import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";

/**
 * Ziehen auf die Plätze G G F F C: mit der Maus sofort, mit dem Finger nach kurzem Halten
 * (sonst bleibt normales Scrollen möglich). Abgelegt wird auf dem Element mit data-slot.
 */
export function useSlotDrag<T>(onDrop: (payload: T, slot: number) => void) {
  const [ghost, setGhost] = useState<{ label: string; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);

  function start(event: ReactPointerEvent, payload: T, label: string) {
    if (event.button > 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const touch = event.pointerType === "touch";
    let active = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const begin = (x: number, y: number) => { active = true; setGhost({ label, x, y }); };
    const move = (e: PointerEvent) => {
      if (!active) {
        const distance = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (touch) { if (distance > 10) cleanup(); return; }
        if (distance < 6) return;
        begin(e.clientX, e.clientY);
      }
      setGhost({ label, x: e.clientX, y: e.clientY });
    };
    const preventScroll = (e: TouchEvent) => { if (active) e.preventDefault(); };
    const up = (e: PointerEvent) => {
      if (active) {
        suppressClick.current = true;
        const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-slot]");
        const slot = target ? Number(target.getAttribute("data-slot")) : Number.NaN;
        if (Number.isInteger(slot)) onDrop(payload, slot);
      }
      cleanup();
    };
    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cleanup);
      document.removeEventListener("touchmove", preventScroll);
      setGhost(null);
    }
    if (touch) timer = setTimeout(() => begin(startX, startY), 200);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cleanup);
    document.addEventListener("touchmove", preventScroll, { passive: false });
  }

  /** Nach einem Ziehen den folgenden Klick verschlucken (sonst öffnet sich z. B. die Detailkarte). */
  function consumeClick(): boolean {
    const was = suppressClick.current;
    suppressClick.current = false;
    return was;
  }

  const ghostElement: ReactNode = ghost && (
    <div className="drag-ghost" style={{ left: ghost.x, top: ghost.y }} aria-hidden="true">{ghost.label}</div>
  );
  return { start, consumeClick, ghost: ghostElement };
}
