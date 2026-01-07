/**
 * Sentient Observer Web Components (Simplified)
 *
 * Central export for all web components.
 * Import this file to register all custom elements.
 *
 * Removed: SentientSidebar (redundant, functionality merged into main app)
 */

// Base
export { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

// Core UI Components
export { SentientHeader } from './sentient-header.js';
export { SentientPanel } from './sentient-panel.js';
export { SentientChat } from './sentient-chat.js';

// Network Panel - WebRTC status, room viewer, memory sync, topology graph
export { NetworkPanel } from './network-panel.js';

// Chat Components
export { ChatMessage } from './chat-message.js';
export { CommandPalette } from './command-palette.js';

// Visualization Components
export { OscillatorVisualizer } from './oscillator-visualizer.js';
export { SedenionVisualizer } from './sedenion-visualizer.js';
export { FieldPanel } from './field-panel.js';

// Editor Components
export { ArtifactEditor } from './artifact-editor.js';

// Structure Panel
export { StructurePanel } from './structure-panel.js';

// Learning Panel
export { LearningPanel } from './learning-panel.js';

// Memory Panel
export { MemoryPanel } from './memory-panel.js';

// Modal Components
export { IntrospectionModal } from './introspection-modal.js';

// Input Components
export { SightCamera } from './sight-camera.js';

// Provider Components
export { ProviderSelector } from './provider-selector.js';

// Main App Shell
export { SentientApp } from './sentient-app.js';

// Auto-register all components when this module is imported
console.log('[Components] Sentient Observer web components loaded');