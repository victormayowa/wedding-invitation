/**
 * THE WEDDING OF VICTOR & ADAEZE — website content
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
 * The NEW WINE'26 colours. Wine, burgundy and green for the traditional engagement;
 * white and grey for the white wedding; pink and purple. Adjust a hex value to
 * match your fabrics exactly; the site's own palette is set in public/css/site.css.
 */
const COLOURS = {
  wine: { name: 'Wine', hex: '#722F37' },
  burgundy: { name: 'Burgundy', hex: '#800020' },
  green: { name: 'Green', hex: '#1F5A3D' },
  white: { name: 'White', hex: '#FFFFFF' },
  grey: { name: 'Grey', hex: '#A7A6AB' },
  pink: { name: 'Pink', hex: '#E8A0B4' },
  purple: { name: 'Purple', hex: '#6B3E8E' },
};

export default {
  couple: { first: 'Victor', second: 'Adaeze' },
  /** The wedding's code name, shown as the site's wordmark. */
  codeName: 'NEW WINE’26',

  /** The wedding day, as YYYY-MM-DD. The countdown and the site's "after the wedding" state follow it. */
  date: '2026-11-28',
  timezone: 'Africa/Lagos',
  utcOffset: '+01:00',
  place: 'Ekiti State, Nigeria',

  tagline: 'Two hearts. One journey. A lifetime together.',

  invitation: {
    statement:
      'Together with our families, we joyfully invite you to celebrate the beginning of our forever.',
    /** Shown beneath the invitation, e.g. 'The family of Chief & Mrs …'. Remove a line you don't need. */
    families: [tbc('Adaeze’s family, e.g. “The family of Mr & Mrs …”'), tbc('Victor’s family')],
    /** Photos beside the invitation: a tall one, then a small square one. */
    images: ['pre-wedding-dsc-7005', 'pre-wedding-dsc-6935'],
  },

  hero: {
    /** Engagement or pre-wedding portrait, upright (4:5) works best. Also the WhatsApp link preview. */
    image: 'pre-wedding-dsc-6740',
    alt: 'Victor in a white jacket and Adaeze in a red lace dress, smiling',
    /** Further photos for the opening slideshow, after the main image. */
    slides: ['pre-wedding-dsc-6992', 'pre-wedding-dsc-6868'],
    credit: null, // e.g. 'Photograph by …'
  },

  rsvp: {
    /** Last day to reply, as YYYY-MM-DD. Replies close at the end of that day. */
    deadline: tbc('Last day to reply, as YYYY-MM-DD'),
    /** Shown on the RSVP page to guests who cannot find their code. */
    help: 'If you can’t find your invitation code, or need to change the number of seats, please get in touch with us using the contacts below.',
  },

  /**
   * The message used when sending invitations from the admin area by WhatsApp.
   * {name} becomes the guest's name, {link} their personal invitation link, {date} the date.
   */
  invitationMessage:
    'Dear {name},\n\nWith great joy, we invite you to celebrate our wedding on {date}.\n\nYour personal invitation and RSVP:\n{link}\n\nWith love,\nVictor & Adaeze',

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
        title: 'The proposal',
        when: tbc('When and where'),
        body: tbc('The proposal, in your own words'),
        image: 'proposal-05',
        alt: 'The engagement ring, held out towards the camera',
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
      name: 'Traditional engagement',
      status: 'draft',
      access: 'open',
      date: tbc('Date, as YYYY-MM-DD'),
      start: tbc('Start time, e.g. 10:00'),
      end: tbc('Finish time (optional)'),
      venue: {
        name: tbc('Venue name'),
        address: tbc('Full address'),
        mapQuery: tbc('What to search on Google Maps: usually venue name and town'),
        landmarks: tbc('Directions from a landmark guests will know'),
        parking: tbc('Parking'),
        transport: tbc('Transport arrangements, if any'),
        image: tbc('Venue photo (optional)'),
      },
      dressCode: {
        title: tbc('Dress code, e.g. “Traditional attire”'),
        description: tbc('A line of guidance on what to wear'),
        colours: [COLOURS.wine, COLOURS.burgundy, COLOURS.green],
      },
      notes: tbc('Anything else guests should know (optional)'),
    },
    {
      id: 'church',
      name: 'White wedding',
      status: 'draft',
      access: 'open',
      date: '2026-11-28',
      start: tbc('Start time, e.g. 10:00'),
      end: tbc('Finish time (optional)'),
      venue: {
        name: tbc('Name of the church'),
        address: tbc('Full address'),
        mapQuery: tbc('What to search on Google Maps'),
        landmarks: tbc('Directions from a landmark'),
        parking: tbc('Parking'),
        transport: tbc('Transport arrangements, if any'),
        image: tbc('Church photo (optional)'),
      },
      dressCode: {
        title: tbc('Dress code'),
        description: tbc('What to wear'),
        colours: [COLOURS.white, COLOURS.grey],
      },
      notes: tbc('e.g. Please arrive 30 minutes early'),
    },
    {
      id: 'reception',
      name: 'Wedding reception',
      status: 'draft',
      access: 'open',
      date: '2026-11-28',
      start: tbc('Start time'),
      end: tbc('Finish time (optional)'),
      venue: {
        name: tbc('Reception hall'),
        address: tbc('Full address'),
        mapQuery: tbc('What to search on Google Maps'),
        landmarks: tbc('Directions from a landmark'),
        parking: tbc('Parking'),
        transport: tbc('Transport between church and reception, if any'),
        image: tbc('Venue photo (optional)'),
      },
      dressCode: {
        title: tbc('Dress code'),
        description: tbc('What to wear'),
        colours: [],
      },
      notes: tbc('Anything else guests should know (optional)'),
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
    intro: tbc('A sentence on the spirit of what to wear'),
    /** Colour themes, shown as swatches. A theme without a title shows only its colours. */
    themes: [
      { title: 'Traditional engagement', colours: [COLOURS.wine, COLOURS.burgundy, COLOURS.green] },
      { title: 'White wedding', colours: [COLOURS.white, COLOURS.grey] },
      { title: tbc('Which celebration pink and purple are for'), colours: [COLOURS.pink, COLOURS.purple] },
    ],
    /** Any further notes: aso-ebi, what to avoid, guidance for the bridal party… */
    notes: [tbc('Aso-ebi or other attire notes (optional)')],
  },

  gallery: {
    /**
     * Each image: { src: 'photo-name', alt: 'What the photo shows', caption: 'optional' }
     * Photo names come from the folder and file name: `npm run photos -- --list` prints them all.
     * Add a 'Wedding day' album after the celebration.
     */
    albums: [
      {
        id: 'pre-wedding',
        title: 'Pre-wedding',
        images: [
          { src: 'pre-wedding-dsc-6740', alt: 'Victor in a white jacket and Adaeze in a red lace dress, smiling' },
          { src: 'pre-wedding-dsc-6992', alt: 'Victor and Adaeze embracing in traditional attire' },
          { src: 'pre-wedding-dsc-6935', alt: 'Their hands together, showing the engagement ring' },
          { src: 'pre-wedding-dsc-7005', alt: 'Victor and Adaeze forehead to forehead in traditional attire' },
          { src: 'pre-wedding-dsc-6742', alt: 'Victor and Adaeze arm in arm, smiling at each other' },
          { src: 'pre-wedding-dsc-6851', alt: 'Victor and Adaeze making a heart with their hands' },
          { src: 'pre-wedding-dsc-7070', alt: 'Adaeze in a pink gele and green lace' },
          { src: 'pre-wedding-dsc-7101', alt: 'Victor in white traditional attire and a blue cap' },
          { src: 'pre-wedding-dsc-6981', alt: 'Victor and Adaeze seated in traditional attire' },
          { src: 'pre-wedding-dsc-6800', alt: 'Adaeze leaning over Victor, both in sunglasses, laughing' },
          { src: 'pre-wedding-dsc-6868', alt: 'Victor and Adaeze in white shirts, smiling' },
          { src: 'pre-wedding-dsc-7029', alt: 'Adaeze smiling in a pink gele, Victor in the foreground' },
          { src: 'pre-wedding-dsc-6795', alt: 'Adaeze in sunglasses resting her arms on Victor’s shoulders' },
          { src: 'pre-wedding-dsc-7025', alt: 'Victor and Adaeze celebrating in traditional attire' },
          { src: 'pre-wedding-dsc-7038', alt: 'Adaeze in a pink gele, framed by Victor’s arm' },
          { src: 'pre-wedding-dsc-7092', alt: 'Adaeze in a pink gele, seen past Victor’s shoulder' },
        ],
      },
      {
        id: 'proposal',
        title: 'The proposal',
        images: [
          { src: 'proposal-film-2', alt: 'The neon “Will You Marry Me?” sign, lit for the moment' },
          { src: 'proposal-03', alt: 'Victor and Adaeze beside the neon “Will You Marry Me?” sign' },
          { src: 'proposal-05', alt: 'The engagement ring, held out towards the camera' },
          { src: 'proposal-01', alt: 'Victor and Adaeze laughing with a little one in their arms' },
          { src: 'proposal-film-1', alt: 'Victor and Adaeze embracing as guests look on' },
          { src: 'proposal-02', alt: 'Victor and Adaeze with a little one in their arms' },
          { src: 'proposal-04', alt: 'Victor and Adaeze smiling beneath the neon sign' },
        ],
      },
      {
        id: 'church-introduction',
        title: 'Church introduction',
        images: [
          { src: 'church-introduction-2026-11-22-15-42-35', alt: 'Victor and Adaeze outside the church' },
          { src: 'church-introduction-2026-11-22-15-42-33', alt: 'Victor and Adaeze with family outside the church' },
          { src: 'church-introduction-2026-11-22-15-42-35-3', alt: 'Victor and Adaeze with family' },
          { src: 'church-introduction-2026-11-22-15-42-38-1', alt: 'Victor and Adaeze with family and church members' },
          { src: 'church-introduction-2026-11-22-15-42-42', alt: 'Adaeze with a family member in a gold gele' },
          { src: 'church-introduction-2026-11-22-15-42-35-1', alt: 'Victor and Adaeze with a guest in blue' },
          { src: 'church-introduction-2026-11-22-15-42-36-1', alt: 'Victor and Adaeze with family, including a little one in yellow' },
          { src: 'church-introduction-2026-11-22-15-42-34-1', alt: 'Adaeze with a family member in light blue' },
          { src: 'church-introduction-2026-11-22-15-42-39-1', alt: 'Family at the church introduction' },
          { src: 'church-introduction-2026-11-22-15-42-40-1', alt: 'A family member in a gold gele' },
        ],
      },
      {
        id: 'registry',
        title: 'Registry',
        images: [
          { src: 'registry-2026-11-24-17-01-18-1', alt: 'Victor and Adaeze outside, she holding her bouquet' },
          { src: 'registry-2026-11-25-02-49-55-1', alt: 'Victor and Adaeze at the Federal Marriage Registry' },
          { src: 'registry-2026-11-25-02-49-55', alt: 'Victor signing the marriage register' },
          { src: 'registry-2026-11-25-02-49-57-4', alt: 'Adaeze signing the marriage register' },
          { src: 'registry-2026-11-25-02-49-56-3', alt: 'Victor and Adaeze smiling with their marriage certificate' },
          { src: 'registry-2026-11-24-17-37-54', alt: 'Victor and Adaeze arriving at the registry with family' },
          { src: 'registry-2026-11-25-02-49-58-2', alt: 'Victor and Adaeze at the registry sign' },
          { src: 'registry-2026-11-25-02-49-57-2', alt: 'Victor and Adaeze with family at the registry' },
          { src: 'registry-2026-11-25-02-49-57-3', alt: 'Victor and Adaeze with family and friends' },
          { src: 'registry-2026-11-25-02-49-53', alt: 'Victor and Adaeze seated at the registry table' },
          { src: 'registry-2026-11-25-02-49-59', alt: 'Victor and Adaeze with friends at the registry' },
          { src: 'registry-2026-11-24-17-01-19-1', alt: 'Victor and Adaeze walking together' },
          { src: 'registry-2026-11-25-02-49-58-3', alt: 'Victor at the Federal Marriage Registry' },
        ],
      },
      { id: 'moments', title: 'Moments together', images: [] },
    ],
  },

  travel: {
    intro: tbc('A line for guests travelling from outside Ekiti State'),
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
    { name: tbc('Coordinator’s name'), role: 'Wedding coordinator', phone: tbc('Phone'), whatsapp: true },
    { name: tbc('Name'), role: 'For Adaeze’s family and guests', phone: tbc('Phone'), whatsapp: true },
    { name: tbc('Name'), role: 'For Victor’s family and guests', phone: tbc('Phone'), whatsapp: true },
  ],
  email: tbc('An email address for enquiries (optional)'),

  gifts: {
    enabled: true,
    message: 'Your presence on our day is the greatest gift of all.',
    /**
     * Gift details are shown only to guests who have opened their personal
     * invitation link or entered their code, never to the public.
     */
    detailsIntro: 'For those who have kindly asked, here is how to send a gift.',
    details: [
      {
        label: 'Bank transfer',
        lines: [tbc('Account name'), tbc('Bank'), tbc('Account number')],
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
