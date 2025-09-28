const deleteButton = document.querySelector(".deletor");
const deleteFolderForm = document.querySelector("#deleteFolderForm");
deleteButton.addEventListener("click", (e) => {
	e.preventDefault();
	const formFile = new FormData(e.currentTarget.parentNode);
	const formFolder = new FormData(deleteFolderForm);
	const FilesId = formFile
		.getAll("dataUnit[]")
		.map((e) => encodeURI(`dataUnit[]=${e}`))
		.join("&");
	const FoldersId = formFolder
		.getAll("folders[]")
		.map((e) => encodeURI(`folders[]=${e}`))
		.join("&");
	if (FilesId) {
		fetch("/delete", {
			method: "POST",
			body: FilesId,
			headers: { "content-type": "application/x-www-form-urlencoded" },
		});
	}
	if (FoldersId) {
		deleteFolderForm.submit();
	}
});
