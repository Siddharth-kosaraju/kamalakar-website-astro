/**
 * JSON-LD Schema builders — generates structured data at build time.
 * Replaces the runtime DOM manipulation in the old SEO.tsx component.
 */

const CANONICAL_BASE = 'https://kamalakarheartcentre.com';

interface FAQItem {
  question: string;
  answer: string;
}

interface VideoItem {
  id: string;
  title: string;
  youtubeId: string;
  duration?: string;
  transcript?: string;
  tags?: string[];
  keywords?: string;
  uploadDate?: string;
}

interface TestimonialItem {
  text: string;
  author: string;
  /** Star rating 1-5. Defaults to 5 when omitted. */
  rating?: number;
}

interface ServiceStep {
  title: string;
  description: string;
}

function durationToISO(duration: string): string {
  const parts = duration.split(':');
  if (parts.length === 2) return `PT${parseInt(parts[0])}M${parseInt(parts[1])}S`;
  if (parts.length === 3) return `PT${parseInt(parts[0])}H${parseInt(parts[1])}M${parseInt(parts[2])}S`;
  return `PT${duration}`;
}

export function buildBusinessSchema(testimonials?: TestimonialItem[]) {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': ['MedicalOrganization', 'LocalBusiness'],
    '@id': `${CANONICAL_BASE}/#organization`,
    name: 'Kamalakar Heart Centre',
    alternateName: 'Kamalakar Heart Centre at Life Hospital',
    description: 'Advanced cardiac care in Guntur by Dr. Kamalakar Kosaraju. Angioplasty, Pacemaker, ECG, 2D Echo and Heart Failure management.',
    url: CANONICAL_BASE,
    logo: `${CANONICAL_BASE}/images/logo.svg`,
    image: `${CANONICAL_BASE}/media/dr-kamalakar.jpg`,
    telephone: '+919959423566',
    email: 'info@kamalakarheartcentre.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Life Hospital, Old Club Road, Kothapet',
      addressLocality: 'Guntur',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.298329484414772,
      longitude: 80.4526551755477,
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '10:00', closes: '18:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '00:00', closes: '23:59', description: 'Emergency Only' },
    ],
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash, Credit Card, UPI',
    areaServed: { '@type': 'GeoCircle', geoMidpoint: { '@type': 'GeoCoordinates', latitude: 16.298329, longitude: 80.452655 }, geoRadius: '50000' },
    medicalSpecialty: 'Cardiology',
    sameAs: ['https://www.facebook.com/DR.Kamalakarkosaraju/'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Cardiac Services',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Diagnostic Services', itemListElement: [{ '@type': 'Offer', itemOffered: { '@type': 'MedicalTest', name: 'ECG Test' } }, { '@type': 'Offer', itemOffered: { '@type': 'MedicalTest', name: '2D Echo' } }] },
        { '@type': 'OfferCatalog', name: 'Treatment Services', itemListElement: [{ '@type': 'Offer', itemOffered: { '@type': 'MedicalProcedure', name: 'Angioplasty' } }, { '@type': 'Offer', itemOffered: { '@type': 'MedicalProcedure', name: 'Pacemaker Implantation' } }] },
      ],
    },
  };

  // Merge reviews/ratings directly into the business schema.
  // Compliance: aggregateRating MUST be derived from the reviews actually displayed on the page
  // where this schema appears (Google Rich Results policy). The testimonials passed in here are
  // rendered visibly via <Testimonials /> on the homepage and contact page.
  if (testimonials && testimonials.length > 0) {
    const ratings = testimonials.map(t => t.rating ?? 5);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(testimonials.length),
    };
    schema.review = testimonials.map(t => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: String(t.rating ?? 5), bestRating: '5' },
      author: { '@type': 'Person', name: t.author },
      reviewBody: t.text,
    }));
  }

  return schema;
}

