import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const serviceItemSchema = z.object({
  title: z.string(),
  desc: z.string(),
});

const videoItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  youtubeId: z.string(),
  duration: z.string().optional(),
  uploadDate: z.string().optional(),
  transcript: z.string().optional(),
  tags: z.array(z.string()).optional(),
  keywords: z.string().optional(),
});

const articleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  date: z.string().optional(),
  url: z.string(),
  publisher: z.string().optional(),
});

const testimonialItemSchema = z.object({
  text: z.string(),
  author: z.string(),
  // Optional star rating 1-5. Defaults to 5 in buildBusinessSchema when omitted.
  rating: z.number().min(1).max(5).optional(),
});

const galleryImageSchema = z.object({
  src: z.string(),
  alt: z.string(),
  aspectRatio: z.enum(['square', 'portrait', 'landscape']).optional(),
});

const faqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const siteSchema = z.object({
  nav: z.object({
    home: z.string(),
    about: z.string(),
    education: z.string(),
    services: z.string(),
    blog: z.string(),
    media: z.string().optional(),
    contact: z.string(),
    bookBtn: z.string(),
    emergencyLabel: z.string(),
    location: z.string(),
    hours: z.string(),
    lightMode: z.string(),
    darkMode: z.string(),
  }),
  hero: z.object({
    headline: z.string(),
    subHeadline: z.string(),
    bodyText: z.string().optional(),
    brandLine: z.string().optional(),
    trustBadge: z.string().optional(),
    ctaBook: z.string(),
    ctaEmergency: z.string(),
    address: z.string(),
    addressLink: z.string(),
    experience: z.string(),
    experienceLabel: z.string(),
    procedures: z.string(),
    proceduresLabel: z.string(),
    angioplasties: z.string(),
    angioplastiesLabel: z.string(),
    imageAlt: z.string(),
  }),
  stats: z.object({
    experience: z.string(),
    experienceLabel: z.string(),
    goldMedalist: z.string(),
    goldMedalistLabel: z.string(),
    fellow: z.string(),
    fellowLabel: z.string(),
    patientRating: z.string().optional(),
  }),
  about: z.object({
    heading: z.string(),
    p1: z.string(),
    p2: z.string(),
    experienceBadge: z.string(),
    servicesLinkText: z.string().optional(),
    learnMoreBtn: z.string().optional(),
    sectionChip: z.string().optional(),
    subtitle: z.string().optional(),
    roleTitle: z.string().optional(),
    credentialMD: z.string().optional(),
    credentialDM: z.string().optional(),
  }),
  services: z.object({
    heading: z.string(),
    expertiseChip: z.string().optional(),
    description: z.string().optional(),
    learnMore: z.string().optional(),
    viewAllBtn: z.string().optional(),
    items: z.array(serviceItemSchema),
  }),
  education: z.object({
    heading: z.string(),
    description: z.string(),
    healthAlert: z.string().optional(),
    symptomsDescription: z.string().optional(),
    riskFactorsTitle: z.string().optional(),
    riskFactorsSubtitle: z.string().optional(),
    riskFactorsCenter: z.string().optional(),
    riskFactorNames: z.object({
      hypertension: z.string(),
      smoking: z.string(),
      diabetes: z.string(),
      obesity: z.string(),
      other: z.string(),
    }).optional(),
    symptoms: z.array(z.string()),
    videos: z.array(videoItemSchema),
    labels: z.object({
      featuredVideos: z.string(),
      upNext: z.string(),
      articles: z.string(),
      articlesCuratedBy: z.string(),
      watchNow: z.string(),
      readArticle: z.string(),
      keywordsLabel: z.string().optional(),
    }),
    articles: z.array(articleItemSchema),
  }),
  testimonials: z.object({
    heading: z.string(),
    successStories: z.string().optional(),
    subtitle: z.string().optional(),
    verifiedPatient: z.string().optional(),
    joinedText: z.string().optional(),
    items: z.array(testimonialItemSchema),
  }),
  gallery: z.object({
    heading: z.string(),
    description: z.string(),
    close: z.string().optional(),
    imageCounter: z.string().optional(),
    images: z.array(galleryImageSchema),
  }),
  preventive: z.object({
    heading: z.string(),
    description: z.string().optional(),
    riskFactors: z.array(z.string()),
    closingText: z.string().optional(),
  }).optional(),
  whyChoose: z.object({
    heading: z.string(),
    subheading: z.string().optional(),
    points: z.array(z.string()),
    closingText: z.string().optional(),
  }).optional(),
  appointment: z.object({
    heading: z.string(),
  }),
  faq: z.object({
    heading: z.string(),
    commonQuestions: z.string().optional(),
    subtitle: z.string().optional(),
    stillHaveQuestions: z.string().optional(),
    contactSupport: z.string().optional(),
    items: z.array(faqItemSchema),
  }),
  contact: z.object({
    heading: z.string(),
    addressLabel: z.string(),
    hoursLabel: z.string(),
    contactLabel: z.string(),
    appointmentPhone: z.string(),
    helpText: z.string().optional(),
    getDirections: z.string().optional(),
    hoursText: z.string().optional(),
    sundayEmergency: z.string().optional(),
    address: z.array(z.string()),
    viewLocationBtn: z.string().optional(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    homeTitle: z.string(),
    homeDescription: z.string(),
    educationTitle: z.string(),
    educationDescription: z.string(),
    keywords: z.array(z.string()).optional(),
    ogImage: z.string().optional(),
    canonicalBase: z.string().optional(),
    gbpUrl: z.string().optional(),
  }),
  footer: z.object({
    brandDescription: z.string(),
    quickLinksTitle: z.string(),
    servicesTitle: z.string(),
    contactTitle: z.string(),
    address: z.string(),
    hours: z.string(),
    copyright: z.string(),
    privacy: z.string(),
    terms: z.string(),
    serviceLinks: z.array(z.string()),
  }),
});

const servicePageSchema = z.object({
  slug: z.string(),
  title: z.string(),
  metaTitle: z.string(),
  metaDescription: z.string(),
  heroHeading: z.string(),
  heroSubheading: z.string(),
  content: z.array(z.string()).optional(),
  sections: z.array(z.object({
    heading: z.string().optional(),
    paragraphs: z.array(z.string()).optional(),
    bullets: z.array(z.string()).optional(),
    closingText: z.string().optional(),
  })).optional(),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  faq: z.array(faqItemSchema),
  keywords: z.array(z.string()).optional(),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
    caption: z.string(),
  })).optional(),
  // Blog post slugs to surface as "Related Patient Guides" on the service page.
  // Each must resolve to a published blog post; [slug].astro throws at build if not.
  relatedPosts: z.array(z.string()).optional(),
  ctaText: z.string(),
});

