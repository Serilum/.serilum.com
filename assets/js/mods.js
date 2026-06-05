const logofiletypes = {};
const logosizes = {};
const collectedversions = {};
let searchTimer;
let resetRotation = 0;

$(document).ready(function(e) {
	console.log("Loading https://serilum.com/mods");

	loadModData();

	checkForChangelogParameter();
});

function loadModData() {
	$.ajax({
		url: "https://workflow.serilum.com/web/data/mod_data.json",
		type: "GET",
		dataType: 'json',
		success: function(data){
			let gridcontent = "";

			for (let [modname, moddata] of Object.entries(data)) {
				if (!moddata["published"]) {
					continue;
				}

				if (moddata["project_type"] && moddata["project_type"] !== "mod") {
					continue;
				}

				if (modname.endsWith("(Forge)")) {
					continue;
				}

				let packageid = modSlug(modname);
				logofiletypes[packageid] = moddata["logo_file_type"];
				logosizes[packageid] = moddata["logo_sizes"];

				let description = cleanSummary(moddata["description"]);

				let forge_versions = moddata["forge_versions"] || [];
				let fabric_versions = moddata["fabric_versions"] || [];
				let neoforge_versions = moddata["neoforge_versions"] || [];

				let hasforge = forge_versions.length > 0;
				let hasfabric = fabric_versions.length > 0;
				let hasneoforge = neoforge_versions.length > 0;

				let allversions = [];
				for (let v of fabric_versions.concat(forge_versions).concat(neoforge_versions)) {
					if (!allversions.includes(v)) {
						allversions.push(v);
					}
				}
				allversions.sort(compareVersionsDesc);

				for (let v of allversions) {
					collectedversions[v] = true;
				}

				let cfslug = modSlug(modname);
				let mrslug = cfslug;
				if (modname === "Villager Names") {
					mrslug += "-serilum";
				}
				let cfmodurl = "https://www.curseforge.com/minecraft/mc-mods/" + cfslug;
				let mrmodurl = "https://modrinth.com/mod/" + mrslug;

				let modhref = cfmodurl;
				let modvalue = mrmodurl;
				if (!enabledCurseForge()) {
					modhref = mrmodurl;
					modvalue = cfmodurl;
				}

				let extraclasses = "";
				if (hasforge) {
					extraclasses += " hasforge";
				}
				if (hasfabric) {
					extraclasses += " hasfabric";
				}
				if (hasneoforge) {
					extraclasses += " hasneoforge";
				}

				let loaders = [];
				if (hasfabric) { loaders.push("fabric"); }
				if (hasforge) { loaders.push("forge"); }
				if (hasneoforge) { loaders.push("neoforge"); }

				let card = '<div class="modcard' + extraclasses + '" data-name="' + modname.toLowerCase() + '" data-desc="' + description.toLowerCase().replaceAll('"', '') + '" data-versions="' + allversions.join(" ") + '" data-env="' + (moddata["environment"] || "") + '" data-loaders="' + loaders.join(" ") + '">';

				card += '	<div class="modcard-top">';
				card += '		<a class="modlink modlogo" href="' + modhref + '" value="' + modvalue + '" target=_blank><img class="modcard-logo" alt="' + modname + '" decoding="async" width="56" height="56" src="' + logoSrc(packageid, moddata["logo_file_type"], moddata["logo_sizes"]) + '" srcset="' + logoSrcset(packageid, moddata["logo_file_type"], moddata["logo_sizes"]) + '" sizes="56px"></a>';
				card += '		<div class="modcard-head">';
				card += '			<a class="modlink name" href="' + modhref + '" value="' + modvalue + '" target=_blank>' + modname + '</a>';
				card += '			<div class="modcard-tags">';
				if (moddata["environment"]) {
					card += environmentBadge(moddata["environment"]);
				}
				if (hasfabric) {
					card += loaderBadge("fabric", "Fabric", 4, "fabric", cfmodurl, mrmodurl);
				}
				if (hasforge) {
					card += loaderBadge("forge", "Forge", 1, "forge", cfmodurl, mrmodurl);
				}
				if (hasneoforge) {
					card += loaderBadge("neoforge", "NeoForge", 6, "neoforge", cfmodurl, mrmodurl);
				}
				card += '			</div>';
				card += '		</div>';
				card += '	</div>';

				card += '	<p class="description">' + description + '</p>';

				if (allversions.length > 0) {
					card += buildVersionBar(modname, moddata, allversions);
				}

				card += '	<div class="modcard-foot">';
				card += '		<a class="changelogbtn" href="#" value="' + packageid + '"><img alt="changelog" src="/assets/images/changelog.png">Changelog</a>';
				card += '		<div class="modcard-deps">';
				for (let dependency of moddata["dependencies"]) {
					if (dependency === "minecraft") {
						continue;
					}

					let depcf = getModUrl(modname, false, true) + dependency;
					let depmr = getModUrl(modname, false, false) + dependency;

					let verurl = depcf;
					let ourl = depmr;
					if (!enabledCurseForge()) {
						verurl = depmr;
						ourl = depcf;
					}

					let deplabel = dependency.charAt(0).toUpperCase() + dependency.slice(1);

					card += '<a class="dependency" href="' + verurl + '" value="' + ourl + '" target=_blank title="Requires ' + deplabel + '"><img alt="' + dependency + '" src="' + logobase + '64/' + dependency + '.png">' + deplabel + '</a>';
				}
				card += '		</div>';
				card += '	</div>';

				card += '</div>';

				gridcontent += card;
			}

			$(".modgrid").html(gridcontent);

			buildVersionFilter();
			applyUrlFilters();
			applyFilters();

			revealLogos();
		},
		error: function(data) { }
	});
}

