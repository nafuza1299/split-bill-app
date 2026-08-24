# Split Bill

A small web app for splitting a shared bill (a restaurant receipt, groceries,
etc.) fairly between a group of people.

You walk through a short wizard: add the people in the group, enter the
receipt's line items (with quantity and price) plus tax and service charge,
then pick how to split — evenly across everyone, or by assigning each item to
the specific people who ordered it. The final summary shows exactly how much
each person owes, and can be exported as a PNG or PDF to share.

## Tech stack

- **React 19** + **TypeScript** — UI and app logic
- **Vite** — dev server and build tooling
- **Zustand** — app state (the wizard's step and all form data), persisted to
  `localStorage` with a 1-day TTL so a reload doesn't lose in-progress work
- **Zod** — input validation
- **Tailwind CSS** — styling
- **html-to-image** + **jsPDF** — exporting the final split summary as an
  image or PDF
- **Vitest** + **Testing Library** — tests

## Getting started

```bash
npm install
npm run dev
```

Other scripts: `npm run build`, `npm test`, `npm run lint`.
