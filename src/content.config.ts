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
    successRate: z.string(),
    successRateLabel: z.string(),
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
  content: z.array(z.string()),
  steps: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  faq: z.array(faqItemSchema),
  keywords: z.array(z.string()).optional(),
  ctaText: z.string(),
});

const blogPostSchema = z.object({
  title: z.string(),
  titleTe: z.string().optional(),
  summary: z.string(),
  summaryTe: z.string().optional(),
  date: z.coerce.date(),
  author: z.string().default('Dr. Kamalakar Kosaraju'),
  tags: z.array(z.string()).optional(),
  tagsTe: z.array(z.string()).optional(),
  readingTime: z.string().optional(),
  published: z.boolean().default(true),
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

const blogTe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog-te' }),
  schema: blogPostSchema,
});

export const collections = { site, services, blog, 'blog-te': blogTe };
