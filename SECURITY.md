# Security Policy

## Reporting a vulnerability

Please **do not** file a public GitHub issue for security vulnerabilities.

Instead, email the maintainer directly with:

- A description of the vulnerability
- Steps to reproduce (or a proof of concept)
- Your assessment of impact and likely affected versions
- (Optional) a suggested fix

We'll acknowledge within 48 hours and aim for a coordinated disclosure within 14 days.

## Scope

In scope:
- The API (`apps/api`) — auth bypass, signature replay, SQL injection, RCE
- The Chrome extension (`apps/extension`) — XSS, content-script injection, key leakage
- The claim web app (`apps/claim-web`) — phishing vectors, signature manipulation

Out of scope:
- DoS through legitimate API traffic
- Issues only reproducible with browser developer tools open
- Self-XSS and social engineering
- Reports about exposed thresholds, scoring rules, or detection heuristics — those are intentionally not in the public docs and won't be discussed in security context

## Bounty

We do not run a paid bug bounty at this stage. We do credit reporters in release notes if requested.
