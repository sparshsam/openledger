# Contributing To OpenLedger

Thanks for considering a contribution. OpenLedger is intentionally small, calm, and privacy-first. Changes should make the app more trustworthy, understandable, and maintainable without turning it into a bank-connected growth product.

## Local Setup

```bash
git clone https://github.com/sparshsam/quietledger.git
cd openledger
npm install
npm run dev
```

Open `http://localhost:3000`.

## Required Checks

Run these before opening a pull request:

```bash
npm run lint
npm run typecheck
npm run build
```

For UI changes, also check:

- Desktop around `1440x1000`
- Mobile around `390x900`
- CSV import preview
- Manual transaction form
- Account management
- JSON export/import

## Product Principles

- No bank login unless it is optional and clearly separated from local mode.
- No shame language, gamification, or manipulative finance copy.
- Prefer clear data ownership over convenience.
- Keep privacy limitations explicit.
- Keep the interface quiet and legible.

## Pull Requests

Please include:

- What changed
- Why it changed
- Validation performed
- Screenshots for visual changes
- Known limitations or follow-up work

## License

By contributing, you agree that your contributions are provided under the project's AGPL-3.0-or-later license.
