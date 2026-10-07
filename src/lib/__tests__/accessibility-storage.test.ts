import { describe, it, expect, beforeEach } from "vitest";
import {
  loadA11y,
  saveA11y,
  STORAGE_KEY,
  DEFAULT_PREFS,
  type A11yPrefs,
} from "../accessibility-storage";

const validPrefs: A11yPrefs = {
  theme: "high-contrast",
  fontScale: "xl",
};

describe("accessibility-storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("loadA11y", () => {
    it("retorna DEFAULT_PREFS quando a chave não existe", () => {
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

    it("retorna DEFAULT_PREFS quando o JSON é inválido", () => {
      localStorage.setItem(STORAGE_KEY, "{ não é json válido");
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

    it("retorna DEFAULT_PREFS quando a versão é diferente", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 99, theme: "neon", fontScale: "m" })
      );
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

    it("retorna DEFAULT_PREFS quando o tema é inválido", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, theme: "azul-marinho", fontScale: "m" })
      );
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

    it("retorna DEFAULT_PREFS quando a escala de fonte é inválida", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, theme: "neon", fontScale: "enorme" })
      );
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

    it("retorna DEFAULT_PREFS quando o payload não é objeto", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify("string qualquer"));
      expect(loadA11y()).toEqual(DEFAULT_PREFS);
    });

        it("retorna as preferências válidas armazenadas", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, ...validPrefs })
      );
      expect(loadA11y()).toEqual(validPrefs);
    });
  });

  describe("saveA11y + loadA11y (round-trip)", () => {
    it("persiste e recupera o objeto completo", () => {
      saveA11y(validPrefs);
      expect(loadA11y()).toEqual(validPrefs);
    });

    it("sobrescreve valor anterior", () => {
      saveA11y({ theme: "neon", fontScale: "xs" });
      saveA11y(validPrefs);
      expect(loadA11y()).toEqual(validPrefs);
    });
  });
});
