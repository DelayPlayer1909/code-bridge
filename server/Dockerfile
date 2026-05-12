# Stage 1: Build the project
FROM node:18-alpine AS builder

WORKDIR /build

# Install Python and Java for build stage
RUN apk add --no-cache python3 openjdk17

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code and build the project
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: Runner
FROM node:18-alpine AS runner

WORKDIR /app

# Install Python and Java in runner stage too (needed at runtime)
RUN apk add --no-cache python3 openjdk17

# Set JAVA_HOME for Alpine
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk
ENV PATH="${JAVA_HOME}/bin:${PATH}"

# Copy build artifacts
COPY --from=builder /build/dist dist/
COPY --from=builder /build/public public/
COPY --from=builder /build/node_modules /node_modules
COPY --from=builder /build/package*.json .

EXPOSE 3000

CMD ["npm", "run", "start"]