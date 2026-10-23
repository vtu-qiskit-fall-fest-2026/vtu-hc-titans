FROM node:20-slim AS frontend-build

WORKDIR /app/frontend
COPY frontend/ ./
RUN npm install && npm run build

FROM python:3.12-slim

WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 5000
CMD gunicorn wsgi:app --bind 0.0.0.0:${PORT:-5000} --workers 1 --timeout 120
