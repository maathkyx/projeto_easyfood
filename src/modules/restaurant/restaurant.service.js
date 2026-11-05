const prisma = require("../../database/prisma");
const emailService = require("../shared/email.service");
const activityService = require("../shared/activity.service");
const imageService = require("../shared/image.service");

// Para quem o comercial recebe os avisos (no futuro, virá do .env ou do banco)
const COMERCIAL_EMAIL = "felipe.oliveira@pro.fecaf.com.br";

// Lista com filtro opcional por categoria (mais recentes primeiro)
async function listRestaurants({ category } = {}) {
  return prisma.restaurant.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" }
  });
}

async function getRestaurantById(id) {
  return prisma.restaurant.findUnique({ where: { id } });
}

async function createRestaurant(data, user) {
  // 1) O que realmente importa: cadastrar o restaurante
  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      category: data.category,
      address: data.address,
      phone: data.phone,
      rating: data.rating || 0,
      ownerId: user.id // ⬅️ grava o dono (quem está logado, vindo do token)
    }
  });

  // 2) Ações secundárias — cada uma isolada por try/catch.
  //    Se qualquer uma falhar, o cadastro NÃO é afetado.

  // E-mail de boas-vindas (usa o serviço genérico)
  try {
    await emailService.sendEmail({
      to: user.email, // e-mail de quem cadastrou (vindo do token)
      toName: restaurant.name,
      subject: `Bem-vindo à EasyFood, ${restaurant.name}!`,
      header: `Olá, ${restaurant.name}!`,
      body: `Seu restaurante <strong>${restaurant.name}</strong> foi cadastrado com sucesso na EasyFood. Categoria: ${restaurant.category}.`,
      footer: "Equipe EasyFood"
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de boas-vindas:", error.message);
  }

  // Registro da atividade
  try {
    await activityService.log("RESTAURANT_CREATED", `Restaurante: ${restaurant.name}`);
  } catch (error) {
    console.error("Erro ao registrar atividade:", error.message);
  }

  // Alerta para o comercial (MESMA função genérica, outro conteúdo)
  try {
    await emailService.sendEmail({
      to: COMERCIAL_EMAIL,
      toName: "Comercial EasyFood",
      subject: `Novo restaurante cadastrado: ${restaurant.name}`,
      header: "Novo restaurante na plataforma",
      body: `Nome: ${restaurant.name}<br/>Categoria: ${restaurant.category}<br/>Avaliação: ${restaurant.rating}`,
      footer: "Notificação automática — EasyFood"
    });
  } catch (error) {
    console.error("Erro ao notificar o comercial:", error.message);
  }

  // 3) O restaurante volta independente do resultado das ações acima
  return restaurant;

  // --- Envio de sms função 
}


// --------createrestaurant.event

// Atualiza só os campos enviados
async function updateRestaurant(id, data) {
  return prisma.restaurant.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.address !== undefined ? { address: data.address } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.rating !== undefined ? { rating: data.rating } : {})
    }
  });
}

// Os pratos referenciam o restaurante (FK RESTRICT): apagamos os pratos junto, na mesma transação.
async function deleteRestaurant(id) {
  const dishes = await prisma.dish.findMany({ where: { restaurantId: id } });

  await prisma.$transaction([
    prisma.dish.deleteMany({ where: { restaurantId: id } }),
    prisma.restaurant.delete({ where: { id } })
  ]);

  // Só depois de o banco confirmar, removemos as imagens dos pratos do disco
  await Promise.all(dishes.map((dish) => imageService.removeImage(dish.imageUrl)));
}

async function getStats() {
  const restaurants = await prisma.restaurant.findMany();
  const categories = {};
  let ratingSum = 0;
  let ratingCount = 0;

  restaurants.forEach((r) => {
    const cat = r.category || "Sem categoria";
    categories[cat] = (categories[cat] || 0) + 1;
    if (r.rating != null) {
      ratingSum += Number(r.rating);
      ratingCount += 1;
    }
  });

  return {
    total: restaurants.length,
    categories,
    averageRating: ratingCount ? Number((ratingSum / ratingCount).toFixed(2)) : 0
  };
}

module.exports = {
  listRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getStats
};