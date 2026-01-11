/**
 * Backends - exports all domain backends
 */

import { Backend } from './interface.js';
import SemanticBackend from './semantic/index.js';
import CryptographicBackend from './cryptographic/index.js';
import ScientificBackend from './scientific/index.js';

import bioinformatics from './bioinformatics/index.js';

export default {
  Backend,
  SemanticBackend,
  CryptographicBackend,
  ScientificBackend,
  
  // Bioinformatics backend
  BioinformaticsBackend: bioinformatics.BioinformaticsBackend,
  
  // Bioinformatics operators
  TranscriptionOperator: bioinformatics.TranscriptionOperator,
  TranslationOperator: bioinformatics.TranslationOperator,
  FoldingTransform: bioinformatics.FoldingTransform,
  BindingAffinityCalculator: bioinformatics.BindingAffinityCalculator,
  MolecularDocker: bioinformatics.MolecularDocker,
  
  // DNA Computing
  DNAStrand: bioinformatics.DNAStrand,
  DNADuplex: bioinformatics.DNADuplex,
  ANDGate: bioinformatics.ANDGate,
  ORGate: bioinformatics.ORGate,
  NOTGate: bioinformatics.NOTGate,
  NANDGate: bioinformatics.NANDGate,
  DNACircuit: bioinformatics.DNACircuit,
  StrandDisplacementReaction: bioinformatics.StrandDisplacementReaction,
  
  // Full bioinformatics module
  bioinformatics
};