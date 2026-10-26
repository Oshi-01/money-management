import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "./voice-commands";

const now = new Date(2026, 9, 26, 10);

describe("voice commands", () => {
  it("extracts expense, category, and local yesterday", () => {
    expect(parseVoiceCommand("Add expense 1,250.50 for lunch in Dining Out yesterday.", now)).toEqual({
      action: "create", entity: "transaction", title: "lunch", amount: 1250.5,
      type: "EXPENSE", category: "Dining Out", date: "2026-10-25",
    });
  });
  it("handles spoken amounts and income", () => {
    expect(parseVoiceCommand("I received five thousand taka from salary", now)).toMatchObject({ amount: 5000, type: "INCOME", title: "salary" });
  });
  it("distinguishes borrowed and lent money", () => {
    expect(parseVoiceCommand("borrow 2000 from Rahim", now)).toMatchObject({ entity: "loan", type: "BORROWED", title: "Rahim" });
    expect(parseVoiceCommand("add loan lent two hundred to Alex", now)).toMatchObject({ type: "LENT", amount: 200 });
  });
  it("keeps the lookup separate from the new amount", () => {
    expect(parseVoiceCommand("edit transaction lunch to 250", now)).toMatchObject({ action: "edit", title: "lunch", amount: 250 });
    expect(parseVoiceCommand("remove loan Alex", now)).toMatchObject({ action: "delete", entity: "loan", title: "Alex" });
  });
  it.each([
    ["Could you log an expense of five hundred taka for groceries please", 500, "groceries", "2026-10-26"],
    ["I paid 1.5k for rent two days ago", 1500, "rent", "2026-10-24"],
    ["Yesterday I spent 50 for lunch", 50, "lunch", "2026-10-25"],
    ["record expense lunch for 250", 250, "lunch", "2026-10-26"],
    ["add expense for lunch of 250", 250, "lunch", "2026-10-26"],
    ["spent fifty point five zero for lunch on October 20", 50.5, "lunch", "2026-10-20"],
    ["গতকাল বাজারে ৫০০ টাকা খরচ করেছি", 500, "বাজারে", "2026-10-25"],
  ])("understands natural phrasing: %s", (text, amount, title, date) => {
    expect(parseVoiceCommand(text, now)).toMatchObject({ action: "create", type: "EXPENSE", amount, title, date });
  });
  it("supports basic Bangla income, loan directions, edits, and removal", () => {
    expect(parseVoiceCommand("বেতন থেকে ৩০০০০ টাকা পেয়েছি", now)).toMatchObject({ type: "INCOME", amount: 30000, title: "বেতন" });
    expect(parseVoiceCommand("রহিমের কাছ থেকে ২০০০ টাকা ধার নিয়েছি", now)).toMatchObject({ type: "BORROWED", title: "রহিম", amount: 2000 });
    expect(parseVoiceCommand("রহিমকে ১০০০ টাকা ধার দিয়েছি", now)).toMatchObject({ type: "LENT", title: "রহিম", amount: 1000 });
    expect(parseVoiceCommand("লোন রহিম মুছে দাও", now)).toMatchObject({ action: "delete", entity: "loan", title: "রহিম" });
    expect(parseVoiceCommand("লেনদেন দুপুরের খাবার এর পরিমাণ ২৫০ করো", now)).toMatchObject({ action: "edit", title: "দুপুরের খাবার", amount: 250 });
  });
  it.each(["don't delete loan Alex", "maybe add expense 500 for lunch", "spent 50 for lunch and paid 20 for coffee", "গতকাল বাজারে ৫০০ টাকা খরচ করেছি এবং লোন রহিম মুছে দাও", "gave Alex 500", "borrow 2000 from Rahim yesterday due tomorrow"])("does not guess ambiguous or multiple instructions: %s", text => {
    expect(() => parseVoiceCommand(text, now)).toThrow();
  });
  it.each(["delete everything", "add expense -50 for lunch", "add expense 0 for lunch", "add expense 1,2 for lunch", "add expense 500 for lunch and delete loan Alex", "borrow 2000 to Alex", "lend 2000 from Alex"])("rejects unsupported or unsafe input: %s", (text) => {
    expect(() => parseVoiceCommand(text, now)).toThrow();
  });
});
