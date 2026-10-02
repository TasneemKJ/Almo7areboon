from pathlib import Path

path = Path('src/ui/continuation.css')
source = path.read_text()
# The browser's unlocked-profile pass measured these at 32px and 36px.
# The associated label remains the hit target for its native 20px radio.
old = '.legacy-choice label { display:flex; align-items:center; min-height:32px;'
assert source.count(old) == 1
source = source.replace(old, '.legacy-choice label { display:flex; align-items:center; min-height:44px;')
old = '.prestige-reset summary { min-height:36px;'
assert source.count(old) == 1
source = source.replace(old, '.prestige-reset summary { min-height:44px;')
path.write_text(source)
print('Raised measured legacy-choice and reset-disclosure touch targets to 44px without changing progression rules.')
