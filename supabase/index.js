require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.PROJECT_URL, process.env.KEY);

async function createBucket(user) {
	const { data, error } = await supabase.storage.createBucket(user, {
		public: true,
		fileSizeLimit: 524288,
	});
	errorHandler(error);
	return data;
}

async function createFolder(userName, folderName) {
	const { data, error } = await supabase.storage
		.from(userName)
		.upload(`${folderName}/hi`, new File([], ""), { upsert: true });
	errorHandler(error);
	return data;
}

async function deleteFiles(userName, fileArray) {
	const { data, error } = await supabase.storage
		.from(userName)
		.remove(fileArray);
	errorHandler(error);
	return data;
}

async function getUrl(userName, filePath) {
	const { data } = supabase.storage.from(userName).getPublicUrl(filePath);
	return data;
}

async function createFile(userName, filePath, file) {
	const { data, error } = await supabase.storage
		.from(userName)
		.update(filePath, file, {
			upsert: true,
		});
	errorHandler(error);
	return data;
}

function errorHandler(error) {
	if (error) {
		console.error(error);
		throw new Error("e", error);
	}
}

async function moveFile(userName, prevPath, currentPath) {
	// Path with file
	const { data, error } = await supabase.storage
		.from(userName)
		.move(prevPath, currentPath);
	errorHandler(error);
	return data;
}

async function getData(userName, path = "") {
	const { data, error } = await supabase.storage.from(userName).list(path, {
		sortBy: { column: "name", order: "asc" },
	});
	errorHandler(error);
	return data;
}

async function downloadFile(userName, path) {
	const { data, error } = await supabase.storage
		.from(userName)
		.download(path);
	errorHandler(error);
	return data;
}

module.exports = {
	createBucket,
	createFolder,
	deleteFiles,
	createFile,
	moveFile,
	getUrl,
	getData,
	downloadFile,
};
