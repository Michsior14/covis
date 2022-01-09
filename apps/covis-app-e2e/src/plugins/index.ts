module.exports = (on: Cypress.PluginEvents) => {
  on(
    'before:browser:launch',
    (browser: Cypress.Browser, options: Cypress.BrowserLaunchOptions) => {
      if (browser.name === 'chromium') {
        options.args = [
          ...options.args.filter((arg) => arg !== '--disable-gpu'),
          '--ignore-gpu-blacklist',
        ];
      }
      return options;
    }
  );
};
