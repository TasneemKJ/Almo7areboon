# Battle banner and Journey

This upgrade connects battle decisions to the existing collection and chapter-seal loop. Successful deployments earn12 momentum, real enemy kills earn8, cap100. At60, choose Advance (+20% normal troop attack damage and15% movement) or Hold (25% less damage to troops/gate), for10 simulation seconds. Orders cannot overlap; rejected/paused commands spend nothing. Skills get no offensive bonus. Pause freezes duration, retry/reload clears the order. Existing save schema and quest payouts stay authoritative.

Journey shows the nearest unclaimed victory/kill/deployment milestones, true progress, the current chapter's seals and a next goal. Earned claims reuse once-only Game.dispatch rewards. Ready/results/quests link to Journey; Chronicle and Cards remain the existing progression destinations. Pending result rewards survive navigation.

Presentation preserves the storybook armies/settlements. The new compact banner sits in the command deck; readiness uses a brass frame, and the active order draws bounded aura/chevrons/pennant on the existing shadow plane (maximum24 marks, no additional scene graphics). Reduced motion keeps static identity and truthful countdowns. Short phones scroll the complete shell instead of clipping lower controls.

## Evidence
Source tests/build and DESIGN lint are run per task. The premium static scanner reports31 actionless buttons because it recognizes onclick/@click but not this app's delegated data-command handler; actual main-handler and native browser tests verify those controls. This scanner result is not presented as a clean static pass.

The Battle banner and Journey review workflow runs the production build in Chromium and WebKit:320x568 and390x844 native touch, earned claim, order use/pause,844x390 rotation, full motion, old-save/reload reset, actual stopped-origin offline return with an uncached negative control, and20 repeated battle/order/retreat/retry cycles. Reports and screenshots identify the exact revision. CI/browser evidence is pending until reviewed and this document will be updated with actual results.

This improves opportunities for meaningful choice and discoverable next goals; measured retention, physical iOS/Android acceptance and low-end hardware performance require later player/device evidence. No new backend, purchases, coercive return timer or random reward economy is introduced.