function revealLogos() {
	let logos = $(".modgrid .modcard-logo").toArray();

	if (logos.length === 0) {
		$(".modwrapper").fadeIn(500);
		return;
	}

	// Gate the grid reveal on the first three rows of logos (roughly above the fold);
	// the rest fade in individually as they finish loading. Mirror the grid layout:
	// minmax(330px, 1fr) tracks + 14px gap inside the 92%/1240px-capped wrapper.
	let gridWidth = Math.min(window.innerWidth * 0.92, 1240);
	let columns = Math.max(1, Math.floor((gridWidth + 14) / (330 + 14)));
	let visibleCount = Math.min(logos.length, columns * 3);
	let pending = visibleCount;
	let revealed = false;

	function reveal() {
		if (revealed) {
			return;
		}
		revealed = true;
		$(".modwrapper").fadeIn(500);
	}

	let timer = setTimeout(reveal, 1500);

	logos.forEach(function(img, i) {
		let counts = i < visibleCount;

		function done() {
			img.classList.add("loaded");
			if (counts && --pending === 0) {
				clearTimeout(timer);
				reveal();
			}
		}

		if (img.complete) {
			done();
		}
		else {
			let onsettle = function() {
				img.removeEventListener("load", onsettle);
				img.removeEventListener("error", onsettle);
				done();
			};
			img.addEventListener("load", onsettle);
			img.addEventListener("error", onsettle);
		}
	});
}

function buildVersionBar(modname, moddata, allversions) {
	let shown = allversions.slice(0, 3);
	let rest = allversions.slice(3);

	let html = '	<div class="modcard-versionbar">';
	for (let version of shown) {
		html += versionChip("modver", modname, moddata, version);
	}

	if (rest.length > 0) {
		html += '<div class="versionstrigger">&hellip;';
		html += '<div class="versionpopup">';
		html += '<span class="verloaderlabel">Other versions</span>';
		html += '<span class="verpills">';
		for (let version of rest) {
			html += versionChip("verpill", modname, moddata, version);
		}
		html += '</span>';
		html += '</div>';
		html += '</div>';
	}

	html += '</div>';

	return html;
}

function versionChip(extraclass, modname, moddata, version) {
	let cfslug = modSlug(modname);
	let mrslug = cfslug;
	if (modname === "Villager Names") {
		mrslug += "-serilum";
	}

	let fullversion = (moddata["version_latest"] || {})[version] || version;

	let cfurl = "https://www.curseforge.com/minecraft/mc-mods/" + cfslug + "/files/all?version=" + fullversion;
	let mrurl = "https://modrinth.com/mod/" + mrslug + "/versions?g=" + fullversion;

	// Legacy split mods host older Fabric builds on a separate -fabric page.
	// A version is ambiguous when its Fabric build lives only on that page,
	// i.e. the main project has no Fabric for it (1.17 and below).
	let fabriclatest = moddata["fabric_version_latest"] || {};
	let mainfabric = moddata["fabric_versions"] || [];

	let cffabric = "";
	if (fabriclatest[version] !== undefined && mainfabric.indexOf(version) === -1 && moddata["fabric_slug"]) {
		cffabric = "https://www.curseforge.com/minecraft/mc-mods/" + moddata["fabric_slug"] + "/files/all?version=" + fabriclatest[version];
	}

	let extra = cffabric === "" ? "" : " ambiguous";

	return '<a class="version ' + extraclass + extra + '" data-cf="' + cfurl + '" data-cffabric="' + cffabric + '" data-mr="' + mrurl + '" href="' + cfurl + '" target=_blank>' + version + '</a>';
}

