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
function getPathInfo(path) {
	const pathArr = path.split("/").filter(Boolean);
	const newPath = "/" + pathArr.join("/");
	const curFolderName = pathArr.at(-1);
	pathArr.pop();
	const prevPath = "/" + pathArr.join("/");
	return {
		path: newPath,
		curFolderName,
		prevPath,
		noMain: newPath.replace("main", ""),
	};
}

module.exports = {
	redirectGet,
	userExistRedirect,
	userNotExistRedir,
	logInGet,
	getPathInfo,
};
