// @ts-check
/* eslint-disable no-case-declarations */

import {BasePlugin} from 'appium/plugin';
import B from 'bluebird';

class FakePlugin extends BasePlugin {
  fakeThing = 'PLUGIN_FAKE_THING';

  static newMethodMap = /** @type {const} */ ({
    '/session/:sessionId/fake_data': {
      GET: {command: 'getFakeSessionData', neverProxy: true},
      POST: {
        command: 'setFakeSessionData',
        payloadParams: {required: ['data']},
        neverProxy: true,
      },
    },
    '/session/:sessionId/fakepluginargs': {
      GET: {command: 'getFakePluginArgs', neverProxy: true},
    },
  });

  /** @type {string?} */
  static _unexpectedData = null;

  static executeMethodMap = /** @type {const} */ ({
    // this execute method overrides fake-drivers fake: getThing, for testing
    'fake: getThing': {
      command: 'getFakeThing',
    },

    // this is a totally new execute method
    'fake: plugMeIn': {
      command: 'plugMeIn',
      params: {required: ['socket']},
    },
  });

  static fakeRoute(req, res) {
    res.send(JSON.stringify({fake: 'fakeResponse'}));
  }

  static unexpectedData(req, res) {
    res.send(JSON.stringify(FakePlugin._unexpectedData));
    FakePlugin._unexpectedData = null;
  }

  // eslint-disable-next-line no-unused-vars,require-await
  static async updateServer(expressApp, httpServer, cliArgs) {
    expressApp.all('/fake', FakePlugin.fakeRoute);
    expressApp.all('/unexpected', FakePlugin.unexpectedData);
    expressApp.all('/cliArgs', (req, res) => {
      res.send(JSON.stringify(cliArgs));
    });
  }

  async getFakeThing() {
    await B.delay(1);
    return this.fakeThing;
  }

  async plugMeIn(next, driver, /** @type {string} */ socket) {
    await B.delay(1);
    return `Plugged in to ${socket}`;
  }

  async getFakePluginArgs() {
    await B.delay(1);
    return this.cliArgs;
  }

  async getPageSource(next, driver, ...args) {
    await B.delay(10);
    return `<Fake>${JSON.stringify(args)}</Fake>`;
  }

  async findElement(next, driver, ...args) {
    this.logger.info(`Before findElement is run with args ${JSON.stringify(args)}`);
    const originalRes = await next();
    this.logger.info(`After findElement is run`);
    originalRes.fake = true;
    return originalRes;
  }

  async getFakeSessionData(next, driver) {
    await B.delay(1);
    return driver.fakeSessionData || null;
  }

  async setFakeSessionData(next, driver, ...args) {
    await B.delay(1);
    driver.fakeSessionData = args[0];
    return null;
  }

  async getWindowHandle(next) {
    const handle = await next();
    return `<<${handle}>>`;
  }

  // eslint-disable-next-line require-await
  async onUnexpectedShutdown(driver, cause) {
    FakePlugin._unexpectedData = `Session ended because ${cause}`;
  }

  async execute(next, driver, script, args) {
    return await this.executeMethod(next, driver, script, args);
  }
}

export {FakePlugin};
export default FakePlugin;
