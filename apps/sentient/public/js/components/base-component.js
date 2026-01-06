/**
 * Base Web Component Class
 * 
 * Provides common functionality for all Sentient Observer components:
 * - Shadow DOM setup with adoptable stylesheets
 * - Template rendering
 * - Event handling utilities
 * - State management
 * - Lifecycle hooks
 */

export class BaseComponent extends HTMLElement {
    constructor() {
        super();
        
        // Create shadow DOM
        this.attachShadow({ mode: 'open' });
        
        // Internal state
        this._state = {};
        this._mounted = false;
        
        // Bound event handlers for cleanup
        this._eventHandlers = new Map();
    }
    
    /**
     * Called when element is added to DOM
     */
    connectedCallback() {
        this._mounted = true;
        
        // Apply styles
        this.applyStyles();
        
        // Render template
        this.render();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Call component-specific initialization
        if (this.onMount) {
            this.onMount();
        }
    }
    
    /**
     * Called when element is removed from DOM
     */
    disconnectedCallback() {
        this._mounted = false;
        
        // Cleanup event handlers
        this.cleanup();
        
        // Call component-specific cleanup
        if (this.onUnmount) {
            this.onUnmount();
        }
    }
    
    /**
     * Observed attributes that trigger attributeChangedCallback
     */
    static get observedAttributes() {
        return [];
    }
    
    /**
     * Called when an observed attribute changes
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue && this._mounted) {
            this.onAttributeChange(name, oldValue, newValue);
            this.render();
        }
    }
    
    /**
     * Override to handle attribute changes
     */
    onAttributeChange(name, oldValue, newValue) {}
    
    /**
     * Get component state
     */
    get state() {
        return this._state;
    }
    
    /**
     * Set component state (triggers re-render)
     */
    setState(newState) {
        const prevState = { ...this._state };
        this._state = { ...this._state, ...newState };
        
        if (this._mounted) {
            this.render();
            if (this.onStateChange) {
                this.onStateChange(prevState, this._state);
            }
        }
    }
    
    /**
     * Apply CSS styles to shadow DOM
     */
    applyStyles() {
        const styles = this.styles();
        if (styles) {
            const styleSheet = new CSSStyleSheet();
            styleSheet.replaceSync(styles);
            this.shadowRoot.adoptedStyleSheets = [styleSheet];
        }
    }
    
    /**
     * Override to provide component styles
     */
    styles() {
        return '';
    }
    
    /**
     * Override to provide component template
     */
    template() {
        return '';
    }
    
    /**
     * Render the component
     */
    render() {
        const content = this.template();
        
        // Preserve existing content if template returns empty
        if (content !== undefined && content !== null) {
            this.shadowRoot.innerHTML = content;
        }
        
        // Re-apply styles after render (for dynamic style updates)
        this.applyStyles();
        
        // Query and cache important elements
        if (this.queryElements) {
            this.queryElements();
        }
        
        // Re-attach event listeners to new elements
        this.setupEventListeners();
    }
    
    /**
     * Override to setup event listeners
     */
    setupEventListeners() {}
    
    /**
     * Add event listener with automatic cleanup
     */
    addHandler(element, event, handler, options) {
        if (!element) return;
        
        const boundHandler = handler.bind(this);
        element.addEventListener(event, boundHandler, options);
        
        // Store for cleanup
        const key = `${event}-${handler.name || 'anonymous'}`;
        this._eventHandlers.set(key, { element, event, handler: boundHandler, options });
        
        return boundHandler;
    }
    
    /**
     * Remove all event handlers
     */
    cleanup() {
        for (const { element, event, handler, options } of this._eventHandlers.values()) {
            element.removeEventListener(event, handler, options);
        }
        this._eventHandlers.clear();
    }
    
    /**
     * Query element in shadow DOM
     */
    $(selector) {
        return this.shadowRoot.querySelector(selector);
    }
    
