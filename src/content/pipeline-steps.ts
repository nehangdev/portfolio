/**
 * A hand-written recreation of the test-generation pipeline, run against a fictional shop.
 * These are the five named phases of the real ten. TODO(nehang): add the other five when ready.
 */

export type Artifact =
  | { kind: 'fields'; items: { label: string; value: string }[] }
  | { kind: 'cases'; columns: string[]; rows: string[][] }
  | { kind: 'code'; lang: string; code: string };

export interface PipelineStep {
  title: string;
  summary: string;
  artifactTitle: string;
  artifact: Artifact;
}

export const pipelineText = {
  scenarioLabel: 'The scenario a tester writes',
  scenario:
    'As a signed-in shopper on Demo Shop, when I add a product to my cart, the cart badge in the header shows the new item count, and the cart page lists the product with its price.',
  stepsLabel: 'Pipeline phases',
  prev: 'Previous phase',
  next: 'Next phase',
  stepOf: (i: number, n: number) => `Phase ${i} of ${n} shown`,
  note: 'These are five of the ten phases. Demo Shop and everything in it is made up.',
};

export const pipelineSteps: PipelineStep[] = [
  {
    title: 'Requirement analysis',
    summary:
      'Break the scenario into who, what and the expected results, and flag anything unclear.',
    artifactTitle: 'Structured requirement',
    artifact: {
      kind: 'fields',
      items: [
        { label: 'Actor', value: 'Signed-in shopper' },
        { label: 'Precondition', value: 'Shopper is signed in and the cart is empty' },
        { label: 'Action', value: 'Add one product to the cart from the product list' },
        {
          label: 'Expected',
          value: 'Header badge shows 1. Cart page lists the product with its price',
        },
        {
          label: 'Open question',
          value:
            'Adding the same product twice: badge 2 with one line of quantity 2, or two lines?',
        },
      ],
    },
  },
  {
    title: 'Project mapping',
    summary: 'Find where the scenario lives in the app and in the existing test project.',
    artifactTitle: 'Project map',
    artifact: {
      kind: 'fields',
      items: [
        { label: 'Routes', value: '/products, /cart' },
        { label: 'UI areas', value: 'Product list, header cart badge, cart page' },
        {
          label: 'Test folder',
          value: 'tests/e2e/shop (existing: product-list.spec.ts, checkout.spec.ts)',
        },
        {
          label: 'Conventions',
          value: 'Page objects in tests/pages, fixtures in tests/fixtures, cart tests tagged @cart',
        },
      ],
    },
  },
  {
    title: 'Manual test-case generation',
    summary: 'Write the checks a person would run, before any code.',
    artifactTitle: 'Test cases',
    artifact: {
      kind: 'cases',
      columns: ['ID', 'Steps', 'Expected'],
      rows: [
        ['TC-01', 'Open /products and add “Desk Lamp”', 'Header badge shows 1'],
        ['TC-02', 'Add “Desk Lamp”, then open the cart', 'One line: Desk Lamp, $24.00'],
        ['TC-03', 'Add “Desk Lamp” twice', 'Waiting on the open question from phase 1'],
      ],
    },
  },
  {
    title: 'Page-object and fixture discovery',
    summary:
      'Match each step to page objects and fixtures that already exist, and note what is missing.',
    artifactTitle: 'Reuse plan',
    artifact: {
      kind: 'fields',
      items: [
        {
          label: 'Reuse',
          value: 'ProductListPage (tests/pages/product-list.page.ts): open(), addToCart(name)',
        },
        {
          label: 'Reuse',
          value: 'CartPage (tests/pages/cart.page.ts): open(), lines(), line(name)',
        },
        { label: 'Reuse', value: 'Fixture signedInShopper (tests/fixtures/auth.ts)' },
        { label: 'Add', value: 'Header.cartBadge locator on the existing Header page object' },
      ],
    },
  },
  {
    title: 'Automated script generation',
    summary: 'Write the Playwright tests using only what the previous phase found.',
    artifactTitle: 'tests/e2e/shop/cart.spec.ts',
    artifact: {
      kind: 'code',
      lang: 'typescript',
      code: `import { expect } from '@playwright/test';
import { test } from '../../fixtures/auth';
import { ProductListPage } from '../../pages/product-list.page';
import { CartPage } from '../../pages/cart.page';
import { Header } from '../../pages/header.component';

test.describe('Cart @cart', () => {
  test('TC-01 adding a product updates the cart badge', async ({ signedInShopper: page }) => {
    const products = new ProductListPage(page);
    await products.open();
    await products.addToCart('Desk Lamp');
    await expect(new Header(page).cartBadge).toHaveText('1');
  });

  test('TC-02 the cart lists the product with its price', async ({ signedInShopper: page }) => {
    const products = new ProductListPage(page);
    await products.open();
    await products.addToCart('Desk Lamp');

    const cart = new CartPage(page);
    await cart.open();
    await expect(cart.lines()).toHaveCount(1);
    await expect(cart.line('Desk Lamp')).toContainText('$24.00');
  });
});`,
    },
  },
];
