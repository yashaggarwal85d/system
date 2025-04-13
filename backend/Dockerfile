# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Use --no-cache-dir to reduce image size
# Use --compile to byte-compile for faster startup (optional)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container at /app
# This includes main.py, routers/, utils/, etc.
COPY . .

# Make port 8000 available to the world outside this container
EXPOSE 8000

# Define environment variable (optional, can be overridden)
ENV MODULE_NAME="backend.main"
ENV VARIABLE_NAME="app"

# Run uvicorn when the container launches
# Use --host 0.0.0.0 to make it accessible from outside the container
# Use --port 8000 to match the EXPOSE instruction
# Use --reload for development (optional, remove for production)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
