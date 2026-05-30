# Security Policy

QuietLedger is an early local-first MVP. It currently has no backend, no hosted user accounts, and no bank connection.

## Supported Version

Only the `main` branch is currently maintained.

## Current Security Model

- Ledger data is stored in browser `localStorage`.
- Local data is not encrypted by QuietLedger.
- CSV import and JSON backup restore run in the browser.
- No bank credentials are requested or stored.
- No server-side sync is connected.

## Important Limitations

`localStorage` is not appropriate for highly sensitive long-term financial records on shared or untrusted devices. Browser data may be visible to other code running in the same browser context and can be removed by browser cleanup, profile changes, or private browsing behavior.

Use JSON exports for backups. Store backups carefully.

## Reporting A Vulnerability

Please do not open a public issue for a suspected security vulnerability.

Report privately through GitHub's security advisory flow if available, or contact the maintainer through the GitHub profile linked from the repository.

Include:

- A clear description of the issue
- Reproduction steps
- Browser and operating system
- Whether user data exposure or modification is possible

## Out Of Scope

- Browser or extension compromise
- User device compromise
- Lost browser profile or cleared site data
- Bank CSV export errors outside QuietLedger's parser
