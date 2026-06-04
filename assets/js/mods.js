const logofiletypes = {};
const collectedversions = {};

$(document).ready(function(e) {
	console.log("Loading https://serilum.com/mods");

	loadModData();

	checkForChangelogParameter();
});

function loadModData() {
	$.ajax({
		url: "/assets/data/mod_data.json",
		type: "GET",
		dataType: 'json',
		success: function(data){
			let gridcontent = "";

			for (let [modname, moddata] of Object.entries(data)) {
				if (!moddata["published"]) {
					continue;
				}

				let packageid = modname.replaceAll(" ", "-").replace("'", "").toLowerCase();
				let imagename = packageid + moddata["logo_file_type"];
				logofiletypes[packageid] = moddata["logo_file_type"];

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

				let cfslug = modname.replaceAll(" ", "-").replaceAll("'", "").toLowerCase();
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

				let card = '<div class="modcard' + extraclasses + '" data-name="' + modname.toLowerCase() + '" data-desc="' + moddata["description"].toLowerCase().replaceAll('"', '') + '" data-versions="' + allversions.join(" ") + '">';

				card += '	<div class="modcard-top">';
				card += '		<a class="modlink modlogo" href="' + modhref + '" value="' + modvalue + '" target=_blank><img class="modcard-logo" alt="logo" loading="lazy" decoding="async" width="56" height="56" src="/assets/data/logo/' + imagename + '"></a>';
				card += '		<div class="modcard-head">';
				card += '			<a class="modlink name" href="' + modhref + '" value="' + modvalue + '" target=_blank>' + modname + '</a>';
				card += '			<div class="modcard-tags">';
				if (hasfabric) {
					card += loaderBadge("fabric", "Fabric", 4, "fabric", cfmodurl, mrmodurl);
				}
				if (hasforge) {
					card += loaderBadge("forge", "Forge", 1, "forge", cfmodurl, mrmodurl);
				}
				if (hasneoforge) {
					card += loaderBadge("neoforge", "NeoForge", 6, "neoforge", cfmodurl, mrmodurl);
				}
				if (moddata["is_bundle"]) {
					card += '<span class="bundlebadge">Bundle</span>';
				}
				card += '			</div>';
				card += '		</div>';
				card += '	</div>';

				card += '	<p class="description">' + moddata["description"] + '</p>';

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

					card += '<a class="dependency" href="' + verurl + '" value="' + ourl + '" target=_blank title="Requires ' + deplabel + '"><img alt="' + dependency + '" loading="lazy" src="/assets/data/logo/' + dependency + '.png">' + deplabel + '</a>';
				}
				card += '		</div>';
				card += '	</div>';

				card += '</div>';

				gridcontent += card;
			}

			$(".modgrid").html(gridcontent);

			buildVersionFilter();
			applyFilters();

			$(".modwrapper").delay(300).fadeIn(500);
		},
		error: function(data) { }
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
	let cfslug = modname.replaceAll(" ", "-").replaceAll("'", "").toLowerCase();
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
	if (fabriclatest[version] !== undefined && mainfabric.indexOf(version) === -1 && moddata["fabric_url"]) {
		cffabric = moddata["fabric_url"].replace("https://", "https://www.") + "/files/all?version=" + fabriclatest[version];
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

	let shown = 0;
	$(".modgrid .modcard").each(function(e) {
		let card = $(this);

		let versions = card.attr("data-versions");

		let matchquery = query === "" || card.attr("data-name").includes(query) || card.attr("data-desc").includes(query);
		let matchversion = versions === "" || versions.split(" ").some(v => enabled.includes(v));

		if (matchquery && matchversion) {
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
	let url = document.URL;

	if (url.includes("?changelog=")) {
		let mod = url.split("?changelog=")[1];

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

			if (logofiletypes[mod] === undefined) {
				$.get("https://serilum.com/assets/data/logo/" + mod + ".png")
					.done(function() {
						content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + '.png">' + content;
						setRestChangelog(mod, content);
					}).fail(function() {
						console.log("Mod data not loaded yet and mod image is not a png.");
						console.log("Expect a 404 Not Found error in the console.");
						console.log("Don't worry. All is well!");

						content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + '.gif">' + content;
						setRestChangelog(mod, content);
				})

				return;
			}

			content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + logofiletypes[mod] + '">' + content;
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
		window.history.replaceState("mods", "Serilum.com | Mods", "/mods?changelog=" + mod);
	}
}

function closeChangelog() {
	$(".changelogwrapper").hide();
	$("body").removeClass("prompt");

	if (window.history.replaceState) {
		window.history.replaceState("mods", "Serilum.com | Mods", "/mods");
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
		return urlprefix + modname.replaceAll(" ", "-").replaceAll("'", "").toLowerCase() + urlsuffix;
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
		return urlprefix + modname.replaceAll(" ", "-").replaceAll("'", "").toLowerCase() + urlsuffix;
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
	_qa("mod_open", { mod: $(this).closest('.modcard').find('.modlink.name').text(), host: enabledCurseForge() ? "curseforge" : "modrinth" });
});
$(document).on('click', '.loader', function(e) {
	_qa("loader_click", { mod: $(this).closest('.modcard').find('.modlink.name').text(), loader: $(this).text(), host: enabledCurseForge() ? "curseforge" : "modrinth" });
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