export function buildPhysicianSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    '@id': `${CANONICAL_BASE}/#physician`,
    name: 'Dr. Kamalakar Kosaraju',
    honorificPrefix: 'Dr.',
    givenName: 'Kamalakar',
    familyName: 'Kosaraju',
    jobTitle: 'Interventional Cardiologist',
    medicalSpecialty: 'Cardiology',
    description: 'MBBS and M.D. General Medicine (Gold Medalist) from Dr. NTR University of Health Sciences, Vijayawada. D.M. Cardiology from Osmania Medical College, Hyderabad (2012–2015) — the three-year super-specialty residency program. Fellow of the European Society of Cardiology (FESC). Andhra Pradesh Medical Council registration #57814. 3,000+ coronary angiograms and 1,000+ angioplasty procedures performed.',
    image: `${CANONICAL_BASE}/media/dr-kamalakar.jpg`,
    url: CANONICAL_BASE,
    telephone: '+919959423566',
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Dr. NTR University of Health Sciences', sameAs: 'https://en.wikipedia.org/wiki/Dr._NTR_University_of_Health_Sciences', description: 'MBBS (2007) and M.D. General Medicine, Gold Medal (2012)' },
      { '@type': 'CollegeOrUniversity', name: 'Osmania Medical College', sameAs: 'https://en.wikipedia.org/wiki/Osmania_Medical_College', description: 'D.M. Cardiology super-specialty residency program (2012–2015)' },
      { '@type': 'Organization', name: 'European Society of Cardiology', sameAs: 'https://www.escardio.org/' },
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'MBBS', educationalLevel: 'Bachelor of Medicine and Bachelor of Surgery', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Dr. NTR University of Health Sciences, Vijayawada' }, dateCreated: '2007' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'M.D. General Medicine (Gold Medal)', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Dr. NTR University of Health Sciences, Vijayawada' }, dateCreated: '2012' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'D.M. Cardiology', educationalLevel: 'Super-specialty doctoral residency program', recognizedBy: { '@type': 'CollegeOrUniversity', name: 'Osmania Medical College, Hyderabad' }, dateCreated: '2015' },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'FESC — Fellow of the European Society of Cardiology', recognizedBy: { '@type': 'Organization', name: 'European Society of Cardiology' } },
      { '@type': 'EducationalOccupationalCredential', credentialCategory: 'Medical Council Registration', identifier: '57814', recognizedBy: { '@type': 'Organization', name: 'Andhra Pradesh Medical Council' }, dateCreated: '2007' },
    ],
    identifier: {
      '@type': 'PropertyValue',
      propertyID: 'Andhra Pradesh Medical Council Registration',
      value: '57814',
    },
    knowsAbout: ['Interventional Cardiology', 'Angioplasty', 'Angiogram', 'Pacemaker Implantation', 'Heart Failure Management', 'ECG', '2D Echocardiography', 'Cardiac Emergency Care', 'Hypertension', 'Cholesterol Management', 'TMT Stress Test'],
    memberOf: { '@type': 'Organization', name: 'European Society of Cardiology', sameAs: 'https://www.escardio.org/' },
    worksFor: { '@type': 'MedicalOrganization', name: 'Kamalakar Heart Centre', '@id': `${CANONICAL_BASE}/#organization` },
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Life Hospital, Old Club Road, Kothapet',
      addressLocality: 'Guntur',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522001',
      addressCountry: 'IN',
    },
  };
}

export function buildProceduresSchema() {
  return [
    { '@context': 'https://schema.org', '@type': 'MedicalProcedure', name: 'Angioplasty', procedureType: 'Percutaneous', bodyLocation: 'Coronary arteries', description: 'Minimally invasive procedure to open blocked coronary arteries using a balloon catheter and stent placement.', howPerformed: 'A catheter is inserted through the wrist or groin, guided to the heart, and a balloon is inflated to open the blocked artery. A stent is placed to keep it open.', preparation: 'Fasting for 6-8 hours, basic blood tests, and mild sedation.', status: 'EventScheduled', url: `${CANONICAL_BASE}/services/angioplasty/` },
    { '@context': 'https://schema.org', '@type': 'MedicalProcedure', name: 'Angiogram', procedureType: 'Percutaneous', bodyLocation: 'Coronary arteries', description: 'Diagnostic imaging procedure using contrast dye and X-ray to visualize coronary arteries and detect blockages.', howPerformed: 'Contrast dye injected through a catheter to visualize arteries on X-ray in real-time.', url: `${CANONICAL_BASE}/services/angioplasty/` },
    { '@context': 'https://schema.org', '@type': 'MedicalProcedure', name: 'Pacemaker Implantation', bodyLocation: 'Chest', description: 'Implantation of a small device that sends electrical impulses to regulate heartbeat.', howPerformed: 'Small incision near the collarbone, leads guided through a vein to the heart, device placed under the skin.', url: `${CANONICAL_BASE}/services/pacemaker/` },
  ];
}

