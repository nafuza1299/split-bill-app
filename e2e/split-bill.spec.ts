import { expect, test, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// Nothing in this app talks to a server, so there is no API to stub — but the
// WhatsApp share opens wa.me for real, and the e2e run must never leave the
// machine. That one URL is fulfilled locally in the test that triggers it.

const RECEIPT_NAME = "Joe's Diner"
const RECEIPT_DATE = '2026-08-23'
// sanitizeFilename() strips the apostrophe and hyphenates the space.
const FILENAME_BASE = 'Joes-Diner-2026-08-23'

/**
 * Writes the persisted store straight into localStorage before the app boots,
 * so tests that aren't about data entry can start on a known receipt. The
 * envelope shape is what createExpiringStorage() reads back (src/lib/cache.ts);
 * the inner { state, version } is zustand's persist format.
 *
 * Fixed ids sidestep the crypto.randomUUID() ids the store hands out, which
 * keeps the assignment map writable from here.
 */
async function seedReceipt(page: Page, overrides: Record<string, unknown> = {}) {
  const state = {
    step: 'people',
    receiptName: RECEIPT_NAME,
    receiptDate: RECEIPT_DATE,
    people: [
      { id: 'alice', name: 'Alice', phone: '81234567890', phoneCountry: 'ID' },
      { id: 'bob', name: 'Bob' },
    ],
    items: [
      { id: 'pizza', name: 'Pizza', quantity: 1, unitPriceCents: 2000 },
      { id: 'salad', name: 'Salad', quantity: 1, unitPriceCents: 1000 },
    ],
    taxCents: 250,
    serviceCents: 100,
    currency: 'USD',
    splitMode: null,
    assignments: {},
    ...overrides,
  }
  await page.addInitScript((value) => {
    // addInitScript re-runs on every navigation, so only seed when there is
    // nothing there — otherwise a reload would clobber what the app just saved.
    if (localStorage.getItem('split-bill-receipt')) return
    localStorage.setItem(
      'split-bill-receipt',
      JSON.stringify({ savedAt: Date.now(), value: { state: value, version: 0 } }),
    )
  }, state)
}

/** The row holding one person's name and their total on the summary step. */
function personRow(page: Page, name: string) {
  return page.getByText(name, { exact: true }).locator('..')
}

/** The whole block for one person: their row plus their itemised breakdown. */
function personBlock(page: Page, name: string) {
  return page.getByText(name, { exact: true }).locator('../..')
}

const next = (page: Page) => page.getByRole('button', { name: 'Next' })

test('walks the whole wizard from an empty receipt to the summary', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Split Bill' })).toBeVisible()

  await page.getByLabel('Receipt name').fill(RECEIPT_NAME)
  await page.getByLabel('Date').fill(RECEIPT_DATE)
  await expect(page.getByLabel('Currency')).toHaveValue('USD')

  // One person via the Add button, one via Enter — both paths reach the store.
  await page.getByPlaceholder('Add a person').fill('Alice')
  await page.getByRole('button', { name: 'Add' }).click()
  await page.getByPlaceholder('Add a person').fill('Bob')
  await page.getByPlaceholder('Add a person').press('Enter')
  await expect(page.getByTitle('Person name', { exact: true })).toHaveCount(2)

  await next(page).click()
  await expect(page.getByText('Receipt details')).toBeVisible()

  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByTitle('Item name').nth(0).fill('Pizza')
  await page.getByTitle('Quantity').nth(0).fill('2')
  await page.getByTitle('Unit price').nth(0).fill('10.00')

  await page.getByRole('button', { name: 'Add item' }).click()
  await page.getByTitle('Item name').nth(1).fill('Salad')
  await page.getByTitle('Unit price').nth(1).fill('10.00')

  await page.getByTitle('Tax').fill('2.50')
  await page.getByTitle('Service charge').fill('1.00')

  await next(page).click()
  await page.getByText('Split evenly').click()
  await next(page).click()

  // 2 x $10.00 + $10.00 = $30.00, plus $2.50 tax and $1.00 service, halved.
  await expect(page.getByText('Summary')).toBeVisible()
  await expect(personRow(page, 'Alice').getByText('$16.75')).toBeVisible()
  await expect(personRow(page, 'Bob').getByText('$16.75')).toBeVisible()
  // The summary's Card.Footer is the page's only <footer>; the receipt card
  // above it prints its own Total, so scope the grand total to the footer.
  await expect(page.getByRole('contentinfo').getByText('$33.50')).toBeVisible()
})

