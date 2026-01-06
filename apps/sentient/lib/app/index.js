/**
 * Application Module Index
 * 
 * Exports all application components for the Sentient Observer.
 */

const { colors, MIME_TYPES } = require('./constants');
const { parseArgs, printHelp } = require('./args');
const { 
    getSentientSystemPrompt, 
    initializeObserver, 
    truncateToolContent, 
    clearScreen, 
    Spinner 
} = require('./shared');
const { SentientCLI } = require('./cli');
const { SentientServer } = require('./server');

module.exports = {
    // Constants
    colors,
    MIME_TYPES,
    
    // Argument parsing
    parseArgs,
    printHelp,
    
    // Shared utilities
    getSentientSystemPrompt,
    initializeObserver,
    truncateToolContent,
    clearScreen,
    Spinner,
    
    // Main application classes
    SentientCLI,
    SentientServer
};