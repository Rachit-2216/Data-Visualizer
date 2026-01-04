import type { ModelType } from '@/store/codeviz-store';

type Template = {
  id: string;
  name: string;
  modelType: ModelType;
  code: (inputSize: number, outputSize: number) => string;
};

export const presetTemplates: Template[] = [
  {
    id: 'mlp',
    name: 'Simple MLP',
    modelType: 'neural',
    code: (inputSize, outputSize) => `import torch.nn as nn

model = nn.Sequential(
    nn.Linear(${inputSize}, 64),
    nn.ReLU(),
    nn.Linear(64, 32),
    nn.ReLU(),
    nn.Linear(32, ${outputSize}),
    nn.Softmax(dim=1)
)`,
  },
  {
    id: 'cnn',
    name: 'CNN (VGG-style)',
    modelType: 'neural',
    code: (inputSize, outputSize) => `import torch.nn as nn

model = nn.Sequential(
    nn.Conv2d(3, 16, 3, 1, 1),
    nn.ReLU(),
    nn.Conv2d(16, 32, 3, 1, 1),
    nn.ReLU(),
    nn.Flatten(),
    nn.Linear(${inputSize}, 64),
    nn.ReLU(),
    nn.Linear(64, ${outputSize})
)`,
  },
  {
    id: 'lstm',
    name: 'RNN / LSTM',
    modelType: 'neural',
    code: (inputSize, outputSize) => `import torch.nn as nn

model = nn.Sequential(
    nn.LSTM(${inputSize}, 64),
    nn.Dropout(0.2),
    nn.Linear(64, ${outputSize})
)`,
  },
  {
    id: 'transformer',
    name: 'Transformer Block',
    modelType: 'neural',
    code: (inputSize, outputSize) => `import torch.nn as nn

model = nn.Sequential(
    nn.Linear(${inputSize}, 128),
    nn.ReLU(),
    nn.Linear(128, 128),
    nn.ReLU(),
    nn.Linear(128, ${outputSize})
)`,
  },
  {
    id: 'autoencoder',
    name: 'Autoencoder',
    modelType: 'neural',
    code: (inputSize, outputSize) => `import torch.nn as nn

model = nn.Sequential(
    nn.Linear(${inputSize}, 64),
    nn.ReLU(),
    nn.Linear(64, 16),
    nn.ReLU(),
    nn.Linear(16, 64),
    nn.ReLU(),
    nn.Linear(64, ${outputSize})
)`,
  },
];

export const baseExamples: Record<ModelType, string> = {
  neural: presetTemplates[0].code(9, 2),
  regression: `from sklearn.linear_model import LinearRegression

model = LinearRegression()
model.fit(X_train, y_train)

# Coefficients: [0.5, 0.3]
# R2 Score: 0.847`,
  logistic: `from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)

# Accuracy: 94.3%
# AUC: 0.967`,
  kmeans: `from sklearn.cluster import KMeans

model = KMeans(n_clusters=4, random_state=42)
model.fit(X)

# Inertia: 12.4
# Silhouette: 0.72`,
  pca: `from sklearn.decomposition import PCA

pca = PCA(n_components=3)
X_reduced = pca.fit_transform(X)

# Explained variance: [45%, 32%, 15%]`,
  tree: `from sklearn.tree import DecisionTreeClassifier

model = DecisionTreeClassifier(max_depth=2)
model.fit(X_train, y_train)

# Accuracy: 89.5%`,
};

