/**
 * @example Knowledge Graph
 * @description Build and query a prime-based knowledge graph
 * 
 * A knowledge graph stores entities and relationships. TinyAleph enhances
 * this with prime-based embeddings that enable:
 * - Semantic entity matching
 * - Relationship inference
 * - Path finding through meaning space
 * - Multi-hop reasoning
 */

const { SemanticBackend, Hypercomplex } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new SemanticBackend({ dimension: 16 });

// ===========================================
// KNOWLEDGE GRAPH CLASS
// ===========================================

class KnowledgeGraph {
    constructor(backend) {
        this.backend = backend;
        this.entities = new Map();
        this.relations = [];
        this.entityIndex = 0;
    }

    // Add an entity with properties
    addEntity(name, type, properties = {}) {
        const description = `${name} is a ${type}. ${Object.entries(properties).map(([k, v]) => `${k}: ${v}`).join('. ')}`;
        const id = ++this.entityIndex;
        
        this.entities.set(id, {
            id,
            name,
            type,
            properties,
            embedding: this.backend.textToOrderedState(description)
        });
        
        return id;
    }

    // Add a relationship between entities
    addRelation(fromId, relation, toId, properties = {}) {
        const from = this.entities.get(fromId);
        const to = this.entities.get(toId);
        if (!from || !to) throw new Error('Entity not found');

        const description = `${from.name} ${relation} ${to.name}`;
        
        this.relations.push({
            fromId,
            toId,
            relation,
            properties,
            embedding: this.backend.textToOrderedState(description)
        });
    }

