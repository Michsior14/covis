export const settings = {
  dialog: () => cy.get('.mat-dialog-container'),
  basic: () => cy.get('.settings-basic .mat-expansion-panel-header'),
  advanced: () => cy.get('.settings-advanced .mat-expansion-panel-header'),
  fpsToggle: () => settings.advanced().get('.mat-slide-toggle-thumb'),
  openButton: () => cy.get('.covis-controls-buttons > :nth-child(1)'),
  closeButton: () => cy.get('[mat-dialog-close=""]'),
  saveButton: () => cy.get('[cdkfocusinitial=""]'),
};
