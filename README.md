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

Deployment runs from GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. **Every push:** the tests run twice, once on SQLite and once on Postgres.
2. **A push to the default branch, or "Run workflow" on the Actions tab:**
   1. The workflow builds the Docker image and publishes it to GitHub Packages.
   2. It connects to your server over SSH, installing Docker there on the first run.
   3. It starts the site behind Caddy, which gets the HTTPS certificate automatically.
   4. It checks that the site answers, then writes the live link in the run summary.

The guest list lives in **Postgres**. Either give the workflow your own database (`DATABASE_URL`), or leave it out and a Postgres container runs on the server, with its data kept in a Docker volume.

### One-time setup

**1. The server.** Ports 80 and 443 must be open in its firewall or cloud security group, and nothing else may be using them.

**2. A deploy key.** On your own computer, create a key that only GitHub uses:

```bash
ssh-keygen -t ed25519 -f wedding-deploy -N ""
```

Then allow it on the server:

```bash
ssh-copy-id -i wedding-deploy.pub root@169.58.141.167
```

**3. Repository secrets.** In GitHub, open the repository, then **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Value |
|---|---|
| `SSH_HOST` | `169.58.141.167` |
| `SSH_PRIVATE_KEY` | the whole contents of the `wedding-deploy` file (the private key) |
| `ADMIN_PASSWORD` | the password for `/admin`, at least 10 characters |
| `SESSION_SECRET` | 64 random characters: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `SSH_KNOWN_HOSTS` | *recommended:* the output of `ssh-keyscan 169.58.141.167` |
| `DATABASE_URL` | *optional:* your Postgres, e.g. `postgres://user:password@host:5432/wedding` |
| `DATABASE_SSL` | *optional:* `require`, or `no-verify` if your Postgres uses a self-signed certificate |
| `DOMAIN` | *optional:* your own domain once its DNS points at the server; otherwise the site is at `https://169-58-141-167.sslip.io` |
| `SSH_USER`, `SSH_PORT` | *optional:* default to `root` and `22` |

Secrets must not contain single quotes. Until the four required ones exist, the deploy step is skipped with a warning, and the tests still run.

**4. Deploy.** Push to the default branch, or open **Actions → Test and deploy → Run workflow**. The run summary shows the live link.

Every later push redeploys in about a minute. Replies are never lost: they live in Postgres, not in the container.

### Backups

On the server, if you are using the bundled Postgres:

```bash
cd /opt/wedding && docker compose exec -T db pg_dump -U wedding wedding > wedding-backup.sql
```

**Export guest list** in the admin area is also a good habit before and after the day.

### Running locally or elsewhere

Without `DATABASE_URL` the site uses a SQLite file in `DATA_DIR`, which is handy on your own computer. Any other host that runs the Docker image works too; set the same values as environment variables.

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
src/db.js             The guest database (Postgres, or SQLite locally)
scripts/photos.js     Prepares photos
test/                 Automated tests (npm test)
design/               The three design directions
deploy/               Production stack used by the GitHub workflow
```

Run the tests with:

```bash
npm test
```

To run them against Postgres as well, point `TEST_DATABASE_URL` at an empty database:

```bash
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/wedding_test npm test
```
