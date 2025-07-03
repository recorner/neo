FROM node:20.8.1

WORKDIR /app

# Install necessary system dependencies
RUN apt-get update \
    && apt-get install -y build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Install global packages
RUN npm install -g pnpm

# Install Winston logger locally in your project
RUN pnpm add winston

# Copy package.json and pnpm-lock.yaml to install project dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy the rest of your application files
COPY . .

# Generate Prisma client
RUN pnpx prisma generate

# Build your application
RUN pnpm build

# Copy the startup script into the container
COPY startup.sh /app/startup.sh

# Grant execute permission to the startup script this is the one that handles the jwt key generation 
RUN chmod +x /app/startup.sh

# Entrypoint
CMD ["/app/startup.sh", "node", "build/index.js"]
