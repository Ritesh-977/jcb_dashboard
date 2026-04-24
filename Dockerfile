# 1. Start with a lightweight Python environment
FROM python:3.10-slim

# 2. Set the working directory inside the container
WORKDIR /app

# 3. Copy your requirements and install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy the compiled React frontend into the container
COPY frontend/dist /app/frontend/dist

# 5. Copy your entire backend code into the container
COPY backend /app/backend

# 6. Change working directory to backend so Uvicorn runs correctly
WORKDIR /app/backend

# 7. Expose the port Snowflake will look for (8000 is standard for FastAPI)
EXPOSE 8000

# 8. Start the FastAPI server using Uvicorn
# Note: Assuming your FastAPI 'app' instance is initialized in app/main.py
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]