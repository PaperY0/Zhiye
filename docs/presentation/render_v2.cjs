const {chromium}=require('C:/Users/16617/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/16617/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const path=require('path');
(async()=>{
const dir=path.join(__dirname,'zhiye-roadshow-v2_ppt169_20261013');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:720}});const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const tiles=[];
for(let i=1;i<=12;i++){
 let name=String(i).padStart(2,'0');await page.goto('file:///'+path.join(dir,'preview',name+'.html').replaceAll('\\','/'));await page.evaluate(()=>document.fonts.ready);
 let png=path.join(dir,'preview',name+'.png');await page.screenshot({path:png});
 tiles.push({input:await sharp(png).resize(640,360).toBuffer(),left:((i-1)%3)*640,top:Math.floor((i-1)/3)*360});
}
await sharp({create:{width:1920,height:1440,channels:3,background:'#e8ede7'}}).composite(tiles).png().toFile(path.join(dir,'preview','overview.png'));
await page.setViewportSize({width:1440,height:1000});await page.goto('file:///'+path.join(dir,'知野-完整路演预览.html').replaceAll('\\','/'));await page.evaluate(()=>document.fonts.ready);
await page.selectOption('#page-select','3');await page.click('#play');await page.waitForFunction(()=>document.querySelector('#status').textContent==='6 / 6 步');await page.waitForTimeout(450);
await page.selectOption('#page-select','9');await page.click('#play');await page.waitForTimeout(150);await page.click('#page-prev');await page.waitForTimeout(500);
await page.click('#reduce');await page.selectOption('#page-select','10');await page.click('#play');await page.waitForFunction(()=>document.querySelector('#status').textContent==='4 / 4 步');
await page.setViewportSize({width:390,height:844});if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Horizontal overflow');
if(errors.length)throw Error(errors.join('\n'));
console.log('PASS: 12 raster pages; playback, navigation, interruption, reduced motion and mobile width');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
