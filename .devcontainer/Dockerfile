FROM node:24-slim

RUN npm install -g pnpm

RUN apt-get update && apt-get install -y \
    sudo \
    git \
    procps \
    curl \
    && rm -rf /var/lib/apt/lists/*

# GitHub CLI (gh) を公式 apt リポジトリからインストール
RUN apt-get update && apt-get install -y gnupg ca-certificates \
    && mkdir -p -m 755 /etc/apt/keyrings \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
       | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

RUN echo "node ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/node \
    && chmod 0440 /etc/sudoers.d/node

RUN mkdir -p /home/node/.claude && chown -R node:node /home/node/.claude

# E2E (Playwright) のブラウザを system-wide な固定パスへ配置する
# - PLAYWRIGHT_BROWSERS_PATH: 各ユーザの ~/.cache を使わず /opt 配下に共有
# - PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: pnpm install 時の二重 DL を抑止
ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Playwright のバージョンは package.json の @playwright/test と必ず揃える。
# package.json 側を上げたのにここを忘れると、ブラウザのバージョン不整合で
# E2E 起動時に「Executable doesn't exist at ...」のエラーが出る。
# (両者を一致させて Dev Container をリビルドすれば解消する)
RUN npx -y playwright@1.59.1 install --with-deps chromium \
    && chmod -R o+rx /opt/playwright