export function buildTestsSchema() {
  return [
    { '@context': 'https://schema.org', '@type': 'MedicalTest', name: 'ECG Test', description: 'Records heart electrical activity through chest sensors. Takes 5-10 minutes.', usedToDiagnose: { '@type': 'MedicalCondition', name: 'Cardiac Arrhythmia' }, url: `${CANONICAL_BASE}/services/ecg-echo/` },
    { '@context': 'https://schema.org', '@type': 'MedicalTest', name: '2D Echo', description: 'Ultrasound imaging of heart chambers, valves, and blood flow. 15-30 minutes.', url: `${CANONICAL_BASE}/services/ecg-echo/` },
  ];
}

export function buildConditionsSchema() {
  return [
    { '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'Coronary Artery Disease', description: 'Narrowing or blockage of coronary arteries that supply blood to the heart muscle.', associatedAnatomy: { '@type': 'AnatomicalStructure', name: 'Coronary Arteries' }, possibleTreatment: [{ '@type': 'MedicalProcedure', name: 'Angioplasty' }, { '@type': 'MedicalProcedure', name: 'Angiogram' }] },
    { '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'Heart Failure', description: 'A chronic condition where the heart cannot pump blood effectively.', possibleTreatment: { '@type': 'MedicalTherapy', name: 'Heart Failure Management' } },
    { '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'Heart Attack', alternateName: 'Myocardial Infarction', description: 'Occurs when blood flow to a part of the heart is blocked.', possibleTreatment: { '@type': 'MedicalProcedure', name: 'Emergency Angioplasty (Primary PCI)' }, signOrSymptom: [{ '@type': 'MedicalSymptom', name: 'Chest pain or pressure' }, { '@type': 'MedicalSymptom', name: 'Pain in arm, jaw, or back' }, { '@type': 'MedicalSymptom', name: 'Shortness of breath' }] },
    { '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'High Cholesterol', description: 'Elevated cholesterol levels increasing risk of heart disease.' },
    { '@context': 'https://schema.org', '@type': 'MedicalCondition', name: 'Heart Problems', description: 'Various cardiac conditions affecting heart function.' },
  ];
}

export function buildFAQSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebPageSchema(page: 'home' | 'education') {
  const isHome = page === 'home';
  const url = isHome ? `${CANONICAL_BASE}/` : `${CANONICAL_BASE}/education`;

  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    url,
    name: isHome ? 'Kamalakar Heart Centre - Best Cardiologist in Guntur' : 'Heart Health Education - Kamalakar Heart Centre',
    description: isHome
      ? 'Expert cardiac care in Guntur by Dr. Kamalakar Kosaraju.'
      : 'Heart health education resources from Kamalakar Heart Centre.',
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', url: CANONICAL_BASE, name: 'Kamalakar Heart Centre' },
    about: { '@type': 'MedicalSpecialty', name: 'Cardiology' },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: isHome
        ? ['#hero-headline', '#about', '#faq']
        : ['#education-heading', '#education-description'],
    },
  };
}

export function buildVideoListSchema(videos: VideoItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Heart Health Education Videos',
    itemListElement: videos.map((video, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'VideoObject',
        name: video.title,
        description: video.transcript || video.title,
        thumbnailUrl: `https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`,
        uploadDate: video.uploadDate || '2024-01-15T00:00:00+05:30',
        duration: video.duration ? durationToISO(video.duration) : undefined,
        contentUrl: `https://www.youtube.com/watch?v=${video.youtubeId}`,
        embedUrl: `https://www.youtube.com/embed/${video.youtubeId}`,
        publisher: {
          '@type': 'Organization',
          name: 'Kamalakar Heart Centre',
          logo: { '@type': 'ImageObject', url: `${CANONICAL_BASE}/images/logo.svg` },
        },
      },
    })),
  };
}


