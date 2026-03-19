import React, { useEffect, useState } from 'react';
import { Award, GraduationCap, Activity, Star } from 'lucide-react';

interface StatsContent {
  experience: string;
  experienceLabel: string;
  goldMedalist: string;
  goldMedalistLabel: string;
  fellow: string;
  fellowLabel: string;
  patientRating?: string;
}

interface StatsProps {
  content: StatsContent;
}

export default function Stats({ content }: StatsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [count1, setCount1] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setIsVisible(true);
    });
    const el = document.getElementById('stats-section');
    if (el) observer.observe(el);
    return () => { if (el) observer.unobserve(el); };
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const target = parseInt(content.experience) || 10;
    const duration = 2000;
    const start = Date.now();
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / duration, 1);
      setCount1(Math.floor(progress * target));
      if (progress === 1) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [isVisible, content.experience]);

  return (
    <section id="stats-section" className="py-12 md:py-20 bg-primary leading-relaxed text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh-gradient opacity-20 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          <div className="text-center p-4 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-6 bg-primary-light/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Activity className="text-accent" size={32} />
            </div>
            <div className="text-3xl md:text-5xl font-serif font-bold text-white mb-2">
              {isVisible ? count1 : 0}+
            </div>
            <p className="text-gray-300 text-sm font-semibold uppercase tracking-widest">{content.experienceLabel}</p>
          </div>

          <div className="text-center p-4 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-6 bg-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Award className="text-accent" size={32} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-2 leading-tight min-h-[3rem] flex items-center justify-center">
              {content.goldMedalist}
            </h3>
            <p className="text-accent-light text-sm font-semibold uppercase tracking-widest">{content.goldMedalistLabel}</p>
          </div>

          <div className="text-center p-4 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-6 bg-primary-light/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="text-sky-300" size={32} />
            </div>
            <h3 className="text-2xl md:text-4xl font-serif font-bold text-white mb-2">{content.fellow}</h3>
            <p className="text-gray-300 text-sm font-semibold uppercase tracking-widest">{content.fellowLabel}</p>
          </div>

          <div className="text-center p-4 md:p-8 rounded-2xl bg-gradient-to-br from-accent/20 to-primary-light/20 border border-accent/20 backdrop-blur-sm hover:border-accent/40 transition-all duration-300 group">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-6 bg-accent/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Star className="text-accent" size={32} fill="currentColor" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-white mb-2">4.9/5</h3>
            <p className="text-accent-light text-sm font-semibold uppercase tracking-widest">{content.patientRating || 'Patient Rating'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
