import {test,expect} from '@playwright/test';
test('desktop WebGL, controls, consent, and offline reload',async({page,context})=>{
 test.setTimeout(90000); const errors=[];page.on('pageerror',e=>errors.push(e.message));const google=[];page.on('request',r=>{if(r.url().includes('googletagmanager'))google.push(r.url());});
 await page.goto('/');await expect(page.locator('#status')).toBeHidden();await expect(page.locator('#error')).toBeHidden();await expect(page.locator('#clock')).toContainText('KST');
 await page.screenshot({path:'test-results/temple-desktop.png'});
 await page.locator('#time').selectOption('night');await page.waitForTimeout(1100);await page.screenshot({path:'test-results/temple-night.png'});
 await page.locator('#scene').focus();await page.keyboard.down('w');await page.waitForTimeout(150);await page.keyboard.up('w');await page.getByRole('button',{name:'처음 시점'}).click();
 await page.locator('#privacy').click();await expect(page.locator('#consent')).toBeVisible();await page.locator('#reject').click();expect(google).toEqual([]);expect(errors).toEqual([]);
 await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.reload();await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await expect(page.locator('#error')).toBeHidden();await expect(page.locator('#status')).toBeHidden();await context.setOffline(false);
});
test('mobile layout and touch controls fit viewport',async({browser})=>{const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const page=await context.newPage();await page.goto('http://127.0.0.1:4173/');await expect(page.locator('#error')).toBeHidden();await expect(page.locator('.pad')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'test-results/temple-mobile.png'});await context.close();});


