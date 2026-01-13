$(document).ready(function(e) {
	let url = document.URL;
	let slug = url.split("/hytale-mod/")[1]

	window.location.replace("https://curseforge.com/hytale/mods/" + slug);
});