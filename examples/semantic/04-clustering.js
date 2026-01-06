/**
 * @example Text Clustering
 * @description Group similar texts using hypercomplex embeddings
 * 
 * TinyAleph enables unsupervised text clustering:
 * - Documents are embedded as hypercomplex vectors
 * - K-means or hierarchical clustering groups similar texts
 * - Cluster centroids represent topic summaries
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

console.log('TinyAleph Text Clustering Example');
console.log('==================================\n');

// ===========================================
// SAMPLE DATA
// ===========================================

const documents = [
    // Technology cluster
    { id: 1, text: 'Machine learning algorithms process large datasets', category: 'tech' },
    { id: 2, text: 'Artificial intelligence is transforming industries', category: 'tech' },
    { id: 3, text: 'Neural networks can recognize patterns in data', category: 'tech' },
    { id: 4, text: 'Deep learning models require significant compute power', category: 'tech' },
    
    // Sports cluster
    { id: 5, text: 'The football team won the championship game', category: 'sports' },
    { id: 6, text: 'Basketball players practice dribbling skills', category: 'sports' },
    { id: 7, text: 'The athlete broke the world record in swimming', category: 'sports' },
    { id: 8, text: 'Soccer matches attract millions of fans worldwide', category: 'sports' },
    
    // Food cluster
    { id: 9, text: 'Italian cuisine features pasta and fresh ingredients', category: 'food' },
    { id: 10, text: 'The chef prepared a delicious gourmet meal', category: 'food' },
    { id: 11, text: 'Fresh vegetables make healthy nutritious dishes', category: 'food' },
    { id: 12, text: 'Baking bread requires flour yeast and patience', category: 'food' },
    
    // Finance cluster  
    { id: 13, text: 'Stock market indices reached new highs today', category: 'finance' },
    { id: 14, text: 'Investment portfolios should be diversified', category: 'finance' },
    { id: 15, text: 'Interest rates affect mortgage payments', category: 'finance' },
    { id: 16, text: 'Cryptocurrency markets are highly volatile', category: 'finance' }
];

// Embed all documents
const embeddedDocs = documents.map(doc => ({
    ...doc,
    state: backend.textToOrderedState(doc.text)
}));

// ===========================================
// HELPER FUNCTIONS
// ===========================================

function similarity(state1, state2) {
    let dot = 0, mag1 = 0, mag2 = 0;
    for (let i = 0; i < state1.c.length; i++) {
        dot += state1.c[i] * state2.c[i];
        mag1 += state1.c[i] * state1.c[i];
        mag2 += state2.c[i] * state2.c[i];
    }
    return dot / (Math.sqrt(mag1) * Math.sqrt(mag2) || 1);
}

function distance(state1, state2) {
    let sum = 0;
    for (let i = 0; i < state1.c.length; i++) {
        const diff = state1.c[i] - state2.c[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

// ===========================================
// K-MEANS CLUSTERING
// ===========================================

console.log('K-Means Clustering:');
console.log('─'.repeat(50) + '\n');

function kMeansClustering(docs, k, maxIterations = 20) {
    const dim = docs[0].state.c.length;
    
    // Initialize centroids randomly from documents
    const centroids = [];
    const usedIndices = new Set();
    while (centroids.length < k) {
        const idx = Math.floor(Math.random() * docs.length);
        if (!usedIndices.has(idx)) {
            usedIndices.add(idx);
            const centroid = Hypercomplex.zero(dim);
            for (let i = 0; i < dim; i++) {
                centroid.c[i] = docs[idx].state.c[i];
            }
            centroids.push(centroid);
        }
    }
    
    let assignments = new Array(docs.length).fill(-1);
    
    for (let iter = 0; iter < maxIterations; iter++) {
        // Assign documents to nearest centroid
        const newAssignments = [];
        for (const doc of docs) {
            let minDist = Infinity;
            let cluster = 0;
            for (let c = 0; c < k; c++) {
                const d = distance(doc.state, centroids[c]);
                if (d < minDist) {
                    minDist = d;
                    cluster = c;
                }
            }
            newAssignments.push(cluster);
        }
        
        // Check for convergence
        if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
            break;
        }
        assignments = newAssignments;
        
        // Update centroids
        for (let c = 0; c < k; c++) {
            const members = docs.filter((_, i) => assignments[i] === c);
            if (members.length > 0) {
                for (let i = 0; i < dim; i++) {
                    centroids[c].c[i] = members.reduce((sum, m) => sum + m.state.c[i], 0) / members.length;
                }
            }
        }
    }
    
    return { centroids, assignments };
}

// Run K-means with k=4 (matching our 4 categories)
const { centroids, assignments } = kMeansClustering(embeddedDocs, 4);

// Display clusters
console.log('Cluster assignments:\n');
for (let c = 0; c < 4; c++) {
    const members = embeddedDocs.filter((_, i) => assignments[i] === c);
    console.log(`Cluster ${c + 1} (${members.length} documents):`);
    for (const member of members) {
        console.log(`  [${member.category}] "${member.text.substring(0, 45)}..."`);
    }
    console.log();
}

// ===========================================
// CLUSTER PURITY
// ===========================================

console.log('═'.repeat(50));
console.log('Cluster Purity Analysis:');
console.log('═'.repeat(50) + '\n');

function calculatePurity(docs, assignments) {
    const clusterCounts = new Map();
    
    for (let i = 0; i < assignments.length; i++) {
        const cluster = assignments[i];
        const category = docs[i].category;
        
        if (!clusterCounts.has(cluster)) {
            clusterCounts.set(cluster, new Map());
        }
        const catCounts = clusterCounts.get(cluster);
        catCounts.set(category, (catCounts.get(category) || 0) + 1);
    }
    
    let correctTotal = 0;
    for (const [cluster, counts] of clusterCounts) {
        const maxCount = Math.max(...counts.values());
        correctTotal += maxCount;
    }
    
    return correctTotal / docs.length;
}

const purity = calculatePurity(embeddedDocs, assignments);
console.log(`Overall cluster purity: ${(purity * 100).toFixed(1)}%\n`);

// ===========================================
// HIERARCHICAL CLUSTERING
// ===========================================

console.log('═'.repeat(50));
console.log('Hierarchical Clustering:');
console.log('═'.repeat(50) + '\n');

function hierarchicalClustering(docs) {
    // Start with each document as its own cluster
    let clusters = docs.map((doc, i) => ({
        id: i,
        members: [doc],
        centroid: doc.state
    }));
    
    const history = [];
    
    while (clusters.length > 1) {
        // Find closest pair
        let minDist = Infinity;
        let mergeI = 0, mergeJ = 1;
        
        for (let i = 0; i < clusters.length; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const d = distance(clusters[i].centroid, clusters[j].centroid);
                if (d < minDist) {
                    minDist = d;
                    mergeI = i;
                    mergeJ = j;
                }
            }
        }
        
        // Merge clusters
        const merged = {
            id: clusters.length,
            members: [...clusters[mergeI].members, ...clusters[mergeJ].members],
            centroid: Hypercomplex.zero(16)
        };
        
        // Compute new centroid
        const allMembers = merged.members;
        for (let d = 0; d < 16; d++) {
            merged.centroid.c[d] = allMembers.reduce((sum, m) => sum + m.state.c[d], 0) / allMembers.length;
        }
        
        history.push({
            level: history.length,
            merged: [clusters[mergeI].id, clusters[mergeJ].id],
            distance: minDist,
            size: merged.members.length
        });
        
        // Remove old clusters, add merged
        clusters = clusters.filter((_, i) => i !== mergeI && i !== mergeJ);
        clusters.push(merged);
    }
    
    return history;
}

const dendrogram = hierarchicalClustering(embeddedDocs);

console.log('Dendrogram (merge history):');
console.log('Level  Distance    Size');
console.log('─'.repeat(30));
for (const merge of dendrogram.slice(-8)) {
    console.log(`${String(merge.level).padStart(5)}  ${merge.distance.toFixed(4).padStart(9)}  ${String(merge.size).padStart(5)}`);
}

// ===========================================
// CLUSTER CENTROIDS AS TOPICS
// ===========================================

console.log('\n' + '═'.repeat(50));
console.log('Cluster Centroids (Topic Representations):');
console.log('═'.repeat(50) + '\n');

// For each cluster, find which documents are most central
for (let c = 0; c < 4; c++) {
    const members = embeddedDocs.filter((_, i) => assignments[i] === c);
    if (members.length === 0) continue;
    
    // Find most central document
    let mostCentral = null;
    let minAvgDist = Infinity;
    
    for (const candidate of members) {
        let avgDist = 0;
        for (const other of members) {
            avgDist += distance(candidate.state, other.state);
        }
        avgDist /= members.length;
        
        if (avgDist < minAvgDist) {
            minAvgDist = avgDist;
            mostCentral = candidate;
        }
    }
    
    console.log(`Cluster ${c + 1} representative:`);
    console.log(`  "${mostCentral.text}"\n`);
}

// ===========================================
// NEW DOCUMENT CLASSIFICATION
// ===========================================

console.log('═'.repeat(50));
console.log('Classifying New Documents:');
console.log('═'.repeat(50) + '\n');

const newDocs = [
    'Quantum computing uses qubits for calculations',
    'The tennis player won the grand slam tournament',
    'Homemade pizza with fresh tomatoes and cheese',
    'Bond yields decreased after the central bank announcement'
];

for (const text of newDocs) {
    const state = backend.textToOrderedState(text);
    
    // Find nearest cluster
    let minDist = Infinity;
    let cluster = 0;
    for (let c = 0; c < centroids.length; c++) {
        const d = distance(state, centroids[c]);
        if (d < minDist) {
            minDist = d;
            cluster = c;
        }
    }
    
    // Find dominant category in cluster
    const clusterMembers = embeddedDocs.filter((_, i) => assignments[i] === cluster);
    const catCounts = new Map();
    for (const m of clusterMembers) {
        catCounts.set(m.category, (catCounts.get(m.category) || 0) + 1);
    }
    const dominantCat = [...catCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';
    
    console.log(`"${text.substring(0, 45)}..."`);
    console.log(`  → Cluster ${cluster + 1} (likely: ${dominantCat})\n`);
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('═'.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. K-means clusters documents by embedding similarity');
console.log('2. Hierarchical clustering reveals nested structure');
console.log('3. Centroids represent topic summaries');
console.log('4. New documents can be classified to clusters');
console.log('5. Purity measures cluster quality');