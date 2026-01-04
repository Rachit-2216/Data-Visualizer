import type { LayerNode, LayerType, ParsedModel } from './model-types';

type ParseOptions = {
  inputSize?: number;
};

const generateId = (index: number) => `layer-${index}-${Date.now()}`;

const splitArgs = (args: string) => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < args.length; i += 1) {
    const ch = args[i];
    if (ch === '(') depth += 1;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const parseNumber = (value?: string) => {
  if (!value) return undefined;
  const num = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : undefined;
};

const normalizeLayerType = (raw: string): LayerType => {
  switch (raw) {
    case 'Linear':
    case 'Conv2d':
    case 'LSTM':
    case 'Dropout':
    case 'BatchNorm1d':
    case 'BatchNorm2d':
    case 'Flatten':
    case 'ReLU':
    case 'Sigmoid':
    case 'Softmax':
    case 'Tanh':
    case 'GELU':
    case 'LeakyReLU':
      if (raw === 'BatchNorm1d' || raw === 'BatchNorm2d') {
        return 'BatchNorm';
      }
      return raw as LayerType;
    default:
      return 'Unknown';
  }
};

const formatShape = (shape?: Array<number | string>) => {
  if (!shape || shape.length === 0) return undefined;
  return `[${shape.join(', ')}]`;
};

export function parsePyTorchSequential(code: string, options: ParseOptions = {}): ParsedModel {
  const errors: string[] = [];
  const layers: LayerNode[] = [];

  const sequentialMatch = code.match(/nn\.Sequential\s*\(([\s\S]*?)\)\s*/m);
  if (!sequentialMatch) {
    return {
      layers: [],
      errors: ['No nn.Sequential block found.'],
    };
  }

  const body = sequentialMatch[1];
  const lines = body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  let currentShape: Array<number | string> | undefined = options.inputSize
    ? [options.inputSize]
    : undefined;

  lines.forEach((line, index) => {
    const match = line.match(/nn\.([A-Za-z0-9_]+)\((.*)\)\s*,?/);
    if (!match) return;
    const rawType = match[1];
    const args = splitArgs(match[2] ?? '');
    const type = normalizeLayerType(rawType);
    const params: Record<string, string | number> = {};
    let activation: string | undefined;

    const inputShape = formatShape(currentShape);

    if (type === 'Linear') {
      const inFeatures = parseNumber(args[0]);
      const outFeatures = parseNumber(args[1]);
      if (inFeatures) params.in_features = inFeatures;
      if (outFeatures) params.out_features = outFeatures;
      currentShape = outFeatures ? [outFeatures] : currentShape;
    } else if (type === 'Conv2d') {
      const inChannels = parseNumber(args[0]);
      const outChannels = parseNumber(args[1]);
      const kernelSize = parseNumber(args[2]);
      const stride = parseNumber(args[3]) ?? 1;
      const padding = parseNumber(args[4]) ?? 0;
      if (inChannels) params.in_channels = inChannels;
      if (outChannels) params.out_channels = outChannels;
      if (kernelSize) params.kernel = kernelSize;
      if (stride) params.stride = stride;
      if (padding) params.padding = padding;
      if (currentShape && currentShape.length >= 3 && outChannels && kernelSize) {
        const height = Number(currentShape[1]);
        const width = Number(currentShape[2]);
        if (Number.isFinite(height) && Number.isFinite(width)) {
          const outH = Math.floor((height + 2 * padding - kernelSize) / stride) + 1;
          const outW = Math.floor((width + 2 * padding - kernelSize) / stride) + 1;
          currentShape = [outChannels, outH, outW];
        } else {
          currentShape = [outChannels, 'H', 'W'];
        }
      } else if (outChannels) {
        currentShape = [outChannels, 'H', 'W'];
      }
    } else if (type === 'LSTM') {
      const inputSize = parseNumber(args[0]);
      const hiddenSize = parseNumber(args[1]);
      if (inputSize) params.input_size = inputSize;
      if (hiddenSize) params.hidden_size = hiddenSize;
      currentShape = hiddenSize ? [hiddenSize] : currentShape;
    } else if (type === 'Dropout') {
      const prob = parseNumber(args[0]);
      if (prob !== undefined) params.p = prob;
    } else if (type === 'Flatten') {
      if (currentShape && currentShape.length > 1) {
        const flat = currentShape.reduce((acc, val) => {
          const num = Number(val);
          return Number.isFinite(num) ? acc * num : acc;
        }, 1);
        currentShape = [flat || 'N'];
      }
    } else if (type === 'BatchNorm') {
      const features = parseNumber(args[0]);
      if (features) params.features = features;
    } else if (type !== 'Unknown') {
      activation = type;
    } else {
      params.raw = args.join(', ');
    }

    const outputShape = formatShape(currentShape);

    layers.push({
      id: generateId(index),
      name: `${rawType}${layers.length + 1}`,
      type,
      params,
      inputShape,
      outputShape,
      activation,
      sourceLine: index + 1,
    });
  });

  if (!layers.length) {
    errors.push('No layers detected inside nn.Sequential.');
  }

  return { layers, errors };
}
