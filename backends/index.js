/**
 * Backends - exports all domain backends
 */

const { Backend } = require('./interface');
const { SemanticBackend } = require('./semantic');
const { CryptographicBackend } = require('./cryptographic');
const { ScientificBackend } = require('./scientific');
const bioinformatics = require('./bioinformatics');

module.exports = {
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