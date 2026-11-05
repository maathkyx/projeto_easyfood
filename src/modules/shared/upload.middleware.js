const multer = require("multer");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Memória: o arquivo bruto não vai para o disco.
// Quem decide o que gravar (e onde) é o image.service, depois do Sharp.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error("Formato inválido. Envie uma imagem JPEG, PNG ou WebP");
      error.statusCode = 415;
      return cb(error);
    }
    cb(null, true);
  }
});

/**
 * Middleware para rotas que recebem UMA imagem no campo "image" (multipart/form-data).
 * Traduz os erros do Multer para status HTTP adequados.
 */
function uploadSingleImage(req, res, next) {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          error: `Arquivo muito grande. Limite: ${MAX_FILE_SIZE / 1024 / 1024} MB`
        });
      }
      // LIMIT_UNEXPECTED_FILE (campo com outro nome), LIMIT_FILE_COUNT etc.
      return res.status(400).json({ error: `Upload inválido: use o campo "image" com um único arquivo` });
    }

    const status = err.statusCode || 500;
    return res.status(status).json({
      error: status === 500 ? "Erro interno no servidor" : err.message
    });
  });
}

module.exports = { uploadSingleImage, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
