add .env to each service (apps/auth/.env)

npx prisma migrate dev

build shared project:
cd packages/shared && npm run build

run auth microservice:
~/glow-space/apps/auth

npm run start
