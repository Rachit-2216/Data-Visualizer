import type { LayerNode, LayerType, ParsedModel } from './model-types';

type ParseOptions = {
  inputSize?: number;
};

const generateId = (index: number) => `tf-layer-${index}-${Date.now()}`;

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
  const match = value.match(/-?\d+(\.\d+)?/);
  if (!match) return undefined;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : undefined;
};

const extractNamedArg = (args: string[], key: string) => {
  const match = args.find((arg) => arg.startsWith(`${key}=`));
  return match ? match.split('=').slice(1).join('=') : undefined;
};

const normalizeLayerType = (raw: string): LayerType | null => {
  switch (raw) {
    case 'Dense':
    case 'Linear':
      return 'Linear';
    case 'Conv2D':
    case 'Conv2d':
      return 'Conv2d';
    case 'MaxPooling2D':
    case 'MaxPool2D':
      return 'MaxPool2d';
    case 'AveragePooling2D':
    case 'AvgPool2D':
      return 'AvgPool2d';
    case 'Flatten':
      return 'Flatten';
    case 'Dropout':
      return 'Dropout';
    case 'BatchNormalization':
      return 'BatchNorm';
    case 'ReLU':
      return 'ReLU';
    case 'Activation':
      return 'Unknown';
    case 'LSTM':
      return 'LSTM';
    case 'Softmax':
      return 'Softmax';
    default:
      return null;
  }
};

const mapActivation = (value?: string): LayerType | null => {
  if (!value) return null;
  const cleaned = value.replace(/['"]/g, '').toLowerCase();
  switch (cleaned) {
    case 'relu':
      return 'ReLU';
    case 'sigmoid':
      return 'Sigmoid';
    case 'tanh':
      return 'Tanh';
    case 'softmax':
      return 'Softmax';
    case 'gelu':
      return 'GELU';
    case 'leakyrelu':
    case 'leaky_relu':
      return 'LeakyReLU';
    default:
      return null;
  }
};

const formatShape = (shape?: Array<number | string>) => {
  if (!shape || shape.length === 0) return undefined;
  return `[${shape.join(', ')}]`;
};

export function parseTensorflowModel(code: string, options: ParseOptions = {}): ParsedModel {
  const errors: string[] = [];
  const layers: LayerNode[] = [];
  let currentShape: Array<number | string> | undefined = options.inputSize
    ? [options.inputSize]
    : undefined;

  const lines = code
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  lines.forEach((line, index) => {
    const addMatch = line.match(/model\.add\((.*)\)/);
    const targetLine = addMatch ? addMatch[1] : line;
    const match = targetLine.match(
      /(?:tf\.)?(?:keras\.)?(?:layers\.)?([A-Za-z0-9_]+)\((.*)\)/
    );
    if (!match) return;
    const rawType = match[1];
    const args = splitArgs(match[2] ?? '');
    const mappedType = normalizeLayerType(rawType);
    if (!mappedType) return;

    const params: Record<string, string | number> = {};
    const inputShape = formatShape(currentShape);

    if (mappedType === 'Linear') {
      const units = parseNumber(args[0]) ?? parseNumber(extractNamedArg(args, 'units'));
      const inputDim = parseNumber(extractNamedArg(args, 'input_dim'));
      if (!currentShape && inputDim) {
        currentShape = [inputDim];
      }
      if (units) {
        params.out_features = units;
        if (currentShape?.[0]) {
          params.in_features = Number(currentShape[0]);
        }
        currentShape = [units];
      }
    } else if (mappedType === 'Conv2d') {
      const filters = parseNumber(args[0]) ?? parseNumber(extractNamedArg(args, 'filters'));
      const kernel = parseNumber(args[1]) ?? parseNumber(extractNamedArg(args, 'kernel_size'));
      const inputShapeArg = extractNamedArg(args, 'input_shape');
      if (!currentShape && inputShapeArg) {
        const shapeMatch = inputShapeArg.match(/-?\d+(\.\d+)?/g);
        if (shapeMatch && shapeMatch.length >= 2) {
          const nums = shapeMatch.map((value) => Number(value));
          currentShape = [nums[2] ?? nums[0], nums[0], nums[1]];
        }
      }
      if (filters) params.out_channels = filters;
      if (kernel) params.kernel = kernel;
      if (filters) {
        currentShape = [filters, 'H', 'W'];
      }
    } else if (mappedType === 'MaxPool2d' || mappedType === 'AvgPool2d') {
      const kernel = parseNumber(args[0]) ?? parseNumber(extractNamedArg(args, 'pool_size')) ?? 2;
      params.kernel = kernel;
    } else if (mappedType === 'Dropout') {
      const prob = parseNumber(args[0]) ?? parseNumber(extractNamedArg(args, 'rate'));
      if (prob !== undefined) params.p = prob;
    } else if (mappedType === 'LSTM') {
      const units = parseNumber(args[0]) ?? parseNumber(extractNamedArg(args, 'units'));
      if (units) params.hidden_size = units;
      currentShape = units ? [units] : currentShape;
    }

    const outputShape = formatShape(currentShape);
    const activationArg = extractNamedArg(args, 'activation');
    const activationLayer = mapActivation(activationArg);

    layers.push({
      id: generateId(index),
      name: `${rawType}${layers.length + 1}`,
      type: mappedType,
      params,
      inputShape,
      outputShape,
      activation: activationArg?.replace(/['"]/g, ''),
      sourceLine: index + 1,
    });

    if (activationLayer) {
      layers.push({
        id: generateId(index + 100),
        name: `${activationLayer}${layers.length + 1}`,
        type: activationLayer,
        params: {},
        inputShape: outputShape,
        outputShape,
        sourceLine: index + 1,
      });
    }
  });

  if (!layers.length) {
    errors.push('No TensorFlow/Keras layers detected. Use Sequential or model.add().');
  }

  return { layers, errors };
}
