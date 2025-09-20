const indexRouter = require("express").Router();
const mainController = require("../controllers/mainController.js");

indexRouter.get("/", mainController.indexGet);

module.exports = indexRouter;
