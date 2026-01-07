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

// Stochastic Kuramoto models
const {
  StochasticKuramoto,
  ColoredNoiseKuramoto,
  ThermalKuramoto,
  gaussianRandom
} = require('./stochastic-kuramoto');

// Primeon Z-Ladder with canonical U evolution
const {
  PrimeonZLadderU,
  createPrimeonLadder,
  shannonEntropyNats,
  probsOf,
  normalize: normalizeComplex,
  C: Complex
} = require('./primeon_z_ladder_u');

// Multi-channel Primeon Z-Ladder
const {
  ZChannel,
  PrimeonZLadderMulti,
  createMultiChannelLadder,
  createAdiabaticSchedule
} = require('./primeon_z_ladder_multi');

// Kuramoto-coupled ladder (hybrid quantum + oscillator dynamics)
const {
  KuramotoCoupledLadder,
  createKuramotoLadder,
  runCollapsePressureExperiment,
  kuramotoOrderParameter,
  getPhase
} = require('./kuramoto-coupled-ladder');

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
  
  // Stochastic Kuramoto models
  StochasticKuramoto,
  ColoredNoiseKuramoto,
  ThermalKuramoto,
  gaussianRandom,
  
  // Primeon Z-Ladder (canonical U evolution)
  PrimeonZLadderU,
  createPrimeonLadder,
  shannonEntropyNats,
  probsOf,
  normalizeComplex,
  Complex,
  
  // Multi-channel Primeon Z-Ladder
  ZChannel,
  PrimeonZLadderMulti,
  createMultiChannelLadder,
  createAdiabaticSchedule,
  
  // Kuramoto-coupled ladder (hybrid model)
  KuramotoCoupledLadder,
  createKuramotoLadder,
  runCollapsePressureExperiment,
  kuramotoOrderParameter,
  getPhase,
  
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