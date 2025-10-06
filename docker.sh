#!/bin/bash

APP_NAME="seekcontrol"
IMAGE_NAME="seekcontrol-image"

# Build ulang image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME .

# Cek apakah container sudah ada
if [ "$(docker ps -aq -f name=^${APP_NAME}$)" ]; then
  echo "🛑 Stopping & removing old container..."
  docker stop $APP_NAME >/dev/null 2>&1
  docker rm $APP_NAME >/dev/null 2>&1
fi

# Run container baru
echo "🚀 Running new container..."
docker run -d --name $APP_NAME -p 3000:3000 $IMAGE_NAME
