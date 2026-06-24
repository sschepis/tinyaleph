/**
 * Server Module Index
 *
 * Exports all server route handlers and utilities.
 */

import { loggers, setCorsHeaders, sendJson, readBody, generateNodeId, getSenseSummary, SMF_AXES, SMF_AXIS_DESCRIPTIONS, colors } from './utils.js';
import { createChatHandlers } from './chat-handler.js';
import { createLearningRoutes } from './learning-routes.js';
import { createObserverRoutes } from './observer-routes.js';
import { createStreamRoutes } from './stream-routes.js';
import { createWebRTCRoutes } from './webrtc-routes.js';
import { createProviderRoutes } from './provider-routes.js';
import { createNetworkSync } from './network-sync.js';
import { createStaticServer, MIME_TYPES } from './static-server.js';

export {
    // Utilities
    loggers,
    setCorsHeaders,
    sendJson,
    readBody,
    generateNodeId,
    getSenseSummary,
    SMF_AXES,
    SMF_AXIS_DESCRIPTIONS,
    colors,
    MIME_TYPES,
    
    // Route factories
    createChatHandlers,
    createLearningRoutes,
    createObserverRoutes,
    createStreamRoutes,
    createWebRTCRoutes,
    createProviderRoutes,
    createNetworkSync,
    createStaticServer
};
