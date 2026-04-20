FROM oven/bun:latest

WORKDIR /app

# Only copy lockfiles first so dependency layer can cache.
COPY package.json bun.lock* ./
RUN bun install

# App source is bind-mounted in docker-compose for local development.
EXPOSE 5173

CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "5173"]
