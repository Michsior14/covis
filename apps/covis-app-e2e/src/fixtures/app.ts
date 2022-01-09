export const app = {
  stats: () => cy.get('#covis-stats'),
  map: () => cy.get('.maplibregl-canvas', { timeout: 1000 }),
  legend: () => cy.get('.covis-legend'),
};
