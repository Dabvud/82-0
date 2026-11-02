import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import InstallHelp from "../../src/components/InstallHelp";

describe("InstallHelp", () => {
  it("bietet auf Android den Installieren-Knopf an", async () => {
    const onPrompt = vi.fn();
    render(<InstallHelp platform="android" canPrompt onPrompt={onPrompt} onClose={() => {}} />);
    await userEvent.click(screen.getByRole("button", {name: "Installieren"}));
    expect(onPrompt).toHaveBeenCalledOnce();
  });
  it("erklärt Android ohne System-Dialog über das Menü", () => {
    render(<InstallHelp platform="android" canPrompt={false} onPrompt={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/Menü ⋮/)).toBeInTheDocument();
    expect(screen.getByText(/App installieren/)).toBeInTheDocument();
  });
  it("erklärt das iPhone in Safari", () => {
    render(<InstallHelp platform="ios-safari" canPrompt={false} onPrompt={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/Zum Home-Bildschirm/)).toBeInTheDocument();
  });
  it("schickt iPhone-Nutzer anderer Browser zu Safari", () => {
    render(<InstallHelp platform="ios-other" canPrompt={false} onPrompt={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/Bitte in Safari öffnen/)).toBeInTheDocument();
  });
  it("zeigt nichts, wenn die App schon installiert ist", () => {
    const {container} = render(<InstallHelp platform="installed" canPrompt={false} onPrompt={() => {}} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
