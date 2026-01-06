/**
 * @example Content-Addressable Storage
 * @description Use content hashes as addresses for deduplication
 * 
 * Content-addressable storage uses the hash of content as its address:
 * - Identical content always has the same address
 * - Enables automatic deduplication
 * - Used in Git, IPFS, and other systems
 */

const { CryptographicBackend } = require('../../modular');

// ===========================================
// SETUP
// ===========================================

const backend = new CryptographicBackend({ dimension: 32 });

console.log('TinyAleph Content-Addressable Storage Example');
console.log('=============================================\n');

// ===========================================
// CONTENT-ADDRESSABLE STORE
// ===========================================

function ContentStore() {
    this.objects = {};
    this.refs = {};
}

ContentStore.prototype.hash = function(content) {
    return backend.hash(content, 32).toString('hex');
};

ContentStore.prototype.put = function(content) {
    var hash = this.hash(content);
    if (!this.objects[hash]) {
        this.objects[hash] = content;
        return { hash: hash, new: true };
    }
    return { hash: hash, new: false, deduplicated: true };
};

ContentStore.prototype.get = function(hash) {
    return this.objects[hash];
};

ContentStore.prototype.has = function(hash) {
    return !!this.objects[hash];
};

ContentStore.prototype.setRef = function(name, hash) {
    this.refs[name] = hash;
};

ContentStore.prototype.getRef = function(name) {
    return this.refs[name];
};

ContentStore.prototype.stats = function() {
    return {
        objectCount: Object.keys(this.objects).length,
        refCount: Object.keys(this.refs).length,
        totalSize: Object.values(this.objects).reduce(function(sum, obj) {
            return sum + obj.length;
        }, 0)
    };
};

// ===========================================
// BASIC USAGE
// ===========================================

console.log('Basic Content-Addressable Storage:');
console.log('-'.repeat(50) + '\n');

var store = new ContentStore();

var content1 = 'Hello, World!';
var content2 = 'Goodbye, World!';
var content3 = 'Hello, World!';  // Duplicate

var result1 = store.put(content1);
var result2 = store.put(content2);
var result3 = store.put(content3);

console.log('Storing content:');
console.log('  "' + content1 + '" -> ' + result1.hash.substring(0, 16) + '... (new: ' + result1.new + ')');
console.log('  "' + content2 + '" -> ' + result2.hash.substring(0, 16) + '... (new: ' + result2.new + ')');
console.log('  "' + content3 + '" -> ' + result3.hash.substring(0, 16) + '... (new: ' + result3.new + ', dedup: ' + result3.deduplicated + ')');

console.log('\nRetrieving by hash:');
console.log('  ' + result1.hash.substring(0, 16) + '... -> "' + store.get(result1.hash) + '"');

// ===========================================
// DEDUPLICATION
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Automatic Deduplication:');
console.log('='.repeat(50) + '\n');

var dedupStore = new ContentStore();

// Simulate storing files with duplicates
var files = [
    { name: 'doc1.txt', content: 'This is document content.' },
    { name: 'doc2.txt', content: 'Different document content.' },
    { name: 'doc3.txt', content: 'This is document content.' },  // Duplicate of doc1
    { name: 'doc4.txt', content: 'Another unique document.' },
    { name: 'doc5.txt', content: 'This is document content.' }   // Duplicate of doc1
];

var fileRefs = {};
var stats = { stored: 0, deduplicated: 0 };

console.log('Storing files:\n');

for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var result = dedupStore.put(file.content);
    fileRefs[file.name] = result.hash;
    
    if (result.new) {
        stats.stored++;
        console.log('  ' + file.name + ': STORED (new content)');
    } else {
        stats.deduplicated++;
        console.log('  ' + file.name + ': DEDUPLICATED (content exists)');
    }
}

console.log('\nDeduplication stats:');
console.log('  Total files: ' + files.length);
console.log('  Unique stored: ' + stats.stored);
console.log('  Deduplicated: ' + stats.deduplicated);
console.log('  Space saved: ' + (stats.deduplicated / files.length * 100).toFixed(0) + '%');

// ===========================================
// VERSIONED STORAGE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Version Control with Content Addressing:');
console.log('='.repeat(50) + '\n');

function VersionedDocument(store, name) {
    this.store = store;
    this.name = name;
    this.versions = [];
}

VersionedDocument.prototype.update = function(content) {
    var result = this.store.put(content);
    this.versions.push({
        hash: result.hash,
        timestamp: new Date().toISOString(),
        version: this.versions.length + 1
    });
    return result;
};

VersionedDocument.prototype.getVersion = function(version) {
    var versionInfo = this.versions[version - 1];
    if (!versionInfo) return null;
    return {
        content: this.store.get(versionInfo.hash),
        ...versionInfo
    };
};

VersionedDocument.prototype.latest = function() {
    return this.getVersion(this.versions.length);
};

VersionedDocument.prototype.history = function() {
    return this.versions;
};

var vStore = new ContentStore();
var doc = new VersionedDocument(vStore, 'readme.md');

console.log('Creating document versions:\n');

doc.update('# Version 1\n\nInitial content.');
doc.update('# Version 2\n\nAdded more details.');
doc.update('# Version 3\n\nFinal version with all content.');

console.log('Version history:');
var history = doc.history();
for (var i = 0; i < history.length; i++) {
    var v = history[i];
    console.log('  v' + v.version + ': ' + v.hash.substring(0, 16) + '...');
}

console.log('\nRetrieving specific versions:');
var v1 = doc.getVersion(1);
var v3 = doc.latest();
console.log('  v1: "' + v1.content.substring(0, 25) + '..."');
console.log('  v3: "' + v3.content.substring(0, 25) + '..."');

// ===========================================
// MERKLE TREE
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('Merkle Tree (Hash Tree):');
console.log('='.repeat(50) + '\n');

function buildMerkleTree(items) {
    if (items.length === 0) return null;
    
    // Hash all leaves
    var leaves = items.map(function(item) {
        return backend.hash(item, 32).toString('hex');
    });
    
    var tree = [leaves];
    
    // Build tree bottom-up
    while (leaves.length > 1) {
        var level = [];
        for (var i = 0; i < leaves.length; i += 2) {
            var left = leaves[i];
            var right = leaves[i + 1] || left;  // Duplicate last if odd
            var combined = backend.hash(left + right, 32).toString('hex');
            level.push(combined);
        }
        tree.push(level);
        leaves = level;
    }
    
    return {
        root: leaves[0],
        tree: tree
    };
}

var dataBlocks = ['Block A', 'Block B', 'Block C', 'Block D'];
var merkle = buildMerkleTree(dataBlocks);

console.log('Data blocks: ' + dataBlocks.join(', '));
console.log('\nMerkle Tree:');
console.log('  Root: ' + merkle.root.substring(0, 32) + '...');
console.log('  Levels: ' + merkle.tree.length);

for (var level = merkle.tree.length - 1; level >= 0; level--) {
    var indent = '  '.repeat(merkle.tree.length - level);
    console.log(indent + 'Level ' + level + ': ' + merkle.tree[level].length + ' nodes');
}

// ===========================================
// KEY TAKEAWAYS
// ===========================================

console.log('\n' + '='.repeat(50));
console.log('KEY TAKEAWAYS:');
console.log('1. Hash of content becomes its address');
console.log('2. Identical content always has same address');
console.log('3. Automatic deduplication saves storage');
console.log('4. Versions can coexist with shared content');
console.log('5. Merkle trees enable efficient verification');
console.log('6. Used in Git, IPFS, blockchains, and more');