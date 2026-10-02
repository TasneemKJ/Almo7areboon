"""Diagnostic-branch patch runner. Each replacement asserts the reviewed pre-fix source."""
from pathlib import Path

path = Path('src/main.ts')
source = path.read_text()
changes = [
    ("let savedWarning=false,pendingImport:Profile|null=null;", "let savedWarning=false,pendingImport:Profile|null=null;\n// Each file selection owns its asynchronous completion, even before a dialog changes.\nlet importRequest=0;"),
    ("  if(input.id!=='import-save')return;\n  if(session.status!=='active'||!guardAction())return;", "  if(input.id!=='import-save')return;\n  const request=++importRequest;\n  if(session.status!=='active'||!guardAction())return;"),
    ("if(lifetime.disposed||version!==modalVersion||modal!=='settings'||session.status!=='active'||!guardAction())return;", "if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='settings'||session.status!=='active'||!guardAction())return;"),
    ("  }catch{toast('The selected file could not be read. Your current game was not changed.');}", "  }catch{\n    if(request!==importRequest||lifetime.disposed||version!==modalVersion||modal!=='settings'||session.status!=='active'||!guardAction())return;\n    input.value='';\n    toast('The selected file could not be read. Your current game was not changed.');\n  }"),
    ('    if(focusBefore?.isConnected&&!focusBefore.hasAttribute(\'disabled\'))focusBefore.focus();\n    else root!.querySelector<HTMLElement>(`[data-tab="${activeTab}"]`)?.focus();', '''    const target=focusBefore;
    if(focusBefore?.isConnected&&!focusBefore.closest('[hidden],[inert]')&&!focusBefore.matches(':disabled')&&focusBefore.getClientRects().length)focusBefore.focus();
    // A restored result often has BODY as its origin. A connected element can also
    // be non-focusable; verify that focus actually moved before accepting it.
    if(!target||document.activeElement!==target||target===document.body||target===document.documentElement)
      root!.querySelector<HTMLElement>(`.bottom-nav [data-tab="${activeTab}"]`)?.focus();'''),
]
for old, new in changes:
    assert source.count(old) == 1, old
    source = source.replace(old, new)
path.write_text(source)
path = Path('src/ui/continuation.css')
addition = '''
/* Keep ordinary dialog dismissal reachable after a long phone-screen scroll.
   Storybook uses its own sticky close treatment; result/recovery sheets have none. */
.dialog:not(.chronicle-dialog):has(>.close-button) { scroll-padding-block-start:58px; }
.dialog:not(.chronicle-dialog)>.close-button {
 position:sticky; top:0; right:auto; float:right; margin:-15px -10px -29px 0;
 z-index:3; background:var(--paper); box-shadow:0 1px 5px #24414b33;
}
.dialog:not(.chronicle-dialog):has(>.close-button)>h2,
.dialog:not(.chronicle-dialog):has(>.close-button)>.eyebrow { padding-right:36px; }
'''
assert addition not in path.read_text()
path.write_text(path.read_text() + addition)
