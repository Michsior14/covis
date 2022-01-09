export const settings = {
  dialog: () => cy.get('.mat-dialog-container'),
  fpsToggle: () => settings.dialog().get('.mat-slide-toggle-thumb'),
  openButton: () => cy.get('.covis-controls-buttons > :nth-child(1)'),
  closeButton: () => cy.get('[mat-dialog-close=""]'),
  saveButton: () => cy.get('[cdkfocusinitial=""]'),
};
