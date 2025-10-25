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
const folderNameValidate = body("folderName")
	.trim()
	.notEmpty()
	.withMessage("Folder name should not be empty");

const arrayValidateFile = body("dataUnit")
	.isArray({ min: 1 })
	.withMessage("Choose files");

const arrayValidateFolder = body("folders")
	.isArray({ min: 1 })
	.withMessage("Choose folders");

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
	res.render("index", { data, username: req.user.username });
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

const createFolderPost = [
	folderNameValidate,
	async (req, res, next) => {
		const isNameValid = validationResult(req);
		if (!isNameValid.isEmpty()) {
			const msgs = JSON.stringify(
				isNameValid.errors.map((obj) => obj.msg)
			);
			console.error(msgs);
			next(msgs);
			return;
		}
		const { folderName } = req.body;
		const { path } = sub.getPathInfo(
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
	},
];

async function createFilePost(req, res, next) {
	try {
		var file = req.file;
		var name = req.body.fileName;
		var nameArr = file.originalname.split(".").filter(Boolean);
	} catch (error) {
		res.json("message: 'Please enter the file'");
		return;
	}
	if (name) nameArr[0] = name;
	let fileName = nameArr.join(".");
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
	let simFiles = await prisma.file.findMany({
		where: {
			folderId: parentFolder,
			AND: [
				{ fileName: { contains: nameArr[0] } },
				{ fileName: { contains: nameArr[1] } },
			],
		},
		orderBy: {
			fileName: "asc",
		},
	});
	simFiles = simFiles.filter(
		(el) => el.fileName.split(".").at(-1) === nameArr.at(-1)
	);
	if (simFiles.length !== 0) {
		let val = simFiles.length >= 2 ? -2 : -1;
		let lastSim = simFiles.at(val).fileName.split(".");
		const copyNameArr = nameArr.join(".").split(".");
		let prevNum = sub.checkTheLastFile(lastSim, copyNameArr);
		while (!Number.isInteger(prevNum) && prevNum !== "new") {
			lastSim = simFiles.at(val).fileName.split(".");
			prevNum = sub.checkTheLastFile(lastSim, copyNameArr);
			val--;
		}
		if (prevNum !== "new") {
			nameArr[nameArr.length - 2] = nameArr.at(-2) + `(${prevNum + 1})`;
			fileName = nameArr.join(".");
		}
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

const deleteFilePost = [
	arrayValidateFile,
	async (req, res) => {
		const isValid = validationResult(req);
		if (!isValid.isEmpty()) return res.status(404).redirect("/main");
		const { path } = sub.getPathInfo(
			decodeURI(new URL(req.get("Referrer")).pathname)
		);
		const { dataUnit } = req.body;
		await deleteFilesById(req.user.username, dataUnit);
		res.redirect(path);
	},
];

const deleteFolderPost = [
	arrayValidateFolder,
	async (req, res) => {
		const isValid = validationResult(req);
		if (!isValid.isEmpty()) return res.status(404).redirect("/main");
		const { path } = sub.getPathInfo(
			decodeURI(new URL(req.get("Referrer")).pathname)
		);
		const { folders } = req.body;
		const folderQuery = [...folders];
		const fileQuery = [];
		for (const i of folderQuery) {
			const folderData = await prisma.folder.findUnique({
				where: { id: i },
				select: {
					folderName: true,
					path: true,
					id: true,
					folders: { select: { id: true } },
					files: { select: { id: true } },
				},
			});
			if (folderData.folders.length > 0) {
				folderData.folders.forEach((folder) => {
					folderQuery.push(folder.id);
				});
			}
			if (folderData.files.length > 0) {
				folderData.files.forEach((file) => {
					fileQuery.push(file.id);
				});
			}
		}
		if (fileQuery.length > 0)
			await deleteFilesById(req.user.username, fileQuery);
		const reverseFodlers = folderQuery.reverse();
		await deleteFoldersById(reverseFodlers);
		res.redirect(path);
	},
];

async function deleteFilesById(username, fileIdArray) {
	const dataPath = [];
	for (const i of fileIdArray) {
		const data = await prisma.file.delete({
			where: { id: i },
			select: {
				fileName: true,
				Folder: { select: { path: true, folderName: true } },
			},
		});
		const path = sub.createPathForSupabase(data);
		dataPath.push(path);
	}
	await storage.deleteFiles(username, dataPath);
}

async function deleteFoldersById(foldersArray) {
	for (const i of foldersArray) {
		await prisma.folder.delete({ where: { id: i } });
	}
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
	deleteFilePost,
	deleteFolderPost,
};
