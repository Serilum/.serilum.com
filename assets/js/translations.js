const siteBase = "https://translations.serilum.com/";
const dataBase = siteBase + "lang/";
const repoSlug = "Serilum/.translations";
const repoBranch = "main";
const sourceLocale = "en_us";
const placeholderPattern = /%(?:\d+\$)?s/g;

let curatedLocales = [];
let allLocales = [];
let sections = [];
let totalKeys = 0;
let currentLocale = "";
let localeExists = false;
let progress = {};
let knownLangs = {};
let pendingImport = null;
let serverValues = {};
let suppressAutoHide = false;

$(document).ready(function(e) {
	console.log("Loading https://serilum.com/translations");

	$.getJSON(siteBase + "settings/languages.json").done(function(curated) {
		curatedLocales = curated.filter(function(l) { return l[0] !== sourceLocale; });
		$.getJSON(siteBase + "settings/all_languages.json").done(function(all) {
			allLocales = all.filter(function(l) { return l[0] !== sourceLocale; });
			loadManifest(startEditor);
		}).fail(function() {
			loadManifest(startEditor);
		});
	}).fail(function() {
		$("#editor").html('<p class="loaderror">Could not load the language list. Please try again in a moment.</p>');
		$("#langlist").html('<div class="langempty">Could not load languages.</div>');
	});
});

function loadManifest(next) {
	$.getJSON(siteBase + "manifest.min.json").done(function(manifest) {
		knownLangs = manifest.languages || {};
		let total = manifest.source || 0;
		progress = {};
		if (total > 0 && manifest.translated) {
			for (let code in manifest.translated) {
				progress[code] = Math.round((manifest.translated[code] / total) * 100);
			}
		}
	}).always(function() {
		next();
	});
}

function startEditor() {
	wireControls();
	setMobileTab("intro");
	buildLanguageList();
	loadSource();
}

function loadSource() {
	$.getJSON(dataBase + "en_us.json").done(function(en) {
		parseSource(en);
		renderEditor();

		let last = localeFromUrl() || Cookies.get("translations_locale") || "";
		if (last && !inLocales(curatedLocales, last) && !inLocales(allLocales, last)) {
			Cookies.remove("translations_locale");
			last = "";
		}
		let showAll = Cookies.get("translations_showall") === "1";
		if (last && !inLocales(curatedLocales, last) && inLocales(allLocales, last)) {
			showAll = true;
		}
		$("#showall").prop("checked", showAll);
		$("#hidecompleted").prop("checked", Cookies.get("translations_hidecompleted") === "1");
		buildLanguageList();
		currentLocale = last;
		selectLocale();
	}).fail(function() {
		$("#editor").html('<p class="loaderror">Could not load the source translations. Please try again in a moment.</p>');
	});
}

function wireControls() {
	$("#langlist").on("click", ".langitem", function() {
		chooseLocale($(this).data("code"));
	});
	$("#langlist").on("click", ".langclear", clearLocale);
	$(".tabbar .tab").on("click", function() {
		setMobileTab($(this).data("tab"));
	});
	$("#langsearch").on("input", filterLanguages);
	$("#showall").on("change", toggleAllLanguages);
	$("#hidecompleted").on("change", function() {
		Cookies.set("translations_hidecompleted", this.checked ? "1" : "0", { expires: 365 });
		filterLanguages();
	});
	$("#filter").on("input", applyFilter);
	$("#introtoggle").on("click", function() {
		suppressAutoHide = true;
		setIntroCollapsed(!$("#introblock").is("[hidden]"));
	});
	setIntroCollapsed(Cookies.get("translations_introcollapsed") === "1");
	$(".translations").on("click input", maybeAutoHideIntro);
	$("#editor").on("input", "textarea", function() {
		autoGrow(this);
		setRowState(this);
		checkPlaceholders($(this));
		saveDraft();
		updateProgress();
	});
	$(".toolbar .copy").on("click", copyFile);
	$(".toolbar .github").on("click", openGithub);
	$(".toolbar .download").on("click", openDownloadModal);
	$(".downloadmodal-confirm").on("click", function() {
		closeDownloadModal();
		downloadFile();
	});
	$(".downloadmodal-cancel").on("click", closeDownloadModal);
	$("#downloadmodal").on("click", function(e) {
		if (e.target === this) { closeDownloadModal(); }
	});
	$(".toolbar .import").on("click", function() {
		$("#importfile").trigger("click");
	});
	$("#importfile").on("change", importFile);
	$(".toolbar .resync").on("click", openResyncModal);
	$(".trmodal-confirm").on("click", function() {
		closeResyncModal();
		resyncLocale();
	});
	$(".trmodal-cancel").on("click", closeResyncModal);
	$("#resyncmodal").on("click", function(e) {
		if (e.target === this) { closeResyncModal(); }
	});
	$(".importmodal-confirm").on("click", confirmImport);
	$(".importmodal-cancel").on("click", closeImportModal);
	$("#importmodal").on("click", function(e) {
		if (e.target === this) { closeImportModal(); }
	});
	$(document).on("keydown", function(e) {
		if (e.key === "Escape") {
			closeResyncModal();
			closeImportModal();
			closeDownloadModal();
		}
	});
}

