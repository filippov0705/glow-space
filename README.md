add .env to each service (apps/auth/.env)

npx prisma migrate dev

build shared project:
cd packages/shared && npm run build

run auth microservice:
~/glow-space/apps/auth

npm run start

~/glow-space/apps/user

npx prisma migrate dev --name add_cities
npx prisma db seed

npx prisma generate
