# Photos

Put your original photographs here: JPEG, PNG or WebP, as large as you have them. This folder is not published or committed; only the prepared copies are.

Then run:

```bash
npm run photos
```

Each photo is saved to `public/images/` at several sizes, in WebP and JPEG, with location and camera data removed. In `content/wedding.js`, refer to a photo by its file name without the extension. For example, `photos/proposal.jpg` is written as `'proposal'`.

| Where | Best shape |
|---|---|
| Opening portrait (`hero.image`) | Upright, around 4:5. It is also turned into the WhatsApp link-preview image. |
| Story chapters, `layout: 'side'` | Upright, 4:5 |
| Story chapters, `layout: 'wide'` | Landscape, 3:2 |
| Venue photos | Landscape, 3:2 |
| Gallery | Any shape; each photo keeps its own proportions |

Give every gallery photo a short `alt` description (what the photo shows), for guests using screen readers. Running the command again only processes new or changed photos. Deleting a photo from this folder removes its copies.