function buildLanguageList() {
	let curatedCodes = {};
	for (let l of curatedLocales) {
		curatedCodes[l[0]] = true;
	}

	let html = sectionHtml("Suggested languages", curatedLocales);
	if ($("#showall").is(":checked")) {
		let others = allLocales.filter(function(l) { return !curatedCodes[l[0]]; });
		html += sectionHtml("All languages", others);
	}
	$("#langlist").html(html);
	highlightCurrent();
	filterLanguages();
	renderPinned();
}

function sectionHtml(title, list) {
	if (list.length === 0) {
		return "";
	}
	let rows = "";
	for (let [code, name] of list) {
		rows += langRowHtml(code, name);
	}
	return '<div class="langsection"><div class="langsection-title">' + esc(title) + "</div>" + rows + "</div>";
}

function langRowHtml(code, name) {
	let pct = progress[code];
	let width = pct == null ? 0 : pct;
	let pctText = pct == null ? "" : pct + "%";
	return '<button type="button" class="langitem" role="option" data-code="' + esc(code) + '">'
		+ '<span class="langitem-top"><span class="langitem-name">' + esc(name) + "</span>"
		+ '<span class="langitem-pct">' + pctText + "</span></span>"
		+ '<span class="langitem-bot"><span class="langbar"><span style="width:' + width + '%"></span></span>'
		+ '<span class="langitem-code">' + esc(code) + "</span></span>"
		+ "</button>";
}

function inLocales(list, code) {
	return list.some(function(l) { return l[0] === code; });
}

function nameFor(code) {
	for (let l of allLocales) {
		if (l[0] === code) { return l[1]; }
	}
	for (let l of curatedLocales) {
		if (l[0] === code) { return l[1]; }
	}
	return code;
}

function toggleAllLanguages() {
	Cookies.set("translations_showall", this.checked ? "1" : "0", { expires: 365 });
	buildLanguageList();
}

function filterLanguages() {
	let q = $("#langsearch").val().toLowerCase();
	let hideDone = $("#hidecompleted").is(":checked");
	let visible = 0;
	$("#langlist .langsection .langitem").each(function() {
		let item = $(this);
		let code = String(item.data("code"));
		let matches = q === "" || code.indexOf(q) !== -1 || item.find(".langitem-name").text().toLowerCase().indexOf(q) !== -1;
		let completed = hideDone && progress[code] === 100 && code !== currentLocale;
		let show = matches && !completed;
		item.toggle(show);
		if (show) {
			visible += 1;
		}
	});
	$("#langlist .langsection").each(function() {
		let anyShown = $(this).find(".langitem").filter(function() { return this.style.display !== "none"; }).length > 0;
		$(this).toggle(anyShown);
	});
	$("#langlist .langempty").remove();
	if (visible === 0) {
		let msg = $("#langlist .langsection .langitem").length === 0 ? "No languages available." : "No languages to show.";
		$("#langlist").append('<div class="langempty">' + msg + "</div>");
	}
}

function chooseLocale(code) {
	currentLocale = code;
	selectLocale();
	if ($(".tabbar").is(":visible")) {
		setMobileTab("editor");
	}
	_qa("translation_select", { locale: code });
}