function loaderBadge(loaderclass, label, gameversiontypeid, mrloader, cfmodurl, mrmodurl) {
	let cfurl = cfmodurl + "/files/all?gameVersionTypeId=" + gameversiontypeid;
	let mrurl = mrmodurl + "/versions?l=" + mrloader;

	let href = cfurl;
	let value = mrurl;
	if (!enabledCurseForge()) {
		href = mrurl;
		value = cfurl;
	}

	return '<a class="loader ' + loaderclass + '" href="' + href + '" value="' + value + '" target=_blank>' + label + '</a>';
}

function cleanSummary(summary) {
	return summary.replace(/\[.*?\]/g, "").replace(/^[\p{Extended_Pictographic}\u200d\uFE0F\s]+/u, "").replace(/\s+([.,!?:;])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

function environmentBadge(environment) {
	let label = "Client &amp; Server";
	if (environment === "client") {
		label = "Client";
	}
	else if (environment === "server") {
		label = "Server";
	}

	return '<span class="envbadge ' + environment + '">' + label + '</span>';
}

function buildVersionFilter() {
	let versions = Object.keys(collectedversions);
	versions.sort(compareVersionsDesc);

	let shown = versions.slice(0, 3);
	let rest = versions.slice(3);

	let html = "";
	for (let version of shown) {
		html += '<span class="verchip enabled" data-version="' + version + '">' + version + '</span>';
	}

	if (rest.length > 0) {
		html += '<div class="versionstrigger filtertrigger">&hellip;';
		html += '<div class="versionpopup">';
		html += '<span class="verloaderlabel">Other versions</span>';
		html += '<span class="verpills">';
		for (let version of rest) {
			html += '<span class="verchip enabled" data-version="' + version + '">' + version + '</span>';
		}
		html += '</span>';
		html += '</div>';
		html += '</div>';
	}

	$(".versionfilter").html(html);
}

function applyFilters() {
	let query = $("#modsearch").val().toLowerCase().trim();

	let enabled = [];
	$(".versionfilter .verchip.enabled").each(function(e) {
		enabled.push($(this).attr("data-version"));
	});

	let enabledenvs = [];
	$(".envfilter .envchip.enabled").each(function(e) {
		enabledenvs.push($(this).attr("data-env"));
	});

	let shown = 0;
	$(".modgrid .modcard").each(function(e) {
		let card = $(this);

		let versions = card.attr("data-versions");
		let env = card.attr("data-env");

		let matchquery = query === "" || card.attr("data-name").includes(query) || card.attr("data-desc").includes(query);
		let matchversion = versions === "" || versions.split(" ").some(v => enabled.includes(v));
		let matchenv = env === "" || enabledenvs.includes(env);

		if (matchquery && matchversion && matchenv) {
			card.show();
			shown += 1;
		}
		else {
			card.hide();
		}
	});

	$(".modcount").html(shown + (shown === 1 ? " mod" : " mods"));

	if (shown === 0) {
		$(".noresults").show();
	}
	else {
		$(".noresults").hide();
	}

	updateFilterUrl();
}

function chipState(chips, attr) {
	let enabled = chips.filter(".enabled");

	if (enabled.length === chips.length) {
		return "";
	}
	if (enabled.length === 0) {
		return "none";
	}

	return enabled.map(function() {
		return $(this).attr(attr);
	}).get().join(",");
}

function updateFilterUrl() {
	let params = new URLSearchParams(window.location.search);

	let query = $("#modsearch").val().trim();
	let env = chipState($(".envfilter .envchip"), "data-env");
	let version = chipState($(".versionfilter .verchip"), "data-version");

	for (let [key, value] of Object.entries({ q: query, env: env, version: version })) {
		if (value === "") {
			params.delete(key);
		}
		else {
			params.set(key, value);
		}
	}

	let qs = params.toString().replace(/%2C/g, ",");
	let url = "/mods" + (qs ? "?" + qs : "");

	if (window.history.replaceState) {
		window.history.replaceState("mods", "Serilum.com | Mods", url);
	}
}

function applyUrlFilters() {
	let params = new URLSearchParams(window.location.search);

	let query = params.get("q");
	if (query !== null) {
		$("#modsearch").val(query);
	}

	let env = params.get("env");
	if (env !== null) {
		let wanted = env === "none" ? [] : env.split(",");
		$(".envfilter .envchip").each(function() {
			$(this).toggleClass("enabled", wanted.includes($(this).attr("data-env")));
		});
	}

	let version = params.get("version");
	if (version !== null) {
		let wanted = version === "none" ? [] : version.split(",");
		$(".versionfilter .verchip").each(function() {
			$(this).toggleClass("enabled", wanted.includes($(this).attr("data-version")));
		});
	}
}

function compareVersionsDesc(a, b) {
	let pa = a.split(".").map(Number);
	let pb = b.split(".").map(Number);

	for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
		let da = pa[i] || 0;
		let db = pb[i] || 0;

		if (da !== db) {
			return db - da;
		}
	}

	return 0;
}

function checkForChangelogParameter() {
	let mod = new URLSearchParams(window.location.search).get("changelog");

	if (mod) {
		setChangelog(mod);
	}
}

function setChangelog(mod) {
	console.log("Setting changelog for " + mod + ".");

	$("body").addClass("prompt");

	$.ajax({
		url: "https://data.serilum.com/changelog/" + mod + ".txt",
		type: "GET",
		dataType: 'text',
		success: function(data){
			let content = formatChangelog(data);

			let filetype = logofiletypes[mod] || ".png";
			content = '<img class="clmodallogo" alt="logo" src="' + logoSrc(mod, filetype, logosizes[mod]) + '" srcset="' + logoSrcset(mod, filetype, logosizes[mod]) + '" sizes="90px">' + content;
			setRestChangelog(mod, content);
		},
		error: function(data) {
			closeChangelog();
			console.log("Mod " + mod + " not found.");
		}
	});
}

function setRestChangelog(mod, content) {
	$(".changelogwrapper .changelogcontent").html(content);
	$('.changelogwrapper .changelogcontent').scrollTop(0);

	$(".changelogwrapper").fadeIn(100);

	if (window.history.replaceState) {
		let params = new URLSearchParams(window.location.search);
		params.set("changelog", mod);
		let qs = params.toString().replace(/%2C/g, ",");
		window.history.replaceState("mods", "Serilum.com | Mods", "/mods?" + qs);
	}
}

function closeChangelog() {
	$(".changelogwrapper").hide();
	$("body").removeClass("prompt");

	if (window.history.replaceState) {
		let params = new URLSearchParams(window.location.search);
		params.delete("changelog");
		let qs = params.toString().replace(/%2C/g, ",");
		window.history.replaceState("mods", "Serilum.com | Mods", "/mods" + (qs ? "?" + qs : ""));
	}
}

function showVersionChoice(version, forgeurl, fabricurl) {
	$(".versionchoice .choiceversion").html(version);
	$("#choiceforge").attr('href', forgeurl);
	$("#choicefabric").attr('href', fabricurl);

	$(".versionchoice").fadeIn(100);
}

function closeVersionChoice() {
	$(".versionchoice").hide();
}

function getActiveModUrl(modname, fullurl=false) {
	let urlprefix = "";
	let urlsuffix = "";

	if (!enabledCurseForge()) {
		if (modname === "Villager Names") {
			urlsuffix += "-serilum";
		}

		urlprefix = "https://modrinth.com/mod/";
	}
	else {
		urlprefix = "https://curseforge.com/minecraft/mc-mods/";
	}

	if (fullurl) {
		return urlprefix + modSlug(modname) + urlsuffix;
	}
	return urlprefix;
}

function getModUrl(modname, fullurl=false, iscurseforge=true) {
	let urlprefix = "";
	let urlsuffix = "";

	if (!iscurseforge) {
		if (modname === "Villager Names") {
			urlsuffix += "-serilum";
		}

		urlprefix = "https://modrinth.com/mod/";
	}
	else {
		urlprefix = "https://www.curseforge.com/minecraft/mc-mods/";
	}

	if (fullurl) {
		return urlprefix + modSlug(modname) + urlsuffix;
	}
	return urlprefix;
}

function enabledCurseForge() {
	return $(".navigation .toggle input").is(":checked");
}

$(document).on('mouseup', '.changelogbtn', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	_qa("changelog_open", { mod: $(this).attr('value') });
	setChangelog($(this).attr('value'));
});

