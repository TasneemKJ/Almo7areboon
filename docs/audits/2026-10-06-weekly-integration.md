# 0.3.13 integration boundary audit

Base: immutable physical-field/Camp/Home source tree 191f81f91a952253a3389dac0df5a29d07dfd897. Incoming: GitHub compare 4878982dc7dcb7a9e0f0b165abce682a3b6452e4...0bd42c400ee55cc965818a12fbbdd2ab1ce29349, two main commits (PR180 and PR181). No remote state was changed.

## Outcomes and invariants

Preserve optional normalized weekly {week, baseSeals, claimed}, Monday-based local week, three new seals and 60 gems, capped wallet, once-per-week claim, reset claim retention and existing profile/save schema. Integrate presentation through actual owners. No art, Camp CSS, economics, extra controls, menus or notices.

## Reproduced gaps and bounded fixes

- Incoming food code uses eight melee costs, despite its changelog saying three. Keep the actual predicate. The real field controller initially discarded the canonical food message through its skill adapter and did not re-ring the waiting recruit. A live-controller test failed, then passed after the adapter returned the physical instruction and the existing recruit ring read the predicate. Threshold, phase, pause, army and wins boundaries are covered. Gate-danger priority stays ahead of this cue.
- Incoming sync admitted fractional week indices, although decodeSave discards them. A real Game test failed then passed after integer admission.
- Incoming Quests sync changed the profile without a fresh ownership check. The actual function test failed then passed after guardAction. Existing showModal already prevented recovery repaint after a failed writer; that protection was characterized and left unchanged.
- Incoming first-win synchronization occurred after seals were awarded. Actual main pre-step plus Game/events tests reproduced zero weekly progress for the first three-seal win after a new week, absent imported state and a reset with an old base. The active pre-step owner now initializes before awarding, without running or mutating on paused/Home frames. Accepted actions synchronize before save; rejected actions preserve profile atomicity.
- Import and reset used the unchanged restoreBackupWithSave transaction. Actual click-handler tests proved the incoming saved replacement had no baseline or a stale baseline; callback preparation now operates on the normalized replacement before its guarded writer commits. Rejected writers leave original game/profile/claim untouched. Reset claim is retained; prestige rebases after the admitted canonical reset.

## Deliberately unchanged

The canonical weekly mechanic tracks the rise in current-timeline seal total, not a lifetime cumulative counter. The first sealed reconciliation retained incoming backward-week behavior. Subsequent characterization proved it could erase a newer claimed marker and permit a second 60-gem award in that same week after three further seals; the approved v2 correction below addresses this reward-integrity blocker. Reward, save-session and receipt owners remain authoritative. The old dense Quests catalogue remains unaccepted simplification debt. No claim of native browser, device, Safari, visual, listening or all-screen acceptance is made.


## V2 reward-integrity correction

Read-only traces against sealed v1 and the incoming-stage source used actual main click/Quests functions and real Game with controlled calendar/seal fixtures. Local day 20003 is week 2858; day 20002 is week 2857. Claiming at three seals changed 100 to 160 gems and retained claimed=true. Opening Quests after rollback to 2857 overwrote the record; returning to 2858 and earning three more seals paid again, reaching 220 gems. An older rejected claim could also replace the current claimed record. A Sunday-ready token clicked Monday paid the expired week once; immediate duplicate did not pay again. Reset did not independently duplicate a retained claim, but could no longer retain a marker already erased by rollback.

Before implementation, eight exact regression groups failed and 129 checks passed: ready pre-Monday token, Quests rollback, ready future/old tokens, import/reset rollback retention, earlier sync retention and rejected-claim mutation. Invalid fraction/NaN, no-progress prior week and failed-writer repeat behavior were characterized without inventing failures.

The approved repair changes only three admission seams: earlier sync is rejected without replacing state; simulation claim checks exact synchronized integer week and reads eligibility without synchronizing; actual UI claim checks the token against the current local week before dispatch. Tests also cover missing/negative/infinite/over-limit weeks, repeated claims, legitimate forward rollover, same-week timeline rebasing, held victory receipts, quota failure and transactional import/reset. Reward values and optional schema are unchanged. Calendar correction backward from a previously advanced week preserves that newer record; no server-clock or broader anti-cheat claim is made.
