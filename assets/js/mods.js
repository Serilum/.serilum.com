const versionurlsuffix = { "1.19" : "3A73407", "1.18" : "3A73250", "1.17" : "3A73242", "1.16" : "3A70886", "1.15" : "3A68722", "1.14" : "3A64806", "1.13" : "3A55023", "1.12" : "3A628", "1.11" : "3A599", "1.7" : "3A5"};
const defaultenabled = ["1_19", "1_18", "1_16", "1_12"];
const ignoredversions = ["1.17", "1.15", "1.14", "1.13", "1.11", "1.7"];
const subversions = { "1.19" : 3, "1.18" : 2, "1.17" : 1, "1.16" : 5, "1.15" : 2, "1.14" : 4, "1.13" : 2, "1.12" : 2 };
const cfonly = [ "1.15", "1.14", "1.13", "1.12", "1.11", "1.7" ];
const logofiletypes = {};

$(document).ready(function(e) { 
	console.log("Loading https://serilum.com/mods");

	setVersionSelector();
	loadModData();

	checkForChangelogParameter();

	if (/Mobi|Android/i.test(navigator.userAgent)) {
		$(".footer").attr('style', 'z-index: -1;');
	}
});

function setVersionSelector() {
	let checkList = document.getElementById('versionselector');
	checkList.getElementsByClassName('anchor')[0].onclick = function(evt) {
		if (checkList.classList.contains('visible')) {
			checkList.classList.remove('visible');
		}
		else {
			checkList.classList.add('visible');
		}
	}

	for (let version of defaultenabled) {
		$("#cb" + version).prop('checked', 'true');
	}
}

