# Official Bun image (Debian-based) — Bun, Node-compatible APIs, TS out of the box
FROM oven/bun:1-debian

# Create a non-root user matching devcontainer conventions
ARG USERNAME=bun
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# The base image already ships with a `bun` user; we just make sure it owns workspace dirs
USER root

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    git \
    curl \
    ca-certificates \
    openssh-client \
    procps \
    # Triplex previews WebGL scenes; these libs help native dependencies that sometimes
    # sneak in (sharp, canvas, etc.). Safe to keep.
    libnss3 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libasound2 \
    && rm -rf /var/lib/apt/lists/*

# Make sure node_modules volume mount is writable by the bun user
RUN mkdir -p /workspaces && chown -R bun:bun /workspaces

USER bun

# Bun cache lives in the container so it survives rebuilds if you volume-mount it later
ENV PATH="/home/bun/.bun/bin:${PATH}"

WORKDIR /workspaces
