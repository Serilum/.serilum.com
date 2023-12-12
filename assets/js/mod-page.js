$(document).ready(function(e) {
	let url = document.URL;
	let slug = url.split("/mod/")[1]

	window.location.replace("https://curseforge.com/minecraft/mc-mods/" + slug);
});