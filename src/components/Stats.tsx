/**
 * "Qualifications & Practice" strip shown below the hero on the homepage.
 *
 * A quiet, factual banner (NMC ethical-advertising guidelines, 2026): verifiable
 * qualifications, registration and procedure counts only — no ratings, no
 * superlatives, no count-up animation. Text comes from en.yaml `stats`.
 *
 * Rendered as static HTML (no `client:*` directive needed — there is no state).
 */

interface StatItem {
  value: string;
  label: string;
}

interface StatsProps {
  content: {
    heading: string;
    items: StatItem[];
  };
}

export default function Stats({ content }: StatsProps) {
  return (
    <section
      id="stats-section"
      aria-labelledby="stats-heading"
      className="py-10 md:py-12 bg-primary text-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="stats-heading"
          className="text-sm font-medium text-white/70 mb-5 md:mb-6"
        >
          {content.heading}
        </h2>
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {content.items.map((item) => (
            <li
              key={item.value}
              className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4"
            >
              <p className="text-lg sm:text-xl md:text-2xl lg:text-xl font-semibold leading-tight text-white">
                {item.value}
              </p>
              <p className="mt-1.5 text-xs sm:text-sm leading-snug text-white/75">
                {item.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
