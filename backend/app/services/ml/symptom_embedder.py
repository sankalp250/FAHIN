"""
FAHIN — Symptom Embedding Service
Wraps the fine-tuned BioBERT model for symptom vectorization.
"""
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def mean_pool(last_hidden, attention_mask):
    mask = attention_mask.unsqueeze(-1).expand(last_hidden.size()).float()
    return (last_hidden * mask).sum(1) / mask.sum(1).clamp(min=1e-9)

class SymptomEmbedder(nn.Module):
    def __init__(self, model_name="dmis-lab/biobert-base-cased-v1.2"):
        super().__init__()
        self.bert = AutoModel.from_pretrained(model_name)
        self.projection = nn.Linear(768, 768)

    def forward(self, input_ids, attention_mask, token_type_ids=None):
        kw = dict(input_ids=input_ids, attention_mask=attention_mask)
        if token_type_ids is not None: kw["token_type_ids"] = token_type_ids
        out = self.bert(**kw)
        pooled = mean_pool(out.last_hidden_state, attention_mask)
        return nn.functional.normalize(self.projection(pooled), dim=-1)

class SymptomEmbedderService:
    def __init__(self, model_path: Path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path / "tokenizer")
        self.model = SymptomEmbedder()
        
        # Load state dict
        state_dict = torch.load(model_path / "model.pt", map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Symptom Embedder loaded on {self.device}")

    def embed(self, symptoms: list[str]) -> list[float]:
        """Convert a list of symptoms into a 768-dim normalized vector."""
        text = ", ".join(symptoms)
        inputs = self.tokenizer(
            text, 
            max_length=128, 
            padding="max_length", 
            truncation=True, 
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            embedding = self.model(**inputs)
        
        return embedding.squeeze(0).cpu().tolist()
