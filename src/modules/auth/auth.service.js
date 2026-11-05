const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const prisma = require("../../database/prisma");
const imageService = require("../shared/image.service");

const JWT_SECRET = process.env.JWT_SECRET;

// Cadastro: guarda o usuário com a senha em hash
async function register({ name, email, password }) {
  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hash }
  });

  // Nunca devolvemos a senha
  return { id: user.id, name: user.name, email: user.email };
}

// Login: confere o e-mail, compara a senha e gera o token
async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null; // usuário não existe
  }

  const senhaConfere = await bcrypt.compare(password, user.password);

  if (!senhaConfere) {
    return null; // senha errada
  }

  // Gera o token com o id e email do usuário, válido por 1 dia
  const token = jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: "1d" }
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl }
  };
}

// Busca os dados atualizados do usuário no banco (sem a senha)
async function getById(id) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email, imageUrl: user.imageUrl };
}

// Atualiza a foto de perfil do usuário AUTENTICADO (o id vem do token, nunca do body/URL)
async function updateProfileImage(userId, file) {
  if (!file) {
    const error = new Error("Arquivo de imagem é obrigatório (campo \"image\")");
    error.statusCode = 400;
    throw error;
  }

  const id = Number(userId);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const error = new Error("Usuário não encontrado");
    error.statusCode = 404;
    throw error;
  }

  // O processamento fica no serviço compartilhado
  const imageUrl = await imageService.optimizeAndSave(file.buffer, "users");

  let updated;
  try {
    updated = await prisma.user.update({ where: { id }, data: { imageUrl } });
  } catch (error) {
    await imageService.removeImage(imageUrl); // não deixa arquivo órfão se o banco falhar
    throw error;
  }

  await imageService.removeImage(user.imageUrl); // apaga a foto anterior
  return { id: updated.id, name: updated.name, email: updated.email, imageUrl: updated.imageUrl };
}

module.exports = { register, login, getById, updateProfileImage };