    /**
     * Query all elements in shadow DOM
     */
    $$(selector) {
        return this.shadowRoot.querySelectorAll(selector);
    }
    
    /**
     * Emit custom event
     */
    emit(eventName, detail = {}, options = {}) {
        const event = new CustomEvent(eventName, {
            bubbles: true,
            composed: true, // Cross shadow DOM boundary
            detail,
            ...options
        });
        this.dispatchEvent(event);
        return event;
    }
    
    /**
     * Escape HTML for safe rendering
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Get attribute with default value
     */
    getAttr(name, defaultValue = '') {
        return this.getAttribute(name) ?? defaultValue;
    }
    
    /**
     * Get boolean attribute
     */
    getBoolAttr(name) {
        return this.hasAttribute(name);
    }
    
    /**
     * Get numeric attribute
     */
    getNumAttr(name, defaultValue = 0) {
        const value = this.getAttribute(name);
        if (value === null) return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    }
    
    /**
     * Get JSON attribute
     */
    getJsonAttr(name, defaultValue = null) {
        const value = this.getAttribute(name);
        if (!value) return defaultValue;
        try {
            return JSON.parse(value);
        } catch {
            return defaultValue;
        }
    }
}

/**
 * Shared CSS variables and utilities available to all components
 */
export const sharedStyles = `
    :host {
        /* Color scheme - Black & Gray Theme */
        --bg-primary: #000000;
        --bg-secondary: #0a0a0a;
        --bg-tertiary: #141414;
        --bg-panel: rgba(10, 10, 10, 0.95);
        
        --text-primary: #f5f5f5;
        --text-secondary: #a3a3a3;
        --text-dim: #737373;
        
        --accent-primary: #e5e5e5;
        --accent-secondary: #a3a3a3;
        --accent-tertiary: #737373;
        
        --success: #22c55e;
        --warning: #f59e0b;
        --error: #ef4444;
        
        --border-color: rgba(255, 255, 255, 0.1);
        --border-glow: rgba(255, 255, 255, 0.2);
        
        /* Typography */
        --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
        --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        
        /* Spacing */
        --space-xs: 4px;
        --space-sm: 8px;
        --space-md: 12px;
        --space-lg: 16px;
        --space-xl: 24px;
        
        /* Border radius */
        --radius-sm: 4px;
        --radius-md: 8px;
        --radius-lg: 12px;
        
        /* Transitions */
        --transition-fast: 150ms ease;
        --transition-normal: 250ms ease;
        
        /* Box sizing */
        box-sizing: border-box;
        font-family: var(--font-sans);
        color: var(--text-primary);
    }
    
    *, *::before, *::after {
        box-sizing: inherit;
    }
    
    /* Scrollbar styling */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    
    ::-webkit-scrollbar-track {
        background: var(--bg-secondary);
    }
    
    ::-webkit-scrollbar-thumb {
        background: #404040;
        border-radius: 3px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: #525252;
    }
    
    /* Utility classes */
    .hidden { display: none !important; }
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-sm { gap: var(--space-sm); }
    .gap-md { gap: var(--space-md); }
    
    /* Button base */
    button {
        font-family: inherit;
        cursor: pointer;
        border: none;
        background: transparent;
        color: inherit;
    }
    
    button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Text utilities */
    .text-gradient {
        background: linear-gradient(135deg, #f5f5f5, #a3a3a3);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .text-dim { color: var(--text-dim); }
    .text-secondary { color: var(--text-secondary); }
    .text-success { color: var(--success); }
    .text-warning { color: var(--warning); }
    .text-error { color: var(--error); }
    
    /* Animation keyframes */
    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes slideIn {
        from { transform: translateY(-10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

/**
 * Helper to define a custom element only if not already defined
 */
export function defineComponent(tagName, componentClass) {
    if (!customElements.get(tagName)) {
        customElements.define(tagName, componentClass);
    }
}