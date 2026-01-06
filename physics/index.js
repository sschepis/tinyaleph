/**
 * Physics engine - exports all physics modules
 */

const { Oscillator, OscillatorBank } = require('./oscillator');
const { KuramotoModel } = require('./kuramoto');
const {
  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy
} = require('./entropy');
const {
  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin
} = require('./lyapunov');
const {
  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence
} = require('./collapse');

// Extended synchronization models
const {
  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling
} = require('./sync-models');

module.exports = {
  // Oscillators
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  
  // Extended synchronization models
  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling,
  
  // Entropy & Information
  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy,
  
  // Lyapunov stability
  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin,
  
  // State collapse
  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence
};