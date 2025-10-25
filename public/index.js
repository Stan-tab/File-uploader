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

(function setTheButtonBack() {
	const buttonBack = document.querySelector("header > button");
	const link = new URL(window.location.href);
	if (link.pathname === "/main") {
		buttonBack.style.visibility = "hidden";
		return;
	}
	buttonBack.addEventListener("click", () => {
		const arr = link.pathname.split("/").filter(Boolean);
		arr.pop();
		window.location.href = `${link.origin}/${arr.join("/")}`;
	});
})();

(function createButtonEvent() {
	const createBut = document.querySelector(".createBut");
	const createDiv = document.querySelector(".create");
	createBut.addEventListener("click", () => {
		createDiv.classList.toggle("show");
	});
})();

(function setChoosers() {
	const choosers = [...document.querySelectorAll(".chooser")];
	const creaters = [...document.querySelectorAll(".creaters")];
	choosers[0].addEventListener("click", () => {
		creaters[0].classList.add("show");
		creaters[1].classList.remove("show");
	});
	choosers[1].addEventListener("click", () => {
		creaters[1].classList.add("show");
		creaters[0].classList.remove("show");
	});
})();

(function showDownloadAndDeleteButtons() {
	const data = [...document.querySelectorAll("main input[type='checkbox']")];
	data.forEach((inp) => {
		inp.addEventListener("click", () => {
			const checkedOnes = [];
			data.forEach((inpt) => {
				if (inpt.checked) checkedOnes.push(inpt.id);
			});
			const forms = [
				...document.querySelectorAll("#downloadForm, #deleteForm"),
			];
			if (checkedOnes.length === 0) {
				forms[0].classList.remove("show");
				forms[1].classList.remove("show");
			} else if (!checkedOnes.includes("folder")) {
				forms[0].classList.add("show");
				forms[1].classList.add("show");
			} else {
				forms[1].classList.add("show");
				forms[0].classList.remove("show");
			}
		});
	});
})();

const downloader = new Download("#downloadForm");
