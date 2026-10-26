"use client";

import { useEffect, useState } from "react";
import { Calculator, Delete } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

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

  const keyClass = "h-12 rounded-xl text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<button type="button" aria-label="Open calculator" title="Calculator" className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Calculator className="h-5 w-5" /></button>} />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Calculator</DialogTitle><DialogDescription>Work out an amount before adding it.</DialogDescription></DialogHeader>
          <div className="mb-3 flex h-16 items-center justify-end overflow-hidden rounded-xl bg-muted px-4 text-right text-3xl font-medium tabular-nums text-foreground" aria-live="polite" aria-atomic="true">
            {display}
          </div>

          <div className="mb-3 flex min-h-5 items-center justify-end gap-2 text-sm text-muted-foreground" aria-label="Selected operation">
            {storedValue !== null && operator ? `${formatNumber(storedValue)} ${operator}` : ""}
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button type="button" onClick={reset} className={`${keyClass} bg-muted text-secondary-foreground hover:bg-border`}>AC</button>
            <button type="button" onClick={backspace} aria-label="Delete last digit" className={`${keyClass} flex items-center justify-center bg-muted text-secondary-foreground hover:bg-border`}><Delete className="h-5 w-5" /></button>
            <button type="button" onClick={applyPercentage} className={`${keyClass} bg-muted text-secondary-foreground hover:bg-border`}>%</button>
            <button type="button" onClick={() => chooseOperator("÷")} className={`${keyClass} bg-primary-soft text-primary hover:bg-primary-soft`}>÷</button>

            {(["7", "8", "9"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-muted text-foreground hover:bg-muted`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("×")} className={`${keyClass} bg-primary-soft text-primary hover:bg-primary-soft`}>×</button>

            {(["4", "5", "6"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-muted text-foreground hover:bg-muted`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("−")} className={`${keyClass} bg-primary-soft text-primary hover:bg-primary-soft`}>−</button>

            {(["1", "2", "3"] as const).map((digit) => <button key={digit} type="button" onClick={() => enterDigit(digit)} className={`${keyClass} bg-muted text-foreground hover:bg-muted`}>{digit}</button>)}
            <button type="button" onClick={() => chooseOperator("+")} className={`${keyClass} bg-primary-soft text-primary hover:bg-primary-soft`}>+</button>

            <button type="button" onClick={() => enterDigit("0")} className={`${keyClass} col-span-2 bg-muted text-foreground hover:bg-muted`}>0</button>
            <button type="button" onClick={() => enterDigit(".")} className={`${keyClass} bg-muted text-foreground hover:bg-muted`}>.</button>
            <button type="button" onClick={equals} className={`${keyClass} bg-primary text-primary-foreground hover:bg-primary-hover`}>=</button>
          </div>
      </DialogContent>
    </Dialog>
  );
}
