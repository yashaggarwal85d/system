# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
# This needs to be copied before installing dependencies
COPY requirements.txt /app/

# Install any needed packages specified in requirements.txt
# Run the installation from the WORKDIR /app
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r /app/requirements.txt

# Copy the backend application code (from the build context, which is the 'backend' folder)
# into a 'backend' subdirectory within the WORKDIR /app
# This creates the structure /app/backend/main.py, /app/backend/routers/, etc.
COPY . /app/backend/

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Run uvicorn when the container launches
# Point to the 'app' instance within the 'backend.main' module
# Uvicorn runs from the WORKDIR /app, so it can find the 'backend' package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
