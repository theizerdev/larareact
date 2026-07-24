FROM cgr.dev/chainguard/node:latest-dev@sha256:b5c250974c575fcab4476d315c6b927c7e3da166357949ad4aca6a330630bd82 AS deps

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM cgr.dev/chainguard/node:latest@sha256:f05865c39e39728adbd1dd5b418e853694631e8818cf1468a5b6b73d65889b15

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create sessions directory and drop root privileges.
RUN mkdir -p sessions

USER 65532

EXPOSE 3001

# Health check without curl to avoid extra runtime packages.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "const http=require('http');const port=process.env.PORT||3001;const req=http.get({host:'127.0.0.1',port,path:'/health',timeout:4000},res=>process.exit(res.statusCode>=200&&res.statusCode<400?0:1));req.on('error',()=>process.exit(1));req.on('timeout',()=>{req.destroy();process.exit(1);});"]

CMD ["start.js"]