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

module.exports = {
  // Oscillators
  Oscillator,
  OscillatorBank,
  KuramotoModel,
  
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