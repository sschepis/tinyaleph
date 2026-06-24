/**
 * Summary Cache
 *
 * Persists file summaries to avoid re-summarization.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Summary Cache - Persists file summaries to avoid re-summarization
 */
export class SummaryCache {
    constructor(cachePath = './data/summary-cache.json') {
        this.cachePath = cachePath;
        this.cache = {};
        this.load();
    }
    
    load() {
        try {
            if (fs.existsSync(this.cachePath)) {
                this.cache = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
            }
        } catch (e) {
            this.cache = {};
        }
    }
    
    save() {
        try {
            const dir = path.dirname(this.cachePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.cachePath, JSON.stringify(this.cache, null, 2));
        } catch (e) {
            // Silent fail
        }
    }
    
    /**
     * Generate a hash for cache key
     */
    hash(filePath, modifiedTime, focus = '') {
        const input = `${filePath}:${modifiedTime}:${focus}`;
        return crypto.createHash('md5').update(input).digest('hex');
    }
    
    /**
     * Get cached summary if still valid
     */
    get(filePath, modifiedTime, focus = '') {
        const key = this.hash(filePath, modifiedTime, focus);
        const entry = this.cache[key];
        
        if (entry && entry.modifiedTime === modifiedTime) {
            return entry;
        }
        
        return null;
    }
    
    /**
     * Store a summary
     */
    set(filePath, modifiedTime, focus, summary, keyPoints, metadata = {}) {
        const key = this.hash(filePath, modifiedTime, focus);
        
        this.cache[key] = {
            filePath,
            modifiedTime,
            focus: focus || '',
            summary,
            keyPoints,
            createdAt: Date.now(),
            ...metadata
        };
        
        this.save();
        return this.cache[key];
    }
    
    /**
     * Clear old entries (older than 7 days)
     */
    cleanup() {
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();
        let removed = 0;
        
        for (const key in this.cache) {
            if (now - this.cache[key].createdAt > maxAge) {
                delete this.cache[key];
                removed++;
            }
        }
        
        if (removed > 0) {
            this.save();
        }
        
        return removed;
    }
    
    /**
     * Get cache stats
     */
    stats() {
        return {
            entries: Object.keys(this.cache).length,
            files: [...new Set(Object.values(this.cache).map(e => e.filePath))].length
        };
    }
}

// Global summary cache instance
let _summaryCache = null;
export function getSummaryCache(dataPath = './data') {
    if (!_summaryCache) {
        _summaryCache = new SummaryCache(path.join(dataPath, 'summary-cache.json'));
    }
    return _summaryCache;
}
