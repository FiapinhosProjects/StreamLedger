// ============================================
// useInputMask.ts - Hook para formatação de inputs com cursor position
// Evita que o cursor pule para o final ao digitar
// ============================================

"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseInputMaskOptions {
  formatFn: (value: string, cursorPos: number) => { value: string; cursorPos: number };
}

/**
 * Hook reutilizável para formatação de inputs com controle de cursor
 */
export function useInputMask({ formatFn }: UseInputMaskOptions) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const currentValue = input.value;
      const cursorPos = input.selectionStart || 0;

      const { value: formattedValue, cursorPos: newCursorPos } = formatFn(currentValue, cursorPos);

      setValue(formattedValue);
      setError(null);

      // Restaura cursor após re-render
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const finalPos = Math.min(newCursorPos, formattedValue.length);
          inputRef.current.setSelectionRange(finalPos, finalPos);
        }
      });
    },
    [formatFn]
  );

  const reset = useCallback(() => {
    setValue("");
    setError(null);
  }, []);

  return {
    value,
    setValue,
    error,
    setError,
    inputRef,
    handleChange,
    reset,
  };
}

/**
 * Formata CPF e calcula nova posição do cursor
 */
export function formatCpfValue(value: string, cursorPos: number): { value: string; cursorPos: number } {
  const numbers = value.replace(/\D/g, "");
  let formatted = "";

  if (numbers.length > 0) {
    formatted = numbers.substring(0, 3);
  }
  if (numbers.length > 3) {
    formatted += "." + numbers.substring(3, 6);
  }
  if (numbers.length > 6) {
    formatted += "." + numbers.substring(6, 9);
  }
  if (numbers.length > 9) {
    formatted += "-" + numbers.substring(9, 11);
  }

  // Calcula nova posição do cursor baseada nos dígitos antes da posição original
  const digitsBeforeCursor = value.substring(0, cursorPos).replace(/\D/g, "").length;
  let newCursorPos = digitsBeforeCursor;

  if (digitsBeforeCursor > 3) newCursorPos++;
  if (digitsBeforeCursor > 6) newCursorPos++;
  if (digitsBeforeCursor > 9) newCursorPos++;

  return { value: formatted, cursorPos: newCursorPos };
}

/**
 * Formata data de nascimento e calcula nova posição do cursor
 */
export function formatDateValue(value: string, cursorPos: number): { value: string; cursorPos: number } {
  const numbers = value.replace(/\D/g, "");
  let formatted = "";

  if (numbers.length > 0) {
    formatted = numbers.substring(0, 2);
  }
  if (numbers.length > 2) {
    formatted += "/" + numbers.substring(2, 4);
  }
  if (numbers.length > 4) {
    formatted += "/" + numbers.substring(4, 8);
  }

  // Calcula nova posição do cursor
  const digitsBeforeCursor = value.substring(0, cursorPos).replace(/\D/g, "").length;
  let newCursorPos = digitsBeforeCursor;

  if (digitsBeforeCursor > 2) newCursorPos++;
  if (digitsBeforeCursor > 4) newCursorPos++;

  return { value: formatted, cursorPos: newCursorPos };
}
