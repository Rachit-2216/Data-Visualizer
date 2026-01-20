from typing import Iterable, Tuple
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def split_features(
    df: pd.DataFrame,
    target_column: str | None,
    feature_columns: Iterable[str] | None = None,
) -> Tuple[pd.DataFrame, pd.Series | None]:
    if target_column:
        if target_column not in df.columns:
            raise ValueError(f"Target column '{target_column}' not found")
        features = df.drop(columns=[target_column])
        if feature_columns:
            features = features[list(feature_columns)]
        target = df[target_column]
        return features, target

    if feature_columns:
        features = df[list(feature_columns)]
    else:
        features = df.copy()
    return features, None


def build_preprocessor(features: pd.DataFrame) -> ColumnTransformer:
    numeric_cols = features.select_dtypes(include=["number", "bool"]).columns.tolist()
    categorical_cols = [
        col for col in features.columns if col not in numeric_cols
    ]

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ],
        remainder="drop",
    )


def align_features(df: pd.DataFrame, feature_columns: Iterable[str]) -> pd.DataFrame:
    aligned = df.copy()
    for col in feature_columns:
        if col not in aligned.columns:
            aligned[col] = None
    return aligned[list(feature_columns)]
