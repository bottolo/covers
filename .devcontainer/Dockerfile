FROM oven/bun:1-debian

ARG USERNAME=bun

USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        openssh-client \
        procps \
        sudo \
        libnss3 \
        libatk-bridge2.0-0 \
        libgtk-3-0 \
        libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Give the bun user passwordless sudo (dev container only — never in prod)
RUN echo "${USERNAME} ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/${USERNAME} \
    && chmod 0440 /etc/sudoers.d/${USERNAME}

RUN mkdir -p /workspaces && chown -R bun:bun /workspaces

USER bun

ENV PATH="/home/bun/.bun/bin:${PATH}"

WORKDIR /workspaces
