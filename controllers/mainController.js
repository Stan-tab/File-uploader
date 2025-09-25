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
	const { id } = req.user;
	let path = decodeURI(req.originalUrl);
	if (!validatePath(path)) {
		next("Invalid path");
		return;
	}
	if (path.at(-1) === "/") path = path.slice(0, -1);
	const folderData = await prisma.folder.findMany({
		where: { AND: [{ path }, { userId: id }] },
	});
	const fileData = await prisma.file.findMany({
		where: {
			Folder: { path, userId: id },
		},
	});
	const rowData = folderData.concat(fileData);
	const data = rowData.map((e) => {
		const name = e.folderName ? e.folderName : e.fileName;
		return { ...e, name };
	});
	console.log(rowData);
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
		await prisma.folder.create({
			data: {
				path: "/",
				folderName: "root",
				User: { connect: { id: user.id } },
			},
		});
		req.logIn(user, (e) => {
			if (e) {
				console.log(e);
				throw new Error("LogIN problem:", e);
			}
			return res.redirect("/main");
		});
	},
];

async function createFolderPost(req, res, next) {
	const { folderName } = req.body;
	const path = decodeURI(new URL(req.get("Referrer")).pathname);
	const pathArr = path.split("/").filter(Boolean);
	const curFolderName = pathArr.at(-1);
	pathArr.pop();
	const prevPath = "/" + pathArr.join("/");
	let rootId = req.session.rootId;
	if (!validatePath(path)) {
		next("Invalid path");
		return;
	}
	if (prevPath !== "/") {
		rootId = (
			await prisma.folder.findFirst({
				where: { path: prevPath, folderName: curFolderName },
			})
		).id;
		console.log(rootId);
	}
	await prisma.folder.create({
		data: {
			folderName,
			path,
			User: { connect: { id: req.user.id } },
			Folder: { connect: { id: rootId } },
		},
	});
	res.redirect(`${path}`);
}

function validatePath(url) {
	return url.split("/").filter(Boolean)[0] === "main";
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
function logInGet(req, res) {
	const msg = req.session.messages ? req.session.messages.at(-1) : undefined;
	res.render("logIn", { msg });
}

async function addRootId(req, res, next) {
	if (!req.session.rootId && req.user) {
		req.session.rootId = (
			await prisma.folder.findFirst({
				where: { AND: [{ path: "/" }, { userId: req.user.id }] },
			})
		).id;
		if (!req.session.rootId) next("Undefined rootId");
	}
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
	addRootId,
};
