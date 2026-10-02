from pathlib import Path

path = Path('scripts/qa/mobile-journeys.mjs')
source = path.read_text()
old = "await page.locator('[data-command=\"close\"]').click();"
assert source.count(old) == 1
source = source.replace(old, "await page.getByRole('button',{name:'CANCEL',exact:true}).click();")
# Contexts support touch. Keep the explicit dblclick case unchanged while
# exercising ordinary control activation through Playwright touchscreen taps.
path.write_text(source.replace('.click()', '.tap()'))
path = Path('scripts/qa/mobile-deep.mjs')
path.write_text(path.read_text().replace('.click()', '.tap()'))
path = Path('scripts/qa/browser-driver.mjs')
source = path.read_text()
old = "try{await fn(current);current.status='passed';}"
assert source.count(old) == 1
source = source.replace(old, "try{await fn(current);current.status=current.metrics.limit?'not-supported':'passed';}")
old = "report.failed=report.cases.length-report.passed;"
assert source.count(old) == 1
source = source.replace(old, "report.failed=report.cases.filter(c=>c.status==='failed').length;\n report.unsupported=report.cases.filter(c=>c.status==='not-supported').map(c=>({id:c.id,reason:c.metrics.limit}));")
path.write_text(source)
print('Clarified Cancel target; enabled touchscreen activation; unsupported capabilities are not counted as passes.')
