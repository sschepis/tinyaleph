/**
 * Autonomous Learning System
 * 
 * Exports all components for the autonomous learning capability
 * of the Sentient Observer.
 * 
 * Components:
 * - SafetyFilter: Enforces whitelists, sandboxing, and content filtering
 * - ChaperoneAPI: Trusted intermediary for all external requests
 * - CuriosityEngine: Detects knowledge gaps and generates learning signals
 * - QueryFormulator: Transforms curiosity into actionable queries
 * - ContentIngester: Processes fetched content for memory integration
 * - ReflectionLoop: Consolidates learning and generates insights
 * - AutonomousLearner: Main learning loop orchestrator
 */

import { SafetyFilter } from './safety-filter.js';
import { ChaperoneAPI } from './chaperone.js';
import { CuriosityEngine, SMF_AXES, AXIS_QUERIES } from './curiosity.js';
import { QueryFormulator } from './query.js';
import { ContentIngester } from './ingester.js';
import { ReflectionLoop } from './reflector.js';
import { AutonomousLearner } from './learner.js';
import { NextStepGenerator, createNextStepGenerator } from './next-steps.js';
import config from './config.js';

/**
 * Create a complete learning system
 * @param {Object} observer - The SentientObserver instance
 * @param {Object} options - Configuration options
 * @returns {Object} Learning system components
 */
function createLearningSystem(observer, options = {}) {
    // Create safety filter
    const safetyFilter = new SafetyFilter(options.safety);
    
    // Create chaperone API
    const chaperone = new ChaperoneAPI({
        ...options.chaperone,
        safetyFilter
    });
    
    // Create autonomous learner
    const learner = new AutonomousLearner(observer, chaperone, {
        curiosity: options.curiosity,
        query: options.query,
        ingester: options.ingester,
        reflector: options.reflector,
        ...options.learner
    });
    
    // Create next-step suggestion generator
    const nextStepGenerator = createNextStepGenerator(options.nextSteps);
    
    return {
        safetyFilter,
        chaperone,
        learner,
        nextStepGenerator,
        
        // Convenience accessors
        curiosityEngine: learner.curiosityEngine,
        queryFormulator: learner.queryFormulator,
        contentIngester: learner.contentIngester,
        reflector: learner.reflector
    };
}

export {
    // Classes
    SafetyFilter,
    ChaperoneAPI,
    CuriosityEngine,
    QueryFormulator,
    ContentIngester,
    ReflectionLoop,
    AutonomousLearner,
    NextStepGenerator,
    
    // Constants
    SMF_AXES,
    AXIS_QUERIES,
    config,
    
    // Factories
    createLearningSystem,
    createNextStepGenerator
};