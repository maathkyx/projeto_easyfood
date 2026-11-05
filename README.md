```markdown
# EasyFood API

API de restaurantes construída com Node.js, Express, Prisma e PostgreSQL.
Autenticação via JWT.

## Como rodar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do `.env.example` e preencha os valores.

3. Rode as migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Inicie o servidor:
   ```bash
   node server.js
   ```

## Endpoints

- `GET  /restaurants` — lista restaurantes (público)
- `GET  /restaurants?category=X` — lista restaurantes, com filtro opcional por categoria (público)
- `GET  /restaurants/stats` — total, categorias e avaliação média (público)
- `POST /restaurants` — cadastra restaurante: nome, categoria, endereço, telefone, avaliação (exige token)
- `PUT  /restaurants/:id` — edita restaurante (exige token; só o dono)
- `DELETE /restaurants/:id` — exclui restaurante e seus pratos (exige token; só o dono)
- `POST /auth/register` — cadastra usuário
- `POST /auth/login` — faz login e devolve um token JWT
- `GET  /auth/me` — dados do usuário logado (exige token)
- `POST /restaurants/:restaurantId/dishes` — cadastra prato (exige token; só o dono do restaurante)
- `GET  /restaurants/:restaurantId/dishes` — cardápio, já com `imageUrl` (público)
- `POST /auth/me/image` — foto do perfil do usuário logado (exige token; multipart, campo `image`)
- `POST /dishes/:dishId/image` — imagem do prato (exige token; multipart, campo `image`)
- `GET  /uploads/...` — acesso às imagens salvas

Imagens: JPEG, PNG ou WebP, até 5 MB. São redimensionadas (máx. 800px) e convertidas para WebP pelo Sharp
em `src/modules/shared/image.service.js`, usado por `auth` e `dishes`.

O front-end fica em `public/index.html` e é aberto em `http://localhost:3000`.
