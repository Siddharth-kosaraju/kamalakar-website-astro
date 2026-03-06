import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Globe, MapPin, Clock, Calendar } from 'lucide-react';

interface NavContent {
  home: string;
  about: string;
  education: string;
  services: string;
  blog: string;
  contact: string;
  bookBtn: string;
  emergencyLabel: string;
  location: string;
  hours: string;
  lightMode: string;
  darkMode: string;
}

interface HeaderProps {
  lang: 'en' | 'te';
  content: NavContent;
  appointmentPhone: string;
  currentPage?: 'home' | 'about' | 'services' | 'education' | 'blog' | 'contact';
  currentPath?: string;
}

export default function Header({ lang, content, appointmentPhone, currentPage = 'home', currentPath = '/' }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const prefix = lang === 'te' ? '/te' : '';
  const altLangLabel = lang === 'en' ? 'తెలుగు' : 'English';

  // Build the alternate language URL from the current page path (passed as prop)
  const altLangUrl = lang === 'en'
    ? `/te${currentPath === '/' ? '/' : currentPath}`
    : currentPath.replace(/^\/te/, '') || '/';

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: content.home, href: `${prefix}/`, page: 'home' as const },
    { name: content.about, href: `${prefix}/about/`, page: 'about' as const },
    { name: content.services, href: `${prefix}/services/`, page: 'services' as const },
    { name: content.education, href: `${prefix}/education/`, page: 'education' as const },
    { name: content.blog, href: `${prefix}/blog/`, page: 'blog' as const },
    { name: content.contact, href: `${prefix}/contact/`, page: 'contact' as const },
  ];

  return (
    <header className="fixed w-full z-50 transition-all duration-300">
      {/* Top Bar */}
      <div className="bg-primary-dark text-white/90 py-2 text-xs md:text-sm transition-all duration-300 h-auto opacity-100 min-h-[52px] sm:min-h-0 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Phone size={14} className="text-accent" />
              <span>{content.emergencyLabel}: <a href="tel:9959423566" className="font-bold hover:text-accent transition-colors">99594 23566</a></span>
            </span>
            <span className="hidden md:flex items-center gap-2">
              <MapPin size={14} className="text-accent" />
              <span>{content.location}</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-2">
              <Clock size={14} className="text-accent" />
              <span>{content.hours}</span>
            </span>
            <a
              href={altLangUrl}
              onClick={() => {
                try { localStorage.setItem('lang-preference', lang === 'en' ? 'te' : 'en'); } catch(e) {}
              }}
              className="flex items-center gap-1 min-h-[44px] py-2 px-3 hover:text-accent transition-colors font-medium border-l border-white/20 pl-4"
            >
              <Globe size={14} aria-hidden="true" />
              <span>{altLangLabel}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className={`bg-neutral-50 shadow-md border-b border-gray-200 transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Branding */}
            <a href={`${prefix}/`} className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all duration-300 overflow-hidden bg-white">
                  <img
                    src="/images/logo.svg"
                    alt="Kamalakar Heart Centre Logo"
                    width={48}
                    height={48}
                    loading="eager"
                    decoding="async"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl md:text-2xl font-serif font-bold text-primary leading-none">
                  Dr. Kamalakar
                </span>
                <span className="text-xs font-sans tracking-widest text-secondary font-medium uppercase mt-1">
                  Heart Centre
                </span>
              </div>
            </a>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8">
              <nav className="flex items-center gap-8" aria-label="Main navigation">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`text-sm font-medium tracking-wide hover:text-accent transition-colors relative group py-2 ${
                      currentPage === link.page
                        ? 'text-accent'
                        : 'text-primary'
                    }`}
                  >
                    {link.name}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-300 ${
                      currentPage === link.page ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}></span>
                  </a>
                ))}
              </nav>

              <a
                href={`tel:${appointmentPhone}`}
                className="bg-gold-gradient text-primary-dark px-6 py-2.5 rounded-full font-bold text-sm shadow-md hover:shadow-glow hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              >
                <Calendar size={16} />
                {content.bookBtn}
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-primary hover:bg-gray-100 rounded-lg transition-colors"
              aria-expanded={isOpen}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-controls="mobile-nav"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile Menu */}
      <div
        id="mobile-nav"
        className={`lg:hidden fixed top-0 right-0 h-full w-[80%] max-w-sm bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? undefined : -1}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-end mb-8">
            <button
              type="button"
              tabIndex={isOpen ? undefined : -1}
              onClick={() => setIsOpen(false)}
              className="p-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-500 hover:text-primary transition-colors rounded-lg"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex flex-col gap-6" aria-label="Main navigation">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                tabIndex={isOpen ? undefined : -1}
                onClick={() => setIsOpen(false)}
                className={`text-lg font-medium border-b border-gray-100 pb-4 ${
                  currentPage === link.page
                    ? 'text-accent'
                    : 'text-primary'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <a
              href={`tel:${appointmentPhone}`}
              tabIndex={isOpen ? undefined : -1}
              onClick={() => setIsOpen(false)}
              className="w-full bg-primary text-white py-3 rounded-lg font-bold text-center flex items-center justify-center gap-2 shadow-lg"
            >
              <Calendar size={18} />
              {content.bookBtn}
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
