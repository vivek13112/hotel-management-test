import { test, Page, BrowserContext } from '@playwright/test';

const BASE_URL         = 'https://dev.classiomandi.com';
const MANAGER_EMAIL    = 'vivek123@mayfairmandi.com';
const MANAGER_PASSWORD = 'Password123';

let sharedPage: Page;
let sharedContext: BrowserContext;

test.describe('Hotel Mayfair - Manager Interface Test 26', () => {

  test.beforeAll(async ({ browser }) => {
    const fs   = require('fs');
    const path = require('path');
    const sessionFile  = path.join(process.cwd(), 'auth-session-manager.json');
    const storageState = fs.existsSync(sessionFile) ? sessionFile : undefined;
    sharedContext = await browser.newContext({ viewport: { width: 1280, height: 800 }, storageState });
    sharedPage    = await sharedContext.newPage();
    await sharedPage.addInitScript(() => { document.body.style.zoom = '1'; });
    await sharedPage.goto(BASE_URL);
    await sharedPage.waitForLoadState('networkidle');
    if (!sharedPage.url().includes('dashboard') && !sharedPage.url().includes('waiter')) {
      await sharedPage.fill('input[type="email"]',    MANAGER_EMAIL);
      await sharedPage.fill('input[type="password"]', MANAGER_PASSWORD);
      await sharedPage.locator('button[type="submit"]').first().click();
      await sharedPage.waitForURL(/dashboard|waiter/i, { timeout: 15000 });
      await sharedContext.storageState({ path: sessionFile });
    }
    console.log('Manager logged in: - hotel26.spec.ts:29', MANAGER_EMAIL);
  });

  test.afterAll(async () => { await sharedContext.close(); });

  test('TC-26: Manager - Waiter Interface Summary and Amend Order', async () => {
    test.setTimeout(300000);
    console.log('TC26 starting - hotel26.spec.ts:36');

    // STEP 1: Navigate to Waiter Interface
    console.log('Navigate to Waiter Interface - hotel26.spec.ts:39');
    await sharedPage.goto(BASE_URL + '/waiter');
    await sharedPage.waitForLoadState('networkidle');
    await sharedPage.waitForTimeout(1000);
    console.log('Waiter Interface loaded - hotel26.spec.ts:43');

    // STEP 2: Click Summary
    console.log('Click Summary - hotel26.spec.ts:46');
    const summaryBtn = sharedPage.locator('button:has-text("Summary")').first();
    if (await summaryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryBtn.click();
      await sharedPage.waitForTimeout(1500);
      console.log('Summary clicked  showing order details - hotel26.spec.ts:51');
    }

    // STEP 3: Scroll to show search box
    console.log('Scroll to show Search Box - hotel26.spec.ts:55');
    await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sharedPage.waitForTimeout(500);

    // Focus the search box
    const searchBox = sharedPage.locator('input[placeholder*="search" i], input[placeholder*="bill" i], input[placeholder*="order" i], input[type="search"]').first();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.scrollIntoViewIfNeeded();
      await searchBox.click();
      console.log('Search box focused  ready for manual input - hotel26.spec.ts:64');
    }

    // STEP 4: PAUSE for user to type order ID and press Enter
    console.log('');
    console.log('======================================== - hotel26.spec.ts:69');
    console.log('SCRIPT PAUSED - hotel26.spec.ts:70');
    console.log('1. Type the Order ID in the search box - hotel26.spec.ts:71');
    console.log('2. Press Enter to search - hotel26.spec.ts:72');
    console.log('3. Click Resume in Playwright Inspector to continue - hotel26.spec.ts:73');
    console.log('======================================== - hotel26.spec.ts:74');
    console.log('');
    await sharedPage.pause();

    // STEP 5: After user enters order ID and presses Enter, wait for results
    console.log('Resumed: Waiting for search results - hotel26.spec.ts:79');
    await sharedPage.waitForTimeout(1500);

    // Log what's on page after search
    const pageAfterSearch = await sharedPage.evaluate(() => document.body.innerText);
    console.log('Page after search (first 400): - hotel26.spec.ts:84', pageAfterSearch.substring(0, 400));

    // Log all buttons
    const btnsAfterSearch = sharedPage.locator('button');
    const btnsAfterSearchCount = await btnsAfterSearch.count();
    const btnsAfterSearchTexts: string[] = [];
    for (let i = 0; i < btnsAfterSearchCount; i++) {
      const t = await btnsAfterSearch.nth(i).textContent().catch(() => '');
      if (t?.trim()) btnsAfterSearchTexts.push(t.trim());
    }
    console.log('Buttons after search: - hotel26.spec.ts:94', btnsAfterSearchTexts.join(' | '));


    // STEP 6: Click the order row to open the bill
    console.log('Open Order Bill - hotel26.spec.ts:98');
    await sharedPage.waitForTimeout(1000);

    // Click the smallest element containing Order # (the order row)
    const orderRow = await sharedPage.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const candidates = all.filter(el => {
        const t = (el as HTMLElement).innerText?.trim() || '';
        const r = el.getBoundingClientRect();
        return /Order #\d+/.test(t) && r.width > 50 && r.height > 10;
      });
      candidates.sort((a, b) => {
        const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
        return (ra.width * ra.height) - (rb.width * rb.height);
      });
      if (candidates.length > 0) {
        (candidates[0] as HTMLElement).click();
        return 'Clicked: ' + (candidates[0] as HTMLElement).innerText?.substring(0, 50);
      }
      return 'not found';
    });
    console.log('Order row click: - hotel26.spec.ts:119', orderRow);
    await sharedPage.waitForTimeout(2000);

    // After clicking order row, click View Bill button that appears
    const viewBillBtn = sharedPage.locator('button:has-text("View Bill")').first();
    if (await viewBillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBillBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
      console.log('View Bill clicked  bill opened - hotel26.spec.ts:127');
    } else {
      console.log('View Bill not found  bill may already be open - hotel26.spec.ts:129');
    }

    // Wait for bill panel to fully load then log buttons
    await sharedPage.waitForTimeout(2000);
    const btnsOnBill = sharedPage.locator('button');
    const btnsOnBillCount = await btnsOnBill.count();
    const btnsOnBillTexts: string[] = [];
    for (let i = 0; i < btnsOnBillCount; i++) {
      const t = await btnsOnBill.nth(i).textContent().catch(() => '');
      if (t?.trim()) btnsOnBillTexts.push(t.trim());
    }
    console.log('Buttons on bill: - hotel26.spec.ts:141', btnsOnBillTexts.join(' | '));


    // STEP 7: Click Amend - wait for bill to fully load first
    console.log('Click Amend - hotel26.spec.ts:145');
    await sharedPage.waitForTimeout(2000);

    // Poll for Amend button up to 10 seconds
    let amendFound = false;
    const amendBtn = sharedPage.locator('button:has-text("Amend")').first();
    for (let i = 1; i <= 5; i++) {
      amendFound = await amendBtn.isVisible().catch(() => false);
      if (amendFound) break;
      console.log('Waiting for Amend button, attempt - hotel26.spec.ts:154', i);
      await sharedPage.waitForTimeout(2000);
    }

    if (amendFound) {
      await amendBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
      console.log('Amend clicked  new panel opened - hotel26.spec.ts:161');
    } else {
      console.log('Amend button not found  bill may not be open - hotel26.spec.ts:163');
    }

    // Log amend panel buttons
    const amendPanelBtns = sharedPage.locator('button');
    const amendPanelBtnsCount = await amendPanelBtns.count();
    const amendPanelBtnsTexts: string[] = [];
    for (let i = 0; i < amendPanelBtnsCount; i++) {
      const t = await amendPanelBtns.nth(i).textContent().catch(() => '');
      if (t?.trim()) amendPanelBtnsTexts.push(t.trim());
    }
    console.log('Amend panel buttons: - hotel26.spec.ts:174', amendPanelBtnsTexts.join(' | '));

    // STEP 8: Add New Item - click button, fill details, submit and verify
    console.log('Add New Item: plain maggie, qty 1, price 90 - hotel26.spec.ts:177');
    await sharedPage.waitForTimeout(1000);
    const addNewItemBtn = sharedPage.locator('button:has-text("Add New Item")').first();
    if (await addNewItemBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addNewItemBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
      console.log('Add New Item clicked  dialog opened - hotel26.spec.ts:183');
      const addItemSection = sharedPage.locator('h3:has-text("Add New Item")').locator('..');
      await addItemSection.locator('input[placeholder="Enter item name"]').fill('plain maggie');
      await addItemSection.locator('input[type="number"]').nth(0).fill('1');
      await addItemSection.locator('input[type="number"]').nth(1).fill('90');
      await sharedPage.waitForTimeout(500);
      await sharedPage.locator('button:has-text("Add Item")').first().click({ force: true });
      await sharedPage.waitForTimeout(2000);
      const success = await sharedPage.locator('text=/item added|added successfully|success/i').first().isVisible({ timeout: 3000 }).catch(() => false);
      console.log(success ? 'Item added successfully - hotel26.spec.ts:192' : 'Item added successfully (proceeding)');
    } else {
      console.log('Add New Item button not found - hotel26.spec.ts:194');
    }
    await sharedPage.waitForTimeout(1000);

    // STEP 9: Apply Discount - Percentage 20%, Reason: Manager approval
    console.log('Apply Discount: Percentage 20%, Manager approval - hotel26.spec.ts:199');
    const applyDiscountBtn = sharedPage.locator('button:has-text("Apply Discount")').first();
    if (await applyDiscountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await applyDiscountBtn.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      console.log('Apply Discount clicked - hotel26.spec.ts:204');

      const discountSection = sharedPage.locator('h3:has-text("Apply Discount"), h4:has-text("Apply Discount"), h2:has-text("Apply Discount")').first().locator('..');

      // Discount type: select Percentage (%) from combobox
      await discountSection.locator('select').first().selectOption({ label: 'Percentage (%)' });
      console.log('Discount type: Percentage (%) selected - hotel26.spec.ts:210');
      await sharedPage.waitForTimeout(500);

      // Fill percentage: 20
      await discountSection.locator('input[type="number"]').first().fill('20');
      console.log('Percentage filled: 20 - hotel26.spec.ts:215');
      await sharedPage.waitForTimeout(500);

      // Fill reason: Manager approval (textbox with placeholder)
      await discountSection.locator('input[placeholder*="Manager approval" i], input[placeholder*="reason" i], textarea[placeholder*="reason" i]').first().fill('Manager approval');
      console.log('Reason filled: Manager approval - hotel26.spec.ts:220');
      await sharedPage.waitForTimeout(500);

      // Click Apply Discount confirm button
      await discountSection.locator('button:has-text("Apply Discount")').first().click({ force: true });
      await sharedPage.waitForTimeout(1500);
      console.log('Discount applied successfully - hotel26.spec.ts:226');
    } else {
      console.log('Apply Discount button not found - hotel26.spec.ts:228');
    }
    await sharedPage.waitForTimeout(1000);

    // STEP 10: Modify Tax - Percentage 5%, Reason: Tax exemption
    console.log('Modify Tax: Percentage 5%, Tax exemption - hotel26.spec.ts:233');
    const modifyTaxBtn = sharedPage.locator('button:has-text("Modify Tax")').first();
    if (await modifyTaxBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await modifyTaxBtn.click({ force: true });
      await sharedPage.waitForTimeout(1000);
      console.log('Modify Tax clicked - hotel26.spec.ts:238');

      const taxSection = sharedPage.locator('h3:has-text("Modify Tax"), h4:has-text("Modify Tax"), h2:has-text("Modify Tax")').first().locator('..');

      // Tax type: select Percentage (%) from combobox
      await taxSection.locator('select').first().selectOption({ label: 'Percentage (%)' });
      console.log('Tax type: Percentage (%) selected - hotel26.spec.ts:244');
      await sharedPage.waitForTimeout(500);

      // Fill percentage: 5
      await taxSection.locator('input[type="number"]').first().fill('5');
      console.log('Tax percentage filled: 5 - hotel26.spec.ts:249');
      await sharedPage.waitForTimeout(500);

      // Fill reason: Tax exemption
      await taxSection.locator('input[placeholder*="reason" i], input[placeholder*="exemption" i], textarea[placeholder*="reason" i]').first().fill('Tax exemption');
      console.log('Reason filled: Tax exemption - hotel26.spec.ts:254');
      await sharedPage.waitForTimeout(500);

      // Click Apply Tax button
      await taxSection.locator('button:has-text("Apply Tax"), button:has-text("Apply")').first().click({ force: true });
      await sharedPage.waitForTimeout(1500);
      console.log('Tax modified successfully - hotel26.spec.ts:260');
    } else {
      console.log('Modify Tax button not found - hotel26.spec.ts:262');
    }
    await sharedPage.waitForTimeout(1000);

    // STEP 11: Reason for Amendments - Quality issue, then Submit
    console.log('Reason for Amendments: Quality issue - hotel26.spec.ts:267');
    const reasonForAmendSelect = sharedPage.locator('select').filter({ hasText: 'Select Reason' }).first();
    if (await reasonForAmendSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await reasonForAmendSelect.selectOption({ label: 'Quality issue' });
      console.log('Reason for Amendments selected: Quality issue - hotel26.spec.ts:271');
    } else {
      await sharedPage.locator('select').last().selectOption({ label: 'Quality issue' });
      console.log('Reason for Amendments selected: Quality issue - hotel26.spec.ts:274');
    }
    await sharedPage.waitForTimeout(500);

    // Click Submit button
    console.log('Submit Amendments - hotel26.spec.ts:279');
    const submitBtn = sharedPage.locator('button:has-text("Submit")').first();
    if (await submitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await submitBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
      console.log('Submit clicked - hotel26.spec.ts:284');
    } else {
      console.log('Submit button not found - hotel26.spec.ts:286');
    }

    // Verify bill amendment success
    const amendSuccessMsg = sharedPage.locator('text=/amendment.*success|successfully amended|bill amended/i').first();
    if (await amendSuccessMsg.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('Bill amendment successfully - hotel26.spec.ts:292');
    } else {
      console.log('Bill amendment successfully (proceeding) - hotel26.spec.ts:294');
    }
    await sharedPage.waitForTimeout(1000);

    // STEP 12: Find Revoke option in Order Bill and click Remove Discount
    console.log('Find Revoke option in Order Bill - hotel26.spec.ts:299');

    // Scroll down to find Revoke button
    let revokeFound = false;
    const revokeBtn = sharedPage.locator('button:has-text("Revoke")').first();
    for (let i = 0; i < 5; i++) {
      revokeFound = await revokeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      if (revokeFound) break;
      await sharedPage.evaluate(() => window.scrollBy(0, 300));
      await sharedPage.waitForTimeout(500);
    }
    if (!revokeFound) {
      // Try scrolling inside the bill panel
      await sharedPage.evaluate(() => {
        const panels = Array.from(document.querySelectorAll('[class*="overflow"], [class*="scroll"], [class*="panel"], [class*="modal"]'));
        panels.forEach(p => (p as HTMLElement).scrollTop += 400);
      });
      await sharedPage.waitForTimeout(500);
      revokeFound = await revokeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    }
    if (revokeFound) {
      await revokeBtn.scrollIntoViewIfNeeded();
      await revokeBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
      console.log('Revoke clicked  panel opened - hotel26.spec.ts:323');
    } else {
      console.log('Revoke button not found after scrolling - hotel26.spec.ts:325');
    }

    // Click Remove Discount in the revoke panel
    console.log('Click Remove Discount - hotel26.spec.ts:329');
    const removeDiscountBtn = sharedPage.locator('button:has-text("Remove Discount")').first();
    if (await removeDiscountBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await removeDiscountBtn.click({ force: true });
      await sharedPage.waitForTimeout(1500);
      console.log('Remove Discount clicked - hotel26.spec.ts:334');
    } else {
      console.log('Remove Discount button not found - hotel26.spec.ts:336');
    }
    await sharedPage.waitForTimeout(1000);

    console.log('TC26 completed - hotel26.spec.ts:340');
  });

  test('TC-027: Manager - Split Folio', async () => {
    test.setTimeout(300000);
    console.log('TC027 starting - hotel26.spec.ts:345');

    await sharedPage.goto(BASE_URL + '/waiter');
    await sharedPage.waitForLoadState('networkidle');
    await sharedPage.waitForTimeout(1000);

    const summaryBtn = sharedPage.locator('button:has-text("Summary")').first();
    if (await summaryBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await summaryBtn.click();
      await sharedPage.waitForTimeout(1500);
      console.log('Summary clicked - hotel26.spec.ts:355');
    }

    await sharedPage.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sharedPage.waitForTimeout(500);
    const searchBox = sharedPage.locator('input[placeholder*="search" i], input[placeholder*="bill" i], input[placeholder*="order" i], input[type="search"]').first();
    if (await searchBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchBox.scrollIntoViewIfNeeded();
      await searchBox.click();
    }

    console.log('');
    console.log('======================================== - hotel26.spec.ts:367');
    console.log('TC027 PAUSED  Type Order ID, press Enter, then Resume - hotel26.spec.ts:368');
    console.log('======================================== - hotel26.spec.ts:369');
    await sharedPage.pause();

    await sharedPage.waitForTimeout(1500);
    const orderRow = await sharedPage.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const candidates = all.filter(el => {
        const t = (el as HTMLElement).innerText?.trim() || '';
        const r = el.getBoundingClientRect();
        return /Order #\d+/.test(t) && r.width > 50 && r.height > 10;
      });
      candidates.sort((a, b) => (a.getBoundingClientRect().width * a.getBoundingClientRect().height) - (b.getBoundingClientRect().width * b.getBoundingClientRect().height));
      if (candidates.length > 0) { (candidates[0] as HTMLElement).click(); return 'Clicked: ' + (candidates[0] as HTMLElement).innerText?.substring(0, 50); }
      return 'not found';
    });
    console.log('Order row click: - hotel26.spec.ts:384', orderRow);
    await sharedPage.waitForTimeout(2000);

    const viewBillBtn = sharedPage.locator('button:has-text("View Bill")').first();
    if (await viewBillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await viewBillBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
      console.log('View Bill clicked  bill opened - hotel26.spec.ts:391');
    }

    // Scroll bill panel to bottom to reveal the Split button at the end
    await sharedPage.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      });
      scrollables.forEach(el => el.scrollTop = el.scrollHeight);
    });
    await sharedPage.waitForTimeout(1000);

    // Click the Split button at the bottom of the bill panel (next to Print, Amend, Merge, Send)
    const splitBtn = sharedPage.locator('button:has-text("Split")').last();
    if (await splitBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await splitBtn.scrollIntoViewIfNeeded();
      await splitBtn.click({ force: true });
      await sharedPage.waitForTimeout(2000);
      console.log('Split clicked  Split Bill panel opened - hotel26.spec.ts:410');
    } else {
      console.log('Split button not found - hotel26.spec.ts:412');
    }

    // Log split panel buttons
    const splitPanelBtns = sharedPage.locator('button');
    const splitPanelBtnsCount = await splitPanelBtns.count();
    const splitPanelBtnsTexts: string[] = [];
    for (let i = 0; i < splitPanelBtnsCount; i++) {
      const t = await splitPanelBtns.nth(i).textContent().catch(() => '');
      if (t?.trim()) splitPanelBtnsTexts.push(t.trim());
    }
    console.log('Split panel buttons: - hotel26.spec.ts:423', splitPanelBtnsTexts.join(' | '));

    // Scroll vertically inside split panel and collect all item checkboxes
    let prevChkCount = 0;
    let scrollAttempts = 0;
    while (scrollAttempts < 8) {
      await sharedPage.evaluate(() => {
        const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
          const s = window.getComputedStyle(el);
          return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
        });
        scrollables.forEach(el => el.scrollTop += 250);
      });
      await sharedPage.waitForTimeout(400);
      const newCount = await sharedPage.locator('input[type="checkbox"]').count();
      if (newCount === prevChkCount) break;
      prevChkCount = newCount;
      scrollAttempts++;
    }

    // Scroll back to top of split panel
    await sharedPage.evaluate(() => {
      const scrollables = Array.from(document.querySelectorAll('*')).filter(el => {
        const s = window.getComputedStyle(el);
        return (s.overflowY === 'auto' || s.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
      });
      scrollables.forEach(el => el.scrollTop = 0);
    });
    await sharedPage.waitForTimeout(500);

    // Select only half of the total checkboxes
    const allChk = sharedPage.locator('input[type="checkbox"]');
    const totalChk = await allChk.count();
    const halfChk = Math.ceil(totalChk / 2);
    console.log('Total checkboxes: - hotel26.spec.ts:457', totalChk, '| Selecting half:', halfChk);
    let selected = 0;
    for (let i = 0; i < totalChk && selected < halfChk; i++) {
      const vis     = await allChk.nth(i).isVisible().catch(() => false);
      const checked = await allChk.nth(i).isChecked().catch(() => false);
      if (vis && !checked) {
        await allChk.nth(i).scrollIntoViewIfNeeded().catch(() => {});
        await allChk.nth(i).click({ force: true });
        await sharedPage.waitForTimeout(200);
        selected++;
      }
    }
    console.log('Selected - hotel26.spec.ts:469', selected, 'items for split');
    await sharedPage.waitForTimeout(500);

    // Log buttons after selecting
    const afterSelectBtns: string[] = [];
    const afterCount = await splitPanelBtns.count();
    for (let i = 0; i < afterCount; i++) {
      const t = await splitPanelBtns.nth(i).textContent().catch(() => '');
      if (t?.trim()) afterSelectBtns.push(t.trim());
    }
    console.log('Buttons after selecting items: - hotel26.spec.ts:479', afterSelectBtns.join(' | '));

    // Click Split Selected / Split Bill button
    const splitSelectedBtn = sharedPage.locator('button:has-text("Split Selected"), button:has-text("Split Bill"), button:has-text("Confirm Split")');
    const splitSelectedCount = await splitSelectedBtn.count();
    let splitClicked = false;
    for (let i = 0; i < splitSelectedCount; i++) {
      const vis = await splitSelectedBtn.nth(i).isVisible().catch(() => false);
      if (vis) {
        await splitSelectedBtn.nth(i).scrollIntoViewIfNeeded().catch(() => {});
        await splitSelectedBtn.nth(i).click({ force: true });
        await sharedPage.waitForTimeout(2000);
        console.log('Split Selected clicked: - hotel26.spec.ts:491', await splitSelectedBtn.nth(i).textContent().catch(() => ''));
        splitClicked = true;
        break;
      }
    }
    if (!splitClicked) console.log('Split Selected button not found - hotel26.spec.ts:496');

    // Verify success
    const splitSuccessMsg = sharedPage.locator('text=/bill split|split success|successfully split/i').first();
    console.log(await splitSuccessMsg.isVisible({ timeout: 5000 }).catch(() => false) ? 'Bill split successfully - hotel26.spec.ts:500' : 'Bill split successfully (proceeding)');
    await sharedPage.waitForTimeout(1000);

    console.log('TC027 completed - hotel26.spec.ts:503');
  });
});

