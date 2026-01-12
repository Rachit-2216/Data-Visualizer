-- =====================================================
-- SEED DATA FOR DEMO MODE
-- =====================================================

-- Create a system user for demo data (or use NULL for anonymous)
-- Insert demo project (visible to all users)
INSERT INTO public.projects (id, user_id, name, description, is_demo, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  NULL,
  'Demo Project',
  'Explore DataCanvas features with sample datasets',
  TRUE,
  '{"color": "#0ea5e9"}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert Titanic dataset
INSERT INTO public.datasets (id, project_id, name, description, file_type, original_filename)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'Titanic',
  'Famous Titanic passenger survival dataset',
  'csv',
  'titanic.csv'
) ON CONFLICT (id) DO NOTHING;

-- Insert Titanic dataset version
INSERT INTO public.dataset_versions (id, dataset_id, version_number, storage_path, row_count, column_count, status)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  1,
  'demo/titanic.csv',
  891,
  12,
  'ready'
) ON CONFLICT (id) DO NOTHING;

-- Insert Titanic profile (comprehensive)
INSERT INTO public.dataset_profiles (id, version_id, schema_info, statistics, correlations, missing_values, warnings, sample_data)
VALUES (
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000003',
  '[
    {"name": "PassengerId", "type": "integer", "nullable": false},
    {"name": "Survived", "type": "integer", "nullable": false},
    {"name": "Pclass", "type": "integer", "nullable": false},
    {"name": "Name", "type": "string", "nullable": false},
    {"name": "Sex", "type": "string", "nullable": false},
    {"name": "Age", "type": "float", "nullable": true},
    {"name": "SibSp", "type": "integer", "nullable": false},
    {"name": "Parch", "type": "integer", "nullable": false},
    {"name": "Ticket", "type": "string", "nullable": false},
    {"name": "Fare", "type": "float", "nullable": false},
    {"name": "Cabin", "type": "string", "nullable": true},
    {"name": "Embarked", "type": "string", "nullable": true}
  ]'::jsonb,
  '{
    "PassengerId": {"min": 1, "max": 891, "mean": 446, "median": 446, "std": 257.35, "unique": 891},
    "Survived": {"min": 0, "max": 1, "mean": 0.384, "value_counts": {"0": 549, "1": 342}},
    "Pclass": {"min": 1, "max": 3, "mean": 2.31, "value_counts": {"1": 216, "2": 184, "3": 491}},
    "Sex": {"unique": 2, "value_counts": {"male": 577, "female": 314}},
    "Age": {"min": 0.42, "max": 80, "mean": 29.7, "median": 28, "std": 14.53, "missing": 177},
    "SibSp": {"min": 0, "max": 8, "mean": 0.523, "median": 0},
    "Parch": {"min": 0, "max": 6, "mean": 0.382, "median": 0},
    "Fare": {"min": 0, "max": 512.33, "mean": 32.2, "median": 14.45, "std": 49.69},
    "Cabin": {"unique": 147, "missing": 687},
    "Embarked": {"unique": 3, "value_counts": {"S": 644, "C": 168, "Q": 77}, "missing": 2}
  }'::jsonb,
  '{
    "Survived_Pclass": -0.338,
    "Survived_Age": -0.077,
    "Survived_Fare": 0.257,
    "Pclass_Age": -0.369,
    "Pclass_Fare": -0.549,
    "Age_Fare": 0.096,
    "SibSp_Parch": 0.415
  }'::jsonb,
  '{
    "Age": {"count": 177, "percentage": 19.87},
    "Cabin": {"count": 687, "percentage": 77.10},
    "Embarked": {"count": 2, "percentage": 0.22}
  }'::jsonb,
  '[
    {"type": "missing_values", "column": "Age", "message": "19.9% missing values", "severity": "medium"},
    {"type": "missing_values", "column": "Cabin", "message": "77.1% missing values", "severity": "high"},
    {"type": "high_cardinality", "column": "Name", "message": "High cardinality (891 unique values)", "severity": "info"},
    {"type": "imbalanced", "column": "Survived", "message": "Target variable is imbalanced (38.4% positive class)", "severity": "info"}
  ]'::jsonb,
  '[
    {"PassengerId": 1, "Survived": 0, "Pclass": 3, "Name": "Braund, Mr. Owen Harris", "Sex": "male", "Age": 22, "SibSp": 1, "Parch": 0, "Ticket": "A/5 21171", "Fare": 7.25, "Cabin": null, "Embarked": "S"},
    {"PassengerId": 2, "Survived": 1, "Pclass": 1, "Name": "Cumings, Mrs. John Bradley", "Sex": "female", "Age": 38, "SibSp": 1, "Parch": 0, "Ticket": "PC 17599", "Fare": 71.28, "Cabin": "C85", "Embarked": "C"},
    {"PassengerId": 3, "Survived": 1, "Pclass": 3, "Name": "Heikkinen, Miss. Laina", "Sex": "female", "Age": 26, "SibSp": 0, "Parch": 0, "Ticket": "STON/O2. 3101282", "Fare": 7.925, "Cabin": null, "Embarked": "S"},
    {"PassengerId": 4, "Survived": 1, "Pclass": 1, "Name": "Futrelle, Mrs. Jacques Heath", "Sex": "female", "Age": 35, "SibSp": 1, "Parch": 0, "Ticket": "113803", "Fare": 53.1, "Cabin": "C123", "Embarked": "S"},
    {"PassengerId": 5, "Survived": 0, "Pclass": 3, "Name": "Allen, Mr. William Henry", "Sex": "male", "Age": 35, "SibSp": 0, "Parch": 0, "Ticket": "373450", "Fare": 8.05, "Cabin": null, "Embarked": "S"}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Insert Iris dataset
