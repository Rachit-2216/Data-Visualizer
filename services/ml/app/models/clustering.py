from typing import Any, Tuple
from sklearn.cluster import KMeans, MiniBatchKMeans, DBSCAN, AgglomerativeClustering


def create_clusterer(algorithm: str, params: dict[str, Any]) -> Tuple[Any, str]:
    algo = algorithm.lower()
    if algo in {"kmeans", "auto"}:
        model = KMeans(
            n_clusters=params.get("n_clusters", 3),
            n_init=params.get("n_init", "auto"),
            random_state=params.get("random_state", 42),
        )
        return model, "sklearn"

    if algo in {"minibatch", "minibatch_kmeans"}:
        model = MiniBatchKMeans(
            n_clusters=params.get("n_clusters", 3),
            batch_size=params.get("batch_size", 1024),
            n_init=params.get("n_init", "auto"),
            random_state=params.get("random_state", 42),
        )
        return model, "sklearn"

    if algo == "dbscan":
        model = DBSCAN(
            eps=params.get("eps", 0.5),
            min_samples=params.get("min_samples", 5),
        )
        return model, "sklearn"

    if algo in {"agglomerative", "hierarchical"}:
        model = AgglomerativeClustering(
            n_clusters=params.get("n_clusters", 3),
            linkage=params.get("linkage", "ward"),
        )
        return model, "sklearn"

    raise ValueError(f"Unsupported clustering algorithm: {algorithm}")
