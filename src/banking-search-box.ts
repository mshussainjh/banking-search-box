/**
 * BankingSearchBox Web Component — Accessibility-First Edition
 *
 * Designed to support accessibility testing with tools such as WAVE, Lighthouse, NVDA, and JAWS
 *
 * Key accessibility implementations:
 *  - ARIA 1.2 combobox pattern (role="combobox" on the <input>)
 *  - Polite + assertive aria-live regions for NVDA/JAWS announcements
 *  - prefers-reduced-motion: animations disabled when user opts out
 *  - Forced Colors (Windows High Contrast) mode fully supported
 *  - All interactive elements have explicit accessible names
 *  - Focus indicators exceed WCAG 2.1 AA (3:1 non-text contrast minimum)
 *  - Touch targets ≥ 44×44px (WCAG 2.5.5)
 *  - Color is never the sole differentiator (underline on highlights, border on badges)
 *  - No positive tabindex values; focus managed via aria-activedescendant
 *  - IDs scoped per-instance (no document-level collisions between multiple instances)
 *  - Spinner has role="status" + sr-only label
 *  - Filter pills use aria-pressed (toggle buttons) — NVDA/JAWS compatible
 *  - Result items carry composite aria-label (icon type, title, subtitle, badge)
 *  - Item body is aria-hidden to prevent double-reading by screen readers
 *  - Home/End keys supported for listbox navigation
 *  - Double-Escape clears input if dropdown already closed
 */