function selectLocale() {
	updateSelectedHeader();
	updateUrlLocale();
	filterLanguages();
	highlightCurrent();
	renderPinned();
	serverValues = {};
	if (currentLocale === "") {
		$(".toolbar").addClass("empty");
		$("#editor").attr("hidden", true);
		clearInputs();
		updateProgress();
		return;
	}
	Cookies.set("translations_locale", currentLocale, { expires: 365 });
	$(".toolbar .loc").text(currentLocale);
	$(".toolbar").removeClass("empty");
	$("#editor").removeAttr("hidden");

	if (Object.keys(knownLangs).length > 0 && !knownLangs[currentLocale]) {
		localeExists = false;
		fillInputs({});
		return;
	}

	$.getJSON(dataBase + currentLocale + ".json").done(function(existing) {
		localeExists = true;
		serverValues = existing;
		fillInputs(existing);
	}).fail(function() {
		localeExists = false;
		serverValues = {};
		fillInputs({});
	});
}

function highlightCurrent() {
	$("#langlist .langitem").removeClass("selected");
	if (currentLocale === "") {
		return;
	}
	$('#langlist .langitem[data-code="' + currentLocale + '"]').addClass("selected");
}

function renderPinned() {
	$("#langlist .langpinned").remove();
	if (currentLocale === "") {
		return;
	}
	let pinned = '<div class="langpinned"><div class="langsection-title">Selected'
		+ '<button type="button" class="langclear" title="Clear selection">&times;</button></div>'
		+ langRowHtml(currentLocale, nameFor(currentLocale)) + "</div>";
	$("#langlist").prepend(pinned);
	$("#langlist .langpinned .langitem").addClass("selected");
}

function clearLocale() {
	currentLocale = "";
	Cookies.remove("translations_locale");
	selectLocale();
}

function localeFromUrl() {
	try {
		return new URLSearchParams(window.location.search).get("lang") || "";
	} catch (err) {
		return "";
	}
}

function updateUrlLocale() {
	let params = new URLSearchParams(window.location.search);
	if (currentLocale === "") {
		params.delete("lang");
	} else {
		params.set("lang", currentLocale);
	}
	let qs = params.toString();
	let url = window.location.pathname + (qs ? "?" + qs : "") + window.location.hash;
	history.replaceState(null, "", url);
}

function setIntroCollapsed(collapsed, persist) {
	if (collapsed) {
		$("#introblock").attr("hidden", true);
	} else {
		$("#introblock").removeAttr("hidden");
	}
	$("#introtoggle").html(collapsed ? "&#9662; Show intro" : "&#9652; Hide intro").attr("aria-expanded", !collapsed);
	if (persist !== false) {
		Cookies.set("translations_introcollapsed", collapsed ? "1" : "0", { expires: 365 });
	}
}

function maybeAutoHideIntro(e) {
	if (suppressAutoHide || !$("#introtoggle").is(":visible")) {
		return;
	}
	if ($(e.target).closest("#introblock, #introtoggle").length) {
		return;
	}
	if (!$(e.target).closest("textarea, input, button, select, a, label").length) {
		return;
	}
	suppressAutoHide = true;
	if (!$("#introblock").is("[hidden]")) {
		setIntroCollapsed(true, false);
	}
}

function setMobileTab(name) {
	$(".translations").removeClass("mtab-languages mtab-intro mtab-editor").addClass("mtab-" + name);
	$(".tabbar .tab").removeClass("active").filter("[data-tab='" + name + "']").addClass("active");
}

function updateSelectedHeader() {
	if (currentLocale === "") {
		$(".selectedlang").text("No language selected");
		return;
	}
	$(".selectedlang").text(nameFor(currentLocale) + " (" + currentLocale + ")");
}

function openResyncModal() {
	if (currentLocale === "") {
		return;
	}
	$(".trmodal-loc").text(currentLocale);
	$("#resyncmodal").removeAttr("hidden");
}

function closeResyncModal() {
	$("#resyncmodal").attr("hidden", true);
}

function resyncLocale() {
	if (currentLocale === "") {
		return;
	}
	localStorage.removeItem(draftKey());
	$.getJSON(dataBase + currentLocale + ".json").done(function(existing) {
		localeExists = true;
		serverValues = existing;
		fillInputs(existing);
		showToast("Re-synced lang/" + currentLocale + ".json from the server.", "#4f9a5b");
	}).fail(function() {
		localeExists = false;
		serverValues = {};
		fillInputs({});
		showToast("No server file for " + currentLocale + " yet; cleared local changes.", "#4f9a5b");
	});
}

function parseSource(en) {
	sections = [];
	totalKeys = 0;
	let current = null;
	for (let key in en) {
		if (key.indexOf("_comment_modname_") === 0) {
			current = { modid: key.substring("_comment_modname_".length), title: en[key], entries: [] };
			sections.push(current);
			continue;
		}
		if (current === null) {
			current = { modid: "other", title: "Other", entries: [] };
			sections.push(current);
		}
		current.entries.push({ key: key, english: en[key] });
		totalKeys += 1;
	}
}

