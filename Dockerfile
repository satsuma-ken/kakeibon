FROM python:3.11-slim

ARG USERNAME=dev
ARG UID=1000
ARG GID=1000

# システムパッケージ（localesを追加）
RUN apt-get update && apt-get install -y locales

# 日本語ロケールを生成
RUN sed -i '/ja_JP.UTF-8/s/^# //g' /etc/locale.gen && \
    locale-gen ja_JP.UTF-8

# 環境変数で日本語ロケールを設定
ENV LANG=ja_JP.UTF-8
ENV LC_ALL=ja_JP.UTF-8
ENV LANGUAGE=ja_JP:ja

# システムパッケージ（localesを追加）
RUN apt-get update && apt-get install -y \
    git vim curl wget gh build-essential \
    && rm -rf /var/lib/apt/lists/*

# Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# ユーザー作成
RUN groupadd -g ${GID} ${USERNAME} \
 && useradd -m -u ${UID} -g ${GID} -s /bin/bash ${USERNAME}

USER ${USERNAME}
ENV HOME=/home/${USERNAME}

# npmのグローバルインストール先を設定
RUN mkdir -p ${HOME}/.npm-global
ENV NPM_CONFIG_PREFIX=${HOME}/.npm-global
ENV PATH="${HOME}/.npm-global/bin:${PATH}"

# Claude Code（ユーザー環境にインストール）
RUN npm install -g @anthropic-ai/claude-code

# UV ユーザ環境にインストール
RUN pip install --no-cache-dir uv
ENV PATH="${HOME}/.local/bin:$PATH"

WORKDIR /workspace
CMD ["/bin/bash"]