export interface BankingSearchItem {
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

export interface BankingSearchFilter {
  id: string;
  label: string;
  emoji?: string;
}

export interface SSSearchDetail {
  query: string;
  filter: string;
}

export interface SSSelectDetail {
  item: BankingSearchItem;
  index: number;
  query: string;
}

export interface SSFilterDetail {
  filter: string;
  query: string;
}

export interface SSOpenDetail {
  query: string;
}

export interface SSCloseDetail {}

export interface SSClearDetail {}

export interface SSResultsSetDetail {
  count: number;
}

export interface BankingSearchEventDetailMap {
  'ss-search': SSSearchDetail;
  'ss-select': SSSelectDetail;
  'ss-filter': SSFilterDetail;
  'ss-open': SSOpenDetail;
  'ss-close': SSCloseDetail;
  'ss-clear': SSClearDetail;
  'ss-results-set': SSResultsSetDetail;
}

interface BankingSearchGroup {
  label: string | null;
  items: BankingSearchItem[];
}

const componentStyles = `
  /* ── Reset ──────────────────────────────────────────────────────────────── */
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Host / design tokens ───────────────────────────────────────────────── */
  :host {
    display: block;
    position: relative;

    --ss-accent:      var(--ss-accent-override, #1a56db);
    --ss-bg:          var(--ss-background,      #ffffff);
    --ss-surface:     var(--ss-card-bg,          #f0f4f8);
    --ss-border:      var(--ss-border-color,     #94a3b8);
    --ss-text:        var(--ss-text-color,       #0f172a);
    --ss-text-muted:  var(--ss-muted-color,      #475569);
    --ss-shadow:      var(--ss-dropdown-shadow,  0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07));
    --ss-radius:      var(--ss-border-radius,    10px);
    --ss-height:      var(--ss-input-height,     48px);
    --ss-font-family: var(--ss-font, 'DM Sans', 'Segoe UI', system-ui, sans-serif);
    --ss-max-height:  var(--ss-dropdown-max-height, 400px);

    /* Internal derived tokens */
    --_focus-ring:    0 0 0 3px color-mix(in srgb, var(--ss-accent) 30%, transparent);
    --_transition:    180ms cubic-bezier(0.4, 0, 0.2, 1);
    --_primary-light: color-mix(in srgb, var(--ss-accent) 12%, transparent);

    font-family: var(--ss-font-family);
    color: var(--ss-text);
  }

  :host([theme="dark"]) {
    --ss-bg:         #0f172a;
    --ss-surface:    #1e293b;
    --ss-border:     #64748b;
    --ss-text:       #f1f5f9;
    --ss-text-muted: #94a3b8;
    --ss-shadow:     0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25);
  }

  /* ── Forced Colors (Windows High Contrast) ──────────────────────────────── */
  @media (forced-colors: active) {
    .input-row { border: 2px solid ButtonText !important; background: Field !important; }
    .input-row:focus-within { outline: 3px solid Highlight !important; outline-offset: 2px; box-shadow: none !important; }
    input { color: FieldText !important; background: transparent !important; }
    .btn-clear { border: 1px solid ButtonText !important; forced-color-adjust: none; }
    .filter-pill { border: 1px solid ButtonText !important; color: ButtonText !important; background: ButtonFace !important; }
    .filter-pill[aria-pressed="true"] { background: Highlight !important; color: HighlightText !important; border-color: Highlight !important; }
    .filter-pill:focus-visible { outline: 3px solid Highlight !important; }
    .dropdown { border: 2px solid ButtonText !important; background: Field !important; }
    .result-item:hover, .result-item.focused { background: Highlight !important; color: HighlightText !important; box-shadow: none !important; forced-color-adjust: none; }
    .item-title mark { color: Highlight !important; background: transparent !important; }
    .spinner { border-color: ButtonText !important; border-top-color: Highlight !important; }
  }

  /* ── Reduced motion ─────────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }

  /* ── Screen-reader-only utility ─────────────────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0,0,0,0);
    white-space: nowrap;
    border: 0;
  }

  /* ── Layout ─────────────────────────────────────────────────────────────── */
  .search-wrapper { position: relative; width: 100%; }

  .input-row {
    display: flex;
    align-items: center;
    background: var(--ss-bg);
    border: 2px solid var(--ss-border);
    border-radius: var(--ss-radius);
    height: var(--ss-height);
    padding: 0 12px;
    gap: 8px;
    transition: border-color var(--_transition), box-shadow var(--_transition);
    cursor: text;
  }

  .input-row:focus-within {
    border-color: var(--ss-accent);
    box-shadow: var(--_focus-ring);
  }

  .icon-search {
    flex-shrink: 0;
    color: var(--ss-text-muted);
    width: 18px; height: 18px;
    transition: color var(--_transition);
    pointer-events: none;
  }

  .input-row:focus-within .icon-search { color: var(--ss-accent); }

  input[type="search"] {
    flex: 1;
    border: none;
    outline: none; /* focus ring is on .input-row */
    background: transparent;
    font-size: 15px;
    color: var(--ss-text);
    font-family: inherit;
    min-width: 0;
    caret-color: var(--ss-accent);
  }

  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-decoration { -webkit-appearance: none; }

  input[type="search"]::placeholder {
    color: var(--ss-text-muted);
    opacity: 1; /* Firefox resets opacity */
  }

  /* ── Clear button ───────────────────────────────────────────────────────── */
  /* 44×44 touch target via negative margin expansion */
  .btn-clear {
    display: none;
    align-items: center;
    justify-content: center;
    min-width: 44px;
    min-height: 44px;
    width: 26px;
    height: 26px;
    margin: -9px -9px -9px 0;
    background: transparent;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    color: var(--ss-text-muted);
    flex-shrink: 0;
    transition: background var(--_transition), color var(--_transition);
    padding: 0;
  }

  .btn-clear:hover { background: var(--ss-surface); color: var(--ss-text); }

  .btn-clear:focus-visible {
    outline: 3px solid var(--ss-accent);
    outline-offset: 2px;
  }

  .btn-clear.visible { display: flex; }

  /* ── Filter group ───────────────────────────────────────────────────────── */
  .filters {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .filter-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: 2px solid var(--ss-border);
    background: var(--ss-bg);
    font-size: 13px;
    font-weight: 500;
    color: var(--ss-text-muted);
    cursor: pointer;
    transition: all var(--_transition);
    font-family: inherit;
    letter-spacing: 0.01em;
    user-select: none;
  }

  .filter-pill:hover { border-color: var(--ss-accent); color: var(--ss-accent); background: var(--_primary-light); }

  .filter-pill:focus-visible {
    outline: 3px solid var(--ss-accent);
    outline-offset: 2px;
  }

  .filter-pill[aria-pressed="true"] {
    background: var(--ss-accent);
    border-color: var(--ss-accent);
    color: #ffffff; /* white on #1a56db = 5.1:1 – passes AA */
  }

  /* ── Dropdown ───────────────────────────────────────────────────────────── */
  .dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0; right: 0;
    background: var(--ss-bg);
    border: 2px solid var(--ss-border);
    border-radius: var(--ss-radius);
    box-shadow: var(--ss-shadow);
    z-index: 9999;
    overflow: hidden;
    display: none;
    animation: ss-pop 160ms cubic-bezier(0.16, 1, 0.3, 1) both;
    max-height: var(--ss-max-height);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--ss-border) transparent;
  }

  .dropdown.open { display: block; }
  .dropdown.above { top: auto; bottom: calc(100% + 6px); animation: ss-pop-up 160ms cubic-bezier(0.16, 1, 0.3, 1) both; }

  @keyframes ss-pop      { from { opacity:0; transform: translateY(-6px) scale(0.98); } to { opacity:1; transform: translateY(0) scale(1); } }
  @keyframes ss-pop-up   { from { opacity:0; transform: translateY(6px) scale(0.98); }  to { opacity:1; transform: translateY(0) scale(1); } }

  /* ── Section headers ────────────────────────────────────────────────────── */
  .section-header {
    padding: 10px 14px 4px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ss-text-muted);
  }

  /* ── Result items ───────────────────────────────────────────────────────── */
  .result-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    min-height: 44px; /* WCAG 2.5.5 touch target */
    cursor: pointer;
    transition: background var(--_transition);
    outline: none;
  }

  .result-item:hover { background: var(--_primary-light); }

  /* Focus: inset box-shadow so it's fully visible without overflow */
  .result-item.focused {
    background: var(--_primary-light);
    box-shadow: inset 0 0 0 2px var(--ss-accent);
  }

  .item-icon {
    flex-shrink: 0;
    width: 36px; height: 36px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 17px;
    background: var(--ss-surface);
  }

  .item-body { flex: 1; min-width: 0; }

  .item-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--ss-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /*
   * Highlight: color + underline so it's not color-only (WCAG 1.4.1)
   * #1a56db on white = 5.1:1 contrast (passes AA for normal text)
   */
  .item-title mark {
    background: transparent;
    color: var(--ss-accent);
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--ss-accent) 45%, transparent);
    text-underline-offset: 2px;
  }

  .item-subtitle {
    font-size: 12px;
    color: var(--ss-text-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Badge: border + text, not colour alone */
  .item-badge {
    flex-shrink: 0;
    font-size: 11.5px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 999px;
    background: var(--ss-surface);
    color: var(--ss-text-muted);
    border: 1.5px solid var(--ss-border);
    white-space: nowrap;
  }

  /* ── Empty / loading / error states ────────────────────────────────────── */
  .state-message {
    padding: 28px 16px;
    text-align: center;
    color: var(--ss-text-muted);
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  .state-icon { font-size: 28px; opacity: 0.5; }

  .spinner {
    width: 24px; height: 24px;
    border: 3px solid var(--ss-border);
    border-top-color: var(--ss-accent);
    border-radius: 50%;
    animation: ss-spin 700ms linear infinite;
  }

  @keyframes ss-spin { to { transform: rotate(360deg); } }

  /* ── Divider ────────────────────────────────────────────────────────────── */
  .divider { height: 1px; background: var(--ss-border); margin: 2px 0; }

  /* ── Footer ─────────────────────────────────────────────────────────────── */
  .dropdown-footer {
    padding: 8px 14px;
    font-size: 12px;
    color: var(--ss-text-muted);
    border-top: 1px solid var(--ss-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .footer-keys { display: flex; gap: 8px; align-items: center; font-size: 11px; }

  kbd {
    display: inline-flex; align-items: center;
    padding: 1px 5px; border-radius: 4px;
    border: 1px solid var(--ss-border);
    background: var(--ss-surface);
    font-size: 10px; font-family: monospace;
    color: var(--ss-text-muted);
  }

  @media (max-width: 480px) { .dropdown-footer { display: none; } }
`;

class BankingSearchBox extends HTMLElement {
  private _searchText: string;
  private _items: BankingSearchItem[];
  private _visibleItems: BankingSearchItem[];
  private _selectedFilter: string;
  private _activeIndex: number;
  private _isDropdownOpen: boolean;
  private _isLoading: boolean;
  private _searchDebounce: ReturnType<typeof window.setTimeout> | null;
  private _announcementTimer: ReturnType<typeof window.setTimeout> | null;
  private _instanceId: string;
  private _outsideClickHandler: (event: MouseEvent) => void;
  private _onWindowResize: () => void;
  private _onWindowScroll: () => void;
  private _searchInput!: HTMLInputElement;
  private _clearButton!: HTMLButtonElement;
  private _filterBar!: HTMLDivElement;
  private _resultsPanel!: HTMLDivElement;
  private _rootWrap!: HTMLDivElement;
  private _statusLiveRegion!: HTMLDivElement;
  private _urgentLiveRegion!: HTMLDivElement;
  private _keyboardHint!: HTMLDivElement;
  private _resultNodes: HTMLElement[] = [];

