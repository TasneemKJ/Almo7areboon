from pathlib import Path

path = Path('scripts/qa/browser-driver.mjs')
source = path.read_text()
old = 'cases:[],screens:[],errors:[],browsers:{}'
assert source.count(old) == 1
source = source.replace(old, 'cases:[],screens:[],errors:[],consoleErrors:[],assetFailures:[],browsers:{}')
old = "page.on('pageerror',error=>{report.errors.push({case:current?.id,message:String(error)});});"
assert source.count(old) == 1
addition = """
 page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push({case:current?.id,message:message.text()});});
 page.on('response',response=>{if(/\\/(art|assets)\\//.test(response.url())&&!response.ok())report.assetFailures.push({case:current?.id,status:response.status(),url:response.url()});});"""
source = source.replace(old, old + addition)
old = "report.status=report.failed===0&&report.errors.length===0?'passed':'failed';"
assert source.count(old) == 1
source = source.replace(old, "report.status=report.failed===0&&report.errors.length===0&&report.consoleErrors.length===0&&report.assetFailures.length===0?'passed':'failed';")
path.write_text(source)
