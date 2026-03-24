"""
FAHIN — Flower Federated Learning Server
Coordinates model weight aggregation across hospital clients.
"""
import flwr as fl
import logging
import argparse
from typing import List, Tuple, Dict, Optional
from flwr.common import Metrics, Parameters, FitRes, EvaluateRes, ndarrays_to_parameters
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def weighted_average(metrics: List[Tuple[int, Metrics]]) -> Metrics:
    """FedAvg metric aggregation — weighted by number of training samples."""
    total = sum(num for num, _ in metrics)
    accuracies = [num * m.get("accuracy", 0) for num, m in metrics]
    losses = [num * m.get("loss", 0) for num, m in metrics]
    return {
        "accuracy": sum(accuracies) / total if total > 0 else 0,
        "loss": sum(losses) / total if total > 0 else 0,
        "total_samples": total,
    }


class FAHINStrategy(fl.server.strategy.FedAvg):
    """Custom FedAvg strategy with FAHIN-specific logging."""

    def __init__(self, **kwargs):
        super().__init__(
            fraction_fit=1.0,
            fraction_evaluate=0.5,
            min_fit_clients=kwargs.pop("min_clients", 2),
            min_evaluate_clients=1,
            min_available_clients=kwargs.pop("min_clients", 2),
            fit_metrics_aggregation_fn=weighted_average,
            evaluate_metrics_aggregation_fn=weighted_average,
            **kwargs,
        )
        self.round_metrics: List[Dict] = []

    def aggregate_fit(self, server_round: int, results, failures):
        aggregated = super().aggregate_fit(server_round, results, failures)
        n_clients = len(results)
        logger.info(f"[Round {server_round}] Aggregated weights from {n_clients} hospitals.")
        if failures:
            logger.warning(f"[Round {server_round}] {len(failures)} clients failed.")
        return aggregated

    def aggregate_evaluate(self, server_round: int, results, failures):
        aggregated = super().aggregate_evaluate(server_round, results, failures)
        if aggregated:
            loss, metrics = aggregated
            logger.info(
                f"[Round {server_round}] Global model — "
                f"loss={loss:.4f}, accuracy={metrics.get('accuracy', 0):.4f}, "
                f"samples={metrics.get('total_samples', 0)}"
            )
        return aggregated


def start_server(rounds: int = 20, min_clients: int = 2, port: int = 8080):
    strategy = FAHINStrategy(min_clients=min_clients)
    logger.info(f"Starting FAHIN FL server on port {port} | rounds={rounds} | min_clients={min_clients}")

    fl.server.start_server(
        server_address=f"0.0.0.0:{port}",
        config=fl.server.ServerConfig(num_rounds=rounds),
        strategy=strategy,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--rounds", type=int, default=20)
    parser.add_argument("--min_clients", type=int, default=2)
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()
    start_server(args.rounds, args.min_clients, args.port)