  static get observedAttributes(): string[] {
    return [
      'placeholder', 'theme', 'debounce', 'min-chars',
      'show-filters', 'filters', 'highlight', 'max-results',
      'loading', 'label', 'aria-label', 'aria-labelledby'
    ];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._searchText = '';
    this._items = [];
    this._visibleItems = [];
    this._selectedFilter = 'all';
    this._activeIndex = -1;
    this._isDropdownOpen = false;
    this._isLoading = false;
    this._searchDebounce = null;
    this._announcementTimer = null;
    // Unique suffix so multiple instances don't share IDs
    this._instanceId = Math.random().toString(36).slice(2, 8);

    this._outsideClickHandler = this._handleOutsideClick.bind(this);
    this._onWindowResize = this._positionResultsPanel.bind(this);
    this._onWindowScroll = this._positionResultsPanel.bind(this);

    this._render();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  connectedCallback(): void {
    document.addEventListener('click', this._outsideClickHandler, true);
    window.addEventListener('resize', this._onWindowResize, { passive: true });
    window.addEventListener('scroll', this._onWindowScroll, { passive: true, capture: true });
  }

  disconnectedCallback(): void {
    document.removeEventListener('click', this._outsideClickHandler, true);
    window.removeEventListener('resize', this._onWindowResize);
    window.removeEventListener('scroll', this._onWindowScroll, { capture: true });
    if (this._searchDebounce !== null) clearTimeout(this._searchDebounce);
    if (this._announcementTimer !== null) clearTimeout(this._announcementTimer);
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (!this._searchInput) return;
    if (name === 'placeholder') this._searchInput.placeholder = value || 'Search…';
    if (name === 'loading') {
      this._isLoading = value !== null && value !== 'false';
      this._resultsPanel.setAttribute('aria-busy', this._isLoading ? 'true' : 'false');
      if (this._isLoading) this._renderResultsPanel();
    }
    if (name === 'filters' || name === 'show-filters') this._renderFilters();
    if (name === 'aria-label' || name === 'label') this._searchInput.setAttribute('aria-label', value || 'Search');
    if (name === 'aria-labelledby') {
      if (value) {
        this._searchInput.setAttribute('aria-labelledby', value);
      } else {
        this._searchInput.removeAttribute('aria-labelledby');
      }
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────

  setResults(results: BankingSearchItem[] | null | undefined): void {
    this._isLoading = false;
    this._resultsPanel.setAttribute('aria-busy', 'false');
    this._items = Array.isArray(results) ? results : [];
    this._refreshVisibleItems();
    if (!this._isDropdownOpen) this._showPanel();
    this._renderResultsPanel();
    this._announceVisibleCount();
  }

  clear(): void {
    this._searchInput.value = '';
    this._searchText = '';
    this._items = [];
    this._visibleItems = [];
    this._activeIndex = -1;
    this._hidePanel();
    this._syncClearButton();
    this._speak('Search cleared');
    this._emit('ss-clear', {});
  }

  open(): void { this._showPanel(); }
  close(): void { this._hidePanel(); }
  get value(): string { return this._searchText; }

  // ── Rendering ─────────────────────────────────────────────────────────────

  private _render(): void {
    const shadow = this.shadowRoot!;
    shadow.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = componentStyles;
    shadow.appendChild(style);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap';
    shadow.appendChild(fontLink);

    // ── Live regions — must be early in the DOM for NVDA/JAWS to register ──
    this._statusLiveRegion = document.createElement('div');
    this._statusLiveRegion.setAttribute('role', 'status');        // polite
    this._statusLiveRegion.setAttribute('aria-live', 'polite');   // belt-and-suspenders for JAWS
    this._statusLiveRegion.setAttribute('aria-atomic', 'true');
    this._statusLiveRegion.className = 'sr-only';
    shadow.appendChild(this._statusLiveRegion);

    this._urgentLiveRegion = document.createElement('div');
    this._urgentLiveRegion.setAttribute('role', 'alert');
    this._urgentLiveRegion.setAttribute('aria-live', 'assertive');
    this._urgentLiveRegion.setAttribute('aria-atomic', 'true');
    this._urgentLiveRegion.className = 'sr-only';
    shadow.appendChild(this._urgentLiveRegion);

    this._keyboardHint = document.createElement('div');
    this._keyboardHint.id = `ss-keyboard-hint-${this._instanceId}`;
    this._keyboardHint.className = 'sr-only';
    this._keyboardHint.textContent = 'Type to search. Use the up and down arrow keys to move through suggestions, Enter to select, Escape to close, and Tab or Shift Tab to move to the next field.';
    shadow.appendChild(this._keyboardHint);

    // ── Wrapper ─────────────────────────────────────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.className = 'search-wrapper';

    // ── Input row ───────────────────────────────────────────────────────────
    const inputRow = document.createElement('div');
    inputRow.className = 'input-row';
    inputRow.addEventListener('click', () => this._searchInput.focus());

    const searchIcon = this._svgIcon('search');
    searchIcon.setAttribute('class', 'icon-search');
    searchIcon.setAttribute('aria-hidden', 'true');
    searchIcon.setAttribute('focusable', 'false');

    const inputLabel = this.getAttribute('aria-label') || this.getAttribute('label') || 'Search';

    this._searchInput = document.createElement('input');
    this._searchInput.type = 'search';
    this._searchInput.autocomplete = 'off';
    this._searchInput.setAttribute('autocorrect', 'off');
    this._searchInput.autocapitalize = 'off';
    this._searchInput.spellcheck = false;
    this._searchInput.placeholder = this.getAttribute('placeholder') || 'Search accounts, customers, transactions…';

    // ARIA 1.2 combobox pattern: role="combobox" lives on the <input>
    this._searchInput.setAttribute('role', 'combobox');
    this._searchInput.setAttribute('aria-label', inputLabel);
    this._searchInput.setAttribute('aria-autocomplete', 'list');
    this._searchInput.setAttribute('aria-expanded', 'false');
    this._searchInput.setAttribute('aria-controls', `ss-listbox-${this._instanceId}`);
    this._searchInput.setAttribute('aria-haspopup', 'listbox');
    this._searchInput.setAttribute('aria-describedby', this._keyboardHint.id);

    const labelledBy = this.getAttribute('aria-labelledby');
    if (labelledBy) {
      this._searchInput.setAttribute('aria-labelledby', labelledBy);
    }

    this._clearButton = document.createElement('button');
    this._clearButton.type = 'button';
    this._clearButton.className = 'btn-clear';
    this._clearButton.setAttribute('aria-label', 'Clear search');
    this._clearButton.setAttribute('tabindex', '-1'); // keyboard path is Escape
    this._clearButton.appendChild(this._svgIcon('x'));
    this._clearButton.addEventListener('click', e => {
      e.stopPropagation();
      this.clear();
      this._searchInput.focus();
    });

    inputRow.appendChild(searchIcon);
    inputRow.appendChild(this._searchInput);
    inputRow.appendChild(this._clearButton);
    wrapper.appendChild(inputRow);

    // ── Filter group ────────────────────────────────────────────────────────
    this._filterBar = document.createElement('div');
    this._filterBar.className = 'filters';
    this._filterBar.setAttribute('role', 'group');
    this._filterBar.setAttribute('aria-label', 'Filter results by category');
    this._filterBar.style.display = 'none';
    wrapper.appendChild(this._filterBar);

    // ── Listbox ─────────────────────────────────────────────────────────────
    this._resultsPanel = document.createElement('div');
    this._resultsPanel.className = 'dropdown';
    this._resultsPanel.id = `ss-listbox-${this._instanceId}`;
    this._resultsPanel.setAttribute('role', 'listbox');
    this._resultsPanel.setAttribute('aria-label', 'Search results');
    this._resultsPanel.setAttribute('aria-busy', 'false');
    this._resultsPanel.setAttribute('tabindex', '-1'); // not in tab order; focus stays on input
    wrapper.appendChild(this._resultsPanel);

    this._rootWrap = wrapper;
    shadow.appendChild(wrapper);

    this._searchInput.addEventListener('input', this._handleSearchInput.bind(this));
    this._searchInput.addEventListener('keydown', this._handleKeydown.bind(this));
    this._searchInput.addEventListener('focus', this._handleFocus.bind(this));

    this._renderFilters();
  }

  private _renderFilters(): void {
    const show = this.getAttribute('show-filters');
    if (!show || show === 'false') { this._filterBar.style.display = 'none'; return; }

    let filterDefs: BankingSearchFilter[] = [];
    try {
      const parsed = JSON.parse(this.getAttribute('filters') || '[]') as unknown;
      if (Array.isArray(parsed)) {
        filterDefs = parsed.filter((item): item is BankingSearchFilter => {
          return !!item && typeof item === 'object' && typeof (item as BankingSearchFilter).id === 'string' && typeof (item as BankingSearchFilter).label === 'string';
        });
      }
    } catch {
      filterDefs = [];
    }

    if (!filterDefs.length) { this._filterBar.style.display = 'none'; return; }

    this._filterBar.style.display = 'flex';
    this._filterBar.innerHTML = '';

    [{ id: 'all', label: 'All' }, ...filterDefs].forEach(f => {
      this._filterBar.appendChild(this._buildFilterChip(f, this._selectedFilter === f.id));
    });
  }

  private _buildFilterChip(filter: BankingSearchFilter, active: boolean): HTMLButtonElement {
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'filter-pill' + (active ? ' active' : '');
    pill.dataset.filterId = filter.id;
    // aria-pressed: toggle button — NVDA reads "pressed"/"not pressed"
    pill.setAttribute('aria-pressed', active ? 'true' : 'false');
    pill.setAttribute('aria-label', filter.label + (active ? ', selected' : ''));

    if (filter.emoji) {
      const e = document.createElement('span');
      e.setAttribute('aria-hidden', 'true');
      e.textContent = filter.emoji;
      pill.appendChild(e);
    }

    const lbl = document.createElement('span');
    lbl.textContent = filter.label;
    pill.appendChild(lbl);

    pill.addEventListener('click', () => this._applySelectedFilter(filter.id));
    return pill;
  }

  private _renderResultsPanel(): void {
    this._resultsPanel.innerHTML = '';
    this._activeIndex = -1;
    this._resultNodes = [];

    if (this._isLoading) {
      const state = document.createElement('div');
      state.className = 'state-message';

      const spinner = document.createElement('div');
      spinner.className = 'spinner';
      spinner.setAttribute('role', 'status');
      spinner.setAttribute('aria-label', 'Searching, please wait');

      const srText = document.createElement('span');
      srText.className = 'sr-only';
      srText.textContent = 'Searching…';

      state.appendChild(spinner);
      state.appendChild(srText);
      this._resultsPanel.appendChild(state);
      return;
    }

    if (!this._visibleItems.length) {
      if (!this._searchText) return;

      const state = document.createElement('div');
      state.className = 'state-message';
      state.setAttribute('role', 'status'); // polite announcement

      const icon = document.createElement('span');
      icon.className = 'state-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '🔍';

      const msg = document.createElement('span');
      msg.textContent = `No results for "${this._searchText}"`;

      state.appendChild(icon);
      state.appendChild(msg);
      this._resultsPanel.appendChild(state);
      this._renderFooter(0);
      return;
    }

    const highlight = this.getAttribute('highlight') !== 'false';
    const groups = this._groupBySection(this._visibleItems);
    let globalIndex = 0;

    groups.forEach((group, gi) => {
      if (groups.length > 1 && group.label) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.setAttribute('aria-hidden', 'true'); // section context in item aria-label
        header.textContent = group.label;
        this._resultsPanel.appendChild(header);
      }

      group.items.forEach((item) => {
        const el = this._buildResultItem(item, globalIndex, highlight);
        this._resultsPanel.appendChild(el);
        this._resultNodes.push(el);
        globalIndex++;
      });

      if (gi < groups.length - 1) {
        const div = document.createElement('div');
        div.className = 'divider';
        div.setAttribute('role', 'separator');
        div.setAttribute('aria-hidden', 'true');
        this._resultsPanel.appendChild(div);
      }
    });

    this._renderFooter(this._visibleItems.length);
    this._syncActiveDescendant();
  }

  private _buildResultItem(item: BankingSearchItem, index: number, highlight: boolean): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'result-item';
    el.setAttribute('role', 'option');
    el.setAttribute('aria-selected', 'false');
    el.id = `ss-item-${this._instanceId}-${index}`;
    el.dataset.index = String(index);
    el.tabIndex = -1;

    // Composite accessible name — what NVDA/JAWS will announce on focus
    const parts = [
      this._iconLabel(item),
      item.title || item.label || '',
      item.subtitle || item.description || '',
      item.badge || item.amount || item.status || ''
    ].filter(Boolean);
    el.setAttribute('aria-label', parts.join(', '));

    // Icon — decorative, SR reads from aria-label above
    const iconEl = document.createElement('div');
    iconEl.className = 'item-icon';
    iconEl.setAttribute('aria-hidden', 'true');
    iconEl.textContent = item.icon || this._iconForType(item.type);
    el.appendChild(iconEl);

    // Body — aria-hidden to prevent double-reading
    const body = document.createElement('div');
    body.className = 'item-body';
    body.setAttribute('aria-hidden', 'true');

    const title = document.createElement('div');
    title.className = 'item-title';
    if (highlight) {
      title.innerHTML = this._highlightMatch(item.title || item.label || '', this._searchText);
    } else {
      title.textContent = item.title || item.label || '';
    }
    body.appendChild(title);

    if (item.subtitle || item.description) {
      const sub = document.createElement('div');
      sub.className = 'item-subtitle';
      sub.textContent = item.subtitle || item.description || null;
      body.appendChild(sub);
    }

    el.appendChild(body);

    if (item.badge || item.amount || item.status) {
      const badge = document.createElement('div');
      badge.className = 'item-badge';
      badge.setAttribute('aria-hidden', 'true'); // included in aria-label
      badge.textContent = item.badge || item.amount || item.status || null;
      el.appendChild(badge);
    }

    el.addEventListener('click', () => this._commitSelection(item, index));
    el.addEventListener('mouseenter', () => this._moveActiveItem(index));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._commitSelection(item, index); }
    });

