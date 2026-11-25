# Design: The Wedding of Victor & Adaeze

**Direction:** bespoke, art-directed digital invitation, built from quiet luxury, organic modernism and editorial restraint.

The brief asked for three related directions first, then one carried through consistently. Each direction appears below with its colour system, type pairing, homepage composition, navigation, motion philosophy and reference board. The chosen one is marked. A visual comparison of all three is in [`design/directions.html`](design/directions.html); open it in a browser.

---

## A. Letterpress

*Stationery minimalism: the site as a cotton-paper card.*

| | |
|---|---|
| **Colour** | Cotton `#F7F3EC` · Ink `#1F1B17` · Graphite `#5B554E` · Deckle `#D9D1C4` · Oxblood `#6B2A2A` (monogram and links only) |
| **Type** | Bodoni Moda (high-contrast Didone, names in italic) with Jost (Futura-like tracked capitals) |
| **Homepage** | Fully centred, like a printed card: monogram, names, date and an invitation line. The photograph arrives after the first scroll as a full-bleed band. |
| **Navigation** | Hidden until the first scroll, then a centred row of small capitals |
| **Motion** | "Ink settling": opacity only, 1.2 s, no movement at all |
| **Reference board** | Letterpress on 600 gsm cotton; deckle-edged envelopes; Didone mastheads; blind embossing; wax seals photographed flat |

**Why not:** it is the closest of the three to a conventional wedding template. Symmetry on every screen becomes predictable, and hairline Didones break up at small sizes on budget Android screens, which many guests will use through WhatsApp.

## B. Harmattan (chosen)

*Organic modernism, rooted in place and season.*

The wedding falls on 28 November in Ekiti State, as the Harmattan begins: warm, dry, hazy light, laterite earth and sun-bleached cloth. The palette and motion borrow from that light instead of from wedding clichés. That gives the site a character of its own without a single decorative motif.

| | |
|---|---|
| **Colour** | Bone `#F3EDE3` (paper) · Oat `#EBE3D6` (alternate sections) · Shea `#E1D7C7` (image plates) · Umber ink `#2A241F` · Earth grey `#5D544B` · **Laterite `#8C4A31`** (the only accent) · Night umber `#211C18` (closing) |
| **Type** | **Newsreader**, a variable serif with optical sizes, so display sizes get the fine cut and reading sizes the sturdy one. Its italic carries the ampersand and the couple's voice. **Hanken Grotesk** handles information: times, addresses, forms and labels. |
| **Homepage** | Asymmetric and editorial. The names are set large on the left, with the second line indented and an italic laterite ampersand. The portrait is offset to the right and spans the full height of the composition. Date, place, tagline, countdown and reply sit in a quiet block beneath a single rule. Without a portrait, the names take the full measure and the details split into two columns. |
| **Navigation** | Names at left, five section links, and a bordered RSVP that stays visible. On phones there is an RSVP button and the word "Menu", which opens a full-screen sheet of large serif links. The bar fills with paper after the first scroll and steps aside while reading downwards. |
| **Motion** | "Haze lifting": content settles 12 px into place over about 1.1 s on a long ease-out curve. Photographs resolve from 106 % scale. There is one parallax, on the hero portrait at 5 % of scroll speed. Countdown hours and days fade in as they turn over; seconds simply change. Everything is disabled under reduced motion. |
| **Reference board** | Ekiti hills in late-November haze; laterite roads after a dry week; sun-bleached linen and aso-oke selvedges; *Kinfolk* and *Apartamento* page rhythm; museum wall labels; reply cards with ruled lines |

## C. Gallery

*Editorial contemporary: the site as an exhibition catalogue.*

| | |
|---|---|
| **Colour** | Gallery white `#FAFAF7` · Charcoal `#161616` · Stone `#8C8A85` · Rule `#E4E2DD` · Deep olive `#3F4A33` |
| **Type** | Instrument Serif (condensed display) with Schibsted Grotesk |
| **Homepage** | Swiss grid. A giant numeric date, 28.11.26, is the hero; monochrome photograph strips; numbered sections. |
| **Navigation** | A fixed vertical index down the left edge on desktop |
| **Motion** | Precise line-draws and horizontal wipes, about 500 ms |
| **Reference board** | Exhibition catalogues; gallery vinyl lettering; contact sheets; Swiss posters |

