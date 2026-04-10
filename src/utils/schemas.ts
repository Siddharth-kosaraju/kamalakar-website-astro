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
    '@type': ['MedicalOrganization', 'MedicalBusiness', 'LocalBusiness'],
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

  // Merge reviews/ratings directly into the business schema (avoids duplicate MedicalBusiness entities)
  if (testimonials && testimonials.length > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      bestRating: '5',
      worstRating: '1',
      reviewCount: String(testimonials.length),
    };
    schema.review = testimonials.map(t => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
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
    description: 'Gold Medalist in M.D. (General Medicine), D.M. Cardiology from Osmania Medical College, Fellow of European Society of Cardiology (FESC). 10+ years of experience with 5,000+ cardiac procedures.',
    image: `${CANONICAL_BASE}/media/dr-kamalakar.jpg`,
    url: CANONICAL_BASE,
    telephone: '+919959423566',
    alumniOf: [
      { '@type': 'CollegeOrUniversity', name: 'Osmania Medical College', sameAs: 'https://en.wikipedia.org/wiki/Osmania_Medical_College' },
      { '@type': 'Organization', name: 'European Society of Cardiology', sameAs: 'https://www.escardio.org/' },
    ],
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
