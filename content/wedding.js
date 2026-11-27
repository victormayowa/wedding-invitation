/**
 * THE WEDDING OF ADAEZE & VICTOR — website content
 * ─────────────────────────────────────────────────
 * Everything guests read lives in this file. Edit the words, save, and the
 * site picks up the change on its next restart (`npm run dev` reloads by itself).
 *
 * PLACEHOLDERS
 * Anything written as tbc('…') is a detail that has not been confirmed. Guests
 * never see a placeholder: the site simply leaves it out. When you are signed in
 * at /admin you will see each one on the site marked "TBC", and /admin/content
 * lists everything still outstanding. To fill one in, replace the whole tbc(…):
 *
 *     name: tbc('Name of the church'),      becomes      name: 'Christ Church Cathedral',
 *
 * PHOTOGRAPHS
 * Put original photos in the /photos folder and run `npm run photos`. Refer to a
 * photo by its file name without the extension, e.g. 'hero' for photos/hero.jpg.
 *
 * Text is plain: no HTML. Use ’ (curly apostrophe) or ' — both are fine.
 */
import { tbc } from '../src/tbc.js';

/**
 * The colours of the day, as printed on the invitation card (sampled from it).
 * Adjust a hex value to match the fabrics exactly; the site's own palette is set
 * in public/css/site.css.
 */
const COLOURS = {
  peach: { name: 'Peach', hex: '#F3AF92' },
  wine: { name: 'Wine', hex: '#A70929' },
  green: { name: 'Green', hex: '#728047' },
};
const COLOURS_OF_THE_DAY = [COLOURS.peach, COLOURS.wine, COLOURS.green];