$(document).on('click', '.modlink', function(e) {
	let modcard = $(this).closest('.modcard');
	_qa("mod_open", { mod: modcard.find('.modlink.name').text(), host: enabledCurseForge() ? "curseforge" : "modrinth", environment: modcard.attr('data-env'), loaders: modcard.attr('data-loaders') });
});
$(document).on('click', '.loader', function(e) {
	_qa("loader_click", { mod: $(this).closest('.modcard').find('.modlink.name').text(), loader: $(this).text(), host: enabledCurseForge() ? "curseforge" : "modrinth" });
});
$(document).on('click', '.dependency', function(e) {
	_qa("dependency_click", { mod: $(this).closest('.modcard').find('.modlink.name').text(), dependency: $(this).text(), host: enabledCurseForge() ? "curseforge" : "modrinth" });
});
$(document).on('click', '.changelogbtn', function(e) {
	e.preventDefault();
});

$(document).on('mouseup', '.versionstrigger', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();
	$(".versionstrigger.open").not(this).removeClass("open");
	$(this).toggleClass("open");
});

$(document).on('mouseup', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	if (!$(e.target).closest('.versionstrigger').length) {
		$(".versionstrigger.open").removeClass("open");
	}
});

$(document).on('click', '.version', function(e) {
	e.preventDefault();

	let el = $(this);

	_qa("version_click", { mod: el.closest('.modcard').find('.modlink.name').text(), version: el.text(), host: enabledCurseForge() ? "curseforge" : "modrinth" });

	if (!enabledCurseForge()) {
		window.open(el.attr('data-mr'), '_blank').focus();
		return;
	}

	let cffabric = el.attr('data-cffabric');
	if (cffabric) {
		showVersionChoice(el.html(), el.attr('data-cf'), cffabric);
	}
	else {
		window.open(el.attr('data-cf'), '_blank').focus();
	}
});

