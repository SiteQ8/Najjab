---
name: Najjab
description: "The wall of hours: square Kufic tilework on gypsum under a cobalt band, where each deadline of a Gulf cyber incident is glazed on the hour it falls due."
colors:
  # Day, the default theme. Keys are the stylesheet's own role names.
  ground: "#E6E5E1"
  surface: "#F2F2EF"
  raised: "#DCDBD6"
  grout: "#C4C1B9"
  tile: "#EFEEEA"
  tile-night: "#DAD8D2"
  line: "#1B1B1F"
  text: "#1B1B1F"
  muted: "#57554F"
  faint: "#67645D"
  band: "#1F3A8A"
  band-hover: "#2A4799"
  band-line: "#6F80BD"
  on-band: "#F1F0ED"
  on-band-muted: "#D3D8EA"
  band-dot: "#3DBDB5"
  turq: "#0B7675"
  turq-text: "#0B6B6A"
  on-turq: "#F2F2EF"
  brick: "#B23A26"
  brick-text: "#A8331F"
  on-brick: "#F2F2EF"
  ochre: "#C4891A"
  ochre-text: "#7F5400"
  on-ochre: "#1B1B1F"
  soon-edge: "#7F5400"
  later: "#1B1B1F"
  on-later: "#F2F2EF"
  primary: "#1B1B1F"
  on-primary: "#F2F2EF"
  focus: "#1F3A8A"
  selection: "#BFDFDB"
  # Night, the dark theme: the same roles, chosen by the visitor or by a dark system preference.
  dark-ground: "#0C1430"
  dark-surface: "#121C3E"
  dark-raised: "#1A2750"
  dark-grout: "#283766"
  dark-tile: "#121D41"
  dark-tile-night: "#0A1128"
  dark-line: "#E9E8E4"
  dark-text: "#E9E8E4"
  dark-muted: "#A6AFCD"
  dark-faint: "#8E97B8"
  dark-band: "#1A2D6E"
  dark-band-hover: "#22388A"
  dark-band-line: "#4F62A8"
  dark-on-band: "#E9E8E4"
  dark-on-band-muted: "#C3CAE6"
  dark-band-dot: "#3DBDB5"
  dark-turq: "#22A098"
  dark-turq-text: "#5DD0C7"
  dark-on-turq: "#08101F"
  dark-brick: "#C2402A"
  dark-brick-text: "#F07A62"
  dark-on-brick: "#F2F2EF"
  dark-ochre: "#C4891A"
  dark-ochre-text: "#E8B04F"
  dark-on-ochre: "#0C1430"
  dark-soon-edge: "#C4891A"
  dark-later: "#E9E8E4"
  dark-on-later: "#0C1430"
  dark-primary: "#E9E8E4"
  dark-on-primary: "#0C1430"
  dark-focus: "#A9BBF5"
  dark-selection: "#29406F"
typography:
  count:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "84px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: '"tnum"'
  name:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1
  title:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.25
  lead:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.5
  panel-title:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
  figure:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.25
    fontFeature: '"tnum"'
  card:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.5
  field:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
  small:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  tag:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.5
  tick:
    fontFamily: "Noto Kufi Arabic, Segoe UI, Tahoma, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
  tile-count:
    fontFamily: "Kufam, Noto Kufi Arabic, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: '"tnum"'
rounded:
  none: "0px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-7: "28px"
  s-8: "32px"
  s-10: "40px"
  s-12: "48px"
  s-16: "64px"
  gutter: "32px"
