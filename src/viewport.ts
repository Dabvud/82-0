import { useEffect, useState } from "react";

export interface ViewportState { height: number; top: number; keyboardOpen: boolean }

/** Sichtbarer Bereich ohne Bildschirmtastatur; iOS verschiebt ihn beim Tippen (offsetTop). */
export function viewportState(vv: { height: number; offsetTop: number } | null, innerHeight: number): ViewportState {
  const height = Math.round(vv?.height ?? innerHeight);
  return { height, top: Math.round(vv?.offsetTop ?? 0), keyboardOpen: height < innerHeight * 0.75 };
}

export function useViewport(): ViewportState {
  const [state, setState] = useState(() => viewportState(window.visualViewport ?? null, window.innerHeight));
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setState(viewportState(vv, window.innerHeight));
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
  return state;
}
