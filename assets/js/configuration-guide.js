const loaders = ["fabric", "forge", "neoforge"];
const sections = ["in-game", "manual"];
const defaultloader = "fabric";

const modmenucurseforge = "https://curseforge.com/minecraft/mc-mods/modmenu";
const modmenumodrinth = "https://modrinth.com/mod/modmenu";

$(document).ready(function(e) {
	console.log("Loading https://serilum.com/configuration-guide");

	let params = new URLSearchParams(window.location.search);

	let loader = params.get("loader");
	if (!loaders.includes(loader)) {
		loader = Cookies.get('configloader');
	}
	if (!loaders.includes(loader)) {
		loader = defaultloader;
	}
	setActiveLoader(loader);
	setModMenuLink();

	let section = params.get("section");
	$(".configguide").delay(150).fadeIn(400, function() {
		if (sections.includes(section)) {
			scrollToSection(section);
		}
	});
});

$(document).on('mouseup', '.loadertabs .loadertab', function(e) {
	if (!(e.which === 1)) { return; }

	const loader = $(this).attr('data-loader');
	setActiveLoader(loader);
	Cookies.set('configloader', loader, { expires: 365 });

	scrollToSection("in-game");
	updateUrl(loader, "");
});

$(document).on('mouseup', '.guideheader .sectionlink', function(e) {
	if (!(e.which === 1)) { return; }

	const section = $(this).attr('data-section');
	scrollToSection(section);
	updateUrl($(".loadertabs .loadertab.selected").attr('data-loader'), section);
});

$(".toggle input").change(function() {
	setModMenuLink();
});

function setModMenuLink() {
	let cf = $(".navigation .toggle input").is(":checked");
	$(".configguide .modmenulink").attr('href', cf ? modmenucurseforge : modmenumodrinth);
}

function setActiveLoader(loader) {
	$(".loadertabs .loadertab").removeClass("selected");
	$(".loadertabs .loadertab[data-loader='" + loader + "']").addClass("selected");

	$(".configguide .loaderpane").addClass("hidden");
	$(".configguide .loaderpane[data-loader='" + loader + "']").removeClass("hidden");
}

function scrollToSection(section) {
	const target = $(".configguide .loaderpane:not(.hidden) .guidesection[data-section='" + section + "']");
	if (target.length === 0) { return; }

	const offset = $(".guideheader").outerHeight() + 51;
	$('html, body').animate({ scrollTop: target.offset().top - offset }, 300);
}

function updateUrl(loader, section) {
	if (!window.history.replaceState) {
		return;
	}

	let url = window.location.pathname + "?loader=" + loader;
	if (section) {
		url += "&section=" + section;
	}

	window.history.replaceState(null, "", url);
}
