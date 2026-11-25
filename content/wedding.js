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

export default {
  couple: { first: 'Victor', second: 'Adaeze' },

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
  },

  hero: {
    /** Engagement or pre-wedding portrait, upright (4:5) works best. */
    image: tbc('Engagement portrait: add photos/hero.jpg, then write \'hero\' here'),
    alt: 'Victor and Adaeze',
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
        image: tbc('Proposal photo, landscape works best'),
        layout: 'wide',
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
      name: 'Traditional wedding',
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
        colours: [
          { name: tbc('Colour name'), hex: tbc('Colour, e.g. #8E4B33') },
          { name: tbc('Colour name'), hex: tbc('Colour') },
        ],
      },
      notes: tbc('Anything else guests should know (optional)'),
    },
    {
      id: 'church',
      name: 'Church wedding',
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
        colours: [],
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
    /** The wedding colours, shown as swatches. */
    palette: [
      { name: tbc('Colour name'), hex: tbc('Colour, e.g. #E9DCC6') },
      { name: tbc('Colour name'), hex: tbc('Colour') },
      { name: tbc('Colour name'), hex: tbc('Colour') },
    ],
    /** Any further notes: aso-ebi, what to avoid, guidance for the bridal party… */
    notes: [tbc('Aso-ebi or other attire notes (optional)')],
  },

  gallery: {
    /**
     * Each image: { src: 'photo-name', alt: 'What the photo shows', caption: 'optional' }
     * Add a 'Wedding day' album after the celebration.
     */
    albums: [
      { id: 'engagement', title: 'Engagement', images: [] },
      { id: 'pre-wedding', title: 'Pre-wedding', images: [] },
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
    /** Shown after the wedding day. */
    after: 'Thank you for celebrating with us. Your love, prayers and presence meant more to us than words can say.',
  },

  site: {
    /** Keep false to ask search engines not to list the site. */
    indexable: false,
  },
};
