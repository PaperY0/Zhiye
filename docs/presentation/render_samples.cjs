const { chromium } = require('C:/Users/16617/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('path');
const fs = require('fs');
(async()=>{
 const dir=path.join(__dirname,'zhiye-roadshow_ppt169_20261013/design-samples-v2');
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1.5});
 for(const name of ['01_cover','05_product','10_validation']){
  await page.goto('file:///'+path.join(dir,name+'.html').replaceAll('\\','/'));
  await page.evaluate(()=>document.fonts.ready);
  await page.screenshot({path:path.join(dir,name+'.png')});
  console.log(name+' rendered');
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
