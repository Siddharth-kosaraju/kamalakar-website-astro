import React, { useState } from 'react';
import { ChevronDown, MessageCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQContent {
  heading: string;
  commonQuestions?: string;
  subtitle?: string;
  stillHaveQuestions?: string;
  contactSupport?: string;
  items: FAQItem[];
}

export default function FAQ({ content }: { content: FAQContent }) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-neutral-50 dark:bg-primary-dark transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-primary dark:text-white mb-6 font-semibold">
            <MessageCircle size={16} className="text-accent" />
            <span className="text-sm uppercase tracking-wider">{content.commonQuestions || 'Common Questions'}</span>
          </div>
          <h2 className="text-4xl font-bold font-serif text-primary dark:text-white mb-6">{content.heading}</h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {content.subtitle || 'Get clarity on our procedures, insurance, and patient care protocols.'}
          </p>
        </div>

        <div className="space-y-4">
          {content.items.map((item, index) => (
            <div key={index} className={`group overflow-hidden rounded-xl border transition-all duration-300 ${expandedIndex === index ? 'bg-white dark:bg-gray-800 border-accent shadow-md' : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
              <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)} className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none">
                <h3 className={`text-lg font-bold font-serif transition-colors duration-200 text-primary dark:text-white`}>
                  {item.question}
                </h3>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${expandedIndex === index ? 'bg-accent/20 text-accent rotate-180' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                  <ChevronDown size={20} />
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-secondary dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">{item.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">{content.stillHaveQuestions || 'Still have questions?'}</p>
          <a href="#contact" className="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-primary-light transition-all hover:-translate-y-1">
            {content.contactSupport || 'Contact Our Support Team'}
          </a>
        </div>
      </div>
    </section>
  );
}
