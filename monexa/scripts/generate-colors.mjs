import { readFile, writeFile } from "node:fs/promises";

const palette = JSON.parse(await readFile(new URL("../shared/colors.json", import.meta.url), "utf8"));
const kebab = value => value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
const variables = Object.entries(palette).flatMap(([key, value]) =>
  typeof value === "string" ? [`  --${kebab(key)}: ${value};`] : Object.entries(value).map(([name, color]) => `  --chart-${name}: ${color};`),
);
const aliases = {
  card: "surface", "card-foreground": "foreground", popover: "surface", "popover-foreground": "foreground",
  "primary-foreground": "on-primary", muted: "subtle", accent: "primary-soft", "accent-foreground": "primary",
  destructive: "danger", "destructive-foreground": "on-primary", ring: "primary",
  success: "income", "success-soft": "income-soft", "success-border": "income-border",
  sidebar: "surface", "sidebar-foreground": "foreground", "sidebar-primary": "primary",
  "sidebar-primary-foreground": "on-primary", "sidebar-accent": "primary-soft",
  "sidebar-accent-foreground": "primary", "sidebar-border": "border", "sidebar-ring": "primary",
};
variables.push(...Object.entries(aliases).map(([key, value]) => `  --${key}: var(--${value});`));
const css = `/* Generated from shared/colors.json. Run npm run colors:generate after editing the palette. */\n:root {\n  color-scheme: only light;\n${variables.join("\n")}\n  --radius: 0.5rem;\n}\n`;
const destination = new URL("../app/colors.css", import.meta.url);
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== css) throw new Error("app/colors.css is stale. Run npm run colors:generate.");
} else await writeFile(destination, css);
