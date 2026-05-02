FROM node:24-slim

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
    sudo \
    git \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN mkdir -p /home/node/.claude && chown -R node:node /home/node/.claude

# E2E (Playwright) のブラウザを system-wide な固定パスへ配置する
# - PLAYWRIGHT_BROWSERS_PATH: 各ユーザの ~/.cache を使わず /opt 配下に共有
# - PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: pnpm install 時の二重 DL を抑止
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Playwright のバージョンは package.json の @playwright/test と必ず揃える
RUN npx -y playwright@1.59.1 install --with-deps chromium \
    && chmod -R o+rx /opt/playwright
