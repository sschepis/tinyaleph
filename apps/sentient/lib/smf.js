/**
 * Sedenion Memory Field (SMF)
 * 
 * Re-exports from tinyaleph core library.
 * @see ../../observer/smf.js for implementation
 * 
 * @module apps/sentient/lib/smf
 */

// Re-export from library
export {
    SedenionMemoryField,
    SMF_AXES,
    AXIS_INDEX,
    SMF_CODEBOOK,
    CODEBOOK_SIZE,
    nearestCodebookAttractor,
    codebookTunnel,
    getTunnelingCandidates
} from '../../../observer/smf.js';
