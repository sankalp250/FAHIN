# Contributing to FAHIN

## Code Standards

- Python: Black formatter, isort, type hints on all functions
- TypeScript: ESLint + Prettier, strict mode
- Commits: Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`)

## PR Process

1. Open an issue first for any significant change
2. Branch naming: `feature/short-description` or `fix/short-description`
3. All PRs require at least one reviewer approval
4. CI must pass (linting, type checks, tests)

## Testing

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test

# ML models
cd ml && python evaluation/evaluate_all.py --quick
```
