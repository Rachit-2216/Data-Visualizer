import type { ParsedModel } from './model-types';

export function parseTensorflowModel(code: string): ParsedModel {
  return {
    layers: [],
    errors: [
      'TensorFlow/Keras parsing is not implemented yet. Use PyTorch nn.Sequential for now.',
    ],
  };
}

