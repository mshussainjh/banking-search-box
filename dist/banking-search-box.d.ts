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
export interface SSCloseDetail {
}
export interface SSClearDetail {
}
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
declare class BankingSearchBox extends HTMLElement {
    private _searchText;
    private _items;
    private _visibleItems;
    private _selectedFilter;
    private _activeIndex;
    private _isDropdownOpen;
    private _isLoading;
    private _searchDebounce;
    private _announcementTimer;
    private _instanceId;
    private _outsideClickHandler;
    private _onWindowResize;
    private _onWindowScroll;
    private _searchInput;
    private _clearButton;
    private _filterBar;
    private _resultsPanel;
    private _rootWrap;
    private _statusLiveRegion;
    private _urgentLiveRegion;
    private _keyboardHint;
    private _resultNodes;
    static get observedAttributes(): string[];
    constructor();
    connectedCallback(): void;
    disconnectedCallback(): void;
    attributeChangedCallback(name: string, _old: string | null, value: string | null): void;
    setResults(results: BankingSearchItem[] | null | undefined): void;
    clear(): void;
    open(): void;
    close(): void;
    get value(): string;
    private _render;
    private _renderFilters;
    private _buildFilterChip;
    private _renderResultsPanel;
    private _buildResultItem;
    private _renderFooter;
    private _handleSearchInput;
    private _handleKeydown;
    private _handleFocus;
    private _handleOutsideClick;
    private _showPanel;
    private _hidePanel;
    private _positionResultsPanel;
    private _moveActiveItem;
    private _syncActiveDescendant;
    private _commitSelection;
    private _applySelectedFilter;
    private _refreshVisibleItems;
    private _syncClearButton;
    /**
     * Polite live-region announcement.
     * 50ms delay lets the DOM settle so NVDA / JAWS reliably pick it up.
     */
    private _speak;
    private _announceVisibleCount;
    private _groupBySection;
    private _highlightMatch;
    private _escapeText;
    private _iconForType;
    private _iconLabel;
    private _emit;
    private _svgIcon;
}
export { BankingSearchBox };
