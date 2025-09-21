const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function indexGet(req, res) {
	res.render("index");
}

function signInGet(req, res) {
	res.render("signIn");
}
async function signInPost(req, res) {
	const { username, password } = req.body;
	const hashedPass = await bcrypt.hash(password, 10);
	const user = await prisma.user.create({
		data: { username, password: hashedPass },
	});
	req.logIn(user, (e) => {
		if (e) {
			console.log(e);
			throw new Error("LogIN problem:", e);
		}
		return res.redirect("/");
	});
}

function logInGet(req, res) {
	res.render("logIn");
}
function logInPost(req, res) {
	const { username, password } = req.body;
	
}

module.exports = {
	indexGet,
	signInGet,
	logInGet,
	signInPost,
	logInPost,
	prisma,
};
