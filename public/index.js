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
		window.location = window.location.href;
	}
	if (FoldersId) {
		deleteFolderForm.submit();
	}
});

class Download {
	constructor(formId) {
		this.form = document.querySelector(formId);
		this.form.addEventListener("submit", (e) => e.preventDefault());
	}
	downloadFile(url, fileName) {
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
	async downloadFiles(id) {
		const filesData = [...document.querySelectorAll(id)];
		for (const input of filesData) {
			if (input.checked) {
				const url = new URL(input.getAttribute("link"));
				const blobUrl = URL.createObjectURL(
					await (await fetch(url.href)).blob()
				);
				const data = {
					name: url.pathname.split("/").at(-1),
					url: blobUrl,
				};
				this.downloadFile(data.url, data.name);
			}
		}
	}
}

const downloader = new Download("#downloadForm");
