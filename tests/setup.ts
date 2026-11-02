import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom kennt elementFromPoint nicht; Tests ersetzen es bei Bedarf per spyOn.
if (typeof document !== "undefined" && !document.elementFromPoint) document.elementFromPoint = () => null;
