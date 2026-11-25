# The Wedding of Victor & Adaeze

A bespoke digital wedding invitation and guest portal for Saturday 28 November 2026, Ekiti State.

![Design directions](design/directions.png)

It is a real working site, not a mock-up:

- **The invitation:** names, portrait, a live countdown, your story, every part of the celebration with maps and directions, the dress code and colours, a gallery with a lightbox, travel and accommodation, questions, contacts, gifts and a closing message.
- **Personal invitation links** such as `/i/K7QM-3XP9` greet each guest by name, show the events they are invited to and pre-fill their reply. Guests can also type their code at `/rsvp`.
- **RSVP:** accept or decline, the number of guests (never more than the seats you allocated), which celebrations they will attend, contact details, dietary and accessibility needs, and a note to you. Guests can change their reply until your deadline. They see a confirmation and can add the events to their calendar.
- **An admin area at `/admin`:**
  - create invitations or import a guest list from a spreadsheet
  - send each invitation by WhatsApp in one click
  - follow replies per celebration and per side of the family
  - read guests' notes
  - post updates such as a change of time
  - export everything to CSV
- **After the day** the site changes on its own: replies close, and the opening reads "Married on Saturday 28 November 2026".

The design rationale (three directions explored, why "Harmattan" was chosen, and the self-review) is in [DESIGN.md](DESIGN.md).

## Run it on your computer

You need [Node.js](https://nodejs.org) 22.13 or newer.

```bash
npm install
```

```bash
cp .env.example .env
```

Set `ADMIN_PASSWORD` and `SESSION_SECRET` in `.env`, then start the site:

```bash
npm run dev
```

Open http://localhost:3000. The admin area is at http://localhost:3000/admin.

## Fill in your details

Everything guests read is in **[content/wedding.js](content/wedding.js)**, a plain, commented file.

- **Nothing was invented.** Anything not yet confirmed is written as `tbc('…')`, a placeholder that guests never see. The site leaves it out gracefully.
- **When you are signed in to `/admin`**, the site shows every placeholder in place, marked **TBC**. You can judge the whole design before every detail exists. **Admin → Content** lists everything still outstanding.
- **To fill one in**, replace the whole `tbc('…')`, e.g. `name: tbc('Name of the church'),` becomes `name: 'Christ Church Cathedral',`.
- **Events** stay hidden until you change `status: 'draft'` to `status: 'confirmed'`. Each event has an `access` setting:
  - `'open'`: every invited guest
  - `'invitation'`: shown to everyone, but only invited guests can reply to it
  - `'private'`: only guests whose invitation includes it can see it
- **Set `rsvp.deadline`.** Replies close at the end of that day.
- **Gift details** are only shown to guests who opened their personal link or entered their code, never to the public.

### Photographs

1. Put your original photos in the `photos/` folder.
2. Run this:

```bash
npm run photos
```

3. Refer to each photo by its file name without the extension, e.g. `image: 'hero'` for `photos/hero.jpg`.

The script makes fast, right-sized copies and removes location data. The portrait becomes the image shown in WhatsApp link previews. Short videos (MP4 or MOV) work the same way: they appear in the gallery marked “Film” and play in the viewer. Videos need [ffmpeg](https://ffmpeg.org) installed. See [photos/README.md](photos/README.md).

## Sending invitations

1. **Admin → Invitations → New invitation.** Enter the name as guests should see it (e.g. "Mr & Mrs Chidi Okafor"), the number of seats, and the celebrations it includes. Or use **Import** to paste a spreadsheet; the columns are explained on that page.
2. On an invitation, **Send on WhatsApp** opens WhatsApp with a ready message and the guest's personal link, and records it as sent. **Copy link** and **Copy message** work for any other channel. Edit the message in `invitationMessage` in the content file.
3. Each link is personal: it can only reply for that invitation, and only for its seats. If a link reaches the wrong person, **Issue a new code**; the old link stops working.
4. If a guest phones in their reply, open their personal link while signed in and reply for them. Signed-in admins can do this even after the deadline.

## Following replies

- **Overview** shows guests attending, invitations answered, seats awaiting, and the count per celebration and per side. It also lists dietary and access needs and guests' notes.
- **Export guest list** downloads a spreadsheet with one row per invitation and a column per celebration.
- **Updates** posts a short announcement. The newest appears at the top of the site, and all of them appear under Guest information.

## Putting it online

The site is a single Node.js process with a SQLite database file, and has no other services or runtime dependencies. Any host that runs Node 22.13+ (or Docker) **with persistent storage** will do.

| Setting | Value |
|---|---|
| `NODE_ENV` | `production` |
| `ADMIN_PASSWORD` | a long password (the site refuses to start without one) |
| `SESSION_SECRET` | 64 random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PUBLIC_URL` | your address, e.g. `https://victorandadaeze.com` (used in invitation links and previews) |
| `DATA_DIR` | a folder on a **persistent disk**: this is your guest list |
| `TRUST_PROXY` | `1` when behind a proxy or platform such as Render, Railway or Fly |

**With Docker:**

```bash
docker build -t wedding .
```

```bash
docker run -d -p 3000:3000 -v wedding-data:/data --env-file .env -e NODE_ENV=production wedding
```

**On Render, Railway or Fly.io:** create a Node web service from this repository. Set the start command to `npm start` and add the settings above. Attach a persistent disk or volume and point `DATA_DIR` at it. Without a persistent disk, replies are lost on every redeploy. Serve over HTTPS; these platforms do it for you.

**Backups.** Download **Export guest list** regularly. Also copy `wedding.db` from `DATA_DIR` while the site is stopped, or use `sqlite3 wedding.db ".backup backup.db"` while it runs.

## Security and privacy

- Admin sessions are signed, expire after 12 hours, and use `HttpOnly`, `SameSite` and (over HTTPS) `Secure` cookies.
- Every admin form carries a CSRF token and an origin check.
- Login, code lookups and replies are rate-limited. Invitation codes are 8 characters from a 31-character alphabet (over 850 billion combinations) and avoid easily confused characters.
- A strict Content Security Policy is in place, and all output is escaped.
- Guests' details are visible only in the admin area. Gift details are visible only to invited guests.
- Search engines are asked not to index the site (`site.indexable: false`).

## Project layout

```
content/wedding.js    Everything guests read: edit this
photos/               Your original photos (not published)
public/               Styles, scripts, fonts and prepared images
src/app.js            Pages, RSVP and admin routes
src/views/            The page templates
src/db.js             The guest database (SQLite, built into Node)
scripts/photos.js     Prepares photos
test/                 Automated tests (npm test)
design/               The three design directions
```

Run the tests with:

```bash
npm test
```