/**
 * One connected JSON-LD graph for the homepage that ties together:
 *   WebSite  →  MedicalClinic (#organization, with aggregateRating from reviews)
 *            →  Physician     (#physician — worksFor → #organization)
 *
 * Use this on the homepage instead of inlining a parallel graph with different
 * @ids — every page that references #organization or #physician then resolves
 * to the same entity in Google's knowledge graph.
 */
export function buildHomepageSchemaGraph(testimonials?: TestimonialItem[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${CANONICAL_BASE}/#website`,
        url: `${CANONICAL_BASE}/`,
        name: 'Kamalakar Heart Centre',
        publisher: { '@id': `${CANONICAL_BASE}/#organization` },
        inLanguage: 'en-IN',
      },
      buildBusinessSchema(testimonials),
      buildPhysicianSchema(),
    ],
  };
}

interface ServicePrice {
  /** Service name as it should appear in JSON-LD (e.g. "ECG Test"). */
  name: string;
  /** Description for the MedicalProcedure / MedicalTest schema. */
  description: string;
  /** @type: MedicalProcedure for treatments, MedicalTest for diagnostics. */
  type: 'MedicalProcedure' | 'MedicalTest';
  /** Price in INR. Use null for "starting from" prices and pass minPrice instead. */
  price: number | null;
  /** Optional minimum price for ranges (e.g. angioplasty: ₹1,10,000 + hardware). */
  minPrice?: number;
  /** Optional disclaimer to render in valueAddedTaxIncluded / description. */
  note?: string;
}

/**
 * OfferCatalog with PriceSpecification per cardiac test/procedure.
 * Used on /services/diagnostics-pricing/ to give Google explicit price
 * answers for "echo test cost in guntur", "angiogram cost", etc.
 */
export function buildPricingOfferCatalog(items: ServicePrice[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'Cardiac Test & Procedure Pricing — Kamalakar Heart Centre, Guntur',
    provider: { '@id': `${CANONICAL_BASE}/#organization` },
    itemListElement: items.map((it) => {
      const offer: Record<string, any> = {
        '@type': 'Offer',
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        seller: { '@id': `${CANONICAL_BASE}/#organization` },
        itemOffered: {
          '@type': it.type,
          name: it.name,
          description: it.description,
        },
      };
      if (it.price !== null) {
        offer.price = String(it.price);
        offer.priceSpecification = {
          '@type': 'PriceSpecification',
          price: String(it.price),
          priceCurrency: 'INR',
        };
      } else if (it.minPrice !== undefined) {
        offer.priceSpecification = {
          '@type': 'PriceSpecification',
          minPrice: String(it.minPrice),
          priceCurrency: 'INR',
          description: it.note || 'Starting price; final cost depends on hardware/consumables.',
        };
      }
      return offer;
    }),
  };
}

export function buildServicePageSchema(service: {
  title: string;
  metaDescription: string;
  steps?: ServiceStep[];
  faq: FAQItem[];
  slug: string;
}) {
  const url = `${CANONICAL_BASE}/services/${service.slug}`;
  const schemas = [];

  // MedicalProcedure
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'MedicalProcedure',
    name: service.title,
    description: service.metaDescription,
    url,
    performedBy: { '@type': 'Physician', name: 'Dr. Kamalakar Kosaraju', '@id': `${CANONICAL_BASE}/#physician` },
    ...(service.steps ? { howPerformed: service.steps.map(s => `${s.title}: ${s.description}`).join('. ') } : {}),
  });

  // FAQPage
  if (service.faq.length > 0) {
    schemas.push(buildFAQSchema(service.faq));
  }

  // Breadcrumb
  schemas.push(buildBreadcrumbSchema([
    { name: 'Home', url: CANONICAL_BASE },
    { name: 'Services', url: `${CANONICAL_BASE}/#services` },
    { name: service.title, url },
  ]));

  return schemas;
}
