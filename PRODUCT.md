# Product

## Platform

web

## Users

Heads of security, incident response leads, data protection officers and compliance teams at banks, insurers, payment firms, telecoms, government bodies and critical infrastructure operators in Kuwait, Saudi Arabia, the UAE, Qatar, Bahrain and Oman. They open Najjab in the first hours of a live incident, often under pressure and outside office hours, and again when they plan and rehearse with tabletop exercises.

## Product Purpose

Najjab turns an incident into the list of authorities that must be notified and the time each notice is due, counted from the discovery time, with the official source and verification level of every duty. Around that list it gives the response playbook, a notice draft in Arabic and English, a tabletop exercise and the full register. Success is a responder who knows within a minute who to notify first and can prove where each deadline comes from.

## Positioning

Every deadline in the register is tied to the provision that sets it and marked as read in the official text or confirmed by a named secondary source, and no number enters the register without one of the two. The six Gulf states, their central banks, national cyber authorities, data protection regulators and financial free zones sit in one clock.

## Operating Context

- A live incident: a laptop in a war room or a phone at night, the link shared in the response channel so the team sees the same countdowns.
- A tabletop exercise: a facilitator projects the page in a lit meeting room and reveals developments one at a time.
- The incident sheet is printed for the file, and the deadlines go into the team's calendar as an .ics file.
- AI assistants reach the same data through the MCP server in the repository.

## Capabilities and Constraints

- One static page on GitHub Pages at najjab.3li.info, plain HTML, CSS and JavaScript with no build step and no dependencies.
- A strict Content Security Policy: no inline scripts, styles or handlers, and nothing loaded from another site, fonts included.
- Arabic first and right to left, with a complete English version; both are held to the house writing rules by the tests.
- State lives in the browser and in the address only; there are no accounts and no server.
- Severity grades differ per authority, so the visitor picks the grade their own classification gives.

## Brand Commitments

- The name نجّاب (Najjab), the swift courier who carries the dispatch, written as a square Kufic logotype built from cells.
- The world of the wall of hours: square Kufic tilework on gypsum under a cobalt band, the deadlines glazed as tiles on a wall with a row for each day and a tile for each hour.
- Colour does jobs only: turquoise for time gone and for every selected control, brick inside the hour and past due, ochre inside six hours, ink for later.
- Kufam for the name, the headings and every figure that counts, and Noto Kufi Arabic for everything else, both self hosted under the SIL Open Font License.
- The author is Ali AlEnezi; commits and releases carry the SiteQ8 identity.

## Evidence on Hand

- The register in data/src/obligations.json: duties, authorities, sources and verification levels.
- Playbooks, tabletop exercises and interface strings in data/src.
- No testimonials, customer names or usage figures exist, and none may be invented.

## Product Principles

1. The deadline and its source travel together: a time without its provision is never shown.
2. Calm under pressure: the most urgent duty is found first, and colour is spent only where it carries meaning.
3. Honest about uncertainty: secondary sources and authorities still being verified are labelled as such.
4. Arabic is a first language, not a translation.
5. A practical reference and not legal advice: the official text prevails.

## Accessibility & Inclusion

Full keyboard use, visible focus, text contrast of at least 4.5:1 in both themes, reduced motion respected, and right to left layout as the default.
