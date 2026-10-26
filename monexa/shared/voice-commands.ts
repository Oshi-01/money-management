import { toDateInputValue } from "./dates";
import { casual } from "chrono-node/en";

export type VoiceCommand = {
  action: "create" | "edit" | "delete";
  entity: "transaction" | "loan";
  title: string;
  amount?: number;
  type?: "INCOME" | "EXPENSE" | "BORROWED" | "LENT";
  date: string;
  category?: string;
};

const units: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

function parseAmount(value: string): number {
  const text = value.trim().toLowerCase().replace(/^(?:[$£৳]\s*|usd\s+|bdt\s+|gbp\s+)/, "")
    .replace(/\s*(?:dollars?|taka|pounds?)$/, "").trim();
  let result: number;
  const shorthand = /^(\d+(?:\.\d{1,2})?)\s*(k|thousand|lakh|million)$/.exec(text);
  if (shorthand) result = Number(shorthand[1]) * ({ k: 1000, thousand: 1000, lakh: 100000, million: 1000000 }[shorthand[2]]!);
  else if (/^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?$/.test(text)) {
    result = Number(text.replaceAll(",", ""));
  } else {
    let total = 0;
    let group = 0;
    const [whole, fraction] = text.split(/\s+point\s+/);
    if (fraction !== undefined) {
      const digits = fraction.split(/\s+/).map(word => units[word]);
      if (!digits.length || digits.length > 2 || digits.some(digit => digit === undefined || digit > 9)) throw new Error("Say at most two decimal places.");
      return parseAmount(whole) + Number(`0.${digits.join("")}`);
    }
    const words = whole.replaceAll("-", " ").split(/\s+/).filter(w => w !== "and");
    if (!words.length) throw new Error("Say a positive amount, such as 500 or five hundred.");
    for (const word of words) {
      if (word in units) group += units[word];
      else if (word === "hundred" && group > 0) group *= 100;
      else if (["thousand", "million", "lakh"].includes(word) && group > 0) {
        total += group * ({ thousand: 1000, million: 1000000, lakh: 100000 }[word]!);
        group = 0;
      } else throw new Error("Use an amount such as 500 or five hundred. You can correct the transcript.");
    }
    result = total + group;
  }
  if (!Number.isFinite(result) || result <= 0 || result > 1e12) throw new Error("Say a positive amount up to one trillion.");
  return result;
}

