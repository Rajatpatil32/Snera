import '@testing-library/jest-dom';

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock IntersectionObserver (used by useReveal hook)
global.IntersectionObserver = class IntersectionObserver {
  constructor(cb) { this.cb = cb; }
  observe(el) {
    // Immediately trigger as "intersecting" in tests
    this.cb([{ isIntersecting: true, target: el }]);
  }
  unobserve() {}
  disconnect() {}
};

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem:    (k)    => store[k] ?? null,
    setItem:    (k, v) => { store[k] = String(v); },
    removeItem: (k)    => { delete store[k]; },
    clear:      ()     => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
