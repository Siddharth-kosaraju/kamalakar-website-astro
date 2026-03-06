import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface ServiceFAQProps {
  items: FAQItem[];
  heading: string;
}

export default function ServiceFAQ({ items, heading }: ServiceFAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl font-bold font-serif text-primary dark:text-white mb-10">
        {heading}
      </h2>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              aria-expanded={openIdx === idx}
            >
              <span className="font-bold text-primary dark:text-white pr-4">{item.question}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`flex-shrink-0 text-gray-400 transition-transform duration-300 ${openIdx === idx ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                openIdx === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <p className="px-6 pb-6 text-gray-600 dark:text-gray-300 leading-relaxed">
                {item.answer}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
