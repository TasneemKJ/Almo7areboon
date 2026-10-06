# Physical Camp Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace the ready preparation dashboard with four actual illustrated places, deliberate Battle/Home, and canonical local food/gate/recruit preparation without starting play or losing advanced access.

**Architecture:** A ready-only presentation owner selects a dedicated DOM scene made from the existing chapter landscape, shelter and character art with a small authored storehouse/journal illustration module. Pure Camp templates read canonical Game status; main routes explicit actions through its existing session guard and dispatch. Focus uses the existing isolated modal, while retained advanced screens have an explicit return origin and remain unaccepted simplicity debt.

**Tech Stack:** Existing TypeScript, native semantic DOM, CSS, Vite and node:test; no dependency or save-format changes.

**Spec:** `game-evidence/almo-simple-opening/camp-design/2026-10-06-camp-transformation.md` and `access-and-verification.md` (parent approval plus latest corrections supersede proposal status). Input: immutable `game-checkouts/Almo-flat-preferences-v2-frozen`, official source 53f7bf91db2589e5590c890636c51e5f972b0269, parent baseline 1,154 tests/477,144 engine-inclusive gzip JS bytes. Work only in `game-checkouts/Almo-physical-camp-work`.

## Global Constraints
- Local only. No browser/server, GitHub writes, new cloud tasks, input-directory edits, dependency changes or ingestion of newer main.
- Default Camp has exactly 2 UI buttons and 4 separately counted genuine physical targets. Each newly focused Camp surface has at most 3 UI buttons including Back. Company focus has 3 separately counted real troop figures.
- Preserve all canonical costs, unlocks, food/rate/base effects, Start/played, held receipts, manual/menu pause, session ownership, save formats and existing optional marks/grace/damage recap/preferences.
- No claim, spend, unlock, spawn, wave, food accrual or simulation time from opening/closing Camp or a focus. Only deliberate Battle starts play.
- Hide and inert the old resources/deployment/upgrades/nav/tools behind Camp; never use a running or paused field as Camp.
- 44px native controls; provisionally 56px station footprint, shared illustration/hit wrapper, visible names, keyboard focus and intrinsic footer/notice layout. No fixed-navigation overlap like the old 27917fe paused-state 320px failure image, which was viewed and is not evidence of current ready Camp.
- Existing advanced leaves remain reachable, listed and explicitly not accepted as simple. No binary chapter/route maze; future travel uses a genuine illustrated map. Future cards use a quantity field/cost preview, not bundle menus. Future quests use read-only records with selected Claim/Back. None is silently implemented in this slice.
- Exact final full suite and build; total gzip JavaScript including engines ≤512,000 bytes. Native acceptance remains blocked, never substituted with source counts.

## Review Focus
1. Late all-six-age wallets and cap levels: exact cost, shortfall and before/after values, no action from rendering.
2. Session conflict immediately before commit or during persistence: recovery wins; no stale focus repaint or duplicate action.
3. Terminal/held expedition entry and advanced-leaf return: receipt remains owner; Camp cannot falsely mount on terminal phase.
4. Keyboard/synthetic old controls and repeated Battle: hidden old owners cannot dispatch; Space cannot bypass deliberate Camp Battle.
5. Insufficient height/200% text/temporary notice: intrinsic controls stay in flow; scroll belongs to focus/scene fallback, target footprints never shrink.

## Files and responsibilities
- Create `src/ui/camp-screen.ts`: pure root, station, recruit, and journal-focus templates; canonical status/cost/presentation names, no dispatch or writes.
- Create `src/ui/camp-owner.ts`: transient ready/root/focus/advanced ownership and return-target admission helpers; no saved fields.
- Create `src/view/camp-illustrations.ts`: small original paper/brass/stone storehouse and journal objects; reuse `storybookArt` shelter, `chapterLandscape`, and actual `unitPortrait` assets. No stock menu icons standing in for places.
- Create `src/ui/camp.css`: dedicated intrinsic-height scene/footer/notice, four spatial targets, focused figures and small-height/text fallback; no legacy deck below scene.
- Modify `src/main.ts`: mount/sync owner, session-safe local dispatch, focus return, Camp-only Battle, explicit legacy-leaf handoff. Retain existing field/receipt implementations.
- Modify `src/ui/world-play.css` only where old Camp display rules conflict; `src/ui/journey-screen.ts` only if necessary to give its retained advanced leaf an explicit chapter/access path. Prefer no template changes there.
- Modify `tests/main-integration.test.ts`: expose real Camp wiring to existing harness, canonical transitions, adversarial session and input paths.
- Create `tests/camp-screen.test.ts`, `tests/camp-owner.test.ts`, `tests/camp-layout.test.ts`: template counts and values, read-only ownership, CSS/geometry contracts (not native claims).
- Modify `DESIGN.md`, `UX-CONTRACT.md`, `TODO.md`; add `docs/audits/2026-10-06-physical-camp.md` carrying approved IDEAL/5Ws/20 ideas, accepted scope, retained debt and unrun native matrix.

## Task 1: Establish ready Camp ownership and physical root
**Interfaces:** `canOwnCamp(profile: Readonly<Profile>, state: Readonly<BattleState>): boolean`; transient `CampOwner = {kind:'root'} | {kind:'focus', focus:CampFocus, returnTarget:CampStation} | {kind:'advanced', returnTarget:CampStation} | null`. `campRootHtml(profile:Readonly<Profile>):string`; `CampStation='storehouse'|'gate'|'company'|'journal'`.
- [ ] Write failing tests: ready without pending receipt admits; running/lost/won or pending receipt rejects; root has Battle/Home + exactly four named station targets; existing chapter/art follows army age, destination follows enemy age; opens leave deep-cloned profile unchanged.
- [ ] Run focused tests and retain RED output.
- [ ] Add root/owner/illustration modules and CSS; wire dedicated `camp-view`, using existing field mode only for presentation. Root is a single illustrated spatial scene, not a grid of navigation cards. Same native wrapper owns each art object's footprint and label. Storehouse accepted level appears as real provision stacks; gate uses authored shelter and repair bracing; company uses actual named troop art, including waiting locked visitors; journal is a book on a low work table.
- [ ] Wire ready entry and canonical-ready continuation to Camp, while Home Play retains its deliberate Start behavior. Remove old Camp chrome from input and visual ownership. Camp footer reserves required notice height; short landscape uses a narrow action rail.
- [ ] Run tests green; update intent docs. Do not commit or publish.

