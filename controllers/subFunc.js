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

function checkTheLastFile(prevFile, curFile) {
	if (prevFile.length != curFile.length) return false;
	for (let i = 0; i < prevFile.length; i++) {
		const [data1, data2] = [
			removeNums(prevFile[i]),
			removeNums(curFile[i]),
		];
		if (data1 != data2) return "new";
	}
	return +parseNum(prevFile.at(-2)) || 0;
}

function removeNums(str) {
	const newString = [];
	for (let i = 0; i < str.length; i++) {
		if (
			Number.isNaN(Number(str.at(i))) &&
			str.at(i) != "(" &&
			str.at(i) != ")"
		) {
			newString.push(str.at(i));
			continue;
		}
	}
	return newString.join("");
}

function parseNum(str) {
	if (str.at(-1) != ")") return false;
	const nums = [];
	for (let i = 2; i <= str.length; i++) {
		const char = str.at(i * -1);
		if (char === "(") break;
		if (!Number.isInteger(Number(char))) return false;
		nums.push(char);
	}
	return nums.reverse().join("");
}

function createPathForSupabase(data) {
	const rawFolderName =
		data.Folder.folderName === "root" ? "" : data.Folder.folderName;
	const folderName = rawFolderName ? rawFolderName + "/" : "";
	const rawFolderPath = data.Folder.path
		.replace("/main", "")
		.replace("/", "");
	const folderPath = rawFolderPath ? rawFolderPath + "/" : "";
	return `${folderPath}${folderName}${data.fileName}`;
}

module.exports = {
	redirectGet,
	userExistRedirect,
	userNotExistRedir,
	logInGet,
	getPathInfo,
	checkTheLastFile,
	createPathForSupabase,
};
