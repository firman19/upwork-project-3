# Use official Node.js LTS version
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy rest of the project
COPY . .

# Optional: Set default command (can be overridden in CLI)
CMD [ "node", "index.js" ]
