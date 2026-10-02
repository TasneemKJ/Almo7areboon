from pathlib import Path

path = Path('scripts/review-ui-recovery.mjs')
source = path.read_text()
marker = '      const r=item.metrics.gems;'
assert source.count(marker) == 1
addition = '''      await page.locator('[data-command="settings"]').click();
      const help=page.locator('.help-box summary');await help.scrollIntoViewIfNeeded();
      item.metrics.helpTarget=await geometry(help);await shot(page,item,'help-target');
      await help.click();check(await page.locator('.help-box').evaluate(node=>node.open),'help disclosure must open');
      check(item.metrics.helpTarget.width>=44&&item.metrics.helpTarget.height>=44,`help target is ${item.metrics.helpTarget.width}x${item.metrics.helpTarget.height}; expected at least 44x44`);
'''
assert 'item.metrics.helpTarget' not in source
path.write_text(source.replace(marker, addition + marker))
plan = Path('docs/superpowers/plans/2026-10-02-four-ui-recovery-iterations.md')
plan.write_text(plan.read_text() + '\nRuling: The gems control already meets 44px and remains unchanged. Iteration 1 also audits the How to play disclosure. Iterations 2–4 were reproduced on all three Chromium viewports. The first touch-extension workflow stopped at a missing shell heredoc terminator before executing any test or changing source; this standalone script removes that setup error.\n')
