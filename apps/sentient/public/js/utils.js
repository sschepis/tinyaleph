/**
 * Sentient Observer - Utility Functions
 */

/**
 * Simple markdown renderer
 */
export function renderMarkdown(text) {
    if (!text) return '';
    
    let html = text
        // Escape HTML first
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    // Lists (simple)
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    return html;
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Capitalize first letter
 */
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Fetch JSON with error handling
 */
export async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

/**
 * Get coherence class for styling
 */
export function getCoherenceClass(coherence) {
    if (coherence > 0.7) return 'coherence-high';
    if (coherence > 0.4) return 'coherence-medium';
    return 'coherence-low';
}

/**
 * Get moment icon by trigger type
 */
export function getMomentIcon(trigger) {
    switch (trigger) {
        case 'coherence': return '🎯';
        case 'entropy_extreme': return '⚡';
        case 'phase_transition': return '🌊';
        default: return '📍';
    }
}