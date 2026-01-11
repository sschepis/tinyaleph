/**
 * Physics engine - exports all physics modules
 */

import { Oscillator, OscillatorBank } from './oscillator.js';
import { KuramotoModel } from './kuramoto.js';

import {  shannonEntropy,
  stateEntropy,
  coherence,
  mutualInformation,
  relativeEntropy,
  jointEntropy,
  oscillatorEntropy  } from './entropy.js';
import {  estimateLyapunov,
  classifyStability,
  adaptiveCoupling,
  localLyapunov,
  delayEmbedding,
  stabilityMargin  } from './lyapunov.js';
import {  collapseProbability,
  shouldCollapse,
  measureState,
  collapseToIndex,
  bornMeasurement,
  partialCollapse,
  applyDecoherence  } from './collapse.js';

// Extended synchronization models
import {  NetworkKuramoto,
  AdaptiveKuramoto,
  SakaguchiKuramoto,
  SmallWorldKuramoto,
  MultiSystemCoupling,
  createHierarchicalCoupling,
  createPeerCoupling  } from './sync-models.js';

// Stochastic Kuramoto models
import {  StochasticKuramoto,
  ColoredNoiseKuramoto,
  ThermalKuramoto,
  gaussianRandom  } from './stochastic-kuramoto.js';

// Primeon Z-Ladder with canonical U evolution
import {  PrimeonZLadderU,
  createPrimeonLadder,
  shannonEntropyNats,
  probsOf,
  normalize as normalizeComplex,
  C as Complex  } from './primeon_z_ladder_u.js';

// Multi-channel Primeon Z-Ladder
import {  ZChannel,
  PrimeonZLadderMulti,
  createMultiChannelLadder,
  createAdiabaticSchedule  } from './primeon_z_ladder_multi.js';

// Kuramoto-coupled ladder (hybrid quantum + oscillator dynamics)
import {  KuramotoCoupledLadder,
  createKuramotoLadder,
  runCollapsePressureExperiment,
  kuramotoOrderParameter,
  getPhase  } from './kuramoto-coupled-ladder.js';

export {
    Oscillator,
    OscillatorBank,
    KuramotoModel,
    NetworkKuramoto,
    AdaptiveKuramoto,
    SakaguchiKuramoto,
    SmallWorldKuramoto,
    MultiSystemCoupling,
    createHierarchicalCoupling,
    createPeerCoupling,
    StochasticKuramoto,
    ColoredNoiseKuramoto,
    ThermalKuramoto,
    gaussianRandom,
    PrimeonZLadderU,
    createPrimeonLadder,
    shannonEntropyNats,
    probsOf,
    normalizeComplex,
    Complex,
    ZChannel,
    PrimeonZLadderMulti,
    createMultiChannelLadder,
    createAdiabaticSchedule,
    KuramotoCoupledLadder,
    createKuramotoLadder,
    runCollapsePressureExperiment,
    kuramotoOrderParameter,
    getPhase,
    shannonEntropy,
    stateEntropy,
    coherence,
    mutualInformation,
    relativeEntropy,
    jointEntropy,
    oscillatorEntropy,
    estimateLyapunov,
    classifyStability,
    adaptiveCoupling,
    localLyapunov,
    delayEmbedding,
    stabilityMargin,
    collapseProbability,
    shouldCollapse,
    measureState,
    collapseToIndex,
    bornMeasurement,
    partialCollapse,
    applyDecoherence
};