FROM node:24-alpine
WORKDIR /app
COPY server/package*.json ./server/
COPY server/vendor ./server/vendor
RUN npm ci --prefix server --omit=dev --legacy-peer-deps --install-links --ignore-scripts
COPY server/index.js ./server/index.js
COPY src/navigation.js ./src/navigation.js
COPY package.json ./package.json
ENV HOST=0.0.0.0
ENV PORT=8790
EXPOSE 8790
CMD ["node", "server/index.js"]
