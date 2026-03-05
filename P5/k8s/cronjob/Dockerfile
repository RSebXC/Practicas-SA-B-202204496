FROM python:3.11-slim
WORKDIR /app
RUN pip install psycopg2-binary pytz --no-cache-dir
COPY script.py .
CMD ["python", "script.py"]