components:
  button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-hover:
    backgroundColor: "{colors.raised}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  button-small:
    padding: "0 12px"
    height: "32px"
  button-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.faint}"
  band-button:
    backgroundColor: "transparent"
    textColor: "{colors.on-band}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 16px"
    height: "40px"
  band-button-hover:
    backgroundColor: "{colors.band-hover}"
  field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.field}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
    height: "44px"
  field-hover:
    backgroundColor: "{colors.raised}"
  check-box:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    size: "18px"
  check-box-checked:
    backgroundColor: "{colors.turq}"
    textColor: "{colors.on-turq}"
  radio:
    backgroundColor: "{colors.surface}"
    size: "18px"
  radio-checked:
    backgroundColor: "{colors.turq}"
    textColor: "{colors.on-turq}"
  segment:
    textColor: "{colors.muted}"
    typography: "{typography.small}"
    rounded: "{rounded.none}"
    padding: "0 4px"
    height: "40px"
  segment-selected:
    backgroundColor: "{colors.turq}"
    textColor: "{colors.on-turq}"
    typography: "{typography.label}"
  switch:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.none}"
    width: "40px"
    height: "22px"
  switch-on:
    backgroundColor: "{colors.turq}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    padding: "12px 0"
  tab-selected:
    textColor: "{colors.text}"
  tag:
    textColor: "{colors.text}"
    typography: "{typography.tag}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "24px"
  tag-secondary:
    textColor: "{colors.ochre-text}"
  summary-chip:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 8px"
    height: "24px"
  wall-tile:
    backgroundColor: "{colors.tile}"
    rounded: "{rounded.none}"
  wall-tile-night:
    backgroundColor: "{colors.tile-night}"
  wall-tile-gone:
    backgroundColor: "{colors.turq}"
  wall-tile-later:
    backgroundColor: "{colors.later}"
    textColor: "{colors.on-later}"
    typography: "{typography.tile-count}"
  wall-tile-soon:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.on-ochre}"
  wall-tile-now:
    backgroundColor: "{colors.brick}"
    textColor: "{colors.on-brick}"
  wall-tile-passed:
    backgroundColor: "{colors.tile}"
    textColor: "{colors.brick-text}"
  countdown:
    backgroundColor: "{colors.later}"
    textColor: "{colors.on-later}"
    typography: "{typography.figure}"
    rounded: "{rounded.none}"
    padding: "8px 4px"
    width: "108px"
    height: "64px"
  countdown-soon:
    backgroundColor: "{colors.ochre}"
    textColor: "{colors.on-ochre}"
  countdown-now:
    backgroundColor: "{colors.brick}"
    textColor: "{colors.on-brick}"
  countdown-passed:
    backgroundColor: "transparent"
    textColor: "{colors.brick-text}"
  countdown-open:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
  countdown-off:
    backgroundColor: "transparent"
    textColor: "{colors.faint}"
  notice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: Najjab

## Overview

**Creative North Star: "The Wall of Hours"**

Najjab (نجّاب) sets the first hours of a cyber incident as square Kufic tilework. The days run down a wall as rows and the hours across them as square tiles, one tile to an hour, and a tile is glazed where a notice falls due, so the next days read at a glance while the time gone since discovery fills turquoise and the present tile moves. The same grammar of square cells and fine grout builds the name: the logotype is a square Kufic نجّاب drawn from cells set a unit apart, its dots glazed turquoise on the cobalt band.

The material is gypsum and ink by day and a deep cobalt night with gypsum ink, under a cobalt band in both. Everything is flat and square: nothing casts a shadow, every line is a hairline, an outline, a ring or a rim, and depth is only a tonal step between the ground, the lighter unglazed tile and the deeper night hour. The density is a working sheet for a war room at night or a phone in one hand: one aligned list of duties under shared column labels, tabular figures, supporting text at 13px, and colour spent only where it carries a meaning.

Motion is scarce and always says something. The tiles set once in reading order on the first draw, a pressed control gives a little over 140ms, a glazed tile takes the reader to its duty and rings it, and the urgency colours change over 240ms as a deadline comes closer. The direction asked for everything after the first draw to stay under 200ms; the shipped state changes run 240ms, entries 220ms and the ring's fade 600ms, and this file records what shipped. Reduced motion keeps every colour change and drops every movement. Arabic is the first language and the page is written right to left from logical sides, so the English edition is the same page mirrored. Two things are rejected outright: the warm cream plaster ground (#EDE6D8) of the first build, replaced with neutral gypsum because it read as the cream ground so many template sites ship, and the category default of a timeline strip over a stack of cards.

**Key Characteristics:**
- Square Kufic tilework: square cells, 1px grout, square corners, and the radio as the only circle.
- Gypsum by day and deep cobalt by night, with the cobalt band across the top in both.
- Colour does jobs only: turquoise, brick, ochre, ink and cobalt each keep to their own.
- Two faces: Kufam 700 for the name, the headings and the countdowns, Noto Kufi Arabic 400 and 600 for the work.
- Flat: no shadow, no gradient, no blur behind a surface; depth is a tonal step and a line.
- Arabic first and right to left from logical sides, mirrored for English.
- One motion on load, the set of the tiles; everything else is a press, a state change or a ring.

