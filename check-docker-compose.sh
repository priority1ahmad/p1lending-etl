#!/bin/bash
# Check which docker-compose command is available

if command -v docker-compose &> /dev/null; then
    echo "docker-compose (v1 standalone) is available"
    docker-compose --version
elif docker compose version &> /dev/null; then
    echo "docker compose (v2 plugin) is available"
    docker compose version
else
    echo "No docker-compose found!"
    exit 1
fi
