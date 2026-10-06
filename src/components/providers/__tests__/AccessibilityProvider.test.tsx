import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import AccessibilityProvider, {
  useAccessibility,
} from "../AccessibilityProvider";

function wrapper({ children }: { children: React.ReactNode }) {
  return <AccessibilityProvider>{children}</AccessibilityProvider>;
}

describe("AccessibilityProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    // Garante estado limpo no <html> entre testes
    delete document.documentElement.dataset.theme;
    document.documentElement.style.removeProperty("--sl-app-font-scale");
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("useAccessibility fora do provider lança erro", () => {
    // suprime o log de erro do React (esperado neste teste)
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useAccessibility())).toThrow(
      /must be used inside/i
    );
    errSpy.mockRestore();
  });

  it("hidrata do localStorage no mount", () => {
    localStorage.setItem(
      "streamledger_a11y",
      JSON.stringify({ version: 1, theme: "high-contrast", fontScale: "xl" })
    );
    const { result } = renderHook(() => useAccessibility(), { wrapper });
    expect(result.current.theme).toBe("high-contrast");
    expect(result.current.fontScale).toBe("xl");
  });

  it("cai pra DEFAULT_PREFS quando não há nada no localStorage", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });
    expect(result.current.theme).toBe("neon");
    expect(result.current.fontScale).toBe("m");
  });

  it("setTheme atualiza state, DOM e localStorage", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });

    act(() => {
      result.current.setTheme("high-contrast");
    });

    expect(result.current.theme).toBe("high-contrast");
    expect(document.documentElement.dataset.theme).toBe("high-contrast");
    const stored = JSON.parse(
      localStorage.getItem("streamledger_a11y") ?? "{}"
    );
    expect(stored.theme).toBe("high-contrast");
  });

  it("cycleFontScale avança na ordem e dá wrap de XL → XS", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });
    expect(result.current.fontScale).toBe("m");

    act(() => result.current.cycleFontScale());
    expect(result.current.fontScale).toBe("g");

    act(() => result.current.cycleFontScale());
    expect(result.current.fontScale).toBe("xl");

    act(() => result.current.cycleFontScale());
    expect(result.current.fontScale).toBe("xs"); // wrap
  });

  it("cycleFontScale aplica o multiplicador correto no --sl-app-font-scale", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });

    act(() => result.current.setFontScale("xl"));
    expect(document.documentElement.style.getPropertyValue("--sl-app-font-scale"))
      .toBe("1.3");

    act(() => result.current.setFontScale("xs"));
    expect(document.documentElement.style.getPropertyValue("--sl-app-font-scale"))
      .toBe("0.85");
  });

  it("resetAll volta para theme=neon + fontScale=m", () => {
    const { result } = renderHook(() => useAccessibility(), { wrapper });

    act(() => {
      result.current.setTheme("high-contrast");
      result.current.setFontScale("xl");
    });

    act(() => {
      result.current.resetAll();
    });

    expect(result.current.theme).toBe("neon");
    expect(result.current.fontScale).toBe("m");
    expect(document.documentElement.dataset.theme).toBe("neon");
  });
});