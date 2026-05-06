import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.09 }
    );

    const targets = document.querySelectorAll('.reveal:not(.in)');
    targets.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  });
}
