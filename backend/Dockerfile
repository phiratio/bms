FROM strapi/base

WORKDIR /src/app

COPY ./package.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["npm", "start"]