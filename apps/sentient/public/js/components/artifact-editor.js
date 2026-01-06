
/**
 * Artifact Editor Component
 * 
 * A comprehensive HTML/script editor and preview system for:
 * - Editing HTML, CSS, and JavaScript
 * - Live preview in sandboxed iframe
 * - Multi-artifact tabs with projects
 * - Template gallery
 * - Version history with restore
 * - AI suggestions integration
 */

import { BaseComponent, sharedStyles, defineComponent } from './base-component.js';

// Template gallery definitions
const ARTIFACT_TEMPLATES = [
    {
        id: 'blank',
        name: 'Blank',
        category: 'Basic',
        icon: '📄',
        description: 'Empty HTML document',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Untitled</title>\n</head>\n<body>\n    \n</body>\n</html>',
        css: '',
        js: ''
    },
    {
        id: 'hello-world',
        name: 'Hello World',
        category: 'Basic',
        icon: '👋',
        description: 'Simple starter template',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Hello World</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>Welcome to your artifact!</p>\n</body>\n</html>',
        css: 'body {\n    font-family: system-ui, sans-serif;\n    padding: 2rem;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    min-height: 100vh;\n    margin: 0;\n}',
        js: 'console.log("Hello World!");'
    },
    {
        id: 'interactive',
        name: 'Interactive',
        category: 'Components',
        icon: '🎮',
        description: 'Button with click counter',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Interactive Demo</title>\n</head>\n<body>\n    <div class="container">\n        <h1>Click Counter</h1>\n        <button id="btn">Click me!</button>\n        <p>Clicks: <span id="count">0</span></p>\n    </div>\n</body>\n</html>',
        css: 'body {\n    font-family: system-ui, sans-serif;\n    padding: 2rem;\n    background: #1a1a2e;\n    color: white;\n    min-height: 100vh;\n    margin: 0;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n}\n\n.container { text-align: center; }\n\nbutton {\n    padding: 1rem 2rem;\n    font-size: 1.2rem;\n    background: #e94560;\n    color: white;\n    border: none;\n    border-radius: 8px;\n    cursor: pointer;\n}\n\nbutton:hover { transform: scale(1.05); }',
        js: 'let count = 0;\nconst btn = document.getElementById("btn");\nconst countEl = document.getElementById("count");\n\nbtn.addEventListener("click", () => {\n    count++;\n    countEl.textContent = count;\n});'
    },
    {
        id: 'canvas',
        name: 'Canvas',
        category: 'Graphics',
        icon: '🎨',
        description: 'Animated canvas particles',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Canvas Animation</title>\n</head>\n<body>\n    <canvas id="canvas"></canvas>\n</body>\n</html>',
        css: 'body { margin: 0; overflow: hidden; background: #000; }\ncanvas { display: block; }',
        js: 'const canvas = document.getElementById("canvas");\nconst ctx = canvas.getContext("2d");\ncanvas.width = window.innerWidth;\ncanvas.height = window.innerHeight;\n\nconst particles = [];\nfor (let i = 0; i < 100; i++) {\n    particles.push({\n        x: Math.random() * canvas.width,\n        y: Math.random() * canvas.height,\n        vx: (Math.random() - 0.5) * 2,\n        vy: (Math.random() - 0.5) * 2,\n        hue: Math.random() * 360\n    });\n}\n\nfunction animate() {\n    ctx.fillStyle = "rgba(0,0,0,0.05)";\n    ctx.fillRect(0, 0, canvas.width, canvas.height);\n    particles.forEach(p => {\n        p.x += p.vx; p.y += p.vy;\n        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;\n        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;\n        ctx.beginPath();\n        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);\n        ctx.fillStyle = `hsl(${p.hue}, 70%, 60%)`;\n        ctx.fill();\n        p.hue += 0.5;\n    });\n    requestAnimationFrame(animate);\n}\nanimate();'
    },
    {
        id: 'todo',
        name: 'Todo App',
        category: 'Apps',
        icon: '✅',
        description: 'Simple todo list',
        html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Todo App</title>\n</head>\n<body>\n    <div class="app">\n        <h1>📝 Todo List</h1>\n        <div class="input-group">\n            <input type="text" id="input" placeholder="Add a task...">\n            <button id="add">Add</button>\n        </div>\n        <ul id="list"></ul>\n    </div>\n</body>\n</html>',
        css: 'body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; min-height: 100vh; margin: 0; padding: 2rem; }\n.app { max-width: 500px; margin: 0 auto; }\n.input-group { display: flex; gap: 0.5rem; margin-bottom: 1rem; }\ninput { flex: 1; padding: 0.8rem; border: 1px solid #45475a; border-radius: 8px; background: #313244; color: #cdd6f4; }\nbutton { padding: 0.8rem 1.5rem; background: #89b4fa; color: #1e1e2e; border: none; border-radius: 8px; cursor: pointer; }\nul { list-style: none; padding: 0; }\nli { display: flex; align-items: center; gap: 0.5rem; padding: 0.8rem; background: #313244; border-radius: 8px; margin-bottom: 0.5rem; }\nli.done { text-decoration: line-through; opacity: 0.5; }',
        js: 'const input = document.getElementById("input");\nconst list = document.getElementById("list");\nlet todos = [];\n\nfunction render() {\n    list.innerHTML = todos.map((t,i) => `<li class="${t.done?"done":""}"><input type="checkbox" ${t.done?"checked":""} onchange="toggle(${i})"><span>${t.text}</span><button onclick="remove(${i})">×</button></li>`).join("");\n}\n\nfunction add() {\n    const text = input.value.trim();\n    if (text) { todos.push({text, done:false}); render(); input.value = ""; }\n}\n\nwindow.toggle = i => { todos[i].done = !todos[i].done; render(); };\nwindow.remove = i => { todos.splice(i,1); render(); };\n\ndocument.getElementById("add").onclick = add;\ninput.onkeypress = e => e.key === "Enter" && add();'
    },
    {
        id: 'chart',
        name: 'Chart',
        category: 'Visualization',
        icon: '📊',
        description: 'SVG bar chart',
        html: '<!DOCTYPE html>\n<html>\n<head><meta charset="UTF-8"><title>Chart</title></head>\n<body>\n    <div class="chart-container">\n        <h2>Monthly Data</h2>\n        <svg id="chart" width="400" height="250"></svg>\n    </div>\n</body>\n</html>',
        css: 'body { font-family: system-ui; background: #0f172a; color: #e2e8f0; min-height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; }\n.chart-container { background: #1e293b; padding: 2rem; border-radius: 12px; }',
        js: 'const data = [{m:"Jan",v:65},{m:"Feb",v:78},{m:"Mar",v:52},{m:"Apr",v:91},{m:"May",v:83}];\nconst svg = document.getElementById("chart");\nconst max = Math.max(...data.map(d=>d.v));\ndata.forEach((d,i) => {\n    const h = (d.v/max)*180, x = 30+i*70, y = 220-h;\n    const rect = document.createElementNS("http://www.w3.org/2000/svg","rect");\n    rect.setAttribute("x",x); rect.setAttribute("y",y); rect.setAttribute("width",50); rect.setAttribute("height",h);\n    rect.setAttribute("fill",`hsl(${210+i*25},70%,60%)`); rect.setAttribute("rx","4");\n    svg.appendChild(rect);\n    const txt = document.createElementNS("http://www.w3.org/2000/svg","text");\n    txt.setAttribute("x",x+25); txt.setAttribute("y",240); txt.setAttribute("text-anchor","middle");\n    txt.setAttribute("fill","#94a3b8"); txt.textContent = d.m;\n    svg.appendChild(txt);\n});'
    }
];