    // Compute similarity
    similarity(a, b) {
        let dot = 0, magA = 0, magB = 0;
        for (let i = 0; i < a.c.length; i++) {
            dot += a.c[i] * b.c[i];
            magA += a.c[i] * a.c[i];
            magB += b.c[i] * b.c[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
    }

    // Find entities by semantic query
    findEntities(query, topK = 5) {
        const queryEmbed = this.backend.textToOrderedState(query);
        const results = [];

        for (const [id, entity] of this.entities) {
            const sim = this.similarity(queryEmbed, entity.embedding);
            results.push({ entity, similarity: sim });
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    // Find relations involving an entity
    getRelations(entityId, direction = 'both') {
        return this.relations.filter(r => {
            if (direction === 'out') return r.fromId === entityId;
            if (direction === 'in') return r.toId === entityId;
            return r.fromId === entityId || r.toId === entityId;
        });
    }

    // Semantic relation search
    findRelations(query, topK = 5) {
        const queryEmbed = this.backend.textToOrderedState(query);
        const results = [];

        for (const rel of this.relations) {
            const sim = this.similarity(queryEmbed, rel.embedding);
            results.push({ relation: rel, similarity: sim });
        }

        results.sort((a, b) => b.similarity - a.similarity);
        return results.slice(0, topK);
    }

    // Find paths between entities (BFS with semantic scoring)
    findPath(fromId, toId, maxDepth = 4) {
        const queue = [{ path: [fromId], relations: [] }];
        const visited = new Set([fromId]);

        while (queue.length > 0) {
            const { path, relations } = queue.shift();
            const currentId = path[path.length - 1];

            if (currentId === toId) {
                return { path, relations };
            }

            if (path.length >= maxDepth) continue;

            const nextRels = this.getRelations(currentId, 'out');
            for (const rel of nextRels) {
                const nextId = rel.fromId === currentId ? rel.toId : rel.fromId;
                if (!visited.has(nextId)) {
                    visited.add(nextId);
                    queue.push({
                        path: [...path, nextId],
                        relations: [...relations, rel]
                    });
                }
            }
        }

        return null; // No path found
    }

    // Multi-hop query (e.g., "friends of friends who like X")
    multiHopQuery(startId, hops) {
        let currentSet = new Set([startId]);

        for (const hop of hops) {
            const nextSet = new Set();
            for (const entityId of currentSet) {
                const rels = this.getRelations(entityId, 'out');
                for (const rel of rels) {
                    if (rel.relation === hop.relation) {
                        nextSet.add(rel.toId);
                    }
                }
            }
            currentSet = nextSet;
            if (currentSet.size === 0) break;
        }

        return Array.from(currentSet).map(id => this.entities.get(id));
    }
}

// ===========================================
// BUILD EXAMPLE GRAPH
// ===========================================

console.log('TinyAleph Knowledge Graph Example');
console.log('==================================\n');

const kg = new KnowledgeGraph(backend);

// Add people
console.log('Building knowledge graph...');
const alice = kg.addEntity('Alice', 'Person', { occupation: 'Engineer', city: 'San Francisco' });
const bob = kg.addEntity('Bob', 'Person', { occupation: 'Designer', city: 'New York' });
const carol = kg.addEntity('Carol', 'Person', { occupation: 'Scientist', city: 'Boston' });
const dave = kg.addEntity('Dave', 'Person', { occupation: 'Engineer', city: 'Seattle' });

// Add companies
const techCorp = kg.addEntity('TechCorp', 'Company', { industry: 'Technology', size: 'Large' });
const designStudio = kg.addEntity('DesignStudio', 'Company', { industry: 'Design', size: 'Small' });

// Add topics
const ai = kg.addEntity('Artificial Intelligence', 'Topic', { field: 'Computer Science' });
const ml = kg.addEntity('Machine Learning', 'Topic', { field: 'Computer Science' });

// Add relationships
kg.addRelation(alice, 'works_at', techCorp);
kg.addRelation(bob, 'works_at', designStudio);
kg.addRelation(carol, 'works_at', techCorp);
kg.addRelation(dave, 'works_at', techCorp);

kg.addRelation(alice, 'knows', bob);
kg.addRelation(alice, 'knows', carol);
kg.addRelation(bob, 'knows', carol);
kg.addRelation(carol, 'knows', dave);

kg.addRelation(alice, 'interested_in', ai);
kg.addRelation(carol, 'interested_in', ml);
kg.addRelation(dave, 'interested_in', ai);

console.log(`Created ${kg.entities.size} entities and ${kg.relations.length} relations\n`);

// ===========================================
// SEMANTIC QUERIES
// ===========================================

console.log('==================================');
console.log('Semantic Entity Search:');
console.log('==================================\n');

const queries = [
    'engineers in technology',
    'people interested in AI',
    'companies in design industry'
];

for (const q of queries) {
    console.log(`Query: "${q}"`);
    const results = kg.findEntities(q, 2);
    for (const { entity, similarity } of results) {
        console.log(`  [${similarity.toFixed(3)}] ${entity.name} (${entity.type})`);
    }
    console.log();
}

// ===========================================
// PATH FINDING
// ===========================================

console.log('==================================');
console.log('Path Finding:');
console.log('==================================\n');

console.log('Path from Alice to Dave:');
const path = kg.findPath(alice, dave);
if (path) {
    const pathNames = path.path.map(id => kg.entities.get(id).name);
    console.log(`  Path: ${pathNames.join(' → ')}`);
    console.log(`  Via: ${path.relations.map(r => r.relation).join(' → ')}`);
} else {
    console.log('  No path found');
}

// ===========================================
// MULTI-HOP QUERIES
// ===========================================

console.log('\n==================================');
console.log('Multi-Hop Query:');
console.log('==================================\n');

console.log('Who are friends-of-friends of Alice?');
const fof = kg.multiHopQuery(alice, [
    { relation: 'knows' },
    { relation: 'knows' }
]);
for (const entity of fof) {
    if (entity.id !== alice) {
        console.log(`  ${entity.name}`);
    }
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n==================================');
console.log('KEY TAKEAWAYS:');
console.log('1. Entities and relations are embedded with primes');
console.log('2. Semantic search finds similar entities by meaning');
console.log('3. Path finding discovers connections between entities');
console.log('4. Multi-hop queries traverse relationship chains');
console.log('5. Combine with reasoning for inference over the graph');
console.log('6. Scale to large graphs with indexing strategies');