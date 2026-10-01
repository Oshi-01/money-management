"use client";

import { useEffect, useState } from "react";
import { Calculator, Delete, X } from "lucide-react";

type Operator = "+" | "−" | "×" | "÷";

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return "Error";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 10,
    useGrouping: false,
  }).format(value);
};

export function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [replaceDisplay, setReplaceDisplay] = useState(false);

  const reset = () => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setReplaceDisplay(false);
  };

  const enterDigit = (digit: string) => {
    if (display === "Error" || replaceDisplay) {
      setDisplay(digit === "." ? "0." : digit);
      setReplaceDisplay(false);
      return;
    }

    if (digit === "." && display.includes(".")) return;
    setDisplay((current) => {
      if (digit === ".") return current === "0" ? "0." : `${current}.`;
      return current === "0" ? digit : `${current}${digit}`;
    });
  };

  const calculate = (left: number, right: number, operation: Operator) => {
    switch (operation) {
      case "+": return left + right;
      case "−": return left - right;
      case "×": return left * right;
      case "÷": return right === 0 ? Number.NaN : left / right;
    }
  };

  const chooseOperator = (nextOperator: Operator) => {
    const currentValue = Number(display);
    if (!Number.isFinite(currentValue)) {
      reset();
      return;
    }

    if (operator && storedValue !== null && !replaceDisplay) {
      const result = calculate(storedValue, currentValue, operator);
      setDisplay(formatNumber(result));
      setStoredValue(result);
    } else {
      setStoredValue(currentValue);
    }

    setOperator(nextOperator);
    setReplaceDisplay(true);
  };

  const equals = () => {
    if (operator === null || storedValue === null) return;
    const result = calculate(storedValue, Number(display), operator);
    setDisplay(formatNumber(result));
    setStoredValue(null);
    setOperator(null);
    setReplaceDisplay(true);
  };

  const applyPercentage = () => {
    const currentValue = Number(display);
    // For addition/subtraction, the percentage is relative to the stored
    // value (e.g. 30 + 30% means 30 + 9). For multiplication/division,
    // convert the entered percentage to its decimal form (30% => 0.3).
    const percentageValue =
      storedValue !== null && (operator === "+" || operator === "−")
        ? storedValue * (currentValue / 100)
        : currentValue / 100;
    setDisplay(formatNumber(percentageValue));
    setReplaceDisplay(true);
  };

  const backspace = () => {
    if (display === "Error" || replaceDisplay || display.length <= 1) {
      setDisplay("0");
      setReplaceDisplay(false);
      return;
    }
    setDisplay((current) => current.slice(0, -1) || "0");
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9.]$/.test(event.key)) enterDigit(event.key);
      else if (event.key === "+") chooseOperator("+");
      else if (event.key === "-") chooseOperator("−");
      else if (event.key === "*") chooseOperator("×");
      else if (event.key === "/") {
        event.preventDefault();
        chooseOperator("÷");
      } else if (event.key === "%") applyPercentage();
      else if (event.key === "Enter" || event.key === "=") equals();
      else if (event.key === "Backspace") backspace();
      else if (event.key === "Escape") setIsOpen(false);
      else return;

      event.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  const keyClass = "h-12 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      {isOpen && (
        <section
          aria-label="Calculator"
          className="mb-3 w-[min(21rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">Calculator</h2>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
              aria-label="Close calculator"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-3 flex h-16 items-center justify-end overflow-hidden rounded-xl bg-gray-50 px-4 text-right text-3xl font-medium tabular-nums text-gray-900 dark:bg-zinc-800 dark:text-gray-100" aria-live="polite" aria-atomic="true">
            {display}
          </div>

          <div className="mb-3 flex min-h-5 items-center justify-end gap-2 text-sm text-gray-500" aria-label="Selected operation">
            {storedValue !== null && operator ? `${formatNumber(storedValue)} ${operator}` : ""}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button type="button" onClick={reset} className={`${keyClass} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700`}>AC</button>
            <button type="button" onClick={backspace} aria-label="Delete last digit" className={`${keyClass} flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700`}><Delete className="h-5 w-5" /></button>
            <button type="button" onClick={applyPercentage} className={`${keyClass} bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-200 dark:hover:bg-zinc-700`}>%</button>
            <button type="button" onClick={() => chooseOperator("÷")} className={`${keyClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900`}>÷</button>

            {(["7", "8", "9"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-zinc-800/70 dark:text-gray-100 dark:hover:bg-zinc-800`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("×")} className={`${keyClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900`}>×</button>

            {(["4", "5", "6"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-zinc-800/70 dark:text-gray-100 dark:hover:bg-zinc-800`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("−")} className={`${keyClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900`}>−</button>

            {(["1", "2", "3"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-zinc-800/70 dark:text-gray-100 dark:hover:bg-zinc-800`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("+")} className={`${keyClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900`}>+</button>

            <button type="button" onClick={() => enterDigit("0")} className={`${keyClass} col-span-2 bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-zinc-800/70 dark:text-gray-100 dark:hover:bg-zinc-800`}>0</button>
            <button type="button" onClick={() => enterDigit(".")} className={`${keyClass} bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-zinc-800/70 dark:text-gray-100 dark:hover:bg-zinc-800`}>.</button>
            <button type="button" onClick={equals} className={`${keyClass} bg-emerald-600 text-white hover:bg-emerald-700`}>=</button>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close calculator" : "Open calculator"}
        aria-expanded={isOpen}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg transition hover:scale-105 hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
      </button>
    </div>
  );
}
