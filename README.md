# QuickFood API

API de restaurantes construída com Node.js, Express, Prisma e PostgreSQL.
Autenticação via JWT.

Desenvolvido por **Matheus Pedro** ([@maathkyx](https://github.com/maathkyx)).

## Como rodar

1. Clone o repositório:
   ```bash
   git clone https://github.com/maathkyx/quickfood-api.git
   cd quickfood-api
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o arquivo `.env` a partir do `.env.example` e preencha os valores.

4. Rode as migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Inicie o servidor:
   ```bash
   node server.js
   ```

## Endpoints

- `GET  /restaurants` — lista restaurantes (público)
- `POST /restaurants` — cadastra restaurante (exige token)
- `POST /auth/register` — cadastra usuário
- `POST /auth/login` — faz login e devolve um token JWT
- `GET  /auth/me` — dados do usuário logado (exige token)