function renderEditor() {
	let html = "";
	for (let section of sections) {
		html += '<div class="section" data-modid="' + section.modid + '">';
		html += '<h2><span class="sectitle">' + esc(section.title) + '</span><span class="modid">' + esc(section.modid) + '</span><span class="seccount"></span></h2>';
		for (let entry of section.entries) {
			html += '<div class="row" data-key="' + esc(entry.key) + '">';
			html += '<div class="src"><div class="en">' + esc(entry.english) + '</div><div class="key">' + esc(entry.key) + "</div></div>";
			html += '<textarea rows="1" spellcheck="true" data-key="' + esc(entry.key) + '"></textarea>';
			html += "</div>";
		}
		html += "</div>";
	}
	$("#editor").html(html);
}

function fillInputs(existing) {
	let values = $.extend({}, existing, readDraft());
	$("#editor textarea").each(function() {
		let v = values[$(this).data("key")];
		$(this).val(v == null ? "" : v);
		autoGrow(this);
		setRowState(this);
		checkPlaceholders($(this));
	});
	updateProgress();
}

function clearInputs() {
	$("#editor textarea").val("").each(function() { autoGrow(this); setRowState(this); });
}

function collectValues() {
	let values = {};
	$("#editor textarea").each(function() {
		let v = $(this).val();
		if (v !== "") {
			values[$(this).data("key")] = v;
		}
	});
	return values;
}

function effectiveValues() {
	let values = {};
	$("#editor textarea").each(function() {
		let key = $(this).data("key");
		let v = $(this).val();
		if (v !== "") {
			values[key] = v;
		} else if (typeof serverValues[key] === "string") {
			values[key] = serverValues[key];
		}
	});
	return values;
}

function buildLocaleFile() {
	let values = effectiveValues();
	let groups = [];
	for (let section of sections) {
		let done = section.entries.filter(function(en) { return values[en.key] != null; });
		if (done.length > 0) {
			groups.push([section, done]);
		}
	}
	let out = "{\n";
	groups.forEach(function(group, gi) {
		let section = group[0], done = group[1];
		out += "  " + JSON.stringify("_comment_modname_" + section.modid) + ": " + JSON.stringify(section.title) + ",\n";
		done.forEach(function(en, ki) {
			let last = (gi === groups.length - 1) && (ki === done.length - 1);
			out += "  " + JSON.stringify(en.key) + ": " + JSON.stringify(values[en.key]) + (last ? "" : ",") + "\n";
		});
		if (gi !== groups.length - 1) {
			out += "\n";
		}
	});
	out += "}\n";
	return out;
}

function copyFile() {
	if (!guardEmpty()) { return; }
	navigator.clipboard.writeText(buildLocaleFile()).then(function() {
		_qa("translation_copy", { locale: currentLocale });
		if (!placeholderWarningToast()) {
			showToast("Copied lang/" + currentLocale + ".json to your clipboard.", "#4f9a5b");
		}
	}, function() {
		showToast("Could not access the clipboard. Use Download instead.", "#d9534f");
	});
}

function openGithub() {
	if (!guardEmpty()) { return; }
	let path = "lang/" + currentLocale + ".json";
	let url = localeExists
		? "https://github.com/" + repoSlug + "/edit/" + repoBranch + "/" + path
		: "https://github.com/" + repoSlug + "/new/" + repoBranch + "?filename=" + path;
	_qa("translation_github", { locale: currentLocale, mode: localeExists ? "edit" : "new" });
	window.open(url, "_blank");
}

function openDownloadModal() {
	if (!guardEmpty()) {
		return;
	}
	$(".downloadmodal-file").text(currentLocale + ".json");
	$("#downloadmodal").removeAttr("hidden");
}

function closeDownloadModal() {
	$("#downloadmodal").attr("hidden", true);
}

function downloadFile() {
	if (!guardEmpty()) { return; }
	let blob = new Blob([buildLocaleFile()], { type: "application/json" });
	let a = document.createElement("a");
	a.href = URL.createObjectURL(blob);
	a.download = currentLocale + ".json";
	a.click();
	URL.revokeObjectURL(a.href);
	_qa("translation_download", { locale: currentLocale });
	placeholderWarningToast();
}