export default {
  /**
   * Named in this order everywhere on the site, as on the invitation card. In the guest
   * list, 'first' is the bride's side and 'second' the groom's.
   */
  couple: { first: 'Adaeze', second: 'Victor' },
  /** The wedding's code name, shown as the site's wordmark. */
  codeName: 'NEW WINE’26',

  /** The wedding day, as YYYY-MM-DD. The countdown and the site's "after the wedding" state follow it. */
  date: '2026-11-28',
  timezone: 'Africa/Lagos',
  utcOffset: '+01:00',
  place: 'Abuja, Nigeria',

  tagline: 'Two hearts. One journey. A lifetime together.',

  /** The invitation, worded as on the printed card. */
  invitation: {
    families: ['Engr. Dr. Chukwuma & Dcns. Patience Katchy', 'Mr. Omotayo & Mrs. Elizabeth Adeleye'],
    statement: 'cordially invite you to the wedding of their children',
    names: 'Adaeze Ifeoma & Victor Mayowa',
    /** The invitation card itself, shown whole beside the wording and offered as a download. */
    card: 'invitation-iv-card',
    cardAlt:
      'The NEW WINE’26 invitation card: the wedding of Adaeze Ifeoma and Victor Mayowa, Thursday 26 and Saturday 28 November 2026',
    /** Photos used when there is no card: a tall one, then a small square one. */
    images: ['pre-wedding-dsc-7005', 'pre-wedding-dsc-6935'],
  },

  hero: {
    /** Engagement or pre-wedding portrait, upright (4:5) works best. Also the WhatsApp link preview. */
    image: 'pre-wedding-dsc-6740',
    alt: 'Adaeze in a red lace dress and Victor in a white jacket, smiling',
    /** Further photos for the opening slideshow, after the main image. */
    slides: ['pre-wedding-dsc-6992', 'pre-wedding-dsc-6868'],
    credit: null, // e.g. 'Photograph by …'
  },

  rsvp: {
    /** Last day to reply, as YYYY-MM-DD. Replies close at the end of that day. None is set. */
    deadline: null,
    /**
     * Guests reply by phone or WhatsApp to these people, as printed on the card; there are
     * no invitation codes. Remove `byPhone` to use the online reply form with codes instead.
     */
    byPhone: true,
    contacts: [
      { name: 'Oluwaferanmi', phone: '0706 045 2660' },
      { name: 'Chiaza', phone: '0703 375 0663' },
    ],
    /** Pre-filled WhatsApp message. {name} becomes the contact's name. */
    whatsappMessage: 'Hello {name}, I’m replying to the invitation to the wedding of Adaeze & Victor (NEW WINE’26).',
    /** Shown on the RSVP page to guests who cannot find their code (online form only). */
    help: 'If you can’t find your invitation code, or need to change the number of seats, please get in touch with us using the contacts below.',
  },

  /**
   * The message used when sending invitations from the admin area by WhatsApp.
   * {name} becomes the guest's name, {link} their personal invitation link, {date} the date.
   */
  invitationMessage:
    'Dear {name},\n\nWith great joy, we invite you to celebrate our wedding on {date}.\n\nYour personal invitation and RSVP:\n{link}\n\nWith love,\nAdaeze & Victor',

  story: {
    intro: tbc('A sentence or two to open your story'),
    /**
     * Chapters appear in this order. A chapter stays hidden until its text is written.
     * image: a photo name. layout: 'side' (photo beside the text) or 'wide' (photo beneath, full width).
     */
    chapters: [
      {
        title: 'How we met',
        when: tbc('When: a year, a season or a date'),
        body: tbc('Where and how you first met, and what you remember of it'),
        image: tbc('Optional photo'),
        layout: 'side',
      },
      {
        title: 'Becoming friends',
        when: tbc('When'),
        body: tbc('How your friendship grew'),
        image: null,
        layout: 'side',
      },
      {
        title: 'The journey',
        when: tbc('When'),
        body: tbc('The road from friendship to love'),
        image: tbc('Optional photo'),
        layout: 'side',
      },
      {
        title: 'What marriage means to us',
        when: null,
        body: tbc('A few words on the life you are building together'),
        image: null,
        layout: 'side',
      },
    ],
  },

  /**
   * LOVE NOTES, in the couple's own words, under "Love notes" in the menu.
   * Notes appear in this order. Separate paragraphs with a blank line.
   *   from:   who wrote it
   *   kicker: the small line above the title
   *   finale: set large beneath the text
   *   image:  a photo beside the note (optional); a note without one is shown as a card
   *   word:   a word set large on the card (optional)
   */
  notes: [
    {
      from: 'Victor',
      kicker: 'The proposal',
      title: 'From Victor, on one knee',
      image: 'proposal-03',
      alt: 'Adaeze and Victor beside the neon “Will You Marry Me?” sign',
      body: `As I kneel here before you today, I find myself searching for words worthy of what you mean to me. Sometimes, I wonder how one is supposed to adequately describe a love that has become such a profound part of one’s life; how to express gratitude for a gift so beautiful that even the most eloquent words seem insufficient.

But perhaps love is not always about finding the perfect words. Perhaps it is about telling the truth of what your heart has found, and today, I want to tell you mine.

I call you EripeOluwayanmife: because you are proof to me that I am the Lord’s choicest beloved. In you, I have seen a kindness of God that words can hardly explain.

I call you Jewel: because you are precious beyond what words can capture; the most exquisite gift my heart has ever received. You are a treasure I never want to take for granted, a beauty that goes far beyond what my eyes can see.

I call you My Sunshine, because you have brought light into places of my life I didn’t even know needed illumination. You brighten my dawning, warm my heart, and make even the ordinary moments of life feel extraordinary. Since you came into my life, favour has found a free course, joy has found a home, and love has become something I get to experience in its most beautiful form.

And today, kneeling before you, I want to make you a promise. I promise to love you as Christ loved the Church: sacrificially, intentionally, tenderly and faithfully.

I promise to stand with you through the seasons, to hold your hand through the storms, to celebrate your victories, to cherish your dreams, and to keep choosing you, even on the days when choosing love demands everything of me.

I want to build with you, grow with you, pray with you, laugh with you, and grow old with you. I want to be the man whose love gives you peace, whose arms feel like home, and whose commitment never leaves you wondering if you are cherished.

Ololufe mi. Ayanfemi. EripeOluwayanmife.

With this ring, I am not just asking you to be my wife; I am inviting you into a forever that I intend to honour, nurture and protect with all that God has placed within me.`,
      finale: 'Will you marry me?',
    },
    {
      from: 'Adaeze',
      kicker: 'A fun fact, from Adaeze',
      title: 'The reason behind why “Achalugo” is on my fan',
      word: 'Achalugo',
      body: `Fun fact: My baby started calling me “Achalugo”.. long before y’all started using the name😌..

I still remember the day he discovered the name Achalugo, he was so excited to call me the name😂😂😂

In summary, na me get the name Achalugo, y’all are just copying from my baby😂😂😂😂😂😂`,
    },
  ],

  /**
   * THE CELEBRATION
   * status:  'draft' (hidden from guests) or 'confirmed' (shown).
   * access:  'open'       — for every invited guest,
   *          'invitation' — shown to all, marked "By invitation", only selected guests can RSVP,
   *          'private'    — only shown to guests whose invitation includes it.
   * date: YYYY-MM-DD. start / end: 24-hour time, e.g. '10:00'.
   */
  events: [
    {
      id: 'traditional',
      name: 'Traditional wedding',
      status: 'confirmed',
      access: 'open',
      date: '2026-11-26',
      start: '14:00',
      end: null,
      venue: {
        name: 'The bride’s residence',
        address: null,
        mapQuery: null,
        mapUrl: null,
        landmarks: null,
        parking: null,
        transport: null,
        image: null,
      },
      dressCode: { title: null, description: null, colours: COLOURS_OF_THE_DAY },
      notes: null,
    },
    {
      id: 'church',
      name: 'White wedding',
      status: 'confirmed',
      access: 'open',
      date: '2026-11-28',
      start: '11:00',
      /** Shown after the start time. */
      timeNote: 'prompt',
      end: null,
      venue: {
        name: 'Living Faith Church, Jahi',
        address: 'Off Katampe Expressway, Jahi, Abuja',
        /** What the embedded map shows (Google plus code and name). */
        mapQuery: '4C4X+P25 Living Faith Church, Jahi, Abuja',
        /** Where "Open in Google Maps" leads. */
        mapUrl: 'https://maps.app.goo.gl/R5dxjq2atjnpQqps9',
        landmarks: null,
        parking: null,
        transport: null,
        image: null,
      },
      dressCode: { title: null, description: null, colours: COLOURS_OF_THE_DAY },
      notes: null,
    },
    {
      id: 'reception',
      name: 'Reception',
      status: 'confirmed',
      access: 'open',
      date: '2026-11-28',
      start: '14:00',
      end: null,
      venue: {
        name: 'Admiralty Event Centre',
        address: 'Command Guest House, off Murtala Mohammed Way, Asokoro, Abuja',
        mapQuery: '3GM9+943 Admiralty Events Centre, Asokoro, Abuja',
        mapUrl: 'https://maps.app.goo.gl/jghnDnHpbBmUw5Kc8',
        landmarks: null,
        parking: null,
        transport: null,
        image: null,
      },
      dressCode: { title: null, description: null, colours: COLOURS_OF_THE_DAY },
      notes: null,
    },
    {
      id: 'thanksgiving',
      name: 'Thanksgiving service',
      status: 'draft',
      access: 'open',
      date: tbc('Date, as YYYY-MM-DD'),
      start: tbc('Start time'),
      end: null,
      venue: {
        name: tbc('Venue'),
        address: tbc('Full address'),
        mapQuery: tbc('What to search on Google Maps'),
        landmarks: null,
        parking: null,
        transport: null,
        image: null,
      },
      dressCode: { title: null, description: null, colours: [] },
      notes: null,
    },
  ],

  dressCode: {
    intro: 'Please join us in the colours of the day.',
    /** Colour themes, shown as swatches. A theme without a title shows only its colours. */
    themes: [{ title: 'Colours of the day', colours: COLOURS_OF_THE_DAY }],
    /** Any further notes: aso-ebi, what to avoid, guidance for the bridal party… */
    notes: [],
  },

  gallery: {
    /**
     * Each image: { src: 'photo-name', alt: 'What the photo shows', caption: 'optional' }
     * A film can also set poster: seconds, the moment shown as its cover (otherwise 40% of the way in).
     * Photo names come from the folder and file name: `npm run photos -- --list` prints them all.
     * Add a 'Wedding day' album after the celebration.
     */
    albums: [
      {
        id: 'pre-wedding',
        title: 'Pre-wedding',
        images: [
          { src: 'pre-wedding-dsc-6740', alt: 'Adaeze in a red lace dress and Victor in a white jacket, smiling' },
          { src: 'pre-wedding-dsc-6992', alt: 'Adaeze and Victor embracing in traditional attire' },
          { src: 'pre-wedding-dsc-6935', alt: 'Their hands together, showing the engagement ring' },
          { src: 'pre-wedding-dsc-7005', alt: 'Adaeze and Victor forehead to forehead in traditional attire' },
          { src: 'pre-wedding-dsc-6742', alt: 'Adaeze and Victor arm in arm, smiling at each other' },
          { src: 'pre-wedding-dsc-6851', alt: 'Adaeze and Victor making a heart with their hands' },
          { src: 'pre-wedding-dsc-7070', alt: 'Adaeze in a pink gele and green lace' },
          { src: 'pre-wedding-dsc-7101', alt: 'Victor in white traditional attire and a blue cap' },
          { src: 'pre-wedding-dsc-6981', alt: 'Adaeze and Victor seated in traditional attire' },
          { src: 'pre-wedding-dsc-6800', alt: 'Adaeze leaning over Victor, both in sunglasses, laughing' },
          { src: 'pre-wedding-dsc-6868', alt: 'Adaeze and Victor in white shirts, smiling' },
          { src: 'pre-wedding-dsc-7029', alt: 'Adaeze smiling in a pink gele, Victor in the foreground' },
          { src: 'pre-wedding-dsc-6795', alt: 'Adaeze in sunglasses resting her arms on Victor’s shoulders' },
          { src: 'pre-wedding-dsc-7025', alt: 'Adaeze and Victor celebrating in traditional attire' },
          { src: 'pre-wedding-dsc-7038', alt: 'Adaeze in a pink gele, framed by Victor’s arm' },
          { src: 'pre-wedding-dsc-7092', alt: 'Adaeze in a pink gele, seen past Victor’s shoulder' },
        ],
      },
      {
        id: 'first-date',
        title: 'First date',
        images: [
          { src: 'nnn-firstdate-1795807335082', alt: 'Adaeze and Victor side by side outside a building, he in a purple cap' },
          { src: 'nnn-firstdate-1795807335106', alt: 'Adaeze and Victor smiling together, he in a purple cap' },
          { src: 'nnn-firstdate-1795807332254', alt: 'Victor in a purple cap, seated for a studio portrait' },
          { src: 'nnn-firstdate-1795807334987', alt: 'Victor’s selfie with Adaeze at a restaurant table' },
          { src: 'nnn-firstdate-1795807335032', alt: 'Adaeze smiling over her meal, Victor in the foreground' },
        ],
      },
      {
        id: 'proposal',
        title: 'The proposal',
        images: [
          { src: 'nnn-proposal-2026-11-27-19-38-57-1', alt: 'Victor on one knee, holding Adaeze’s hands' },
          { src: 'nnn-proposal-2026-11-27-19-38-57-3', alt: 'Victor kneeling before Adaeze beneath the floral arch' },
          { src: 'nnn-proposal-2026-11-27-19-38-58', alt: 'Adaeze smiling down at Victor as he kneels' },
          { src: 'nnn-proposal-2026-11-27-19-38-59', alt: 'Adaeze with her hands clasped as Victor kneels' },
          { src: 'nnn-proposal-2026-11-27-19-39-00-1', alt: 'Adaeze laughing in her red lace dress' },
          { src: 'nnn-proposal-2026-11-27-19-39-00-2', alt: 'Adaeze’s hand wearing the engagement ring' },
          { src: 'nnn-proposal-2026-11-27-19-39-01-5', alt: 'The engagement ring, held among pink blossoms' },
          { src: 'nnn-proposal-2026-11-27-19-39-02', alt: 'Adaeze’s hand with the ring and her watch' },
          { src: 'nnn-proposal-2026-11-27-19-39-01-2', alt: 'Adaeze showing her ring, Victor beside her' },
          { src: 'nnn-proposal-2026-11-27-19-39-03', alt: 'Adaeze and Victor showing the ring together' },
          { src: 'proposal-film-2', alt: 'The neon “Will You Marry Me?” sign, lit for the moment' },
          { src: 'proposal-03', alt: 'Adaeze and Victor beside the neon “Will You Marry Me?” sign' },
          { src: 'proposal-05', alt: 'The engagement ring, held out towards the camera' },
          { src: 'proposal-01', alt: 'Adaeze and Victor laughing with a little one in their arms' },
          { src: 'proposal-film-1', alt: 'Adaeze and Victor embracing as guests look on' },
          { src: 'proposal-02', alt: 'Adaeze and Victor with a little one in their arms' },
          { src: 'proposal-04', alt: 'Adaeze and Victor smiling beneath the neon sign' },
          { src: 'nnn-proposal-2026-11-27-19-39-01-1', alt: 'Adaeze and Victor embracing beside the neon sign' },
          { src: 'nnn-proposal-2026-11-27-19-39-01-4', alt: 'Adaeze beside the neon “Will You Marry Me?” sign' },
          { src: 'nnn-proposal-2026-11-27-19-39-03-3', alt: 'Adaeze in red lace beneath the neon sign' },
          { src: 'nnn-proposal-2026-11-27-19-38-59-4', alt: 'Adaeze and Victor with two friends' },
          { src: 'nnn-proposal-2026-11-27-19-39-00-4', alt: 'Adaeze and Victor with friends in front of the arch' },
          { src: 'nnn-proposal-2026-11-27-19-39-00', alt: 'Adaeze with Victor and a friend in a striped shirt' },
          { src: 'nnn-proposal-2026-11-27-19-39-01', alt: 'Adaeze with a friend in a striped shirt' },
          { src: 'nnn-proposal-2026-11-27-19-39-02-1', alt: 'Adaeze and a friend in a striped shirt, smiling' },
          { src: 'nnn-proposal-2026-11-27-19-39-03-2', alt: 'Adaeze between Victor and a friend holding a little one' },
          { src: 'nnn-proposal-2026-11-27-19-38-50', alt: 'Adaeze and Victor making a heart with their hands, her ring in view' },
        ],
      },
      {
        id: 'iku-aka',
        title: 'Iku Aka (door knocking)',
        images: [
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330536', alt: 'Adaeze in green and gold, standing in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330815', alt: 'Adaeze and Victor side by side in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330874', alt: 'Adaeze and Victor in front of the gate' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331037', alt: 'Adaeze and Victor together beneath the trees' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331693', alt: 'Victor standing behind Adaeze in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331752', alt: 'Adaeze smiling, Victor behind her' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334482', alt: 'Adaeze and Victor arm in arm' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334421', alt: 'Adaeze laughing beside Victor' },
          { src: 'nnn-iku-aka-door-knocking-introduction-2026-11-27-19-39-27', alt: 'Adaeze and Victor standing together outside the house' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330587', alt: 'Both families gathered in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330699', alt: 'The families and guests lined up for a photo' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331083', alt: 'Adaeze and Victor with family elders' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331137', alt: 'Adaeze and Victor with elders in traditional dress' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330671', alt: 'Adaeze with three women in traditional dress' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330468', alt: 'Adaeze and Victor with family and little ones outside the house' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807331108', alt: 'Adaeze and Victor with family and two little ones' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807330718', alt: 'Guests arriving in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332040', alt: 'Women of the family seated in the living room' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332067', alt: 'Women of the family seated together, smiling' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332094', alt: 'Two elders in red caps seated before a tray of fruit' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332169', alt: 'The men of the family seated in the living room' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332284', alt: 'A guest bending to greet the men in the living room' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332512', alt: 'Adaeze standing among the elders in the living room' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807332219', alt: 'A guest smiling in the living room' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333404', alt: 'Adaeze with two women and a man in a beige shirt' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333530', alt: 'Adaeze sharing a laugh with a woman in a peplum dress' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333933', alt: 'Adaeze and a woman in a peplum dress, arm in arm' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333796', alt: 'A guest in a peplum dress in the courtyard' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333572', alt: 'Adaeze holding a baby in a knitted hat' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334095', alt: 'Adaeze with three women' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333758', alt: 'Adaeze with three friends in print dresses' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333876', alt: 'Adaeze and a friend in red, posing playfully' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807333973', alt: 'Adaeze and a friend in a red print' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334040', alt: 'Adaeze and Victor with three women' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334058', alt: 'Adaeze between a man in navy and a woman in blue' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334076', alt: 'Adaeze and Victor with three guests' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334217', alt: 'Adaeze and Victor with two guests in navy and blue' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334691', alt: 'Adaeze and Victor with a woman in a floral blouse' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334679', alt: 'Adaeze laughing with a woman in a floral blouse' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334465', alt: 'Adaeze and Victor with a friend in a blue shirt' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334282', alt: 'Adaeze and Victor with a friend in a red print' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334571', alt: 'Adaeze and Victor with a friend in a patterned dress' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334642', alt: 'Adaeze and Victor with friends and a little one' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334653', alt: 'Adaeze and Victor with two friends and a little one' },
          { src: 'nnn-iku-aka-door-knocking-introduction-1795807334616', alt: 'Victor beside a friend holding a baby' },
        ],
      },
      {
        id: 'parental-consent',
        title: 'Parental consent',
        images: [
          { src: 'nnn-parental-consent-1795807331779', alt: 'Adaeze and Victor in matching red and mustard outfits' },
          { src: 'nnn-parental-consent-1795807331899', alt: 'Adaeze and Victor beneath the palm trees' },
          { src: 'nnn-parental-consent-1795807331862', alt: 'Adaeze and Victor with family and friends' },
        ],
      },
      {
        id: 'church-introduction',
        title: 'Church introduction',
        images: [
          { src: 'church-introduction-2026-11-22-15-42-35', alt: 'Adaeze and Victor outside the church' },
          { src: 'church-introduction-2026-11-22-15-42-33', alt: 'Adaeze and Victor with family outside the church' },
          { src: 'church-introduction-2026-11-22-15-42-35-3', alt: 'Adaeze and Victor with family' },
          { src: 'church-introduction-2026-11-22-15-42-38-1', alt: 'Adaeze and Victor with family and church members' },
          { src: 'church-introduction-2026-11-22-15-42-42', alt: 'Adaeze with a family member in a gold gele' },
          { src: 'church-introduction-2026-11-22-15-42-35-1', alt: 'Adaeze and Victor with a guest in blue' },
          { src: 'church-introduction-2026-11-22-15-42-36-1', alt: 'Adaeze and Victor with family, including a little one in yellow' },
          { src: 'church-introduction-2026-11-22-15-42-34-1', alt: 'Adaeze with a family member in light blue' },
          { src: 'church-introduction-2026-11-22-15-42-39-1', alt: 'Family at the church introduction' },
          { src: 'church-introduction-2026-11-22-15-42-40-1', alt: 'A family member in a gold gele' },
        ],
      },
      {
        id: 'registry',
        title: 'Registry',
        images: [
          // The photographer's set first, then the phone photos and films from the same day.
          { src: 'new-registry-dsc-5041', alt: 'Adaeze and Victor exchanging rings' },
          { src: 'new-registry-dsc-5046', alt: 'Adaeze and Victor smiling at each other during the ring exchange' },
          { src: 'new-registry-dsc-5049', alt: 'Adaeze and Victor signing the marriage register' },
          { src: 'new-registry-dsc-5051', alt: 'Signing the marriage register together' },
          { src: 'new-registry-dsc-5055', alt: 'Adaeze and Victor at the registry table' },
          { src: 'new-registry-dsc-5057', alt: 'Signing the register with witnesses' },
          { src: 'new-registry-dsc-5058', alt: 'Adaeze and Victor seated at the registry, smiling' },
          { src: 'new-registry-dsc-5060', alt: 'Adaeze and Victor sharing a smile at the registry table' },
          { src: 'new-registry-dsc-5061', alt: 'Adaeze and Victor embracing after the vows' },
          { src: 'new-registry-dsc-5062', alt: 'Adaeze and Victor sharing a kiss' },
          { src: 'new-registry-dsc-5066', alt: 'Receiving the marriage certificate' },
          { src: 'new-registry-dsc-5069', alt: 'The certificate presentation with family' },
          { src: 'new-registry-dsc-5072', alt: 'Adaeze and Victor at the Federal Marriage Registry sign' },
          { src: 'new-registry-dsc-5077', alt: 'Adaeze and Victor laughing together at the registry' },
          { src: 'new-registry-dsc-5078', alt: 'Adaeze and Victor with family at the registry' },
          { src: 'new-registry-dsc-5083', alt: 'Adaeze and Victor with family and friends outside the registry' },
          { src: 'new-registry-dsc-5086', alt: 'Adaeze holding the marriage certificate' },
          { src: 'new-registry-dsc-5092', alt: 'Adaeze waving, bouquet in hand' },
          { src: 'new-registry-dsc-5098', alt: 'Adaeze and Victor with friends at the registry' },
          { src: 'new-registry-dsc-5099', alt: 'Victor with the marriage certificate' },
          { src: 'nnn-more-registry-2026-11-27-19-38-59-2', alt: 'Adaeze and Victor at the registry sign, gazing at each other' },
          { src: 'registry-2026-11-24-17-01-18-1', alt: 'Adaeze and Victor outside, she holding her bouquet' },
          { src: 'registry-2026-11-25-02-49-55-1', alt: 'Adaeze and Victor at the Federal Marriage Registry' },
          { src: 'registry-2026-11-25-02-49-55', alt: 'Victor signing the marriage register' },
          { src: 'registry-2026-11-25-02-49-57-4', alt: 'Adaeze signing the marriage register' },
          { src: 'registry-2026-11-25-02-49-56-3', alt: 'Adaeze and Victor smiling with their marriage certificate' },
          { src: 'registry-2026-11-24-17-37-54', alt: 'Adaeze and Victor arriving at the registry with family' },
          { src: 'registry-2026-11-25-02-49-58-2', alt: 'Adaeze and Victor at the registry sign' },
          { src: 'registry-2026-11-25-02-49-57-2', alt: 'Adaeze and Victor with family at the registry' },
          { src: 'registry-2026-11-25-02-49-57-3', alt: 'Adaeze and Victor with family and friends' },
          { src: 'registry-2026-11-25-02-49-53', alt: 'Adaeze and Victor seated at the registry table' },
          { src: 'registry-2026-11-25-02-49-59', alt: 'Adaeze and Victor with friends at the registry' },
          { src: 'registry-2026-11-24-17-01-19-1', alt: 'Adaeze and Victor walking together' },
          { src: 'registry-2026-11-25-02-49-58-3', alt: 'Victor at the Federal Marriage Registry' },
          { src: 'nnn-more-registry-2026-11-27-19-24-39', alt: 'Adaeze and Victor at the registry sign, a short film' },
        ],
      },
      {
        id: 'traditional-taste',
        title: 'Traditional taste',
        images: [
          { src: 'nnn-traditional-taste-2026-11-27-19-20-02', alt: 'Adaeze in wine lace and coral beads, dancing' },
          { src: 'nnn-traditional-taste-2026-11-27-19-20-22', alt: 'Adaeze in traditional attire beside an elder in a red cap' },
          { src: 'nnn-traditional-taste-2026-11-27-19-24-20', alt: 'Adaeze in a green gele, smiling with her fan', poster: 6 },
          { src: 'nnn-traditional-taste-traditional-pretaste', alt: 'Behind the scenes: Adaeze filmed in wine lace and coral beads', poster: 50 },
          { src: 'nnn-traditional-taste-2026-11-27-19-19-44', alt: 'Guests dancing under the canopy', poster: 40 },
        ],
      },
      {
        id: 'jnc',
        title: 'JnC',
        images: [
          { src: 'nnn-jnc-1795807331261', alt: 'Adaeze and Victor wearing conference lanyards by a tall window' },
          { src: 'nnn-jnc-1795807330416', alt: 'Adaeze smiling at a table, a lanyard round her neck' },
          { src: 'nnn-jnc-1795807330445', alt: 'Adaeze in pink scrubs, seated outdoors' },
          { src: 'nnn-jnc-1795807331185', alt: 'Adaeze speaking at a lectern' },
          { src: 'nnn-jnc-1795807331210', alt: 'Adaeze listening in the conference hall' },
          { src: 'nnn-jnc-1795807331236', alt: 'Adaeze and Victor seated in the audience' },
          { src: 'nnn-jnc-1795807331286', alt: 'Adaeze holding a copy of “Checklist”, Victor leaning in' },
          { src: 'nnn-jnc-1795807331424', alt: 'Adaeze and Victor before green and yellow balloons' },
          { src: 'nnn-jnc-1795807331563', alt: 'Adaeze and Victor on the red carpet' },
          { src: 'nnn-jnc-1795807331399', alt: 'Victor with two women at the Excellence & Impact backdrop' },
          { src: 'nnn-jnc-1795807331933', alt: 'Adaeze and Victor admiring a cap at the backdrop' },
          { src: 'nnn-jnc-1795807331968', alt: 'Adaeze and Victor smiling at the DNC ’26 backdrop' },
        ],
      },
      {
        id: 'moments',
        title: 'Lovely moments',
        images: [
          { src: 'nnn-otherlovelypictures-1795807332404', alt: 'Adaeze in a varsity jacket, seated on a sofa' },
          { src: 'nnn-otherlovelypictures-1795807332456', alt: 'Adaeze’s selfie, Victor behind her in a cap' },
          { src: 'nnn-otherlovelypictures-1795807333221', alt: 'Adaeze and Victor in jackets, leaning against a green backdrop' },
          { src: 'nnn-otherlovelypictures-1795807332657', alt: 'Adaeze laughing in a pink T-shirt and cap' },
          { src: 'nnn-otherlovelypictures-1795807332735', alt: 'Adaeze in her varsity jacket, smiling' },
          { src: 'nnn-otherlovelypictures-1795807332818', alt: 'Adaeze seated on a sofa against a yellow wall' },
          { src: 'nnn-otherlovelypictures-1795807332870', alt: 'Adaeze and Victor leaning against the Palms Mall, Ilorin backdrop' },
          { src: 'nnn-otherlovelypictures-1795807332919', alt: 'Adaeze and Victor in pink and red T-shirts' },
          { src: 'nnn-otherlovelypictures-1795807332967', alt: 'Adaeze laughing, her arm round Victor' },
          { src: 'nnn-otherlovelypictures-1795807333291', alt: 'Adaeze and Victor in jackets against a yellow wall' },
          { src: 'nnn-otherlovelypictures-1795807333020', alt: 'Adaeze and Victor embracing on a lawn' },
          { src: 'nnn-otherlovelypictures-1795807333430', alt: 'Adaeze and Victor on a hotel lawn' },
          { src: 'nnn-otherlovelypictures-1795807333741', alt: 'Adaeze and Victor arm in arm on the lawn' },
          { src: 'nnn-otherlovelypictures-1795807334198', alt: 'A selfie of Adaeze and Victor on the lawn' },
          { src: 'nnn-otherlovelypictures-1795807334263', alt: 'Adaeze and Victor cheek to cheek' },
          { src: 'nnn-otherlovelypictures-1795807333145', alt: 'Adaeze in striped trousers in a hallway' },
          { src: 'nnn-otherlovelypictures-1795807333195', alt: 'Adaeze in a close selfie' },
          { src: 'nnn-otherlovelypictures-1795807333512', alt: 'A portrait of Adaeze' },
          { src: 'nnn-otherlovelypictures-1795807333954', alt: 'Victor standing on the hotel lawn' },
          { src: 'nnn-otherlovelypictures-1795807334505', alt: 'Adaeze in the hotel courtyard' },
          { src: 'nnn-otherlovelypictures-1795807334730', alt: 'A mirror selfie of Adaeze and Victor in a corridor' },
          { src: 'nnn-otherlovelypictures-1795807334775', alt: 'A mirror selfie, Victor in white and Adaeze in print' },
          { src: 'nnn-otherlovelypictures-1795807334752', alt: 'Victor in a yellow kaftan' },
          { src: 'nnn-otherlovelypictures-1795807334935', alt: 'Adaeze and Victor posing playfully' },
          { src: 'nnn-otherlovelypictures-1795807334883', alt: 'Adaeze and Victor arm in arm, he in yellow' },
          { src: 'nnn-otherlovelypictures-1795807334960', alt: 'Adaeze and Victor in a close selfie' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-41', alt: 'Adaeze and Victor, heads together in a selfie' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-42', alt: 'Adaeze and Victor smiling for the camera' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-43-1', alt: 'Adaeze and Victor, she in a black headband' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-43', alt: 'Adaeze and Victor outdoors, she in a floral top' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-44', alt: 'Adaeze and Victor in an outdoor selfie' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-45-1', alt: 'Adaeze and Victor on a red carpet, she in green and gold' },
          { src: 'nnn-otherlovelypictures-2026-11-27-19-32-45', alt: 'Adaeze and Victor making peace signs' },
          { src: 'nnn-otherlovelypictures-vid-20260403-wa0225', alt: 'Adaeze and Victor chatting and laughing' },
        ],
      },
    ],
    /**
     * A last tab gathering every film from the albums above, after any listed here.
     * Remove it to keep films only in their own albums.
     */
    films: {
      title: 'Films',
      images: [
          { src: 'nnn-2026-11-27-19-38-56', alt: 'Adaeze and Victor in lilac and pink aso-oke' },
      ],
    },
  },

  travel: {
    intro: tbc('A line for guests travelling to Abuja'),
    hotels: [
      {
        name: tbc('Hotel name'),
        address: tbc('Address'),
        phone: tbc('Phone, e.g. +234 …'),
        price: tbc('Approximate price per night'),
        url: tbc('Booking link (optional)'),
        note: tbc('e.g. 10 minutes from the venue'),
      },
      {
        name: tbc('Hotel name'),
        address: tbc('Address'),
        phone: tbc('Phone'),
        price: tbc('Approximate price per night'),
        url: tbc('Booking link (optional)'),
        note: null,
      },
    ],
    /** Short notes on getting here. */
    routes: [
      { title: 'By air', body: tbc('Nearest airports and onward travel') },
      { title: 'By road', body: tbc('Routes and travel times from major cities') },
    ],
    help: tbc('Who guests can contact for help with accommodation'),
  },

  /** Questions appear only once they have an answer. */
  faqs: [
    { q: 'What time should I arrive?', a: tbc('Answer') },
    { q: 'Can I bring an additional guest?', a: tbc('e.g. Our celebration is by invitation, so we can only accommodate the guests named on your invitation.') },
    { q: 'Are children invited?', a: tbc('Answer') },
    { q: 'What should I wear?', a: tbc('Answer, or point to the dress code above') },
    { q: 'Is parking available?', a: tbc('Answer') },
    { q: 'Can I attend only one of the events?', a: tbc('Answer') },
    { q: 'Where can I find accommodation?', a: tbc('Answer') },
    { q: 'When is the RSVP deadline?', a: tbc('Answer') },
    { q: 'Who should I contact if I need help?', a: tbc('Answer') },
  ],

  /**
   * Contacts for guests. phone in international format, e.g. '+234 803 000 0000'.
   * whatsapp: true adds a WhatsApp link for the same number.
   */
  contacts: [
    { name: 'Oluwaferanmi', role: 'RSVP', phone: '0706 045 2660', whatsapp: true },
    { name: 'Chiaza', role: 'RSVP', phone: '0703 375 0663', whatsapp: true },
  ],
  email: null,

  gifts: {
    enabled: true,
    message: 'Your presence on our day is the greatest gift of all.',
    /**
     * public: true shows the gift details to everyone, as the printed card does.
     * Without it they appear only to guests who opened a personal invitation link.
     */
    public: true,
    detailsIntro: 'For those who wish to bless us, we prefer gifts in monetary value.',
    details: [
      {
        label: 'Bank transfer',
        lines: ['Adaeze Katchy', 'Ecobank', '4102011901'],
      },
    ],
    registry: { label: 'Gift registry', url: null },
  },

  closing: {
    message:
      'We are grateful for the people, moments and blessings that have brought us to this day. Thank you for being part of our story. We cannot wait to celebrate this new chapter with you.',
    signoff: 'With love,',
    /** Background photo for the closing band, under a deep wine overlay. */
    image: 'pre-wedding-dsc-6851',
    /** Shown after the wedding day. */
    after: 'Thank you for celebrating with us. Your love, prayers and presence meant more to us than words can say.',
  },

  site: {
    /** Keep false to ask search engines not to list the site. */
    indexable: false,
  },
};
