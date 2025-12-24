FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends gcc g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# Copy Python packages FIRST
COPY --from=builder /usr/local /usr/local

# Install runtime dependencies AFTER (so nmap is not overwritten)
RUN apt-get update && apt-get install -y --no-install-recommends nmap iputils-ping curl libcap2-bin && setcap cap_net_raw,cap_net_admin,cap_net_bind_service+eip /usr/bin/nmap && rm -rf /var/lib/apt/lists/*

COPY . .
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD curl -f http://localhost:8000/health || exit 1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
