# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY backend/go.mod backend/go.sum* ./
RUN go mod download 2>/dev/null || true

COPY backend/*.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o iretro-server .

# Runtime stage
FROM alpine:latest

WORKDIR /app
COPY --from=builder /app/iretro-server .
COPY web/ ./web/

EXPOSE 8080
ENV PORT=8080

CMD ["./iretro-server"]