## Colors

A neutral ground of gypsum and ink carrying four glazes that each hold a meaning, under a cobalt band; night turns the ground to deep cobalt, lifts the text twins and keeps the glazes.

### Primary
- **Kufic Cobalt** (`band` #1F3A8A; night #1A2D6E): the band across the top that holds the logotype, the name, the tagline and the two settings, and the colour of the browser's own bar. By day nothing else is cobalt but the focus and arrival rings.
- **Lit Cobalt** (`band-hover` #2A4799; night #22388A): a band button under a fine pointer.
- **Cobalt Rule** (`band-line` #6F80BD; night #4F62A8): the hairline edge of the band buttons and the rule between the name and the tagline.
- **Gypsum on Cobalt** (`on-band` #F1F0ED; night #E9E8E4): the logotype's cells, the name, the band buttons' labels and the focus ring on the band.
- **Cobalt Mist** (`on-band-muted` #D3D8EA; night #C3CAE6): the tagline.
- **Dot Turquoise** (`band-dot` #3DBDB5 in both themes): the dots of the logotype, and nowhere else.
- **Cobalt Ring** (`focus` #1F3A8A; night #A9BBF5): the 2px ring that shows focus and the ring that marks a duty on arrival.

### Secondary
- **Glaze Turquoise** (`turq` #0B7675; night #22A098): time gone since discovery on the wall, and every selected control: a checked box, a chosen radio, the chosen severity, a switch turned on, the bar under the open tab, the caret and the browser's own accent.
- **Turquoise Ink** (`turq-text` #0B6B6A; night #5DD0C7): turquoise as words: the time since discovery in the key, the exercise clock and its minute stamps, and a playbook phase whose steps are all done.
- **Gypsum on Turquoise** (`on-turq` #F2F2EF; night #08101F): the check, the radio's dot, the switch's thumb and the chosen severity's word on a turquoise fill.
- **Turquoise Wash** (`selection` #BFDFDB; night #29406F): selected text.

### Tertiary
- **Kiln Brick** (`brick` #B23A26; night #C2402A, a step brighter so a glazed tile holds 3:1 against the night tiles beside it): the glaze of a notice due within the hour or at once, and the 3px rim of a deadline that has passed.
- **Brick Ink** (`brick-text` #A8331F; night #F07A62): brick as words: the countdown inside the hour, a notice due at once named in the finding, the count of deadlines already passed, and the figure on a passed tile.
- **Gypsum on Brick** (`on-brick` #F2F2EF in both themes): figures and words on the brick glaze.
- **Ochre Glaze** (`ochre` #C4891A in both themes; by day an ochre tile carries a 1px kiln edge `soon-edge` #7F5400 in place of its grout, so it holds 3:1 against the pale tiles beside it): the glaze of a notice due within six hours, and the edge of the tag on a duty confirmed only by a secondary source.
- **Ochre Ink** (`ochre-text` #7F5400; night #E8B04F): ochre as words: the countdown within six hours, the condition a deadline depends on, and the word on a secondary source tag.
- **Ink on Ochre** (`on-ochre` #1B1B1F; night #0C1430): figures and words on the ochre glaze.
- **Ink Glaze** (`later` #1B1B1F; night #E9E8E4): the glaze of a notice due later than six hours. By night it turns to gypsum, so later stays the strongest mark against the ground.
- **Gypsum on Ink** (`on-later` #F2F2EF; night #0C1430): figures and words on the ink glaze.

### Neutral
- **Gypsum** (`ground` #E6E5E1; night #0C1430): the page.
- **Bright Gypsum** (`surface` #F2F2EF; night #121C3E): the face of buttons, fields, boxes and the switch, the notice draft and the folded incident.
- **Pressed Gypsum** (`raised` #DCDBD6; night #1A2750): a control's face under a fine pointer, one step away from the surface, darker by day and lighter by night.
- **Grout** (`grout` #C4C1B9; night #283766): every hairline rule, the grout of the wall, the frame of an untimed countdown, a disabled edge, the underline of a link and the scrollbar.
- **Unglazed Tile** (`tile` #EFEEEA; night #121D41): an hour with nothing due, a step lighter than the ground so the wall has its own body.
- **Night Hour** (`tile-night` #DAD8D2; night #0A1128): the hours before 06:00 and from 18:00, a step deeper than the ground.
- **Ink** (`text` and `line` #1B1B1F; night #E9E8E4): text, the 1px edge of every control off the band, the rule under the column labels, and the ring on the present hour and on a hovered glazed tile.
- **Weathered Ink** (`muted` #57554F; night #A6AFCD): labels, hints, places, sources, the day names and hour marks, and the tabs not open.
- **Faded Ink** (`faint` #67645D; night #8E97B8): the country's own time on a due line, a disabled label, and the word on a duty not triggered at this grade.
- **Ink Fill** (`primary` #1B1B1F; night #E9E8E4) with **Gypsum on Ink Fill** (`on-primary` #F2F2EF; night #0C1430): the one filled button in a region.

On paper the palette collapses to black ink on white with grey grout (#BBBBBB), every glaze prints black, and urgency is read from the figures.

### Named Rules
**The Colour Does Jobs Rule.** A hue appears only where it means something: turquoise is time gone, a chosen control and work done; brick is within the hour, at once and passed; ochre is within six hours and, as words or an edge, a condition or a secondary source; ink is later; cobalt is the band and the ring of focus. The logotype's dots belong to the mark and are not a job to extend. A hue with no job is not added, and no job borrows another's hue.

**The Hollow Rim Rule.** When a deadline passes its glaze comes off: the tile returns to the unglazed body, or to the ground in a duty row, takes a 3px brick rim and sets its figure in brick ink. A fill is time still to meet; a rim is time gone by.

**The Text Twin Rule.** Every glaze has a twin for words, tuned to read at 4.5:1 or better on gypsum by day and on cobalt by night, and the glaze itself is kept for fills, rims and bars. Text never takes the glaze directly.

## Typography

**Display Font:** Kufam 700 (with Noto Kufi Arabic, Segoe UI, sans-serif)
**Body Font:** Noto Kufi Arabic 400 and 600 (with Segoe UI, Tahoma, system-ui, sans-serif)

**Character:** Two Kufi faces. Kufam's square, built letterforms give the name, the headings and the countdowns the geometry of the tilework, while Noto Kufi Arabic carries the work at a reading weight and a working 600, its Latin sitting evenly beside the Arabic in the English edition. Both are self hosted under the SIL Open Font License in Arabic and Latin subsets, and swap in as they arrive.

### Hierarchy
- **Count** (Kufam 700, 84px, line height 1, letter spacing -0.02em; 72px below 1100px, 56px on a phone): the countdown to the first notice, the one display figure on the page, in ink, ochre ink or brick ink by urgency.
- **Name** (Kufam 700, 26px, line height 1; 22px on a phone): the wordmark beside the logotype.
- **Title** (Kufam 700, 22px, line height 1.25): the section headings, the incident and the clock.
- **Lead** (Noto Kufi Arabic 600, 20px, line height 1.5; 18px on a phone): the finding that names the first notice above its countdown.
- **Panel Title** (Kufam 700, 20px, line height 1.25; 18px on a phone): the heading of the playbook and of the exercise.
- **Figure** (Kufam 700, 16px, line height 1.25): the countdown on each duty's tile, stepping down to 13px once it passes a hundred hours and gains a digit. The register's country headings take the same face and size.
- **Card** (Noto Kufi Arabic 600, 16px, line height 1.5): the authority at the head of each duty.
- **Field** (Noto Kufi Arabic 400, 16px, line height 1.5): text in fields and selects and the shown moment of discovery, at the size phone browsers do not zoom into.
- **Body** (Noto Kufi Arabic 400, 15px, line height 1.75, measure 70ch): running text, the playbook's steps, the exercise and the tabs.
- **Label** (Noto Kufi Arabic 600, 13px, line height 1.5): field labels and legends in weathered ink, button labels, the switch's words and group titles.
- **Small** (Noto Kufi Arabic 400, 13px, line height 1.5): hints, places, scope, due lines, sources, the key, the tagline at a 58ch measure, and the footer.
- **Tag** (Noto Kufi Arabic 600, 12px, line height 1.5): verification tags and the column labels over the duties.
- **Tick** (Noto Kufi Arabic 400, 12px, line height 1.5): the hour marks over the wall on their 24px row, the time zone in the wall's corner, the word under a duty's countdown and the words of a gap row.
- **Tile Count** (Kufam 700, 12px, line height 1): the number of notices on a glazed tile that holds more than one, hidden when the wall is narrower than 460px.

### Named Rules
**The Counting Face Rule.** Kufam 700 sets the name, the headings and every figure that counts down: the first notice's countdown, each duty's countdown and the number on a glazed tile. Noto Kufi Arabic sets everything else, at 400 to read and at 600 to label, choose or stress, so the elapsed clocks and the due times stay in the reading face. There is no third face and no other weight.

**The Steady Figures Rule.** Figures are tabular across the whole page, and every countdown and the time since discovery in the key are isolated left to right, so 00:22:58 keeps its order and its width inside an Arabic line as it ticks.

## Layout

The page is a desk on a 1440px frame, centred, with a 32px gutter (20px below 900px, 16px on a phone) that never falls inside the device's safe area. Under the band the desk has two columns: the incident rail, 360px on the start side (316px below 1100px), and the sheet beside it, set 32px off a grout hairline (24px below 1100px). The rail holds its place as tall as the window and its form scrolls on its own, while the sheet scrolls the page.

The sheet reads in one order: the clock's title, the finding and its countdown with the calendar and print actions beside them, the count of duties, then the wall 28px below, the duties 32px below the wall, and the work tabs 48px below the clock, with 64px of air at the foot of the sheet. The band is at least 72px tall (60px on a phone), with the logotype and the name on the start side, the tagline after a cobalt hairline at a 58ch measure, and the language and theme at the end. Running text holds a 70ch measure.

Spacing runs on a 4px base from 4px to 64px. The working steps are 8px between a label and its control and between buttons, 16px above and below each group of the form and each duty row, 20px between the columns of a duty, 24px above a panel, 32px between groups, and 48px and 64px between the large parts of the sheet.

The width tells the page how to fold. Below 1100px the rail narrows and the countdown steps down to 72px. Below 900px the desk becomes one column and the incident folds into a summary above the clock: a bright gypsum box with a grout edge, its title reduced to Label type, the chosen values as small chips on the ground, and an Edit button that opens the form beneath it over 220ms. Below 760px the tagline takes its own line under the name and the notice draft becomes one column. On a phone (560px and below) the tagline goes, the logotype shrinks from 95 by 47px to 57 by 28px, the two clock actions share the width at 44px with short labels, and every country, zone, incident type and severity choice is at least 44px tall.

Print gives the sheet to paper: the band reduces to the name and the tagline over an ink hairline, a brief of the incident prints as a list of terms, the form, the wall, the actions, the tabs and the other panels are left off, the playbook prints with every phase open, duty rows keep together on a page, and the countdown tiles become ink hairline boxes.

### Named Rules
**The Own Column Rule.** The wall and the duty rows answer to the width of their own column through container queries, never to the window, so the same block works on the desk, folded on a tablet and on a phone. Under 760px the wall moves its key below and keeps only the marks every six hours, and under 460px it hides the tile counts and gives each glazed tile a 24px target; the duties drop their column labels under 860px and become two columns with a 92px countdown tile under 600px.

**The Logical Side Rule.** Every side is written as start or end, never left or right, so the Arabic page and its English mirror come from one stylesheet. Only the safe area insets, which are physical by nature, and the travel of the switch's thumb are set per side.

## Elevation & Depth

Najjab is flat by construction. Nothing casts a shadow, nothing carries a gradient and nothing blurs what lies behind it, so there is no shadow vocabulary. Depth is a tonal step and a line: the unglazed tile and the bright gypsum surface sit a step lighter than the ground, the night hours a step deeper, and a hovered control one step away from its face; rules and grout are 1px hairlines, controls carry a 1px ink edge, focus and the present hour carry a 2px ring, and a passed deadline or the open tab carries a 3px rim or bar. Layering is only stacking order: the present tile and a hovered or focused glazed tile lift their ring above their neighbours, and the incident rail holds its place while the sheet scrolls.

### Named Rules
**The No Shadow Rule.** No element casts a shadow, takes a gradient or blurs the surface behind it. Whatever must stand apart takes a hairline, a tonal step or a ring.

**The Grout Rule.** The wall's grout is each tile's own 1px outline drawn into the 1px gap of the grid. Tiles carry no border and no line is laid over the wall; the gap row and the present tile's ring keep the same outline grammar.

## Shapes

Square throughout (0px). Buttons, fields, selects, the severity frame, tags, chips, the switch's track and its thumb, the countdown tile, the boxes and the band all keep square corners. The one circle is the radio: a choice of one among several is drawn round, while a box that may be chosen with others is square.

Form is built from cells. The logotype is square Kufic drawn from 5 unit cells set a unit apart, the same cell and grout grammar as the wall, and the small square that leads a verification tag (8px) is a tile in miniature, filled for the official text and hollow for a secondary source. Icons are one drawn set on a 16px grid with a 1.5px stroke (2px for a check inside a box), square ends and mitred joins, so their corners agree with the tiles.

Lines come in four weights: the hairline (1px) for rules, grout, edges and underlines; the box line (1.5px) for the check box, the radio, the switch's track and the hollow square of a tag; the ring (2px) for focus, the present hour, a hovered glazed tile and a duty on arrival; and the rim (3px) for a passed deadline and the bar under the open tab. A dashed hairline marks what is subordinate or does not apply: the further stages under a duty, the countdown tile of a duty not triggered at this grade, and an empty state.

### Named Rules
**The Square Corner Rule.** Every corner is square. The radio's circle is the only rounded shape among the controls, and it exists to say one of many.

**The Dashed Means Less Rule.** A solid hairline is for what stands; a dashed hairline is for what is subordinate or does not apply.

## Components

### Buttons
Flat tiles with an ink edge, and in each region one of them filled in ink.
- **Shape:** square (0px) with a 1px ink edge, 40px tall with 16px to each side, the label in Label type with an optional 16px drawn icon 8px from it.
- **Primary:** an ink fill with a gypsum label, turning to a gypsum fill with a deep cobalt label by night, used once in a region: the calendar action on the clock and the next development in the exercise.
- **Default:** a bright gypsum face with an ink label and edge, for print, set to now, reset and the rest.
- **Small:** 32px tall with 12px to each side, for Edit on the folded incident and Copy under a draft.
- **Hover / Focus:** under a fine pointer the face steps to pressed gypsum and the primary eases to 88% opacity; a press scales the button to 97% over 140ms; focus draws the 2px cobalt ring 2px outside the edge.
- **Disabled:** no face, a faded ink label and a grout edge.
- **Label swap:** Copy turns to Copied through a 200ms blur and dim, and turns back after 1800ms.
- **Phone:** long labels give way to short ones, and the two clock actions share the row at 44px.
- **Band buttons:** on the cobalt band a button has no face, a cobalt rule edge and a gypsum label, and the theme button is a 40px square holding a 20px icon; a fine pointer lights the face to lit cobalt, a press scales it to 97%, and focus draws a gypsum ring.

### Chips
The incident's choices are small tiles beside their words.
- **Style:** an 18px square box with a 1.5px ink line on bright gypsum and the word beside it in Body type, at least 32px tall (44px on a phone); countries sit three to a row and free zones one to a row.
- **State:** a chosen box fills turquoise with a 2px gypsum check and its word turns 600; under a fine pointer an unchosen box steps to pressed gypsum; a press scales the box to 90%; focus rings the box rather than the word.
- **Radios:** the incident type uses the same tile drawn round, its inner dot gypsum on turquoise once chosen.
- **Summary chips:** when the incident folds, each chosen value shows as a 24px square chip on the ground with a grout edge, in Label type.

### Cards / Containers
There are no cards. Duties are ruled rows on the ground, never boxes in a stack, and the few boxes on the page are flat.
- **Corner Style:** square (0px).
- **Background:** bright gypsum for the notice draft, the authorities still being verified and the folded incident; none for an empty state.
- **Shadow Strategy:** none, as set out under Elevation & Depth.
- **Border:** a 1px grout edge, dashed for an empty state.
- **Internal Padding:** 16px for the notice draft, 16px by 20px for the authorities still being verified, 20px for an empty state, and 12px by 16px for the head of the folded incident.

### Inputs / Fields
- **Style:** a 1px ink edge, square, on bright gypsum, at least 44px tall with 8px by 12px of padding, in Field type. A select drops the browser's arrow for a drawn 16px chevron 12px from the end edge and keeps 40px clear for it. A label sits 8px above in Label type and weathered ink, and a hint sits 8px below in Small type.
- **Focus:** the 2px cobalt ring 2px outside the edge; the caret and the browser's own accent are turquoise.
- **Hover:** the face steps to pressed gypsum under a fine pointer.
- **The moment of discovery:** it leads the form and shows as a field in the page's own words for the date and time, with a calendar icon at the end; the browser's own picker sits beneath it and opens from it, and where no picker opens the field itself appears in place. Set to now sits beside it at the same height.
- **Severity:** four tiles in one 1px ink frame divided by grout hairlines, 40px tall (44px on a phone), each word in Small type and weathered ink. The chosen tile fills turquoise with a gypsum word at 600, an unchosen tile steps to pressed gypsum under a fine pointer, a press scales the tile's face to 97%, and focus rings the tile inside the frame.
- **Switch:** the personal data switch is a square track (`switch-w` 40px by `switch-h` 22px) with a 1.5px ink line and a square ink thumb (`thumb` 13px) set `thumb-inset` 3px in. Turned on, the track fills turquoise and the thumb turns gypsum and travels toward the end over 240ms, its travel worked out from those tokens (18px). When the incident type already involves personal data the switch is locked on at 55% opacity, and under reduced motion the thumb jumps to the end instead of travelling.
- **Text areas:** the notice draft's longer fields take Body line height (1.75), start at 96px and resize only in height.
- **Form rhythm:** each group of the incident form sits between grout hairlines with 16px above and below.

### Navigation
- **The band:** cobalt across the full width, at least 72px tall (60px on a phone), holding the logotype (95 by 47px) and the name on the start side, the tagline after a cobalt hairline, and the language and theme buttons at the end. A skip link waits above it and drops in as an ink tile when it takes focus.
- **Work tabs:** words on a grout hairline, 24px apart (20px on a phone), in Body type and weathered ink. The open tab turns ink at 600 with a 3px turquoise bar along its foot; a fine pointer turns a tab ink; focus rings it inside its own box; the arrow keys move between tabs in reading direction; and the row scrolls sideways without a scrollbar when it runs out of room.
- **Links:** underlined with a 1px grout line 4px below the text; under a fine pointer the line takes the colour of the text.

### Tags
- **Verification tag:** 24px tall with 8px to each side, square, in Tag type with a 1px edge and an 8px square before the word. The official text is ink with an ink edge and a filled square; a secondary source is ochre ink on an ochre edge with a hollow square. A tag explains its level through its title and is never a control.

### The Wall of Hours
The signature: the incident's deadlines glazed as tiles on a wall, a row for each day and a square tile for each hour.
- **Grid:** a label column at its natural width and 24 equal square tiles with a 1px gap that the tiles' own grout outlines fill. The rows run from the day of discovery to the day of the last deadline; a day with a deadline, the first day and today always keep their row, a single quiet day keeps its row, and a run of quiet days folds into one gap row of tile body that names how many days pass.
- **Labels:** each day in Small type and weathered ink, today in ink at 600; the hour marks every three hours in Tick type; the present hour's mark names the time in ink at 600, and any mark that would touch it steps aside.
- **Tiles:** an unglazed tile for a day hour, a deeper tile for a night hour, turquoise for an hour wholly gone since discovery, and a turquoise fill along the reading direction for the part of an hour gone. The present hour carries a 2px ink ring and fills minute by minute.
- **Glazed tiles:** an hour in which a notice falls due takes the glaze of its most pressing notice: ink for later, ochre within six hours, brick within the hour, and once passed the unglazed body with a 3px brick rim and a brick figure. A tile holding more than one notice shows how many in Tile Count type.
- **States:** a glazed tile is a link to its duty. Under a fine pointer it lifts a 2px ink ring 1px outside; focus draws the cobalt ring; a press scales it to 90% over 140ms; following it scrolls to the duty and rings it. Where the wall is narrower than 460px each glazed tile gets a 24px target, and touching glazed tiles share one target that leads to the earliest duty.
- **The key:** beside the wall, or below it when the wall is narrow, listing only the kinds the wall shows, each swatch the tile itself at 12px, with the time since discovery in turquoise ink.
- **First draw:** the tiles set once in reading order, 36ms a row and 7ms an hour, each growing from 80% and fading in over 260ms; gap rows fade in on their row's beat. The set happens on the first draw only, never on a redraw and never under reduced motion.

### Duty Rows
Each authority to notify is one ruled row under shared column labels: time left, authority, stage and time, source.
- **Row:** four columns, the countdown tile at 108px, the authority, the stage and time at 1.3 parts and the source, 20px apart and 16px above and below, with a grout hairline beneath. The column labels sit in Tag type and weathered ink over an ink hairline.
- **Content:** the authority in Card type with its country and scope in Small type and weathered ink; the lead stage at 600 with its time, then the due moment in the reader's time and, when it differs, the country's own time in faded ink; a condition in ochre ink; further stages under a dashed hairline; and the source with its verification tag.
- **Countdown tile:** 108 by 64px and square, the figure in Figure type over its word in Tick type. The ink glaze is for later, ochre within six hours and brick within the hour; a notice due at once shows its word on brick. Once passed the glaze comes off for a 3px brick rim, a brick figure and the word overdue. A duty to notify promptly, or by a period not yet set, shows its word in weathered ink inside a grout hairline frame, and a duty not triggered at this grade shows a faded word inside a dashed one. Colours change over 240ms as urgency moves.
- **Arrival:** a duty reached from the wall takes the 2px cobalt ring 4px outside at once, holds it for 1200ms, then lets it fade over 600ms.
- **Groups:** the duties with a moment to meet lead under the column labels; those with no fixed time and those not triggered at this grade follow under their own titles in Label type and weathered ink, over an ink hairline.

### Playbook and Exercise
- **Phases:** each playbook phase is a disclosure row at least 48px tall between grout hairlines, with an ink hairline above the first, a 16px chevron in weathered ink that turns over 150ms as the phase opens, and its progress at the end in Small type, which turns turquoise ink with a check once every step is done.
- **Steps:** check tiles at a 70ch measure; a done step turns weathered ink with a grout line through it.
- **Exercise:** developments arrive in a ruled list under an ink hairline, the minute stamp in turquoise ink at 600 in a 112px column, and each new development rises 8px and fades in over 220ms. The exercise clock sits at the end of the controls in turquoise ink.

## Do's and Don'ts

### Do:
- **Do** take every gap and padding from the 4px scale (4px to 64px) and every line from the four weights (1px, 1.5px, 2px and 3px).
- **Do** draw a new control as a flat square tile with a 1px ink edge on bright gypsum (#F2F2EF), and fill it turquoise (#0B7675) once it is chosen.
- **Do** give a glaze's words to its text twin and keep the glaze for fills, rims and bars, with text at 4.5:1 or better in both themes.
- **Do** set every countdown in Kufam 700 with tabular figures, isolated left to right.
- **Do** write every side as start or end, so the English page mirrors the Arabic one from the same rules.
- **Do** size any block that sits in the sheet by its own column with container queries.
- **Do** show hover only to fine pointers, and keep a press at 140ms on the ease out curve (cubic-bezier(0.23, 1, 0.32, 1)).
- **Do** keep every colour change and drop every movement under reduced motion.

### Don't:
- **Don't** add a shadow, a gradient, a blur behind a surface or a rounded corner; the radio's circle is the only curve among the controls.
- **Don't** spend turquoise, brick, ochre or cobalt where they carry no job, and don't let one job borrow another's hue.
- **Don't** return to the warm cream plaster ground (#EDE6D8); the ground is neutral gypsum (#E6E5E1).
- **Don't** stack the deadlines as cards under a timeline strip; they are glazed tiles on the wall and ruled rows under shared labels.
- **Don't** add a third face or another weight, and don't set a countdown in Noto Kufi Arabic.
- **Don't** move anything on load but the first set of the tiles.
- **Don't** let a passed deadline keep its fill; it becomes a hollow brick rim.
- **Don't** draw an icon from a typed character; icons are drawn on the 16px grid with square ends.
