import test, { before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const SAMPLE_ITEMS = [
  { type: 'account', title: 'John Doe — Checking', subtitle: 'ACC-001 · $12,450', badge: 'Active', icon: '🏦' },
  { type: 'account', title: 'Jane Smith — Savings', subtitle: 'ACC-002 · $34,890', badge: 'Active', icon: '🏦' },
  { type: 'transaction', title: 'Wire Transfer to HSBC', subtitle: 'TXN-001 · Mar 24', badge: '-$5,000', icon: '↗️' },
  { type: 'customer', title: 'Acme Corp', subtitle: 'Business client', badge: 'KYC ✓', icon: '🏢' },
];

let dom;

function installDomGlobals(window) {
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.customElements = window.customElements;
  globalThis.HTMLElement = window.HTMLElement;
  globalThis.Node = window.Node;
  globalThis.Event = window.Event;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.KeyboardEvent = window.KeyboardEvent;
  globalThis.MouseEvent = window.MouseEvent;
  globalThis.SVGElement = window.SVGElement;
  globalThis.ShadowRoot = window.ShadowRoot;
  globalThis.PointerEvent = window.PointerEvent || window.MouseEvent;

  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
}

function createComponent(attributes = {}) {
  const element = document.createElement('banking-search-box');
  for (const [name, value] of Object.entries(attributes)) {
    if (value === true) {
      element.setAttribute(name, 'true');
    } else if (value !== false && value != null) {
      element.setAttribute(name, String(value));
    }
  }
  document.body.appendChild(element);
  return element;
}

function getInput(element) {
  return element.shadowRoot.querySelector('input[type="search"]');
}

function getResultsPanel(element) {
  return element.shadowRoot.getElementById(element.shadowRoot.querySelector('[role="listbox"]').id);
}

before(async () => {
  dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  installDomGlobals(dom.window);
  await import('../dist/banking-search-box.js');
});

afterEach(() => {
  document.body.innerHTML = '';
});

test('renders a real custom element with shadow DOM and combobox semantics', () => {
  const element = createComponent();
  const input = getInput(element);
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  assert.ok(element.shadowRoot, 'shadowRoot should exist');
  assert.ok(input, 'search input should render');
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-autocomplete'), 'list');
  assert.ok(input.getAttribute('aria-describedby'));
  assert.equal(panel.getAttribute('aria-busy'), 'false');
});

test('setResults mutates the real DOM and renders options', () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);

  const options = element.shadowRoot.querySelectorAll('[role="option"]');
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  assert.equal(options.length, SAMPLE_ITEMS.length);
  assert.equal(panel.getAttribute('aria-busy'), 'false');
  assert.match(options[0].getAttribute('aria-label') || '', /John Doe/);
});

test('loading attribute updates aria-busy and renders loading state in the real panel', () => {
  const element = createComponent({ loading: 'true' });
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  element.setAttribute('loading', 'true');
  assert.equal(panel.getAttribute('aria-busy'), 'true');
  assert.ok(panel.textContent.includes('Searching'));

  element.setResults(SAMPLE_ITEMS);
  assert.equal(panel.getAttribute('aria-busy'), 'false');
});

test('dispatches ss-search from real input interaction', async () => {
  const element = createComponent({ debounce: 0, loading: 'false' });
  const input = getInput(element);

  const detail = await new Promise((resolve) => {
    element.addEventListener('ss-search', (event) => resolve(event.detail), { once: true });
    input.value = 'john';
    input.dispatchEvent(new window.Event('input', { bubbles: true }));
  });

  assert.deepEqual(detail, { query: 'john', filter: 'all' });
});

test('ArrowDown updates aria-activedescendant on the real input', () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const input = getInput(element);

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

  const activeDescendant = input.getAttribute('aria-activedescendant');
  assert.ok(activeDescendant);
  assert.ok(element.shadowRoot.getElementById(activeDescendant));
});

test('Enter on an active option dispatches ss-select with real detail payload', async () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const input = getInput(element);

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));

  const detail = await new Promise((resolve) => {
    element.addEventListener('ss-select', (event) => resolve(event.detail), { once: true });
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  });

  assert.equal(detail.index, 0);
  assert.equal(detail.item.title, SAMPLE_ITEMS[0].title);
  assert.equal(input.value, SAMPLE_ITEMS[0].title);
});

test('Escape closes the dropdown on the real component', () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const input = getInput(element);
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  input.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.classList.contains('open'), false);
});

test('Tab closes the dropdown and preserves native event flow', () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const input = getInput(element);
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  const tabEvent = new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  const dispatchResult = input.dispatchEvent(tabEvent);

  assert.equal(dispatchResult, true, 'Tab should not be prevented');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(panel.classList.contains('open'), false);
});



test('touch-style selection path selects a result item', async () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const firstOption = element.shadowRoot.querySelector('[role="option"]');
  const input = getInput(element);

  const detailPromise = new Promise((resolve) => {
    element.addEventListener('ss-select', (event) => resolve(event.detail), { once: true });
  });

  if (typeof window.PointerEvent === 'function') {
    firstOption.dispatchEvent(new window.PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch' }));
    firstOption.dispatchEvent(new window.PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }));
  }
  firstOption.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  const detail = await detailPromise;
  assert.equal(detail.index, 0);
  assert.equal(input.value, SAMPLE_ITEMS[0].title);
});

test('clicking outside closes the dropdown', () => {
  const element = createComponent();
  element.setResults(SAMPLE_ITEMS);
  const input = getInput(element);
  const outside = document.createElement('button');
  document.body.appendChild(outside);

  assert.equal(input.getAttribute('aria-expanded'), 'true');

  outside.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

  assert.equal(input.getAttribute('aria-expanded'), 'false');
});

test('setResults accepts empty or null data without throwing', () => {
  const element = createComponent();

  assert.doesNotThrow(() => element.setResults([]));
  assert.doesNotThrow(() => element.setResults(null));

  const options = element.shadowRoot.querySelectorAll('[role="option"]');
  const panel = element.shadowRoot.querySelector('[role="listbox"]');

  assert.equal(options.length, 0);
  assert.equal(panel.getAttribute('aria-busy'), 'false');
});

test('renders filter pills in the real DOM and dispatches ss-filter on click', async () => {
  const element = createComponent({
    'show-filters': 'true',
    filters: JSON.stringify([
      { id: 'account', label: 'Accounts', emoji: '🏦' },
      { id: 'customer', label: 'Customers', emoji: '👤' },
    ]),
  });
  element.setResults(SAMPLE_ITEMS);

  const buttons = element.shadowRoot.querySelectorAll('.filter-pill');
  assert.equal(buttons.length, 3);

  const detail = await new Promise((resolve) => {
    element.addEventListener('ss-filter', (event) => resolve(event.detail), { once: true });
    buttons[1].click();
  });

  assert.deepEqual(detail, { filter: 'account', query: '' });
});