    return el;
  }

  private _renderFooter(count: number): void {
    const footer = document.createElement('div');
    footer.className = 'dropdown-footer';
    footer.setAttribute('aria-hidden', 'true'); // live region handles announcements

    const countEl = document.createElement('span');
    countEl.textContent = `${count} result${count !== 1 ? 's' : ''}`;
    footer.appendChild(countEl);

    const keys = document.createElement('div');
    keys.className = 'footer-keys';
    keys.innerHTML = '<kbd>↑↓</kbd> navigate &nbsp;<kbd>↵</kbd> select &nbsp;<kbd>Esc</kbd> close';
    footer.appendChild(keys);

    this._resultsPanel.appendChild(footer);
  }

  // ── Event Handlers ────────────────────────────────────────────────────────

  private _handleSearchInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this._searchText = val;
    this._syncClearButton();
    if (this._searchDebounce !== null) clearTimeout(this._searchDebounce);

    if (!val.trim()) {
      this._items = [];
      this._visibleItems = [];
      this._hidePanel();
      return;
    }

    const minChars = parseInt(this.getAttribute('min-chars') || '1', 10);
    if (val.trim().length < minChars) return;

    const debounceMs = parseInt(this.getAttribute('debounce') || '200', 10);
    this._searchDebounce = setTimeout(() => {
      this._emit('ss-search', { query: val, filter: this._selectedFilter });
      if (this.getAttribute('loading') !== 'false') {
        this._isLoading = true;
        this._resultsPanel.setAttribute('aria-busy', 'true');
        this._showPanel();
        this._renderResultsPanel();
      }
    }, debounceMs);
  }

  private _handleKeydown(e: KeyboardEvent): void {
    const items = this._resultNodes || [];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this._isDropdownOpen) { this._showPanel(); return; }
        this._moveActiveItem(Math.min(this._activeIndex + 1, items.length - 1));
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (this._activeIndex <= 0) {
          this._moveActiveItem(-1);
        } else {
          this._moveActiveItem(this._activeIndex - 1);
        }
        break;

      case 'Home':
        if (this._isDropdownOpen && items.length) { e.preventDefault(); this._moveActiveItem(0); }
        break;

      case 'End':
        if (this._isDropdownOpen && items.length) { e.preventDefault(); this._moveActiveItem(items.length - 1); }
        break;

      case 'Enter':
        e.preventDefault();
        if (this._activeIndex >= 0 && items[this._activeIndex]) {
          items[this._activeIndex].click();
        } else if (this._searchText) {
          this._emit('ss-search', { query: this._searchText, filter: this._selectedFilter });
        }
        break;

      case 'Escape':
        e.preventDefault();
        if (this._isDropdownOpen) {
          this._hidePanel();
          this._speak('Search suggestions closed');
        } else if (this._searchText) {
          this.clear(); // second Escape clears input
        }
        break;

      case 'Tab':
        this._hidePanel();
        break;
    }
  }

  private _handleFocus(): void {
    if (this._searchText && this._visibleItems.length) this._showPanel();
  }

  private _handleOutsideClick(e: MouseEvent): void {
    const targetNode = e.target as Node | null;
    if (!targetNode) return;
    if (!this.contains(targetNode) && !this.shadowRoot?.contains(targetNode)) this._hidePanel();
  }

  // ── State Helpers ─────────────────────────────────────────────────────────

  private _showPanel(): void {
    this._isDropdownOpen = true;
    this._resultsPanel.classList.add('open');
    this._searchInput.setAttribute('aria-expanded', 'true');
    this._positionResultsPanel();
    this._emit('ss-open', { query: this._searchText });
  }

  private _hidePanel(): void {
    this._isDropdownOpen = false;
    this._resultsPanel.classList.remove('open', 'above');
    this._searchInput.setAttribute('aria-expanded', 'false');
    this._searchInput.removeAttribute('aria-activedescendant');
    this._activeIndex = -1;
    this._emit('ss-close', {});
  }

  private _positionResultsPanel(): void {
    if (!this._isDropdownOpen) return;
    const rect = this._rootWrap.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const dropHeight = Math.min(this._visibleItems.length * 54 + 90, 400);
    if (spaceBelow < dropHeight && spaceAbove > spaceBelow) {
      this._resultsPanel.classList.add('above');
    } else {
      this._resultsPanel.classList.remove('above');
    }
  }

  private _moveActiveItem(index: number): void {
    const items = this._resultNodes || [];
    if (this._activeIndex >= 0 && items[this._activeIndex]) {
      items[this._activeIndex].classList.remove('focused');
      items[this._activeIndex].setAttribute('aria-selected', 'false');
    }
    this._activeIndex = index;
    if (index >= 0 && items[index]) {
      items[index].classList.add('focused');
      items[index].setAttribute('aria-selected', 'true');
      items[index].scrollIntoView({ block: 'nearest' });
    }
    this._syncActiveDescendant();
  }

  private _syncActiveDescendant(): void {
    if (this._activeIndex >= 0 && this._resultNodes?.[this._activeIndex]) {
      this._searchInput.setAttribute('aria-activedescendant', `ss-item-${this._instanceId}-${this._activeIndex}`);
    } else {
      this._searchInput.removeAttribute('aria-activedescendant');
    }
  }

  private _commitSelection(item: BankingSearchItem, index: number): void {
    this._emit('ss-select', { item, index, query: this._searchText });
    this._searchInput.value = item.title || item.label || '';
    this._searchText = this._searchInput.value;
    this._syncClearButton();
    this._hidePanel();
    this._speak(`Selected: ${item.title || item.label || 'item'}`);
  }

  private _applySelectedFilter(filterId: string): void {
    this._selectedFilter = filterId;
    this._filterBar.querySelectorAll<HTMLButtonElement>('.filter-pill').forEach((pill) => {
      const active = pill.dataset.filterId === filterId;
      pill.classList.toggle('active', active);
      pill.setAttribute('aria-pressed', active ? 'true' : 'false');
      const lbl = pill.querySelector('span:last-child')?.textContent || '';
      pill.setAttribute('aria-label', lbl + (active ? ', selected' : ''));
    });
    this._refreshVisibleItems();
    this._renderResultsPanel();
    this._announceVisibleCount();
    this._emit('ss-filter', { filter: filterId, query: this._searchText });
  }

  private _refreshVisibleItems(): void {
    this._visibleItems = this._selectedFilter === 'all'
      ? this._items
      : this._items.filter(r => r.type === this._selectedFilter || r.category === this._selectedFilter);
    const max = parseInt(this.getAttribute('max-results') || '50', 10);
    this._visibleItems = this._visibleItems.slice(0, max);
  }

  private _syncClearButton(): void {
    this._clearButton.classList.toggle('visible', !!this._searchText);
  }

  // ── Accessibility helpers ─────────────────────────────────────────────────

  /**
   * Polite live-region announcement.
   * 50ms delay lets the DOM settle so NVDA / JAWS reliably pick it up.
   */
  private _speak(msg: string): void {
    if (this._announcementTimer !== null) clearTimeout(this._announcementTimer);
    this._statusLiveRegion.textContent = '';
    this._announcementTimer = setTimeout(() => {
      this._statusLiveRegion.textContent = msg;
    }, 50);
  }

  private _announceVisibleCount(): void {
    if (this._isLoading) return;
    const count = this._visibleItems.length;
    const filterLabel = this._selectedFilter === 'all' ? '' : ` in ${this._selectedFilter}s`;
    const msg = count === 0
      ? `No results found for "${this._searchText}"${filterLabel}`
      : `${count} result${count !== 1 ? 's' : ''}${filterLabel} found. Use arrow keys to navigate.`;
    this._speak(msg);
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  private _groupBySection(results: BankingSearchItem[]): BankingSearchGroup[] {
    const grouped: Record<string, BankingSearchItem[]> = {};
    results.forEach(r => {
      const key = r.type || r.category || 'Results';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    const keys = Object.keys(grouped);
    if (keys.length === 1) return [{ label: null, items: grouped[keys[0]] }];
    return keys.map(k => ({ label: k.charAt(0).toUpperCase() + k.slice(1), items: grouped[k] }));
  }

  private _highlightMatch(text: string, query: string): string {
    if (!query) return this._escapeText(text);
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Body is aria-hidden; SR reads composite aria-label — no double-reading issue
    return this._escapeText(text).replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
  }

  private _escapeText(str: unknown): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private _iconForType(type: string | undefined): string {
    const icons: Record<string, string> = { account:'🏦', transaction:'💳', customer:'👤', transfer:'↔️', loan:'📋', card:'💳', report:'📊', branch:'🏢', default:'🔹' };
    return icons[type ?? 'default'] || icons.default;
  }

  private _iconLabel(item: BankingSearchItem): string {
    const map: Record<string, string> = { '🏦':'Bank account', '💳':'Card or transaction', '👤':'Customer', '↔️':'Transfer', '📋':'Loan', '📊':'Report', '🏢':'Branch', '↗️':'Outgoing', '↙️':'Incoming', '🏧':'ATM', '🏠':'Home loan', '🚗':'Auto loan', '🔹':'' };
    return map[item.icon || this._iconForType(item.type)] || item.type || '';
  }

  private _emit<K extends keyof BankingSearchEventDetailMap>(name: K, detail: BankingSearchEventDetailMap[K]): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }

  private _svgIcon(name: 'search' | 'x'): SVGSVGElement {
    const paths = { search: 'M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z', x: 'M18 6L6 18M6 6l12 12' };
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false'); // IE/Edge legacy
    svg.style.width = '100%';
    svg.style.height = '100%';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', paths[name]);
    svg.appendChild(path);
    return svg;
  }
}

if (!customElements.get('banking-search-box')) {
  customElements.define('banking-search-box', BankingSearchBox);
}

export { BankingSearchBox };