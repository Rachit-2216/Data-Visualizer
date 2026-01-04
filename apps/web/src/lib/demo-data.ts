export type ColumnType = 'numeric' | 'categorical' | 'text' | 'datetime' | 'boolean' | 'id';

export type DatasetColumn = {
  name: string;
  type: ColumnType;
};

export type DatasetProfile = {
  dataset: {
    name: string;
    version: number;
    status: 'ready' | 'profiling' | 'failed';
    uploadedAt: string;
  };
  stats: {
    rowCount: number;
    columnCount: number;
    memoryMb: number;
    duplicateRows: number;
    missingCells: number;
  };
  warnings: Array<{
    severity: 'high' | 'med' | 'low';
    message: string;
  }>;
  columnTypes: {
    numeric: number;
    categorical: number;
    text: number;
    datetime: number;
    boolean: number;
  };
};

export type DemoDataset = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  rowCount: number;
  columns: DatasetColumn[];
  sampleRows: Array<Record<string, unknown>>;
  profile: DatasetProfile;
  isProtected?: boolean;
};

export type DemoProject = {
  id: string;
  name: string;
  createdAt: string;
  isProtected?: boolean;
};

export const demoProject: DemoProject = {
  id: 'demo-project',
  name: 'Demo Project',
  createdAt: '2024-01-01T08:00:00Z',
  isProtected: true,
};

const titanicColumns: DatasetColumn[] = [
  { name: 'PassengerId', type: 'id' },
  { name: 'Survived', type: 'categorical' },
  { name: 'Pclass', type: 'categorical' },
  { name: 'Name', type: 'text' },
  { name: 'Sex', type: 'categorical' },
  { name: 'Age', type: 'numeric' },
  { name: 'SibSp', type: 'numeric' },
  { name: 'Parch', type: 'numeric' },
  { name: 'Fare', type: 'numeric' },
  { name: 'Embarked', type: 'categorical' },
];

const irisColumns: DatasetColumn[] = [
  { name: 'sepal_length', type: 'numeric' },
  { name: 'sepal_width', type: 'numeric' },
  { name: 'petal_length', type: 'numeric' },
  { name: 'petal_width', type: 'numeric' },
  { name: 'species', type: 'categorical' },
];

export const demoDatasets: Record<string, DemoDataset[]> = {
  [demoProject.id]: [
    {
      id: 'demo-titanic',
      projectId: demoProject.id,
      name: 'Titanic Dataset',
      createdAt: '2024-01-15T10:30:00Z',
      rowCount: 891,
      columns: titanicColumns,
      sampleRows: [
        {
          PassengerId: 1,
          Survived: 0,
          Pclass: 3,
          Name: 'Braund, Mr. Owen Harris',
          Sex: 'male',
          Age: 22,
          SibSp: 1,
          Parch: 0,
          Fare: 7.25,
          Embarked: 'S',
        },
        {
          PassengerId: 2,
          Survived: 1,
          Pclass: 1,
          Name: 'Cumings, Mrs. John Bradley',
          Sex: 'female',
          Age: 38,
          SibSp: 1,
          Parch: 0,
          Fare: 71.2833,
          Embarked: 'C',
        },
      ],
      profile: {
        dataset: {
          name: 'Titanic Dataset',
          version: 1,
          status: 'ready',
          uploadedAt: '2024-01-15T10:30:00Z',
        },
        stats: {
          rowCount: 891,
          columnCount: titanicColumns.length,
          memoryMb: 0.15,
          duplicateRows: 0,
          missingCells: 866,
        },
        warnings: [
          { severity: 'high', message: 'Column "Age" has 19.9% missing values' },
          { severity: 'med', message: 'Column "Cabin" has 77.1% missing values' },
          { severity: 'low', message: 'High cardinality in "Name" column' },
        ],
        columnTypes: {
          numeric: 4,
          categorical: 4,
          text: 1,
          datetime: 0,
          boolean: 0,
        },
      },
      isProtected: true,
    },
    {
      id: 'demo-iris',
      projectId: demoProject.id,
      name: 'Iris Dataset',
      createdAt: '2024-01-20T09:15:00Z',
      rowCount: 150,
      columns: irisColumns,
      sampleRows: [
        {
          sepal_length: 5.1,
          sepal_width: 3.5,
          petal_length: 1.4,
          petal_width: 0.2,
          species: 'setosa',
        },
        {
          sepal_length: 6.2,
          sepal_width: 3.4,
          petal_length: 5.4,
          petal_width: 2.3,
          species: 'virginica',
        },
      ],
      profile: {
        dataset: {
          name: 'Iris Dataset',
          version: 1,
          status: 'ready',
          uploadedAt: '2024-01-20T09:15:00Z',
        },
        stats: {
          rowCount: 150,
          columnCount: irisColumns.length,
          memoryMb: 0.02,
          duplicateRows: 1,
          missingCells: 0,
        },
        warnings: [
          { severity: 'low', message: 'Minor duplicate rows detected' },
        ],
        columnTypes: {
          numeric: 4,
          categorical: 1,
          text: 0,
          datetime: 0,
          boolean: 0,
        },
      },
      isProtected: true,
    },
  ],
};
