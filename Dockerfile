FROM node:latest
WORKDIR /app
RUN apt-get update
RUN apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev -y
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . .
RUN pnpx prisma generate
RUN pnpm build

CMD ["node", "build/index.js"]