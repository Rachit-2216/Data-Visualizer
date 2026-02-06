export type LayerType =
  | 'Input'
  | 'Linear'
  | 'Conv2d'
  | 'MaxPool2d'
  | 'AvgPool2d'
  | 'LSTM'
  | 'Dropout'
  | 'Flatten'
  | 'BatchNorm'
  | 'ReLU'
  | 'Sigmoid'
  | 'Softmax'
  | 'Tanh'
  | 'GELU'
  | 'LeakyReLU'
  | 'Unknown';

export type LayerNode = {
  id: string;
  name: string;
  type: LayerType;
  params: Record<string, string | number>;
  inputShape?: string;
  outputShape?: string;
  activation?: string;
  sourceLine?: number;
};

export type ParsedModel = {
  layers: LayerNode[];
  errors: string[];
};