/** Free, deterministic fallback. Ambiguous requests are left for correction or AI review. */
export function parseVoiceCommand(transcript: string, now = new Date()): VoiceCommand {
  let text = transcript.trim().replace(/[.!?।]+$/, "").replace(/\s+/g, " ")
    .replace(/^(?:(?:hey monexa|please|can you|could you|would you|i|just)\s+)+/i, "")
    .replace(/\s+please$/i, "")
    .replace(/[০-৯]/g, digit => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  if (!text || text.length > 500) throw new Error("Enter one command, up to 500 characters.");
  if (/\b(?:and|then)\s+(?:i\s+)?(?:add|record|delete|remove|edit|update|change|borrow|lend|spent|paid|received)\b/i.test(text) || /(?:এবং|তারপর)/.test(text)) {
    throw new Error("Use one command at a time so each action can be reviewed separately.");
  }
  if (/\b(?:don't|do not|never|cancel|not sure|maybe)\b/i.test(text) || /করো না|করবেন না/.test(text)) throw new Error("Say the action you want to take, or correct the transcript.");
  let day = toDateInputValue(now);
  const banglaDay = /^(আজ|গতকাল)\s+|\s+(আজ|গতকাল)$/.exec(text);
  if (banglaDay) {
    const date = new Date(now);
    if ((banglaDay[1] ?? banglaDay[2]) === "গতকাল") date.setDate(date.getDate() - 1);
    day = toDateInputValue(date); text = text.replace(banglaDay[0], "").trim();
  }
  // Only remove an explicit date at the beginning/end, never a number or a name in the description.
  const dates = casual.parse(text, now).filter(result => /today|yesterday|ago|last|next|tomorrow|\d{4}-\d{2}-\d{2}|\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d/i.test(result.text));
  if (dates.length > 1) throw new Error("Use one date per command. Set a loan’s due date in review.");
  if (dates[0]) {
    const result = dates[0];
    const before = text.slice(0, result.index).trim();
    const after = text.slice(result.index + result.text.length).trim();
    if (!before || !after) { day = toDateInputValue(result.start.date()); text = `${before.replace(/\s+on$/i, "")} ${after.replace(/^,\s*/, "")}`.trim().replace(/^(?:please\s+|i\s+)/i, ""); }
  }

  const banglaExpense = /^(.+?)\s+(\d+(?:\.\d{1,2})?)\s*টাকা\s+(খরচ করেছি|খরচ করলাম|খরচ যোগ করো|খরচ হয়েছে)$/.exec(text);
  if (banglaExpense) return { action: "create", entity: "transaction", type: "EXPENSE", title: banglaExpense[1], amount: parseAmount(banglaExpense[2]), date: day };
  const banglaIncome = /^(.+?)\s+থেকে\s+(\d+(?:\.\d{1,2})?)\s*টাকা\s+(পেয়েছি|পেলাম|আয় হয়েছে)$/.exec(text);
  if (banglaIncome) return { action: "create", entity: "transaction", type: "INCOME", title: banglaIncome[1], amount: parseAmount(banglaIncome[2]), date: day };
  const banglaLoan = /^(.+?)(?:ের কাছ থেকে|র কাছ থেকে|এর কাছ থেকে|কে)\s+(\d+(?:\.\d{1,2})?)\s*টাকা\s+ধার\s+(নিয়েছি|দিয়েছি)$/.exec(text);
  if (banglaLoan) return { action: "create", entity: "loan", type: banglaLoan[3] === "নিয়েছি" ? "BORROWED" : "LENT", title: banglaLoan[1], amount: parseAmount(banglaLoan[2]), date: day };
  const banglaDelete = /^(লেনদেন|লোন|ঋণ)\s+(.+?)\s+(?:মুছে দাও|ডিলিট করো)$/.exec(text);
  if (banglaDelete) return { action: "delete", entity: banglaDelete[1] === "লেনদেন" ? "transaction" : "loan", title: banglaDelete[2], date: day };
  const banglaEdit = /^(লেনদেন|লোন|ঋণ)\s+(.+?)\s+(?:এর পরিমাণ |পরিমাণ )?(\d+(?:\.\d{1,2})?)\s*(?:টাকা )?করো$/.exec(text);
  if (banglaEdit) return { action: "edit", entity: banglaEdit[1] === "লেনদেন" ? "transaction" : "loan", title: banglaEdit[2], amount: parseAmount(banglaEdit[3]), date: day };

  const remove = /^(?:delete|remove) (?:the |my )?(transaction|loan) (?:for |with |named )?(.+)$/i.exec(text);
  if (remove) return { action: "delete", entity: remove[1].toLowerCase() as "transaction" | "loan", title: remove[2].trim(), date: day };

  const edit = /^(?:edit|update|change|set) (?:the |my )?(transaction|loan) (?:for |with |named )?(.+?) (?:amount )?to (.+)$/i.exec(text);
  if (edit) return { action: "edit", entity: edit[1].toLowerCase() as "transaction" | "loan", title: edit[2].trim(), amount: parseAmount(edit[3]), date: day };

  const loan = /^(?:add loan |record loan )?(borrow(?:ed)?|lend|lent) (.+?) (from|to) (.+)$/i.exec(text);
  if (loan) {
    const borrowed = /^borrow/i.test(loan[1]);
    if (loan[3].toLowerCase() !== (borrowed ? "from" : "to")) throw new Error('Use “borrow 2000 from Rahim” or “lend 1000 to Alex”.');
    return { action: "create", entity: "loan", title: loan[4].trim(), amount: parseAmount(loan[2]), type: borrowed ? "BORROWED" : "LENT", date: day };
  }

  const personFirstLoan = /^(?:gave|lent|loaned) (.+?) (.+?) (?:as a loan|as loan|on loan)$/i.exec(text);
  if (personFirstLoan) {
    // Amount is intentionally explicit here; never reinterpret a gift as a loan.
    return { action: "create", entity: "loan", type: "LENT", title: personFirstLoan[1], amount: parseAmount(personFirstLoan[2]), date: day };
  }

  const amountLast = /^(?:add |record |log )?(expense|income) (?:for |from )?(.+?) (?:of |for )(.+)$/i.exec(text);
  if (amountLast) {
    let amount: number | undefined;
    try { amount = parseAmount(amountLast[3]); } catch { /* Try the usual amount-first form below. */ }
    if (amount !== undefined) return { action: "create", entity: "transaction", title: amountLast[2].trim(), amount, type: amountLast[1].toLowerCase() === "income" ? "INCOME" : "EXPENSE", date: day };
  }
  const transaction = /^(?:add |record |log )?(?:an? )?(expense|income|spent|spend|paid|received|receive|earned|earn) (?:of )?(.+?) (?:for|on|from) (.+)$/i.exec(text);
  if (transaction) {
    const [, verb, amount, rest] = transaction;
    const parts = /^(.*?) (?:in|under) (?:the )?(?:category )?(.+?)(?: category)?$/i.exec(rest);
    return { action: "create", entity: "transaction", title: (parts?.[1] ?? rest).trim(), amount: parseAmount(amount), type: /^(?:income|received|receive|earned|earn)$/i.test(verb) ? "INCOME" : "EXPENSE", date: day, category: parts?.[2].trim() };
  }
  throw new Error('Try “add expense 500 for groceries”, “borrow 2000 from Rahim”, “edit transaction lunch to 250”, or “delete loan Rahim”.');
}
