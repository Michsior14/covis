import 'jest-preset-angular/setup-jest';

if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: () => void 0 });
}
