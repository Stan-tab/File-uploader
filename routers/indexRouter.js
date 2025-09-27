require("dotenv").config();
const indexRouter = require("express").Router();
const mainController = require("../controllers/mainController.js");
const localPassport = require("../authentication/passport.js");
const session = require("express-session");
const passport = require("../authentication/passport.js");
const sub = require("../controllers/subFunc.js");
const psql = new (require("connect-pg-simple")(session))({
	conString: process.env.TABLE,
});

indexRouter.use(
	session({
		store: psql,
		name: "userData",
		secret: process.env.SECRET || "Yummy cockie",
		resave: true,
		rolling: true,
		saveUninitialized: false,
		cookie: {
			maxAge: 60 * 60 * 1000,
		},
	})
);
indexRouter.use(localPassport.session());
indexRouter.use(mainController.addRootId);
indexRouter.get("/", sub.redirectGet);
indexRouter.get("/main{/*splat}", [
	sub.userNotExistRedir,
	mainController.indexGet,
]);
indexRouter.post("/createFolder", [
	sub.userNotExistRedir,
	mainController.createFolderPost,
]);
indexRouter.post("/upload", [
	sub.userNotExistRedir,
	mainController.createFilePost,
]);

indexRouter.get("/signIn", [
	sub.userExistRedirect,
	mainController.signInGet,
]);
indexRouter.get("/logIn", [
	sub.userExistRedirect,
	sub.logInGet,
]);
indexRouter.post("/signIn", [
	sub.userExistRedirect,
	mainController.signInPost,
]);
indexRouter.post("/logIn", [
	sub.userExistRedirect,
	passport.authenticate("local", {
		successRedirect: "/",
		failureRedirect: "/logIn",
		failureMessage: true,
	}),
]);

indexRouter.all("{*splat}", (req, res) => {
	res.send("Hi");
});

module.exports = indexRouter;