// The 5 categories fixed by CLAUDE.md media-section plan. Every video must be
// assigned one at add time — matches the admin-portal dropdown planned for
// Phase 3 (DynamoDB-backed CMS), enforced here for the Phase 1 YAML source.
const MEDIA_CATEGORIES = [
  'Heart Tests Explained',
  'Heart Attack & Emergency',
  'Prevention & Lifestyle',
  'Inside the Clinic',
] as const;

const mediaItemSchema = z.object({
  // Full YouTube URL (youtube.com/watch?v=... or youtu.be/...) — matches what
  // the admin portal will accept verbatim; the youtube ID is derived at build
  // time in src/utils/youtube.ts, never hand-entered.
  youtubeUrl: z.string().url(),
  displayTitle: z.string(),
  category: z.enum(MEDIA_CATEGORIES),
  language: z.enum(['English', 'Telugu']).default('English'),
  // featured = shown in the large player at the top of /media/ (only one should be featured)
  // full     = gets its own /media/<slug>/ page with schema + related links
  // grid-only = appears in the gallery grid only, no dedicated page
  tier: z.enum(['featured', 'full', 'grid-only']).default('grid-only'),
  description: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  uploadDate: z.string().optional(),
  duration: z.string().optional(),
  relatedService: z.string().optional(),
  relatedPost: z.string().optional(),
  // Admin-managed display order (ascending) — see /admin/'s up/down reorder
  // controls. Materialized straight from the DynamoDB item's `order` field.
  order: z.number().default(0),
});

const blogPostSchema = z.object({
  title: z.string(),
  summary: z.string(),
  // Optional SEO overrides. metaTitle feeds the <title> (H1 stays `title`);
  // metaDescription feeds the meta description (falls back to `summary`).
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  date: z.coerce.date(),
  author: z.string().default('Dr. Kamalakar Kosaraju'),
  tags: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  published: z.boolean().default(true),
  // Optional hero image rendered at the top of the post and used as the og:image.
  // Paths are relative to /public, e.g. "/media/blog-foo-hero.jpg".
  // If heroImage is set, a sibling .webp at the same path stem is auto-resolved
  // for the <picture> srcset (matches the gallery-*.{jpg,webp} convention).
  heroImage: z.string().optional(),
  heroImageAlt: z.string().optional(),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/site' }),
  schema: siteSchema,
});

const services = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './src/content/services',
    // Force filename-based IDs so both en and te entries coexist
    // (default behavior uses the `slug` field from data, causing collisions)
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ''),
  }),
  schema: servicePageSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogPostSchema,
});

const media = defineCollection({
  loader: glob({
    pattern: '**/*.yaml',
    base: './src/content/media',
    // Filename is the slug (used for /media/<slug>/ full-tier pages).
    generateId: ({ entry }) => entry.replace(/\.yaml$/, ''),
  }),
  schema: mediaItemSchema,
});

export const collections = { site, services, blog, media };
