FROM oven/bun:1.2.15

WORKDIR /app

COPY . .

RUN bun install && bun run build

EXPOSE 4500

CMD ["bun", "start"]
