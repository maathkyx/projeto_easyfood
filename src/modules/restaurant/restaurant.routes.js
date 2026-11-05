const express = require("express");
const controller = require("./restaurant.controller");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

router.get("/", controller.list);
router.get("/stats", controller.stats); // antes de "/:id" para não ser confundida com um id
router.post("/", authenticate, controller.create);
router.put("/:id", authenticate, controller.update);
router.delete("/:id", authenticate, controller.remove);

module.exports = router;
