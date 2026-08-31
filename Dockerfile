FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    STORAGE_DIR=/data \
    DB_PATH=/data/cludari.db \
    AUTH_DB=/data/auth.db \
    DATA_DIR=/data/data

WORKDIR /app

COPY requirements.railway.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Railway Volume should be mounted here. The bootstrap copies the bundled
# v69 databases into it only on first boot.
RUN mkdir -p /data/data

EXPOSE 8000
CMD ["python", "railway_start.py"]
