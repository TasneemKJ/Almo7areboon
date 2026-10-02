from pathlib import Path

path = Path('src/main.ts')
source = path.read_text()
line = next(line for line in source.splitlines() if 'layer.hidden=false;layer.innerHTML=' in line)
old = '${id!==\'result\'&&id!==\'session\'?`<button class="close-button" data-command="close" aria-label="Close">${icon(\'close\')}</button>`:\'\'}'
assert old in line
prefix = '''  const dismissButton=`<button class="close-button" data-command="close" aria-label="Close">${icon('close')}</button>`;
  const dismissMarkup=id==='result'||id==='session'?'':id==='chronicle'?dismissButton:`<div class="dialog-dismiss">${dismissButton}</div>`;
'''
path.write_text(source.replace(line, prefix + line.replace(old, '${dismissMarkup}')))
path = Path('src/ui/continuation.css')
source = path.read_text()
marker = '\n/* Keep ordinary dialog dismissal reachable'
assert source.count(marker) == 1
path.write_text(source[:source.index(marker)] + '''
/* A dedicated sticky dismiss header prevents the close button from floating
   over scrolled quest rewards and other content. Storybook keeps its own header. */
.dialog:has(>.dialog-dismiss) { scroll-padding-block-start:58px; }
.dialog-dismiss {
 position:sticky; top:0; height:44px; margin-top:-15px; margin-bottom:12px;
 z-index:3; display:flex; justify-content:flex-end; background:var(--paper);
 border-bottom:1px solid var(--paper-edge);
}
.dialog-dismiss>.close-button { position:static; flex-shrink:0; }
''')
print('Replaced the floating dismiss control with a dedicated sticky header; storybook/results remain unchanged.')