## Task 2: Local canonical food/gate/recruit preparation
**Interfaces:** `CampFocus = CampStation | {recruit:UnitKind}`; `campFocusHtml(game:Game, focus:CampFocus):string`; pure `campActionFromData(data:DOMStringMap):Action|null` only maps exact focus commands. Main checks focus ownership and canonical status at action time.
- [ ] Write failing tests across all six ages for food/base cost−1/exact/+1 and max level; fresh food50→0 wallet, rate .80→.94, next71; gate40→0 wallet/max180→252; recruit unlock 150/400×8^age and battle food separate; already-unlocked recruit has no deploy command. Opening all focuses mutates no profile, RNG or battle state.
- [ ] Test restored oven/workshop preparation toggles bread/repairs/None through `chronicle-preparation`, exclusive effects and no fee; do not offer unavailable restoration actions. Local Camp is ready-only; retained receipt-origin Chronicle keeps its existing semantics.
- [ ] Run RED. Implement focuses with source-derived `upgradeStatus`, `foodRate`, `unlockCost`, `ERAS`, `preparationAvailable` and role descriptions. Costs/wallet/shortfall are static text; disabled choices count. Food/gate each 2 controls, restored preparation adds one. Recruit focus unlock+Back or Back only; company focus Evolution/Storybook decisions/Back + 3 genuine troop targets and passive skill reference with current captain replacement. No obsolete above-army skill guidance.
- [ ] Bind guarded one-dispatch actions; re-read live status; accepted purchase updates local depiction/value in place; rejected/conflict input never shows success. Restore same action focus after refresh or Back if action disappears.
- [ ] Run focused tests green and inspect diff.

## Task 3: Access and focus handoffs without claiming advanced-leaf simplicity
**Access map:** Camp storehouse→food/bread; gate→base/repairs; company→real recruit→unlock/role; company Evolution→existing Evolution/legacy/prestige route; company Company→existing Chronicle captain/tale/restoration/expedition; journal→Choose battle / Company journal / Back (3). Choose battle opens existing chapter picker; Company journal opens existing Journey with its existing Cards, Chronicle and Quests paths. These old leaves retain their dense markup and are documented as unaccepted. This intentionally keeps the bounded Camp work separate from the approved future-map/record/quantity-field redesigns; it does not call those leaves solved.
- [ ] Write failing integration tests for each pointer route, Back/Escape return, preserved terminal entry refusal and held receipt; root and field remain inert behind focuses; advanced secondary-screen close returns to the originating station, not old bottom nav.
- [ ] Test hidden legacy Camp controls (start/spawn/skill/order/unlock/tab) do not bypass current owner; synthetic activation and rapid repeated Battle dispatch Start once; keyboard Space on Camp does not begin battle; native Enter/Space on its Battle button remains ordinary button activation.
- [ ] Test session loss before action and during save, temporary zero writes, unsupported session no mutation; focus-opening does not persist, while canonical commits keep existing persistence.
- [ ] Run RED. Route advanced leaves through explicit Camp-origin context and isolated owners; keep receipt-origin paths unchanged. Use same modal isolation/tap guard, no auto Close on Camp focuses, return-target fallback to actual station/Battle only if visible.
- [ ] Run focused tests green. Preserve complete source action map including chapters, cards, all quests/daily, story routes, expedition abandon/provision, evolution/legacy/captain/tales and read-only statistics.

## Task 4: Exact local verification and immutable handoff
- [ ] Run `npm test` and capture full exit/totals. Run `npm run build` and preserve engine-inclusive gzip result; independently enumerate/gzip every dist JavaScript file. No changing the budget.
- [ ] Independently review changed code against costs, receipts, save ownership, click isolation, focus restoration and the control inventory. Fix within scope with regression tests; rerun full affected evidence after final changes.
- [ ] Freeze a separate immutable full source candidate, produce a narrow patch against the frozen input, and save source-file SHA-256/payload manifest and tests/build logs outside the repo under `game-evidence/almo-simple-opening/physical-camp`.
- [ ] Native matrix remains NOT RUN due to denied browser/server: 320×568, 360×640, 390×844, 412×915 and 844×390 touch/mobile DPR2/3, 4× CPU; 1280×800 desktop; all station/cost/preparation/locked/advanced return and save warnings; 200% root text; Tab/Shift-Tab/Enter/Escape; root/focus/receipt rotation and background; center/four-corner topmost hit tests ≥44px; reduced-motion and listening. Native rendering, visual polish, touch geometry, physical-device/Safari and audio acceptance are not claimed.

## Self-review / explicit boundary for approval
The four physical places, local actions and ready ownership are complete plan coverage. Advanced leaves are retained and reachable, not redesigned. The proposed journal handoff uses Choose battle / Company journal / Back so arbitrary chapter access remains shallow (2 taps to old picker); its existing Journey/Chronicle leaves remain dense and unaccepted. New Camp station art is a small authored SVG composition alongside existing chapter shelters/troops, with native geometry unverified until browser permission. These are the two staging decisions for parent review before product edits.
