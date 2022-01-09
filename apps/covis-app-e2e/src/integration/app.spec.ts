import { app } from '../fixtures/app';
import { controlBar } from '../fixtures/controls-bar';
import { settings } from '../fixtures/settings';

describe('covis-app', () => {
  beforeEach(() => cy.visit('/'));

  it('should load the map', () => {
    app.map().should('be.visible');
  });

  it('should open and close the legend', () => {
    app.legend().should('be.visible').click();
    cy.get('.covis-legend-row-wrapper > :nth-child(1)').should('be.visible');
    cy.get('.covis-legend-toggle').click();
    cy.get('.covis-legend-row-wrapper > :nth-child(1)').should(
      'not.be.visible'
    );
  });

  it('should open and close the settings', () => {
    settings.dialog().should('not.exist');
    settings.openButton().click();
    settings.dialog().should('be.visible');

    settings.closeButton().click();
    settings.dialog().should('not.exist');
  });

  it('should toggle fps metrics', () => {
    const toggle = () => {
      settings.openButton().click();
      settings.fpsToggle().click();
      settings.saveButton().click();
    };

    toggle();
    app.stats().should('be.visible');

    toggle();
    app.stats().should('not.be.visible');
  });

  it('should toggle controls bar', () => {
    controlBar.barBody().should('be.visible');

    controlBar.toggle().click();
    controlBar.barBody().should('not.be.visible');

    controlBar.toggle().click();
    controlBar.barBody().should('be.visible');
  });
});
