# # syntax=docker/dockerfile:1
# FROM python:3.11-slim

# ENV PYTHONDONTWRITEBYTECODE=1
# ENV PYTHONUNBUFFERED=1

# WORKDIR /app

# # psycopg2-binary を使う前提（requirements.txt に入っている想定）
# COPY requirements.txt .
# RUN pip install --no-cache-dir -r requirements.txt

# COPY . .

# # Cloud Run は $PORT を使う必要があります
# CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]

# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# いったんソースを /app に置く
COPY . .

# ✅ ここが重要：/app/api パッケージを作って、今のコードを丸ごとコピーする
#    （main.py が `from api.routers ...` を前提にしているため）
RUN mkdir -p /app/api && \
    cp -r \
      __init__.py \
      main.py \
      config.py \
      routers \
      db \
      deps \
      logic \
      models \
      schemas \
      services \
      tests \
    /app/api/

# Cloud Run は $PORT を使う
CMD ["sh", "-c", "uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8080}"]