**Why not:** it is beautiful but cool. It reads as an agency or gallery more than a wedding, and monochrome photography undersells the warmth the brief asks for.

### Why Harmattan

It is the only direction with a recognisable personality drawn from the couple's own circumstances rather than from the genre. Its warmth comes from earth tones, not gold. Its depth comes from three paper tones, a dark close and real texture. And it leaves room for photography to lead once the portraits arrive.

---

## The system

**Grid.** Twelve columns, a maximum measure of 82 rem, and gutters of 20 to 64 px that scale with the screen. Every section shares the measure but composes differently, so structure stays constant while rhythm varies:

- The story uses a sticky margin column.
- The celebration splits its header and reads each event across the page.
- The dress code is centred.
- The gallery uses justified rows.
- Guest information puts its titles in the margin.

**Type scale.**

| Element | Setting |
|---|---|
| Names | 60 to 152 px, light |
| Section titles | 40 to 72 px |
| Lead | 19 to 23 px serif |
| Body | 17 px sans at 1.65 line height |
| Labels | 12 px capitals tracked at 0.16 em |

Labels are the only capitals: action links on events were moved to sentence case to keep tracked capitals from becoming wallpaper.

**Detail.**

- 1 px hairlines replace boxes almost everywhere.
- Buttons are square-cornered.
- There is one shadow, under the reply card, which reads as a card lying on a table.
- A faint grain on every paper tone keeps flat colour from looking synthetic.

**Photography.**

- Every image keeps its natural proportions, except deliberate crops: the portrait at 4:5, chapter images at 4:5 or 3:2.
- Each image reserves its space and shows its own average tone while loading.
- Location metadata is stripped.

**Placeholders.** Unconfirmed content never reaches guests. Signed-in admins see it marked "TBC" in dashed laterite, and missing photographs appear as labelled plates. That way the couple can judge the full composition before every detail exists.

## Creative-direction review

I ran this review against screenshots at 1440 px and 390 px, with the real (mostly placeholder) content and with filled-in sample content and stand-in images. Each question gets an honest answer and the change made.

1. **Bespoke or template?** The indented names, the laterite ampersand, the thread that drops from the hero into the invitation, the margin-column story and the hairline event rows do not come from any wedding template. The one generic risk was every section opening with the same label-plus-title. Each section therefore uses a different header composition.
2. **Is every element necessary?** The design deliberately has no numbered sections ("01 —"), icons, cards around events or decorative monogram. The vertical rule above the invitation stays because it links hero to invitation; it does not decorate.
3. **Hierarchy.** On every screen, names come first, then the date, then the reply action. On mobile the reply stays one tap away in the navigation bar throughout.
4. **Proportions and spacing.**
   - The italic ampersand collided with "Adaeze", so it was given 0.1 em of air.
   - The second-line indent was reduced on phones.
   - The reply card was taken nearly edge to edge on small screens.
5. **Motion.** Seconds no longer animate, because a pulse every second competed for attention; only hours and days settle in. The navigation hides only after 560 px and returns on any upward scroll or keyboard focus.
6. **Generic patterns.** No gradients, glass, glow or floating shapes. I rejected the overused serif-heading-with-one-italic-word pattern; italics appear only in the ampersand, the tagline and sign-offs.
7. **Mobile.** At 390 px the names, date and portrait form the first screen. Event facts stack in reading order, and the countdown units narrow on very small phones.
8. **Cheap or inconsistent details.**
   - The celebration heading showed one date when events spanned two days. It now reads "27 – 28 November".
   - The awkward lead copy was rewritten.
   - Event names lost a capital in the admin list; that is fixed.

Accessibility checks:

- Every text colour pair meets WCAG AA. The lowest is laterite on oat at 5.25:1; placeholder hint text, at 3.5:1, is the only exception.
- Focus rings are visible throughout.
- Forms have labels, hints and an error summary that moves focus to the first problem.
- Content stays visible without JavaScript.
- Reduced motion is honoured.
