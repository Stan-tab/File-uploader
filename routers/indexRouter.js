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
			maxAge: 60 * 60 * 1000,
		},
	})
);
indexRouter.use(localPassport.session());
indexRouter.get("/", mainController.redirectGet);
indexRouter.get("/main{/*splat}", [
	mainController.userNotExistRedir,
	mainController.indexGet,
]);
indexRouter.post("/createFolder", [
	mainController.userNotExistRedir,
	mainController.createFolderPost,
]);

indexRouter.get("/signIn", [
	mainController.userExistRedirect,
	mainController.signInGet,
]);
indexRouter.get("/logIn", [
	mainController.userExistRedirect,
	mainController.logInGet,
]);
indexRouter.post("/signIn", [
	mainController.userExistRedirect,
	mainController.signInPost,
]);
indexRouter.post("/logIn", [
	mainController.userExistRedirect,
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/logIn",
		failureMessage: true,
	}),
]);

indexRouter.all("{*splat}", (req,res) => {res.send("Hi")})

module.exports = indexRouter;
