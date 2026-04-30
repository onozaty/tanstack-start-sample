FROM node:24-slim

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
    sudo \
    git \
    procps \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN mkdir -p /home/node/.claude && chown -R node:node /home/node/.claude
