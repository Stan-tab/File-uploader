require("dotenv").config();
const indexRouter = require("express").Router();
const mainController = require("../controllers/mainController.js");
const localPassport = require("../authentication/passport.js");
const session = require("express-session");
const passport = require("../authentication/passport.js");
const psql = new (require("connect-pg-simple")(session))({
	conString: process.env.TABLE,
});

indexRouter.use(
	session({
		store: psql,
		name: "userData",
		secret: "Yummy cockie",
		resave: true,
		rolling: true,
		saveUninitialized: false,
		cookie: {
			maxAge: 2 * 60 * 1000,
		},
	})
);
indexRouter.use(localPassport.session());
indexRouter.get("/", mainController.indexGet);
indexRouter.get("/signIn", mainController.signInGet);
indexRouter.get("/logIn", mainController.logInGet);
indexRouter.post("/signIn", mainController.signInPost);
indexRouter.post(
	"/logIn",
	passport.authenticate("local", { successRedirect: "/", failureRedirect: "/logIn" })
);

module.exports = indexRouter;
