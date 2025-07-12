FROM node:20

# ติดตั้ง ffmpeg, imagemagick, jq, zip, unzip
RUN apt update && apt install -y ffmpeg imagemagick jq zip unzip

# เตรียมแอป
WORKDIR /app
COPY . .

# ติดตั้ง npm dependencies
RUN npm install

# รันแอป
CMD ["node", "server.js"]