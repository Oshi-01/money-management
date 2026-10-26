# Monexa color meanings

One light palette serves web and mobile. The mint canvas and teal brand restore Monexa’s original visual identity. White
panels, quiet borders, and a single prominent balance surface establish hierarchy.
Status colors communicate financial meaning alongside labels and icons.

| Role | Color | Web token | Mobile token | Use |
| --- | --- | --- | --- | --- |
| Action / selection | Teal `#146b58` | `primary` | `colors.primary` | Primary buttons, links, focus, selected navigation and controls |
| Income / positive outcome | Green `#28734e` | `income`, `success` | `colors.income` | Money received, receivables, favorable financial trends, paid/completed states |
| Expense / liability | Ochre `#985329` | `expense` | `colors.expense` | Spending, money owed, unfavorable financial trends |
| Attention | Amber `#806000` | `warning` | `colors.warning` | Near/over budget, overdue loans, conditions requiring attention |
| Failure / destruction | Red `#b42332` | `destructive`, `danger-soft` | `colors.danger` | Validation errors, failed requests, delete actions and confirmations |
| Information | Blue `#285f89` | `info` | `colors.info` | Explicitly labeled informational notices |
| Neutral data / progress | Sage `#638473` | `progress`, `chart-balance`, `chart-progress` | `colors.progress` | Partial savings progress and neutral data; cash flow charts use brand teal |

## Rules

- Ordinary spending is not an error. Expense rows use ochre; invalid forms and
  deletion controls use red, even when they concern an income or expense record.
- Teal belongs to primary actions, selected navigation, the balance surface, and
  the Monexa brand. Blue is reserved for explicitly labeled informational notices.
- Positive numbers are not automatically income: an outstanding borrowed amount
  is still a liability. Use the record's meaning and label, not just its sign.
- Savings progress stays sage until the goal is complete, then becomes green.
  Budget progress stays sage until it needs attention, then becomes amber.
- Category names do not receive invented status colors. Spending breakdowns use
  ordered bars with explicit category names, amounts, and percentages. Category
  identity is not communicated using green/red alert colors.
- Labels, signs, icons, and progress values carry meaning alongside color. Never
  require users to distinguish colors to identify income, spending, or a warning.
- Status-colored text sits on white or its matching soft background. Do not apply
  reduced opacity to meaningful text unless the resulting contrast is checked.

## Source and maintenance

Edit `shared/colors.json`, then run `npm run colors:generate`. The generated
`app/colors.css` exposes CSS variables; `app/globals.css` maps them to semantic
Tailwind utilities. `mobile/src/theme/colors.ts` reads the same palette directly.

Examples: `text-income`, `bg-warning-soft text-warning`,
`hover:bg-danger-soft hover:text-destructive`, and `colors.danger`.
Avoid raw color literals in screen code or new competing theme files.

The principal text/status pairs meet WCAG AA's 4.5:1 contrast threshold for normal
text. Contrast still needs checking when adding opacity, imagery, or a new surface.
