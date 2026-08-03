export const TRADE_CONFIG = {
  // Platform identity
  platformName: 'Chiron',

  // Listing terminology
  listingName: 'submission',
  listingNamePlural: 'submissions',

  // What is being traded
  tradeNoun: 'idea',
  tradeNounPlural: 'ideas',

  // Offer / Seek labels
  offerLabel: 'What are you offering?',
  offerPlaceholder: 'Describe your idea, invention, lyrics, or research — share enough to attract interest but keep key details private until a deal is agreed.',

  seekLabel: 'What are you looking for in return?',
  seekPlaceholder: 'e.g. Funding, co-development, revenue share, publishing deal, or open to offers',

  // Categories
  categories: [
    'Scientific Innovation',
    'Technology & Engineering',
    'Medical & Pharmaceutical',
    'Environmental & Energy',
    'Laboratory Collaboration',
    'Music & Lyrics',
    'Literature & Publishing',
    'Film & Screenplay',
    'Art & Design',
    'Other Creative Work',
  ],

  // Availability options (repurposed for readiness)
  availabilityOptions: [
    'Ready for immediate deal',
    'Open to discussion',
    'Seeking co-development partner',
    'Seeking funding only',
    'Seeking lab collaboration',
    'Flexible',
  ],

  // Trade types
  tradeTypes: [
    { value: 'barter', label: 'Non-monetary (credits, naming rights, participation)' },
    { value: 'paid', label: 'Monetary purchase' },
    { value: 'both', label: 'Open to all offers' },
  ],

  // Home page
  heroTagline: 'Where ideas find their future.',
  heroSubtitle: 'A private marketplace for scientists, inventors, labs, and creators to connect with those who can bring their ideas to life.',
}