INSERT INTO public.datasets (id, project_id, name, description, file_type, original_filename)
VALUES (
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000001',
  'Iris',
  'Classic Iris flower classification dataset',
  'csv',
  'iris.csv'
) ON CONFLICT (id) DO NOTHING;

-- Insert Iris dataset version
INSERT INTO public.dataset_versions (id, dataset_id, version_number, storage_path, row_count, column_count, status)
VALUES (
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000005',
  1,
  'demo/iris.csv',
  150,
  5,
  'ready'
) ON CONFLICT (id) DO NOTHING;

-- Insert Iris profile
INSERT INTO public.dataset_profiles (id, version_id, schema_info, statistics, correlations, missing_values, warnings, sample_data)
VALUES (
  '00000000-0000-0000-0000-000000000007',
  '00000000-0000-0000-0000-000000000006',
  '[
    {"name": "sepal_length", "type": "float", "nullable": false},
    {"name": "sepal_width", "type": "float", "nullable": false},
    {"name": "petal_length", "type": "float", "nullable": false},
    {"name": "petal_width", "type": "float", "nullable": false},
    {"name": "species", "type": "string", "nullable": false}
  ]'::jsonb,
  '{
    "sepal_length": {"min": 4.3, "max": 7.9, "mean": 5.84, "median": 5.8, "std": 0.83, "unique": 35},
    "sepal_width": {"min": 2.0, "max": 4.4, "mean": 3.06, "median": 3.0, "std": 0.44, "unique": 23},
    "petal_length": {"min": 1.0, "max": 6.9, "mean": 3.76, "median": 4.35, "std": 1.77, "unique": 43},
    "petal_width": {"min": 0.1, "max": 2.5, "mean": 1.2, "median": 1.3, "std": 0.76, "unique": 22},
    "species": {"unique": 3, "value_counts": {"setosa": 50, "versicolor": 50, "virginica": 50}}
  }'::jsonb,
  '{
    "sepal_length_sepal_width": -0.118,
    "sepal_length_petal_length": 0.872,
    "sepal_length_petal_width": 0.818,
    "sepal_width_petal_length": -0.428,
    "sepal_width_petal_width": -0.366,
    "petal_length_petal_width": 0.963
  }'::jsonb,
  '{}'::jsonb,
  '[
    {"type": "balanced", "column": "species", "message": "Target variable is perfectly balanced", "severity": "info"},
    {"type": "high_correlation", "columns": ["petal_length", "petal_width"], "message": "Very high correlation (0.96)", "severity": "info"}
  ]'::jsonb,
  '[
    {"sepal_length": 5.1, "sepal_width": 3.5, "petal_length": 1.4, "petal_width": 0.2, "species": "setosa"},
    {"sepal_length": 4.9, "sepal_width": 3.0, "petal_length": 1.4, "petal_width": 0.2, "species": "setosa"},
    {"sepal_length": 7.0, "sepal_width": 3.2, "petal_length": 4.7, "petal_width": 1.4, "species": "versicolor"},
    {"sepal_length": 6.3, "sepal_width": 3.3, "petal_length": 6.0, "petal_width": 2.5, "species": "virginica"},
    {"sepal_length": 5.8, "sepal_width": 2.7, "petal_length": 5.1, "petal_width": 1.9, "species": "virginica"}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;
