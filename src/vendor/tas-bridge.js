/* tas-bridge.js: the page side of TasKit (ios/) and a future Android shell.
 *
 * A classic script, no imports: inline it into the game's single HTML file before the game's own
 * script. It defines one global function, createTasBridge(options), that returns the bridge.
 *
 *   const gameApp = createTasBridge({ handler: 'mygame', boot: '__mygameAppBoot',
 *                                     defaultProduct: 'fullGame', onUpdate: (bridge, before) => render() });
 *   window.gameApp = gameApp;          // the name in TasGameConfig.bridgeGlobal
 *   if (gameApp.owns('fullGame')) …    // off the app this is always true
 *   gameApp.buy('fullGame');           // the app shows the App Store sheet
 *
 * In the app: iOS posts to window.webkit.messageHandlers[handler] (objects); Android calls
 * window[androidInterface].postMessage(json) (strings). The app owns what was bought: it sets
 * window[boot] before this script runs and calls bridge.update(u) when the store answers.
 * Off the app (the web, a headless test) there is no handler: every post is a no-op and owns()
 * is true, so nothing is gated. Purchases never belong in the save.
 */
(function (root) {
  'use strict';

  function isObject(v) { return !!v && typeof v === 'object'; }

  function createTasBridge(options) {
    const o = options || {};
    const w = o.window || root;
    const handlerName = String(o.handler || 'tas');
    const androidName = String(o.android || (handlerName.charAt(0).toUpperCase() + handlerName.slice(1) + 'Android'));
    const bootName = String(o.boot || ('__' + handlerName + 'AppBoot'));
    const onUpdate = typeof o.onUpdate === 'function' ? o.onUpdate : null;
    const onStatus = typeof o.onStatus === 'function' ? o.onStatus : null;

    const ios = function () { return w.webkit && w.webkit.messageHandlers && w.webkit.messageHandlers[handlerName]; };
    const android = function () { const a = w[androidName]; return a && typeof a.postMessage === 'function' ? a : null; };

    const bridge = {
      inApp: !!(ios() || android()),
      platform: ios() ? 'ios' : (android() ? 'android' : 'web'),
      // Keys are the app's catalog keys (TasGameConfig.catalog).
      owned: {}, prices: {}, price: '', status: '',

      /** Off the app everything is open; in the app only a literal `true` from the store owns. */
      owns(id) { return !this.inApp || this.owned[id] === true; },

      /** Sends {type, data} to the app. A no-op off the app; never throws. */
      post(type, data) {
        if (!this.inApp) return false;
        const msg = { type: String(type), data: data === undefined ? null : data };
        try {
          const h = ios();
          if (h) h.postMessage(msg);
          else android().postMessage(JSON.stringify(msg));
          return true;
        } catch (e) { return false; }
      },

      buy(id) { this.setStatus('buying'); return this.post('buy', { id: String(id || o.defaultProduct || '') }); },
      restore() { this.setStatus('buying'); return this.post('restore'); },
      /** Asks for fresh prices and ownership (a purchase card opened). */
      refresh() { return this.post('price'); },
      /** Opens a page the app knows by name (TasGameConfig.legalPages), e.g. 'terms', 'privacy'. */
      openPage(name) { return this.post('openURL', { page: String(name) }); },
      /** Hands a PNG data URL to the share sheet. */
      share(dataURL) { return this.post('share', { dataURL: String(dataURL) }); },
      /** After a won climax (never a loss or a purchase): the app may ask for a rating, rarely. */
      requestReview() { return this.post('requestReview'); },

      setStatus(s) { this.status = s; if (onStatus) { try { onStatus(this); } catch (e) { /* the game's own */ } } },

      /** Called by the app: {owned:{key:bool}, prices:{key:text}, price?, status?}. A malformed update is ignored. */
      update(u) {
        if (!isObject(u)) return;
        const before = Object.assign({}, this.owned);
        apply(this, u);
        if (onUpdate) { try { onUpdate(this, before); } catch (e) { /* the game's own */ } }
      },
    };

    function apply(b, u) {
      if (isObject(u.owned)) { b.owned = {}; for (const k of Object.keys(u.owned)) b.owned[k] = u.owned[k] === true; }
      if (isObject(u.prices)) { b.prices = {}; for (const k of Object.keys(u.prices)) if (typeof u.prices[k] === 'string') b.prices[k] = u.prices[k]; }
      if (typeof u.price === 'string') b.price = u.price;
      if (typeof u.status === 'string') b.status = u.status;
    }

    // The app's answer from before this script ran; only in the app, so a web page cannot be locked by a stray global.
    if (bridge.inApp && isObject(w[bootName])) {
      const b = w[bootName];
      apply(bridge, { owned: b.owned, prices: b.prices, price: b.price });
    }
    return bridge;
  }

  root.createTasBridge = createTasBridge;
})(typeof window !== 'undefined' ? window : globalThis);