test('blocks Next until the step is valid and says why', async ({ page }) => {
  await seedReceipt(page, { people: [{ id: 'alice', name: 'Alice' }] })
  await page.goto('/')

  await expect(next(page)).toBeDisabled()
  // The disabled button has pointer-events: none, so the tooltip's hover
  // target is the span the Tooltip wraps it in.
  await next(page).locator('..').hover()
  await expect(page.getByRole('tooltip')).toHaveText(
    'Add at least two people with valid, non-duplicate names.',
  )

  await page.getByPlaceholder('Add a person').fill('Bob')
  await page.getByRole('button', { name: 'Add' }).click()
  await expect(next(page)).toBeEnabled()
})

test('assign mode inserts the assignment step and splits by who ordered what', async ({ page }) => {
  await seedReceipt(page, { step: 'mode' })
  await page.goto('/')

  await page.getByText('Assign items').click()
  await next(page).click()

  await expect(page.getByText('Who owes what?')).toBeVisible()
  await page.getByRole('checkbox', { name: 'Alice had Pizza' }).check()
  await page.getByRole('checkbox', { name: 'Bob had Salad' }).check()
  await next(page).click()

  // Alice took the $20 item, Bob the $10 one, so tax and service follow the
  // same 2:1 ratio rather than being halved.
  await expect(personRow(page, 'Alice').getByText('$22.33')).toBeVisible()
  await expect(personRow(page, 'Bob').getByText('$11.17')).toBeVisible()

  await expect(personBlock(page, 'Alice').getByText('Pizza')).toBeVisible()
  await expect(personBlock(page, 'Alice').getByText('Salad')).toHaveCount(0)
  await expect(personBlock(page, 'Bob').getByText('Salad')).toBeVisible()
  await expect(personBlock(page, 'Bob').getByText('Pizza')).toHaveCount(0)
})

test('in-progress work survives a reload', async ({ page }) => {
  await seedReceipt(page)
  await page.goto('/')

  await next(page).click()
  await expect(page.getByText('Receipt details')).toBeVisible()
  await page.getByTitle('Unit price').nth(0).fill('25.00')

  await page.reload()

  // Same step, same edit — the round-trip through the expiring localStorage
  // wrapper only happens in a real browser.
  await expect(page.getByText('Receipt details')).toBeVisible()
  await expect(page.getByTitle('Unit price').nth(0)).toHaveValue('25.00')
  await expect(page.getByTitle('Item name').nth(0)).toHaveValue('Pizza')
})

test('Clear all wipes the receipt only after the confirm is accepted', async ({ page }) => {
  await seedReceipt(page)
  await page.goto('/')
  await expect(page.getByTitle('Person name', { exact: true })).toHaveCount(2)

  page.once('dialog', (dialog) => dialog.dismiss())
  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page.getByTitle('Person name', { exact: true })).toHaveCount(2)

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear all' }).click()
  await expect(page.getByTitle('Person name', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Receipt name')).toHaveValue('')
})

test('exports the summary as a PNG named after the receipt', async ({ page }) => {
  await seedReceipt(page, { step: 'summary', splitMode: 'even' })
  await page.goto('/')
  await expect(page.getByText('Summary')).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export as PNG' }).click()
  expect((await download).suggestedFilename()).toBe(`${FILENAME_BASE}.png`)
})

test('exports the summary as a PDF named after the receipt', async ({ page }) => {
  await seedReceipt(page, { step: 'summary', splitMode: 'even' })
  await page.goto('/')
  await expect(page.getByText('Summary')).toBeVisible()

  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export as PDF' }).click()
  expect((await download).suggestedFilename()).toBe(`${FILENAME_BASE}.pdf`)
})

test("WhatsApp share opens wa.me with the person's number and their share", async ({
  page,
  context,
}) => {
  // Fulfilled locally: the popup must not actually reach WhatsApp.
  await context.route('**/wa.me/**', (route) => route.fulfill({ body: 'stub' }))
  await seedReceipt(page, { step: 'summary', splitMode: 'even' })
  await page.goto('/')

  // Bob has no phone number, so his button stays disabled behind a tooltip.
  await expect(page.getByRole('button', { name: "Share Bob's share via WhatsApp" })).toBeDisabled()

  // The popup is opened with noopener, so wait on the context rather than the
  // opener page.
  const popup = context.waitForEvent('page')
  await page.getByRole('button', { name: "Share Alice's share via WhatsApp" }).click()

  // +62 (Indonesia) prefixed onto her number, and her own share in the body.
  const url = (await popup).url()
  expect(url).toMatch(/^https:\/\/wa\.me\/6281234567890\?text=/)
  expect(decodeURIComponent(url)).toContain('Alice')
})

test('the summary has no detectable WCAG A/AA violations', async ({ page }) => {
  await seedReceipt(page, { step: 'summary', splitMode: 'even' })
  await page.goto('/')
  await expect(page.getByText('Summary')).toBeVisible()

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()

  expect(results.violations).toEqual([])
})