$(document).on('click', '.versionchoice .choicebtn', function(e) {
	closeVersionChoice();
});
$(document).on('mouseup', '.versionchoice', function(e) {
	if (e.target === this) {
		closeVersionChoice();
	}
});

$(document).on('mouseup', 'a', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();
});

$(document).on('input', '#modsearch', function(e) {
	applyFilters();

	clearTimeout(searchTimer);
	let term = $(this).val().trim();
	if (term !== "") {
		searchTimer = setTimeout(function() {
			_qa("mod_search", { term: term.toLowerCase() });
		}, 800);
	}
});

$(document).on('mouseup', '.verchip', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();

	let chips = $(".versionfilter .verchip");
	let allenabled = chips.length === chips.filter(".enabled").length;

	if (allenabled) {
		// First filter action while everything is on: isolate the clicked version.
		chips.removeClass("enabled");
		$(this).addClass("enabled");
	}
	else {
		$(this).toggleClass("enabled");
	}

	applyFilters();

	_qa("version_filter", { version: $(this).attr('data-version'), enabled: $(this).hasClass("enabled") });
});

$(document).on('mouseup', '.envchip', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();

	let chips = $(".envfilter .envchip");
	let allenabled = chips.length === chips.filter(".enabled").length;

	if (allenabled) {
		// First filter action while everything is on: isolate the clicked environment.
		chips.removeClass("enabled");
		$(this).addClass("enabled");
	}
	else {
		$(this).toggleClass("enabled");
	}

	applyFilters();

	_qa("env_filter", { environment: $(this).attr('data-env'), enabled: $(this).hasClass("enabled") });
});

$(document).on('mouseup', '.resetfilters', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();

	resetRotation -= 360;
	$(this).find('.reseticon').css('transform', 'rotate(' + resetRotation + 'deg)');

	$("#modsearch").val("");
	$(".envfilter .envchip").addClass("enabled");
	$(".versionfilter .verchip").addClass("enabled");

	applyFilters();

	_qa("filters_reset", {});
});

$(document).on('mouseup', '.changelogwrapper .insidechangelog .closewrapper p', function(e) {
	closeChangelog();
});
$(document).on('mouseup', '.changelogwrapper', function(e) {
	if (e.target === this) {
		closeChangelog();
	}
});
$(document).on('keyup', function(e) {
	if (e.key === "Escape") {
		if ($(".changelogwrapper").is(":visible")) {
			closeChangelog();
		}
		if ($(".versionchoice").is(":visible")) {
			closeVersionChoice();
		}
	}
});