const TEMPLATE_CATEGORIES = ['All', 'Basic', 'Components', 'Graphics', 'Apps', 'Visualization'];

export class ArtifactEditor extends BaseComponent {
    constructor() {
        super();
        
        const defaultArtifact = {
            id: 'artifact_1',
            name: 'Untitled',
            html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>Preview</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n    <p>Edit the code to see changes.</p>\n</body>\n</html>',
            css: 'body {\n    font-family: sans-serif;\n    padding: 20px;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    color: white;\n    min-height: 100vh;\n    margin: 0;\n}',
            js: 'console.log("Artifact loaded!");',
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        
        this._state = {
            artifacts: [defaultArtifact],
            activeArtifactId: 'artifact_1',
            activeTab: 'html',
            isFullscreen: false,
            autoRun: true,
            showPreview: true,
            showTemplateGallery: false,
            templateCategory: 'All',
            showVersionHistory: false,
            showAISuggestions: false,
            aiSuggesting: false,
            aiSuggestion: null
        };
        
        this.versionHistory = {};
        this.maxVersions = 50;
        this.debounceTimer = null;
        this.artifactCounter = 1;
    }
    
    static get observedAttributes() {
        return ['content', 'title', 'readonly', 'auto-run'];
    }
    
    onAttributeChange(name, oldValue, newValue) {
        if (name === 'content' && newValue) {
            try {
                const parsed = JSON.parse(newValue);
                const artifact = this.getActiveArtifact();
                if (artifact) {
                    if (parsed.html !== undefined) artifact.html = parsed.html;
                    if (parsed.css !== undefined) artifact.css = parsed.css;
                    if (parsed.js !== undefined) artifact.js = parsed.js;
                }
            } catch {
                const artifact = this.getActiveArtifact();
                if (artifact) artifact.html = newValue;
            }
        } else if (name === 'auto-run') {
            this._state.autoRun = newValue !== 'false';
        }
    }
    
    getActiveArtifact() {
        return this._state.artifacts.find(a => a.id === this._state.activeArtifactId);
    }
    
    styles() {
        return `
            ${sharedStyles}
            
            :host {
                display: block;
                height: 100%;
                min-height: 400px;
            }
            
            .artifact-editor {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-lg);
                overflow: hidden;
            }
            
            .artifact-editor.fullscreen {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 9999;
                border-radius: 0;
            }
            
            /* Artifact Tabs */
            .artifact-tabs {
                display: flex;
                align-items: center;
                gap: 2px;
                padding: var(--space-xs) var(--space-sm);
                background: var(--bg-primary);
                border-bottom: 1px solid var(--border-color);
                overflow-x: auto;
            }
            
            .artifact-tab {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                color: var(--text-secondary);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                cursor: pointer;
                white-space: nowrap;
                transition: all var(--transition-fast);
            }
            
            .artifact-tab:hover {
                background: var(--bg-secondary);
            }
            
            .artifact-tab.active {
                background: var(--accent-primary);
                color: var(--bg-primary);
            }
            
            .artifact-tab-close {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                font-size: 0.65rem;
                opacity: 0.5;
            }
            
            .artifact-tab-close:hover {
                opacity: 1;
                background: rgba(0,0,0,0.2);
            }
            
            .new-artifact-btn {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: var(--radius-sm);
                background: var(--bg-tertiary);
                color: var(--text-dim);
                cursor: pointer;
                font-size: 1rem;
            }
            
            .new-artifact-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            /* Toolbar */
            .editor-toolbar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .toolbar-left, .toolbar-right {
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .toolbar-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: var(--space-xs);
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                color: var(--text-secondary);
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                cursor: pointer;
                transition: all var(--transition-fast);
            }
            
            .toolbar-btn:hover {
                background: var(--accent-primary);
                color: white;
            }
            
            .toolbar-btn.primary {
                background: var(--accent-primary);
                color: white;
                border-color: var(--accent-primary);
            }
            
            .toolbar-btn.icon-only {
                padding: var(--space-xs);
                width: 28px;
                height: 28px;
            }
            
            .toolbar-btn.icon-only span { display: none; }
            
            /* File Tabs */
            .file-tabs {
                display: flex;
                gap: 2px;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .file-tab {
                padding: var(--space-xs) var(--space-md);
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--text-secondary);
                background: transparent;
                border-radius: var(--radius-sm) var(--radius-sm) 0 0;
                border: 1px solid transparent;
                border-bottom: none;
                cursor: pointer;
                text-transform: uppercase;
            }
            
            .file-tab:hover {
                color: var(--text-primary);
                background: var(--bg-tertiary);
            }
            
            .file-tab.active {
                color: var(--accent-primary);
                background: var(--bg-primary);
                border-color: var(--border-color);
            }
            
            .file-tab-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                margin-right: var(--space-xs);
                display: inline-block;
            }
            
            .file-tab-dot.html { background: #e34c26; }
            .file-tab-dot.css { background: #264de4; }
            .file-tab-dot.js { background: #f7df1e; }
            
            /* Editor Main */
            .editor-main {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .editor-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
                border-right: 1px solid var(--border-color);
            }
            
            .editor-wrapper {
                display: flex;
                height: 100%;
            }
            
            .line-numbers {
                padding: var(--space-md) var(--space-sm);
                background: var(--bg-secondary);
                color: var(--text-dim);
                font-family: var(--font-mono);
                font-size: 13px;
                line-height: 1.6;
                text-align: right;
                user-select: none;
                border-right: 1px solid var(--border-color);
                min-width: 40px;
            }
            
            .editor-content {
                flex: 1;
                position: relative;
                overflow: auto;
            }
            
            .code-textarea {
                width: 100%;
                height: 100%;
                min-height: 300px;
                padding: var(--space-md);
                background: var(--bg-primary);
                border: none;
                color: var(--text-primary);
                font-family: var(--font-mono);
                font-size: 13px;
                line-height: 1.6;
                resize: none;
                outline: none;
                tab-size: 4;
                white-space: pre;
            }
            
            /* Preview Panel */
            .preview-panel {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: white;
            }
            
            .preview-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-color);
            }
            
            .preview-title {
                font-size: 0.7rem;
                font-weight: 500;
                color: var(--text-secondary);
                text-transform: uppercase;
            }
            
            .preview-frame {
                flex: 1;
                border: none;
                background: white;
            }
            
            .resizer {
                width: 4px;
                background: var(--bg-tertiary);
                cursor: col-resize;
            }
            
            .resizer:hover { background: var(--accent-primary); }
            
            /* Status Bar */
            .status-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-xs) var(--space-md);
                background: var(--bg-tertiary);
                border-top: 1px solid var(--border-color);
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            
            .status-left, .status-right {
                display: flex;
                align-items: center;
                gap: var(--space-md);
            }
            
            /* Template Gallery Modal */
            .modal-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                pointer-events: none;
                transition: opacity var(--transition-normal);
            }
            
            .modal-overlay.visible {
                opacity: 1;
                pointer-events: auto;
            }
            
            .modal {
                width: 90%;
                max-width: 800px;
                max-height: 80vh;
                background: var(--bg-secondary);
                border-radius: var(--radius-lg);
                border: 1px solid var(--border-color);
                display: flex;
                flex-direction: column;
            }
            
            .modal-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-md);
                border-bottom: 1px solid var(--border-color);
            }
            
            .modal-title {
                font-size: 1rem;
                font-weight: 600;
            }
            
            .modal-close {
                cursor: pointer;
                padding: var(--space-xs);
            }
            
            .modal-body {
                flex: 1;
                overflow-y: auto;
                padding: var(--space-md);
            }
            
            /* Template Gallery */
            .template-categories {
                display: flex;
                gap: var(--space-xs);
                margin-bottom: var(--space-md);
                flex-wrap: wrap;
            }
            
            .category-btn {
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                color: var(--text-secondary);
                cursor: pointer;
            }
            
            .category-btn.active {
                background: var(--accent-primary);
                color: white;
            }
            
            .template-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: var(--space-md);
            }
            
            .template-card {
                padding: var(--space-md);
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                cursor: pointer;
                transition: all var(--transition-fast);
                border: 2px solid transparent;
            }
            
            .template-card:hover {
                border-color: var(--accent-primary);
                transform: translateY(-2px);
            }
            
            .template-icon {
                font-size: 2rem;
                margin-bottom: var(--space-sm);
            }
            
            .template-name {
                font-weight: 600;
                margin-bottom: var(--space-xs);
            }
            
            .template-desc {
                font-size: 0.75rem;
                color: var(--text-dim);
            }
            
            /* Version History */
            .version-list {
                display: flex;
                flex-direction: column;
                gap: var(--space-xs);
            }
            
            .version-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
            }
            
            .version-info {
                flex: 1;
            }
            
            .version-time {
                font-size: 0.75rem;
                font-weight: 500;
            }
            
            .version-changes {
                font-size: 0.65rem;
                color: var(--text-dim);
            }
            
            .version-restore {
                padding: var(--space-xs) var(--space-sm);
                font-size: 0.7rem;
                background: var(--accent-primary);
                color: white;
                border: none;
                border-radius: var(--radius-sm);
                cursor: pointer;
            }
            
            /* AI Suggestions */
            .ai-panel {
                position: absolute;
                bottom: 50px;
                right: 10px;
                width: 300px;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-md);
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                z-index: 100;
            }
            
            .ai-panel-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: var(--space-sm);
                border-bottom: 1px solid var(--border-color);
            }
            
            .ai-panel-title {
                font-size: 0.75rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: var(--space-xs);
            }
            
            .ai-panel-body {
                padding: var(--space-sm);
                max-height: 200px;
                overflow-y: auto;
            }
            
            .ai-prompt-input {
                width: 100%;
                padding: var(--space-sm);
                background: var(--bg-primary);
                border: 1px solid var(--border-color);
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-size: 0.75rem;
                resize: none;
            }
            
            .ai-suggestion {
                margin-top: var(--space-sm);
                padding: var(--space-sm);
                background: var(--bg-tertiary);
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
            }
            
            .ai-actions {
                display: flex;
                gap: var(--space-xs);
                margin-top: var(--space-sm);
            }
            
            .ai-actions button {
                flex: 1;
                padding: var(--space-xs);
                font-size: 0.7rem;
                border-radius: var(--radius-sm);
                cursor: pointer;
            }
            
            /* Hidden state */
            .hidden { display: none !important; }
        `;
    }
    
    template() {
        const { artifacts, activeArtifactId, activeTab, isFullscreen, showPreview, 
                showTemplateGallery, templateCategory, showVersionHistory, showAISuggestions } = this._state;
        
        const artifact = this.getActiveArtifact();
        const title = this.getAttr('title', artifact?.name || 'Artifact');
        const isReadonly = this.hasAttribute('readonly');
        
        const fileTabs = [
            { id: 'html', label: 'HTML', dot: 'html' },
            { id: 'css', label: 'CSS', dot: 'css' },
            { id: 'js', label: 'JS', dot: 'js' }
        ];
        
        const currentCode = artifact ? (activeTab === 'html' ? artifact.html : activeTab === 'css' ? artifact.css : artifact.js) : '';
        const lineCount = currentCode.split('\n').length;
        
        const versions = this.versionHistory[activeArtifactId] || [];
        
        const filteredTemplates = templateCategory === 'All' 
            ? ARTIFACT_TEMPLATES 
            : ARTIFACT_TEMPLATES.filter(t => t.category === templateCategory);
        
        return `
            <div class="artifact-editor ${isFullscreen ? 'fullscreen' : ''}">
                <!-- Artifact Tabs -->
                <div class="artifact-tabs">
                    ${artifacts.map(a => `
                        <div class="artifact-tab ${a.id === activeArtifactId ? 'active' : ''}" data-artifact="${a.id}">
                            <span>◆ ${this.escapeHtml(a.name)}</span>
                            ${artifacts.length > 1 ? `<span class="artifact-tab-close" data-close="${a.id}">×</span>` : ''}
                        </div>
                    `).join('')}
                    <button class="new-artifact-btn" id="newArtifact" title="New Artifact">+</button>
                </div>
                
                <!-- Toolbar -->
                <div class="editor-toolbar">
                    <div class="toolbar-left">
                        <button class="toolbar-btn" id="templateBtn" title="Templates">📁 Templates</button>
                        <button class="toolbar-btn" id="historyBtn" title="Version History">📜 History</button>
                    </div>
                    <div class="toolbar-right">
                        <button class="toolbar-btn primary" id="runBtn" title="Run (Ctrl+Enter)">▶ Run</button>
                        <button class="toolbar-btn" id="copyBtn" title="Copy">📋</button>
                        <button class="toolbar-btn" id="downloadBtn" title="Download">⬇️</button>
                        <button class="toolbar-btn icon-only" id="aiBtn" title="AI Suggestions">🤖</button>
                        <button class="toolbar-btn icon-only" id="previewToggle" title="Toggle Preview">◧</button>
                        <button class="toolbar-btn icon-only" id="fullscreenBtn" title="Fullscreen">⛶</button>
                    </div>
                </div>
                
                <!-- File Tabs -->
                <div class="file-tabs">
                    ${fileTabs.map(t => `
                        <button class="file-tab ${activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
                            <span class="file-tab-dot ${t.dot}"></span>
                            ${t.label}
                        </button>
                    `).join('')}
                </div>
                
                <!-- Editor Main -->
                <div class="editor-main">
                    <div class="editor-panel">
                        <div class="editor-wrapper">
                            <div class="line-numbers" id="lineNumbers">
                                ${Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join('')}
                            </div>
                            <div class="editor-content">
                                <textarea
                                    class="code-textarea"
                                    id="codeInput"
                                    spellcheck="false"
                                    ${isReadonly ? 'readonly' : ''}
                                >${this.escapeHtml(currentCode)}</textarea>
                            </div>
                        </div>
                    </div>
                    
                    ${showPreview ? `
                        <div class="resizer" id="resizer"></div>
                        <div class="preview-panel">
                            <div class="preview-header">
                                <span class="preview-title">Preview</span>
                                <span id="previewStatus">Ready</span>
                            </div>
                            <iframe class="preview-frame" id="previewFrame" sandbox="allow-scripts allow-modals"></iframe>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Status Bar -->
                <div class="status-bar">
                    <div class="status-left">
                        <span>Lines: ${lineCount}</span>
                        <span>Chars: ${currentCode.length}</span>
                        <span>Versions: ${versions.length}</span>
                    </div>
                    <div class="status-right">
                        <span>${this._state.autoRun ? 'Auto-run' : 'Manual'}</span>
                    </div>
                </div>
                
                <!-- AI Panel -->
                ${showAISuggestions ? `
                    <div class="ai-panel">
                        <div class="ai-panel-header">
                            <span class="ai-panel-title">🤖 AI Assistant</span>
                            <span class="modal-close" id="closeAI">×</span>
                        </div>
                        <div class="ai-panel-body">
                            <textarea class="ai-prompt-input" id="aiPrompt" placeholder="Ask AI for help..." rows="2"></textarea>
                            ${this._state.aiSuggestion ? `
                                <div class="ai-suggestion">${this.escapeHtml(this._state.aiSuggestion)}</div>
                                <div class="ai-actions">
                                    <button id="applyAI" style="background: var(--success); color: white; border: none;">Apply</button>
                                    <button id="dismissAI" style="background: var(--bg-tertiary); color: var(--text-secondary); border: 1px solid var(--border-color);">Dismiss</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
                
                <!-- Template Gallery Modal -->
                <div class="modal-overlay ${showTemplateGallery ? 'visible' : ''}" id="templateModal">
                    <div class="modal">
                        <div class="modal-header">
                            <span class="modal-title">📁 Template Gallery</span>
                            <span class="modal-close" id="closeTemplates">×</span>
                        </div>
                        <div class="modal-body">
                            <div class="template-categories">
                                ${TEMPLATE_CATEGORIES.map(cat => `
                                    <button class="category-btn ${templateCategory === cat ? 'active' : ''}" data-category="${cat}">${cat}</button>
                                `).join('')}
                            </div>
                            <div class="template-grid">
                                ${filteredTemplates.map(t => `
                                    <div class="template-card" data-template="${t.id}">
                                        <div class="template-icon">${t.icon}</div>
                                        <div class="template-name">${t.name}</div>
                                        <div class="template-desc">${t.description}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Version History Modal -->
                <div class="modal-overlay ${showVersionHistory ? 'visible' : ''}" id="historyModal">
                    <div class="modal">
                        <div class="modal-header">
                            <span class="modal-title">📜 Version History</span>
                            <span class="modal-close" id="closeHistory">×</span>
                        </div>
                        <div class="modal-body">
                            ${versions.length === 0 ? `
                                <p style="color: var(--text-dim);">No version history yet. Changes are saved as you edit.</p>
                            ` : `
                                <div class="version-list">
                                    ${versions.slice().reverse().map((v, i) => `
                                        <div class="version-item">
                                            <div class="version-info">
                                                <div class="version-time">${new Date(v.timestamp).toLocaleString()}</div>
                                                <div class="version-changes">${v.changes || 'Auto-save'}</div>
                                            </div>
                                            <button class="version-restore" data-version="${versions.length - 1 - i}">Restore</button>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    onMount() {
        this.cacheElements();
        if (this._state.autoRun) {
            setTimeout(() => this.runPreview(), 100);
        }
    }
    
    cacheElements() {
        this.codeInput = this.$('#codeInput');
        this.previewFrame = this.$('#previewFrame');
        this.lineNumbers = this.$('#lineNumbers');
    }
    
    setupEventListeners() {
        this.cacheElements();
        
        // Artifact tabs
        this.$$('.artifact-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (e.target.classList.contains('artifact-tab-close')) {
                    this.closeArtifact(e.target.dataset.close);
                } else {
                    this.switchArtifact(tab.dataset.artifact);
                }
            });
        });
        
        // New artifact
        const newBtn = this.$('#newArtifact');
        if (newBtn) newBtn.addEventListener('click', () => this.createNewArtifact());
        
        // File tabs
        this.$$('.file-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchFileTab(tab.dataset.tab));
        });
        
        // Code input
        if (this.codeInput) {
            this.codeInput.addEventListener('input', () => this.handleCodeChange());
            this.codeInput.addEventListener('scroll', () => this.syncScroll());
            this.codeInput.addEventListener('keydown', (e) => this.handleKeydown(e));
        }
        
        // Toolbar buttons
        const runBtn = this.$('#runBtn');
        const copyBtn = this.$('#copyBtn');
        const downloadBtn = this.$('#downloadBtn');
        const previewToggle = this.$('#previewToggle');
        const fullscreenBtn = this.$('#fullscreenBtn');
        const templateBtn = this.$('#templateBtn');
        const historyBtn = this.$('#historyBtn');
        const aiBtn = this.$('#aiBtn');
        
        if (runBtn) runBtn.addEventListener('click', () => this.runPreview());
        if (copyBtn) copyBtn.addEventListener('click', () => this.copyCode());
        if (downloadBtn) downloadBtn.addEventListener('click', () => this.downloadCode());
        if (previewToggle) previewToggle.addEventListener('click', () => this.togglePreview());
        if (fullscreenBtn) fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        if (templateBtn) templateBtn.addEventListener('click', () => this.showTemplates());
        if (historyBtn) historyBtn.addEventListener('click', () => this.showHistory());
        if (aiBtn) aiBtn.addEventListener('click', () => this.toggleAI());
        
        // Modal closes
        const closeTemplates = this.$('#closeTemplates');
        const closeHistory = this.$('#closeHistory');
        const closeAI = this.$('#closeAI');
        
        if (closeTemplates) closeTemplates.addEventListener('click', () => this.hideTemplates());
        if (closeHistory) closeHistory.addEventListener('click', () => this.hideHistory());
        if (closeAI) closeAI.addEventListener('click', () => this.hideAI());
        
        // Template modal
        const templateModal = this.$('#templateModal');
        if (templateModal) {
            templateModal.addEventListener('click', (e) => {
                if (e.target === templateModal) this.hideTemplates();
            });
        }
        
        // History modal
        const historyModal = this.$('#historyModal');
        if (historyModal) {
            historyModal.addEventListener('click', (e) => {
                if (e.target === historyModal) this.hideHistory();
            });
        }
        
        // Category buttons
        this.$$('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._state.templateCategory = btn.dataset.category;
                this.render();
            });
        });
        
        // Template cards
        this.$$('.template-card').forEach(card => {
            card.addEventListener('click', () => this.applyTemplate(card.dataset.template));
        });
        
        // Version restore
        this.$$('.version-restore').forEach(btn => {
            btn.addEventListener('click', () => this.restoreVersion(parseInt(btn.dataset.version)));
        });
        
        // AI prompt
        const aiPrompt = this.$('#aiPrompt');
        if (aiPrompt) {
            aiPrompt.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.askAI(aiPrompt.value);
                }
            });
        }
        
        // AI actions
        const applyAI = this.$('#applyAI');
        const dismissAI = this.$('#dismissAI');
        if (applyAI) applyAI.addEventListener('click', () => this.applyAISuggestion());
        if (dismissAI) dismissAI.addEventListener('click', () => { this._state.aiSuggestion = null; this.render(); });
        
        // Resizer
        const resizer = this.$('#resizer');
        if (resizer) this.setupResizer(resizer);
        
        // Keyboard shortcuts
        this.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.runPreview();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveVersion('Manual save');
            }
        });
    }
    
    // Artifact management
    createNewArtifact() {
        this.artifactCounter++;
        const newArtifact = {
            id: `artifact_${Date.now()}`,
            name: `Untitled ${this.artifactCounter}`,
            html: '<!DOCTYPE html>\n<html>\n<head>\n    <meta charset="UTF-8">\n    <title>New</title>\n</head>\n<body>\n    \n</body>\n</html>',
            css: '',
            js: '',
            createdAt: Date.now(),
            modifiedAt: Date.now()
        };
        
        this._state.artifacts.push(newArtifact);
        this._state.activeArtifactId = newArtifact.id;
        this._state.activeTab = 'html';
        this.render();
    }
    
    switchArtifact(id) {
        if (this._state.activeArtifactId === id) return;
        this.saveCurrentFile();
        this._state.activeArtifactId = id;
        this._state.activeTab = 'html';
        this.render();
        if (this._state.autoRun) this.runPreview();
    }
    
    closeArtifact(id) {
        if (this._state.artifacts.length <= 1) return;
        
        const idx = this._state.artifacts.findIndex(a => a.id === id);
        if (idx === -1) return;
        
        this._state.artifacts.splice(idx, 1);
        
        if (this._state.activeArtifactId === id) {
            this._state.activeArtifactId = this._state.artifacts[Math.min(idx, this._state.artifacts.length - 1)].id;
        }
        
        this.render();
    }
    
    switchFileTab(tabId) {
        this.saveCurrentFile();
        this._state.activeTab = tabId;
        this.render();
        setTimeout(() => this.codeInput?.focus(), 0);
    }
    
    saveCurrentFile() {
        const artifact = this.getActiveArtifact();
        if (!artifact || !this.codeInput) return;
        
        const code = this.codeInput.value;
        const oldCode = artifact[this._state.activeTab];
        
        if (code !== oldCode) {
            artifact[this._state.activeTab] = code;
            artifact.modifiedAt = Date.now();
            this.saveVersion(`Updated ${this._state.activeTab.toUpperCase()}`);
        }
    }
    
    handleCodeChange() {
        this.saveCurrentFile();
        this.updateLineNumbers();
        
        if (this._state.autoRun) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => this.runPreview(), 500);
        }
        
        this.emit('code-change', { artifact: this.getActiveArtifact() });
    }
    
    updateLineNumbers() {
        if (!this.lineNumbers || !this.codeInput) return;
        const lineCount = this.codeInput.value.split('\n').length;
        this.lineNumbers.innerHTML = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join('');
    }
    
    syncScroll() {
        if (!this.lineNumbers || !this.codeInput) return;
        this.lineNumbers.scrollTop = this.codeInput.scrollTop;
    }
    
    handleKeydown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = this.codeInput.selectionStart;
            const end = this.codeInput.selectionEnd;
            const value = this.codeInput.value;
            this.codeInput.value = value.substring(0, start) + '    ' + value.substring(end);
            this.codeInput.selectionStart = this.codeInput.selectionEnd = start + 4;
            this.handleCodeChange();
        }
    }
    
    // Preview
    runPreview() {
        this.saveCurrentFile();
        const artifact = this.getActiveArtifact();
        const previewFrame = this.$('#previewFrame');
        const statusEl = this.$('#previewStatus');
        
        if (!previewFrame || !artifact) return;
        
        if (statusEl) statusEl.textContent = 'Running...';
        
        try {
            let html = artifact.html;
            
            if (artifact.css && !html.includes('<style>')) {
                const styleTag = `<style>\n${artifact.css}\n</style>`;
                html = html.includes('</head>')
                    ? html.replace('</head>', `${styleTag}\n</head>`)
                    : styleTag + '\n' + html;
            }
            
            if (artifact.js && !html.includes('<script>')) {
                const scriptTag = `<script>\n${artifact.js}\n</script>`;
                html = html.includes('</body>')
                    ? html.replace('</body>', `${scriptTag}\n</body>`)
                    : html + '\n' + scriptTag;
            }
            
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            previewFrame.src = url;
            previewFrame.onload = () => {
                URL.revokeObjectURL(url);
                if (statusEl) statusEl.textContent = 'Ready';
            };
        } catch (err) {
            if (statusEl) statusEl.textContent = `Error: ${err.message}`;
        }
    }
    
    copyCode() {
        this.saveCurrentFile();
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        const code = artifact[this._state.activeTab];
        navigator.clipboard.writeText(code).then(() => this.showToast('Copied!'));
    }
    
    downloadCode() {
        this.saveCurrentFile();
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        let html = artifact.html;
        if (artifact.css) html = html.replace('</head>', `<style>\n${artifact.css}\n</style>\n</head>`);
        if (artifact.js) html = html.replace('</body>', `<script>\n${artifact.js}\n</script>\n</body>`);
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artifact.name.replace(/\s+/g, '-')}.html`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Downloaded!');
    }
    
    togglePreview() {
        this._state.showPreview = !this._state.showPreview;
        this.render();
        if (this._state.showPreview) setTimeout(() => this.runPreview(), 100);
    }
    
    toggleFullscreen() {
        this._state.isFullscreen = !this._state.isFullscreen;
        this.render();
    }
    
    setupResizer(resizer) {
        let startX, startWidth;
        const editorPanel = this.$('.editor-panel');
        
        const onMove = (e) => {
            if (!editorPanel) return;
            const dx = e.clientX - startX;
            editorPanel.style.flex = `0 0 ${startWidth + dx}px`;
        };
        
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        
        resizer.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startWidth = editorPanel?.offsetWidth || 400;
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        });
    }
    
    // Template gallery
    showTemplates() {
        this._state.showTemplateGallery = true;
        this.render();
    }
    
    hideTemplates() {
        this._state.showTemplateGallery = false;
        this.render();
    }
    
    applyTemplate(templateId) {
        const template = ARTIFACT_TEMPLATES.find(t => t.id === templateId);
        if (!template) return;
        
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        artifact.html = template.html;
        artifact.css = template.css;
        artifact.js = template.js;
        artifact.name = template.name;
        artifact.modifiedAt = Date.now();
        
        this.saveVersion(`Applied template: ${template.name}`);
        this.hideTemplates();
        this.render();
        this.runPreview();
    }
    
    // Version history
    showHistory() {
        this._state.showVersionHistory = true;
        this.render();
    }
    
    hideHistory() {
        this._state.showVersionHistory = false;
        this.render();
    }
    
    saveVersion(changes = '') {
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        const id = this._state.activeArtifactId;
        if (!this.versionHistory[id]) this.versionHistory[id] = [];
        
        this.versionHistory[id].push({
            timestamp: Date.now(),
            changes,
            html: artifact.html,
            css: artifact.css,
            js: artifact.js
        });
        
        if (this.versionHistory[id].length > this.maxVersions) {
            this.versionHistory[id] = this.versionHistory[id].slice(-this.maxVersions);
        }
    }
    
    restoreVersion(index) {
        const versions = this.versionHistory[this._state.activeArtifactId];
        if (!versions || !versions[index]) return;
        
        const version = versions[index];
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        artifact.html = version.html;
        artifact.css = version.css;
        artifact.js = version.js;
        artifact.modifiedAt = Date.now();
        
        this.saveVersion('Restored from history');
        this.hideHistory();
        this.render();
        this.runPreview();
        this.showToast('Version restored');
    }
    
    // AI suggestions
    toggleAI() {
        this._state.showAISuggestions = !this._state.showAISuggestions;
        this.render();
    }
    
    hideAI() {
        this._state.showAISuggestions = false;
        this.render();
    }
    
    async askAI(prompt) {
        if (!prompt.trim()) return;
        
        this._state.aiSuggesting = true;
        this.render();
        
        try {
            const artifact = this.getActiveArtifact();
            const context = `Current ${this._state.activeTab.toUpperCase()} code:\n${artifact[this._state.activeTab]}\n\nUser request: ${prompt}`;
            
            const res = await fetch('/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: `Help me with this code:\n${context}` })
            });
            
            if (res.ok) {
                const data = await res.json();
                this._state.aiSuggestion = data.response || 'No suggestion available';
            } else {
                this._state.aiSuggestion = 'Failed to get AI suggestion';
            }
        } catch (err) {
            this._state.aiSuggestion = `Error: ${err.message}`;
        }
        
        this._state.aiSuggesting = false;
        this.render();
    }
    
    applyAISuggestion() {
        // Extract code from suggestion if wrapped in code blocks
        let suggestion = this._state.aiSuggestion || '';
        const codeMatch = suggestion.match(/```(?:\w+)?\n([\s\S]*?)```/);
        if (codeMatch) suggestion = codeMatch[1];
        
        const artifact = this.getActiveArtifact();
        if (artifact && suggestion.trim()) {
            artifact[this._state.activeTab] = suggestion.trim();
            artifact.modifiedAt = Date.now();
            this.saveVersion('Applied AI suggestion');
        }
        
        this._state.aiSuggestion = null;
        this.render();
        this.runPreview();
    }
    
    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            padding: 8px 16px; background: rgba(20,20,40,0.95); border: 1px solid rgba(99,102,241,0.3);
            border-radius: 8px; color: #e5e7eb; font-size: 0.8rem; z-index: 10000;
        `;
        toast.textContent = message;
        this.shadowRoot.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }
    
    // Public API
    setContent(content) {
        const artifact = this.getActiveArtifact();
        if (!artifact) return;
        
        if (typeof content === 'string') {
            artifact.html = content;
        } else if (typeof content === 'object') {
            if (content.html !== undefined) artifact.html = content.html;
            if (content.css !== undefined) artifact.css = content.css;
            if (content.js !== undefined) artifact.js = content.js;
        }
        
        this.render();
        if (this._state.autoRun) this.runPreview();
    }
    
    getContent() {
        this.saveCurrentFile();
        const artifact = this.getActiveArtifact();
        return artifact ? { html: artifact.html, css: artifact.css, js: artifact.js } : null;
    }
    
    getCombinedHTML() {
        this.saveCurrentFile();
        const artifact = this.getActiveArtifact();
        if (!artifact) return '';
        
        let html = artifact.html;
        if (artifact.css) html = html.replace('</head>', `<style>\n${artifact.css}\n</style>\n</head>`);
        if (artifact.js) html = html.replace('</body>', `<script>\n${artifact.js}\n</script>\n</body>`);
        return html;
    }
}

defineComponent('artifact-editor', ArtifactEditor);