function importFile(e) {
	let file = e.target.files[0];
	if (!file) {
		return;
	}
	let reader = new FileReader();
	reader.onload = function() {
		let data;
		try {
			data = JSON.parse(reader.result);
		} catch (err) {
			showToast("That file is not valid JSON.", "#d9534f");
			return;
		}
		if (!data || typeof data !== "object") {
			showToast("That file is not a language file.", "#d9534f");
			return;
		}
		pendingImport = data;
		$(".importmodal-file").text(file.name);
		$("#importmodal").removeAttr("hidden");
	};
	reader.readAsText(file);
	$("#importfile").val("");
}

function confirmImport() {
	let data = pendingImport;
	closeImportModal();
	if (data) {
		applyImported(data);
		_qa("translation_import", { locale: currentLocale });
	}
}

function closeImportModal() {
	$("#importmodal").attr("hidden", true);
	pendingImport = null;
}

function applyImported(data) {
	let applied = 0;
	$("#editor textarea").each(function() {
		let key = $(this).data("key");
		if (typeof data[key] === "string") {
			$(this).val(data[key]);
			autoGrow(this);
			setRowState(this);
			checkPlaceholders($(this));
			applied += 1;
		}
	});
	saveDraft();
	updateProgress();
	showToast("Imported " + applied + " translation" + (applied === 1 ? "" : "s") + " from the file.", "#4f9a5b");
}

function guardEmpty() {
	if (Object.keys(collectValues()).length === 0) {
		showToast("Nothing to submit yet. Fill in at least one translation.", "#d9534f");
		return false;
	}
	return true;
}

function placeholderWarningToast() {
	let warns = $("#editor .row.warn").length;
	if (warns === 0) {
		return false;
	}
	let msg = warns === 1
		? "Heads up: 1 field has a placeholder mismatch. Check the highlighted row before submitting."
		: "Heads up: " + warns + " fields have placeholder mismatches. Check the highlighted rows before submitting.";
	showToast(msg, "#d9534f");
	return true;
}

function updateProgress() {
	let done = currentLocale === "" ? 0 : Object.keys(collectValues()).length;
	let pct = totalKeys === 0 ? 0 : Math.round((done / totalKeys) * 100);
	$(".selected .bar span").css("width", pct + "%");
	$(".selected .pct").text(done + " / " + totalKeys + " (" + pct + "%)");
	updateSectionCounts();
}

function updateSectionCounts() {
	$("#editor .section").each(function() {
		let tas = $(this).find("textarea");
		let done = tas.filter(function() { return $(this).val() !== ""; }).length;
		$(this).find(".seccount").text(done + " / " + tas.length);
	});
}

function setRowState(el) {
	$(el).closest(".row").toggleClass("filled", $(el).val() !== "");
}

function applyFilter() {
	let q = $("#filter").val().toLowerCase();
	$("#editor .row").each(function() {
		let row = $(this);
		let hit = q === "" || row.text().toLowerCase().indexOf(q) !== -1 || (row.find("textarea").val() || "").toLowerCase().indexOf(q) !== -1;
		row.toggle(hit);
	});
	$("#editor .section").each(function() {
		let anyShown = $(this).find(".row").filter(function() { return this.style.display !== "none"; }).length > 0;
		$(this).toggle(anyShown);
	});
}

function checkPlaceholders(textarea) {
	let value = textarea.val();
	let row = textarea.closest(".row");
	if (value === "" || samePlaceholders(englishFor(textarea.data("key")), value)) {
		row.removeClass("warn");
	} else {
		row.addClass("warn");
	}
}

function samePlaceholders(a, b) {
	let pa = (a.match(placeholderPattern) || []).sort();
	let pb = (b.match(placeholderPattern) || []).sort();
	return pa.join(",") === pb.join(",");
}

function englishFor(key) {
	for (let section of sections) {
		for (let entry of section.entries) {
			if (entry.key === key) { return entry.english; }
		}
	}
	return "";
}

function draftKey() {
	return "translations_draft_" + currentLocale;
}

function saveDraft() {
	if (currentLocale === "") { return; }
	localStorage.setItem(draftKey(), JSON.stringify(collectValues()));
}

function readDraft() {
	try {
		return JSON.parse(localStorage.getItem(draftKey()) || "{}");
	} catch (err) {
		return {};
	}
}

function autoGrow(el) {
	el.style.height = "auto";
	el.style.height = (el.scrollHeight + 2) + "px";
}

function esc(s) {
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
