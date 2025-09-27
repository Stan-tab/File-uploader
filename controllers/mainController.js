const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const storage = require("../supabase/index");
const { body, validationResult } = require("express-validator");
const sub = require("./subFunc");
const multer = require("multer");
const memory = multer.memoryStorage();
const { decode } = require("base64-arraybuffer");
const uploadFile = multer({
	storage: memory,
	limits: { fileSize: 524288 },
}).single("file");
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

async function indexGet(req, res, next) {
	const { id } = req.user;
	let { path, prevPath } = sub.getPathInfo(decodeURI(req.originalUrl));
	const pathValidated = await validatePath(req.user.id, path);
	if (!pathValidated) {
		next("Invalid path");
		return;
	}
	const folderData = await prisma.folder.findMany({
		where: { AND: [{ path }, { userId: id }] },
	});
	const fileData = await prisma.file.findMany({
		where: {
			Folder: { path: prevPath, userId: id },
		},
	});
	const rowData = folderData.concat(fileData);
	const data = rowData.map((e) => {
		const name = e.folderName ? e.folderName : e.fileName;
		return { ...e, name };
	});
	// console.log(data);
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
	const { path, curFolderName, prevPath } = sub.getPathInfo(
		decodeURI(new URL(req.get("Referrer")).pathname)
	);
	let rootId = req.session.rootId;
	const pathValidated = await validatePath(req.user.id, path);
	if (!pathValidated) {
		next("Invalid path");
		return;
	}
	rootId = pathValidated.id;
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

async function createFilePost(req, res, next) {
	const file = req.file;
	const name = req.body.fileName;
	const nameArr = file.originalname.split(".").filter(Boolean);
	if (name) nameArr[0] = name;
	const fileName = nameArr.join(".");
	const fileBase64 = decode(file.buffer.toString("base64"));
	let parentFolder = req.session.rootId;
	const { noMain, path } = sub.getPathInfo(
		decodeURI(new URL(req.get("Referrer")).pathname)
	);
	const pathValidated = await validatePath(req.user.id, path);
	if (!pathValidated) {
		next("Invalid path");
		return;
	}
	parentFolder = pathValidated.id;
	const simFiles = await prisma.file.findMany({
		where: { folderId: parentFolder, fileName },
	});
	if (simFiles.length !== 0) {
		next("File with similar name already exist");
		return;
	}
	const filePath = (
		await storage.createFile(
			req.user.username,
			noMain + "/" + fileName,
			fileBase64
		)
	).path;
	const { publicUrl } = await storage.getUrl(req.user.username, filePath);
	await prisma.file.create({
		data: {
			fileName,
			link: publicUrl,
			Folder: { connect: { id: parentFolder } },
		},
	});
	res.redirect(`${path}`);
}

async function getParentFolderData(userId, prevPath, curFolderName) {
	try {
		const parentFolder = await prisma.folder.findFirst({
			where: {
				userId: userId,
				path: prevPath,
				folderName: curFolderName,
			},
		});
		return parentFolder || { id: false };
	} catch (e) {
		console.error(e);
		return { id: false };
	}
}
async function validatePath(id, url) {
	const { prevPath, curFolderName } = sub.getPathInfo(decodeURI(url));
	if (url.split("/").filter(Boolean)[0] !== "main") return false;
	const data = await getParentFolderData(
		id,
		prevPath,
		curFolderName === "main" ? "root" : curFolderName
	);
	return data.id ? data : false;
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
	signInPost,
	prisma,
	createFolderPost,
	addRootId,
	createFilePost,
	uploadFile,
};
