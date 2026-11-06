# Changelog

## 0.6.0 (2026-11-06)

- A new visual world, the wall of hours, taken from square Kufic tilework: a cobalt band carrying the name as a square Kufic logotype, a gypsum ground by day and a deep blue night, square corners and flat tiles for every control.
- The wall of hours replaces the route. Every deadline with a fixed time is glazed on a wall with a row for each day and a tile for each hour: brick inside the hour, ochre inside six hours, ink for later, and a hollow brick tile once its time has passed. The time since discovery fills turquoise, the present hour carries a ring, runs of empty days fold into one line, and the key lists only what the wall shows. Each glazed tile takes you to its duty and rings it.
- The duties read as one ruled list under shared labels for time left, authority, stage and time, and source, each countdown on its own tile. Notices with no fixed time follow under their own rule, and duties that do not apply at the chosen grade under another.
- The first notice's countdown is set large in Kufam. The faces are now Kufam for the name, the headings and the figures, and Noto Kufi Arabic for everything else, both self hosted.
- On a phone the band keeps the name and both settings on one line, and the wall keeps all 24 hours of every day.
- The browser test now walks the wall: 24 tiles a day, the present hour ringed, every glazed tile named for screen readers, a tile taking focus to its duty, and nothing spilling on a 320 pixel phone. The engine tests cover how the wall lays out days and gaps, and the house style check reads exactly the files git would commit.
- New favicon and social image.
- The SDAIA breach rule is now read in the official text, Article 24 of the PDPL Implementing Regulation: 72 hours from becoming aware. Its old source page had moved, so the link now opens the regulation itself, and the register holds 17 duties read in the official text and 5 confirmed by secondary sources.

## 0.5.0 (2026-11-06)

- A new design with a day theme in sand stone and a night theme in lamp black. The site follows the device unless you choose, and colour is spent only on deadlines: red inside the last hour and once a deadline passes, amber inside six hours.
- The route of deadlines: every deadline with a fixed time is a station on a road that starts at discovery, with a marker for now moving along it. Each station takes you to its authority's slip and rings it. Notices due immediately lead the slips and stay off the road.
- The next notice leads the clock with its own countdown. A notice due immediately is named above it, and the number of deadlines already passed sits under it.
- On a phone the incident folds into a summary above the clock, each slip puts its seal beside the authority, and the actions and tabs take short names. Nothing spills sideways even with every country and zone selected on a 320 pixel screen.
- Fixed Arabic letters joining across neighbouring elements, which cut the last letter of stage names and authority names, and words in neighbouring parts of one line, such as a verification tag and its source, running together when read aloud or copied.
- Seals stay whole for counts past a hundred hours and for the longest stamp on the narrowest phone.
- The incident sheet prints black on white from either theme.
- Every size, gap, radius, stroke and duration comes from one scale. New favicon and social image.
- The browser test now covers both themes, the route, the folded incident on a phone, words kept apart across elements, printing from a dark browser and worst cases on the narrowest phone, and the engine tests cover the route and the next deadline.

## 0.4.1 (2026-10-02)

- External link check over every source, secondary and authority link and the links in README and NOTICE, run by preflight: a 404 or 410 fails, sites that refuse robots are reported.
- Fixed the QFC source link, which had moved, to the official breach reporting form that states the 72 hour rule.
- The browser test now holds both languages pure: no lowercase English in the Arabic page and no Arabic in the English page.
- MCP: the overview lists the free zones and the duty list filters by zone.
- Using a tabletop scenario's countries now drops free zones outside them.
- Fixed a stray "null" that the tabletop panel printed before the exercise ended, and the browser test now fails on any stray null, undefined or NaN in either language.
- The site is served over HTTPS on najjab.3li.info.

## 0.4.0 (2026-10-02)

- Financial free zones: pick DIFC, ADGM or QFC beside the country and their data protection duties join the clock, while federal duties stay for work outside the zone.
- DIFC Commissioner of Data Protection (as soon as practicable), ADGM Office of Data Protection (72 hours where feasible) and QFC Data Protection Office (72 hours), each read in the official text.
- The register now holds 22 duties, 16 read in the official text.

## 0.3.1 (2026-10-02)

- Oman Cyber Defense Centre: the duty of government entities and critical infrastructure operators to report cyber incidents, recorded by the National Cyber Security Index, with no published period.
- The register now holds 19 duties. Three authorities remain under verification.

## 0.3.0 (2026-10-02)

- Calendar file: every deadline with a fixed time as an iCalendar event with a reminder 15 minutes before it, from the site and from the new `najjab_calendar` MCP tool.
- Bahrain National Cyber Security Center: its national incident response plan makes reporting the affected entity's role, with no fixed period.
- The register now holds 18 duties, 13 read in the official text. Four authorities remain under verification.

## 0.2.0 (2026-10-02)

- Central Bank of the UAE: Operational Risk Management Regulation, in force since 14 September 2026, with the 4 hour notice, the 24 hour summary report, the notice on return to normal operations and the 72 hour notice for high-risk incidents.
- Central Bank of Bahrain: the one hour call, the two hour preliminary report and the 10 day full report for bank licensees.
- Qatar Central Bank: data breaches at licensed financial institutions go to QCB under its incident reporting guidelines and to NCSA and the Ministry of Interior.
- The register now holds 17 duties, 12 read in the official text. Five authorities remain under verification.
- Follow up notices within a duty are listed in the order they fall due.

## 0.1.0 (2026-10-02)

First release.

- Register of 14 notification duties across Kuwait, Saudi Arabia, the UAE, Qatar, Bahrain and Oman, 9 read in the official text and 5 confirmed by named secondary sources.
- Notification clock: deadlines computed from the discovery time, ordered by what is due first, with live countdowns in the user's time zone and the country's.
- Playbooks for ransomware, business email compromise, data breach and exposed cloud access keys.
- Notice draft in Arabic and English, tabletop exercises with timed developments, and the full register with the authorities still being verified.
- MCP server with seven read-only tools and no dependencies.
