FROM node:22-bookworm-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN chown -R node:node /app

EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 CMD node -e "fetch('http://127.0.0.1:5173').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

USER node
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
