"""
FAHIN — Symptom Embedding Model Training
Architecture: BioBERT fine-tuned with contrastive learning
Input: Raw symptom text
Output: 768-dim embedding vector (same-disease symptoms cluster together)
"""
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModel
import pandas as pd
import numpy as np
from pathlib import Path
import argparse
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_NAME = "dmis-lab/biobert-base-cased-v1.2"


class SymptomDataset(Dataset):
    """Pairs of (symptom_text, disease_label) for contrastive learning."""
    def __init__(self, df: pd.DataFrame, tokenizer):
        self.tokenizer = tokenizer
        self.samples = []
        symptom_cols = [c for c in df.columns if c.startswith("symptom_")]
        for _, row in df.iterrows():
            syms = [str(row[c]).strip() for c in symptom_cols if pd.notna(row[c]) and str(row[c]).strip()]
            text = ", ".join(syms[:8])  # max 8 symptoms
            self.samples.append((text, str(row["disease"]).strip()))

    def __len__(self): return len(self.samples)
    def __getitem__(self, i):
        text, label = self.samples[i]
        enc = self.tokenizer(text, max_length=128, padding="max_length", truncation=True, return_tensors="pt")
        return {k: v.squeeze(0) for k, v in enc.items()}, label


def mean_pool(last_hidden, attention_mask):
    mask = attention_mask.unsqueeze(-1).expand(last_hidden.size()).float()
    return (last_hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9)


class SymptomEmbedder(nn.Module):
    def __init__(self, model_name=MODEL_NAME):
        super().__init__()
        self.bert = AutoModel.from_pretrained(model_name)
        self.projection = nn.Linear(768, 768)

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        kw = dict(input_ids=input_ids, attention_mask=attention_mask)
        if token_type_ids is not None: kw["token_type_ids"] = token_type_ids
        out = self.bert(**kw)
        pooled = mean_pool(out.last_hidden_state, attention_mask)
        return nn.functional.normalize(self.projection(pooled), dim=-1)


def supervised_contrastive_loss(embeddings, labels, temp=0.07):
    """SupCon loss: same-disease embeddings pulled together."""
    device = embeddings.device
    labels = torch.tensor([hash(l) % 10000 for l in labels], device=device)
    sim = torch.mm(embeddings, embeddings.T) / temp
    mask_pos = (labels.unsqueeze(0) == labels.unsqueeze(1)).float()
    mask_pos.fill_diagonal_(0)
    log_prob = sim - torch.logsumexp(sim, dim=1, keepdim=True)
    loss = -(mask_pos * log_prob).sum(1) / mask_pos.sum(1).clamp(min=1)
    return loss.mean()


def train(data_path: str, output_dir: str, epochs: int = 10, batch_size: int = 32):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    df = pd.read_csv(data_path)
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    dataset = SymptomDataset(df, tokenizer)
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=2)
    logger.info(f"Dataset: {len(dataset)} samples on {DEVICE}")

    model = SymptomEmbedder().to(DEVICE)
    optimiser = torch.optim.AdamW(model.parameters(), lr=2e-5, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimiser, T_max=epochs)

    best_loss = float("inf")
    for epoch in range(epochs):
        model.train()
        losses = []
        for batch, labels in loader:
            batch = {k: v.to(DEVICE) for k, v in batch.items()}
            optimiser.zero_grad()
            emb = model(**batch)
            loss = supervised_contrastive_loss(emb, labels)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimiser.step()
            losses.append(loss.item())
        mean_loss = np.mean(losses)
        scheduler.step()
        logger.info(f"Epoch {epoch+1}/{epochs} | Loss: {mean_loss:.4f}")
        if mean_loss < best_loss:
            best_loss = mean_loss
            torch.save(model.state_dict(), output_path / "model_best.pt")

    torch.save(model.state_dict(), output_path / "model.pt")
    tokenizer.save_pretrained(output_path / "tokenizer")
    with open(output_path / "metadata.json", "w") as f:
        json.dump({"base_model": MODEL_NAME, "embedding_dim": 768, "best_loss": float(best_loss), "epochs": epochs}, f)
    logger.info(f"Symptom embedder saved to {output_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data",   required=True)
    parser.add_argument("--output", default="ml/models/symptom_embedding/")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=32)
    args = parser.parse_args()
    train(args.data, args.output, args.epochs, args.batch_size)
