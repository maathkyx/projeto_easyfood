const express = require("express");
const cors = require("cors");
const path = require("path");
const { UPLOADS_ROOT } = require("./modules/shared/image.service");

const restaurantRoutes = require("./modules/restaurant/restaurant.routes");
const authRoutes = require("./modules/auth/auth.routes")
const dishRoutes = require("./modules/dishes/dish.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

// Imagens enviadas (perfil e pratos) acessíveis pelo navegador: GET /uploads/...
app.use("/uploads", express.static(UPLOADS_ROOT));


app.use("/auth", authRoutes); 
app.use(dishRoutes);
app.use("/restaurants", restaurantRoutes);
    


module.exports = app;