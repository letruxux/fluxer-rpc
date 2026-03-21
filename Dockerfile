FROM oven/bun:latest

WORKDIR /app

COPY . .
ENV RUN_MODE=docker

RUN bun install

CMD ["bun", "run", "start"]