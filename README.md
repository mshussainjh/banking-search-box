# Banking Search Box

Banking Search Box is a reusable Web Component built with TypeScript.

It renders a search input with a dropdown of matching results and optional filter chips. The component was written as a plain custom element so it can be dropped into a simple HTML page or used inside React, Angular, Vue, or any other frontend app.

## What it supports

- search input with clear action
- dropdown results list
- optional category filters
- keyboard navigation with Arrow keys, Enter, Escape, Tab, and Shift+Tab
- ARIA combobox / listbox semantics
- theme overrides through CSS custom properties
- custom events for parent app integration

## Project structure

```text
src/        TypeScript source
 dist/      compiled JavaScript and type declarations
 demo/      browser demo page
 tests/     DOM-level tests using jsdom
```

## Install and run

```bash
npm install
npm run build
npm test
```

To view the demo locally:

```bash
npm run demo
```

Then open the local URL shown in the terminal.

## Basic usage

```html
<banking-search-box
  placeholder="Search customers, accounts, transactions"
  show-filters="true"
></banking-search-box>

<script type="module">
  import './dist/banking-search-box.js';

  const searchBox = document.querySelector('banking-search-box');

  searchBox.setAttribute('filters', JSON.stringify([
    { id: 'account', label: 'Accounts', emoji: '🏦' },
    { id: 'customer', label: 'Customers', emoji: '👤' },
    { id: 'transaction', label: 'Transactions', emoji: '💳' }
  ]));

  searchBox.addEventListener('ss-search', async (event) => {
    const query = event.detail.query;
    const filter = event.detail.filter;

    searchBox.setAttribute('loading', 'true');

    const results = await Promise.resolve([
      { type: 'account', title: 'John Doe — Checking', subtitle: 'ACC-001 · $12,450', badge: 'Active', icon: '🏦' }
    ]);

    searchBox.setAttribute('loading', 'false');
    searchBox.setResults(results);
  });

  searchBox.addEventListener('ss-select', (event) => {
    console.log('Selected item:', event.detail.item);
  });
</script>
```

## Public API

### Methods

| Method | Description |
|---|---|
| `setResults(results)` | Replaces the current result set. Accepts an array, `null`, or `undefined`. |
| `clear()` | Clears the search input, results, and active state. |
| `open()` | Opens the dropdown. |
| `close()` | Closes the dropdown. |
| `value` | Returns the current search text. |

### Attributes

| Attribute | Description |
|---|---|
| `placeholder` | Placeholder text for the input |
| `label` | Accessible label text |
| `aria-label` | Explicit accessible name |
| `aria-labelledby` | Reference to an external label |
| `theme` | Theme switch, for example `dark` |
| `debounce` | Debounce time in milliseconds before `ss-search` is emitted |
| `min-chars` | Minimum number of characters before search starts |
| `show-filters` | Shows the filter chip row when `true` |
| `filters` | JSON array of filter definitions |
| `highlight` | Enables or disables match highlighting |
| `max-results` | Caps the number of visible results |
| `loading` | Shows the loading state when `true` |

## Result item shape

`setResults()` accepts objects with a flexible shape. These are the supported fields:

```ts
interface BankingSearchItem {
  title?: string;
  label?: string;
  subtitle?: string;
  description?: string;
  type?: string;
  category?: string;
  icon?: string;
  badge?: string;
  amount?: string;
  status?: string;
  [key: string]: unknown;
}
```

In practice, `title` or `label` should be present so the component has something meaningful to display.

## Events

| Event | Detail payload |
|---|---|
| `ss-search` | `{ query, filter }` |
| `ss-select` | `{ item, index, query }` |
| `ss-filter` | `{ filter, query }` |
| `ss-open` | `{ query }` |
| `ss-close` | `{}` |
| `ss-clear` | `{}` |

### Parent integration example

```js
const searchBox = document.querySelector('banking-search-box');

searchBox.addEventListener('ss-search', (event) => {
  console.log('Search requested:', event.detail.query, event.detail.filter);
});

searchBox.addEventListener('ss-select', (event) => {
  console.log('User selected:', event.detail.item);
});

searchBox.addEventListener('ss-filter', (event) => {
  console.log('Filter changed:', event.detail.filter);
});
```

## Accessibility

The component follows the ARIA combobox pattern and was implemented to work well with accessibility testing tools and assistive technology, including WAVE, NVDA, and JAWS.

Supported keyboard actions:

| Key | Action |
|---|---|
| Arrow Down | Move to next result |
| Arrow Up | Move to previous result |
| Enter | Select highlighted item |
| Escape | Close the dropdown |
| Tab | Close the dropdown and move to the next interactive element |
| Shift + Tab | Close the dropdown and move to the previous interactive element |
| Home | Jump to the first result |
| End | Jump to the last result |

The component does not trap focus. Focus remains on the input while navigating suggestions with the arrow keys.

## Styling and theming

The component uses Shadow DOM for style isolation and supports CSS custom properties.

### Common CSS custom properties

| Custom property | Purpose |
|---|---|
| `--ss-accent-override` | Accent color |
| `--ss-background` | Input and dropdown background |
| `--ss-card-bg` | Surface background for badges and icons |
| `--ss-border-color` | Border color |
| `--ss-text-color` | Primary text color |
| `--ss-muted-color` | Secondary text color |
| `--ss-dropdown-shadow` | Dropdown shadow |
| `--ss-border-radius` | Shared border radius |
| `--ss-input-height` | Input height |
| `--ss-dropdown-max-height` | Dropdown max height |
| `--ss-font` | Font family |

## Test coverage

The test suite uses the real custom element in a jsdom environment. Current coverage includes:

- render and shadow DOM structure
- combobox and listbox semantics
- loading state and `aria-busy`
- keyboard navigation
- real `ss-search`, `ss-select`, and `ss-filter` events
- click outside to close
- touch-style selection path
- empty or null result data

## Notes

The implementation stays close to the assignment scope. It uses vanilla Web Components instead of a framework so the component remains portable and easy to embed in different host applications.
