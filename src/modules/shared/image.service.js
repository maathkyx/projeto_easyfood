const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

// Pasta física dos uploads (servida em /uploads pelo app.js)
const UPLOADS_ROOT = path.join(__dirname, "../../../uploads");
const PUBLIC_PREFIX = "/uploads";

const MAX_DIMENSION = 800; // lado máximo, em px
const WEBP_QUALITY = 80;
const ALLOWED_FORMATS = ["jpeg", "png", "webp"];

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Otimiza uma imagem com Sharp e a grava em uploads/<folder>/.
 * Não sabe quem a chamou (usuário, prato...): só recebe o buffer e a pasta.
 *
 * @param {Buffer} buffer  - conteúdo bruto do arquivo enviado
 * @param {string} folder  - subpasta de destino (ex.: "users", "dishes")
 * @returns {Promise<string>} caminho público (ex.: "/uploads/users/<uuid>.webp")
 */
async function optimizeAndSave(buffer, folder) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw httpError("Arquivo de imagem é obrigatório", 400);
  }
  if (!/^[a-z0-9-]+$/i.test(folder)) {
    throw new Error("Pasta de destino inválida"); // erro de programação → 500
  }

  let optimized;
  try {
    // Não confiamos no mimetype informado pelo cliente: o Sharp lê o conteúdo real.
    const { format } = await sharp(buffer).metadata();
    if (!ALLOWED_FORMATS.includes(format)) {
      throw new Error("formato não permitido");
    }

    optimized = await sharp(buffer)
      .rotate() // respeita a orientação EXIF (fotos de celular)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY }) // remove metadados e padroniza o formato
      .toBuffer();
  } catch (error) {
    throw httpError("O arquivo enviado não é uma imagem válida (JPEG, PNG ou WebP)", 400);
  }

  const filename = `${crypto.randomUUID()}.webp`;
  const dir = path.join(UPLOADS_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), optimized);

  return `${PUBLIC_PREFIX}/${folder}/${filename}`;
}

/**
 * Remove uma imagem previamente salva (ex.: ao ser substituída por outra).
 * Nunca lança erro: falhar em limpar um arquivo antigo não deve quebrar a operação.
 */
async function removeImage(publicPath) {
  if (!publicPath || !publicPath.startsWith(`${PUBLIC_PREFIX}/`)) return;

  const relative = publicPath.slice(PUBLIC_PREFIX.length + 1);
  const fullPath = path.resolve(UPLOADS_ROOT, relative);

  // Proteção contra path traversal: só apaga dentro de uploads/
  if (!fullPath.startsWith(UPLOADS_ROOT + path.sep)) return;

  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Erro ao remover imagem antiga:", error.message);
    }
  }
}

module.exports = { optimizeAndSave, removeImage, UPLOADS_ROOT };
