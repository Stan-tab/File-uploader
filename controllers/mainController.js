const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const storage = require("../supabase/index");
const { body, validationResult } = require("express-validator");
const signInValidate = [
	body("username")
		.trim()
		.notEmpty()
		.withMessage("Username could not be empty"),
	body("password")
		.trim()
		.isLength({ min: 8 })
		.withMessage("Password should be more than 8 symbols"),
	body("passConfirm")
		.trim()
		.custom((value, { req }) => {
			if (value !== req.body.password || !value) return false;
			return true;
		})
		.withMessage("Passwords should be similar"),
];

async function indexGet(req, res) {
	const data = await getRootData(req.user.username);
	console.log(data);
	res.render("index", { data });
}

function signInGet(req, res) {
	res.render("signIn");
}

const signInPost = [
	signInValidate,
	async (req, res) => {
		// validation part
		const validation = validationResult(req);
		if (!validation.isEmpty()) {
			const msgs = validation.errors.map((obj) => obj.msg);
			res.render("signIn", { msgs });
			return;
		}
		// storage & sql part
		const { username, password } = req.body;
		const hashedPass = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: { username, password: hashedPass },
		});
		await storage.createBucket(username);
		req.logIn(user, (e) => {
			if (e) {
				console.log(e);
				throw new Error("LogIN problem:", e);
			}
			return res.redirect("/main");
		});
	},
];

function logInGet(req, res) {
	const msg = req.session.messages ? req.session.messages.at(-1) : undefined;
	res.render("logIn", { msg });
}

async function getRootData(username, path = "") {
	const root = (await storage.getData(username, path)).map((e) => {
		delete e.last_accessed_at;
		return e;
	});
	return root;
}

async function createFolderPost(req, res) {
	// const { folderName } = req.body;
	const path = new URL(req.get("Referrer")).pathname.replace("/main", "");
	console.log(path);
}

function redirectGet(req, res) {
	return res.redirect("/main");
}

function userExistRedirect(req, res, next) {
	if (req.user) return res.redirect("/main");
	next();
}

function userNotExistRedir(req, res, next) {
	if (!req.user) return res.redirect("/logIn");
	next();
}

module.exports = {
	indexGet,
	signInGet,
	logInGet,
	signInPost,
	prisma,
	redirectGet,
	userExistRedirect,
	userNotExistRedir,
	createFolderPost,
};