function loadModData() {
	preloadImage("/assets/images/changelog.png");
	for (let version in versionurlsuffix) {
		preloadImage("/assets/data/logo/" + version.replace(".", "_") + ".png");
	}

	$.ajax({
		url: "/assets/data/mod_data.json",
		type: "GET",
		dataType: 'json',
		success: function(data){
			let modlistcontent = '<tr class="modheader">';
			modlistcontent += '	<th class="logo"></th>';
			modlistcontent += '	<th class="name">Name</th>';
			modlistcontent += '	<th class="description">Description</th>';
			modlistcontent += '	<th class="changelog">Changelog</th>';
			modlistcontent += '	<th class="versions">Fabric</th>';
			modlistcontent += '	<th class="versions">Forge</th>';
			modlistcontent += '	<th class="dependencies">Dependencies</th>';
			modlistcontent += '</tr>';

			let ishidden = "";
			for (let [modname, moddata] of Object.entries(data)) {
				if (!moddata["published"]) {
					continue;
				}

				let packageid = modname.replaceAll(" ", "-").replace("'", "").toLowerCase();
				let imagename = packageid + moddata["logo_file_type"];
				logofiletypes[packageid] = moddata["logo_file_type"];

				preloadImage("/assets/data/logo/" + imagename);

				let hasfabric = moddata["fabric_versions"].length > 0;
				let hasforge = moddata["forge_versions"].length > 0;

				let extrarowclasses = "";
				if (hasfabric) {
					extrarowclasses += " hasfabric";
				}
				if (hasforge) {
					extrarowclasses += " hasforge";
				}

				let modrowcontent = '<tr class="modrow' + extrarowclasses + '">';
				modrowcontent += '	<td class="logo"><img alt="logo" src="/assets/data/logo/' + imagename + '"></a></td>';
				modrowcontent += '	<td class="name">' + modname + '</a></td>';
				modrowcontent += '	<td class="description">' + moddata["description"] + '</td>';

				modrowcontent += '	<td class="changelog"><a href="#changelog"><img class="climage" alt="climage" src="/assets/images/changelog.png" value="' + packageid + '"></a></td>';

				modrowcontent += '	<td class="versions fabricver">';
				for (let fabric_version of moddata["fabric_versions"]) {
					ishidden = "";
					if (ignoredversions.includes(fabric_version)) {
						ishidden = " hidden";
					}

					let fabric_url = moddata["fabric_url"]
					if (fabric_version !== "1.16" && fabric_version !== "1.17") {
						fabric_url = fabric_url.replace("-fabric-version", "").replace("-fabric", "");
					}

					let cfurl = fabric_url + '/files/all?filter-status=1&filter-game-version=1738749986%' + versionurlsuffix[fabric_version];

					let subver = fabric_version;
					for (let i = 1; i <= subversions[fabric_version]; i++) {
						subver += "," + fabric_version + "." + i;
					}
					let mrurl = getModUrl(modname, true, false) + "/versions?l=fabric&g=" + subver;

					let verurl = cfurl;
					let ourl = mrurl;
					if (!enabledCurseForge()) {
						verurl = mrurl;
						ourl = cfurl;
					}

					modrowcontent += '<a class="v' + fabric_version.replace(".", "_") + '" href="' + verurl + '" value="' + ourl + '" target=_blank' + ishidden + '><img alt="version" src="/assets/images/versions/' + fabric_version.replaceAll(".", "_") + '.png"></a>';
				}
				modrowcontent += '</td>';

				modrowcontent += '	<td class="versions forgever">';
				for (let forge_version of moddata["forge_versions"]) {
					ishidden = "";
					if (ignoredversions.includes(forge_version)) {
						ishidden = " hidden";
					}

					let iscurseforge = enabledCurseForge();
					if (cfonly.includes(forge_version)) {
						iscurseforge = true;
					}

					let cfurl = moddata["forge_url"] + '/files/all?filter-status=1&filter-game-version=1738749986%' + versionurlsuffix[forge_version];

					let subver = forge_version;
					for (let i = 1; i <= subversions[forge_version]; i++) {
						subver += "," + forge_version + "." + i;
					}
					let mrurl = getModUrl(modname, true, false) + "/versions?l=forge&g=" + subver;

					let verurl = cfurl;
					let ourl = mrurl;
					if (!iscurseforge) {
						verurl = mrurl;
						ourl = cfurl;
					}

					if (cfonly.includes(forge_version)) {
						ourl = verurl;
					}

					modrowcontent += '<a class="v' + forge_version.replace(".", "_") + '" href="' + verurl + '" value="' + ourl + '" target=_blank' + ishidden + '><img alt="version" src="/assets/images/versions/' + forge_version.replaceAll(".", "_") + '.png"></a>';
				}
				modrowcontent += '</td>';

				modrowcontent += '	<td class="dependencies">';
				for (let dependency of moddata["dependencies"]) {
					let cfurl = getModUrl(modname, false, true) + dependency;
					let mrurl = getModUrl(modname, false, false) + dependency;

					let verurl = cfurl;
					let ourl = mrurl;
					if (!enabledCurseForge()) {
						verurl = mrurl;
						ourl = cfurl;
					}

					modrowcontent += '<a class="dependency_' + dependency + '" href="' + verurl + '" value="' + ourl + '" target=_blank' + '><img alt="dependency" src="/assets/data/logo/' + dependency + '.png"></a>';
				}

				modrowcontent += '</td>';

				modrowcontent += '</tr>';

				modlistcontent += modrowcontent;
			}

			$("table.modlist").html(modlistcontent);

			$(".modwrapper").delay(300).fadeIn(500);
		},
		error: function(data) { }
	});
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
		url: "https://raw.githubusercontent.com/ricksouth/serilum-mc-mods/master/changelog/" + mod + ".txt",
		type: "GET",
		dataType: 'text',
		success: function(data){
			let content = wrapURL(data.replaceAll("\n", "<br>"), true);

			if (logofiletypes[mod] === undefined) {
				$.get("https://serilum.com/assets/data/logo/" + mod + ".png")
					.done(function() { 
						content = '<img alt="logo" src="/assets/data/logo/' + mod + '.png"><br><br>' + content;
						setRestChangelog(mod, content);
					}).fail(function() {
						console.log("Mod data not loaded yet and mod image is not a png.");
						console.log("Expect a 404 Not Found error in the console.");
						console.log("Don't worry. All is well!");

						content = '<img alt="logo" src="/assets/data/logo/' + mod + '.gif"><br><br>' + content;
						setRestChangelog(mod, content);
				})

				return;
			}

			content = '<img alt="logo" src="/assets/data/logo/' + mod + logofiletypes[mod] + '"><br><br>' + content;
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

$(document).on('mouseup', 'a', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	e.stopImmediatePropagation();
});

$(document).on('mouseup', '.modrow', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	let modrow = $(this);
	let modname = modrow.children('.name').html();

	window.open(getActiveModUrl(modname, true), '_blank').focus();
});

$("#versionselector input").change(function() {
	let version = $(this).attr('id').replace("cb", "");

	if ($(this).is(":checked")) {
		$(".v" + version).show();
	}
	else {
		$(".v" + version).hide();
	}
});
$(document).on('mouseup', '#versionselector .items p', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	let id = $(this).attr('id');
	$("#" + id.replace("label", "")).click();
});

$(document).on('mouseup', '.climage', function(e) {
	if (!(e.which === 1)) {
		return;
	}

	let mod = $(this).attr('value');
	setChangelog(mod);
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
	}
});

function closeChangelog() {
	$(".changelogwrapper").hide();
	$("body").removeClass("prompt");

	if (window.history.replaceState) {
		window.history.replaceState("mods", "Serilum.com | Mods", "/mods");
	}
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
		urlprefix = "https://curseforge.com/minecraft/mc-mods/";
	}

	if (fullurl) {
		return urlprefix + modname.replaceAll(" ", "-").replaceAll("'", "").toLowerCase() + urlsuffix;
	}
	return urlprefix;
}

function enabledCurseForge() {
	return $(".navigation .toggle input").is(":checked");
}

function preloadImage(url) {
	let img = new Image();
	img.src = url;
}

function wrapURL(text) {
	let urlPattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^z`!()\[\]{};:'".,<>?«»“”‘’]))/ig;

	return text.replace(urlPattern, function (url) {
		return `<a href="${url.trim()}" target=_blank>${url.trim()}</a>`;
	});
}