const grouppagesize = 40;
const logofiletypes = {};

let allentries = [];
let rendergroups = [];
let filteredcount = 0;
let currentpage = 0;
let searchterm = "";

$(document).ready(function(e) {
	console.log("Loading https://serilum.com/mods/changelog");
	loadChangelogData();
});

function loadChangelogData() {
	$.ajax({
		url: "/assets/data/changelog_data.json",
		type: "GET",
		dataType: 'json',
		success: function(changelogdata) {
			allentries = [];
			for (let key of changelogdata["keys"]) {
				let linedata = changelogdata["entries"][key];
				allentries.push({
					timestamp: linedata["timestamp"],
					modname: linedata["modname"],
					version: linedata["version"],
					slug: linedata["slug"],
					content: linedata["content"]
				});
			}

			buildHeader();
			currentpage = getPageFromUrl();
			applyFilter();
			$(".changelogwrapper .insidechangelog").delay(100).fadeIn(400);
		},
		error: function(data) { }
	});
}

function buildHeader() {
	let headerhtml = "";

	headerhtml += '<div class="clheader">';
	headerhtml += "<h1>Global Mod Changelog</h1>";
	headerhtml += "<p>An overview of every changelog submitted across all mods. Search for a mod, or click a mod name to open its complete changelog.</p>";
	headerhtml += '</div>';

	headerhtml += '<div class="clcontrols">';
	headerhtml += '<div class="toppager"></div>';
	headerhtml += '<input id="clsearch" type="text" placeholder="Search mods" autocomplete="off">';
	headerhtml += '<p class="clcount"></p>';
	headerhtml += '</div>';

	headerhtml += '<div class="cllist"></div>';
	headerhtml += '<div class="pager"></div>';

	$(".changelogwrapper .insidechangelog").html(headerhtml);
}

function applyFilter() {
	let filtered = allentries;
	if (searchterm !== "") {
		filtered = allentries.filter(function(entry) {
			return entry.modname.toLowerCase().includes(searchterm);
		});
	}
	filteredcount = filtered.length;

	rendergroups = [];
	let groupindex = {};
	for (let entry of filtered) {
		let groupkey = entry.timestamp + "||" + entry.content;
		if (groupindex[groupkey] === undefined) {
			let group = {
				timestamp: entry.timestamp,
				content: entry.content,
				items: []
			};
			groupindex[groupkey] = group;
			rendergroups.push(group);
		}
		groupindex[groupkey].items.push(entry);
	}

	renderPage();
}

function renderPage() {
	let totalpages = Math.max(1, Math.ceil(rendergroups.length / grouppagesize));
	if (currentpage > totalpages - 1) { currentpage = totalpages - 1; }
	if (currentpage < 0) { currentpage = 0; }

	setPageInUrl(currentpage);

	let start = currentpage * grouppagesize;
	let pagegroups = rendergroups.slice(start, start + grouppagesize);

	let listhtml = "";

	if (pagegroups.length === 0) {
		listhtml += '<p class="clnoresults">No mods match your search.</p>';
	}

	let lasttimestamp = "";
	for (let group of pagegroups) {
		if (lasttimestamp !== group.timestamp) {
			listhtml += '<p class="cldate">' + group.timestamp + '</p>';
			lasttimestamp = group.timestamp;
		}

		listhtml += buildGroup(group);
	}

	$(".cllist").html(listhtml);
	$(".clcount").html(filteredcount + (filteredcount === 1 ? " update" : " updates"));

	buildPager(totalpages);
}

function buildGroup(group) {
	let grouphtml = '<div class="clgroup">';

	if (group.items.length === 1) {
		let item = group.items[0];

		grouphtml += '<div class="clcard">';
		grouphtml += '<a class="clmod" href="https://serilum.com/mods/?changelog=' + item.slug + '" data-slug="' + item.slug + '" target=_blank>' + item.modname + ' <span class="clver">' + item.version + '</span></a>';
		grouphtml += '<p class="clcontent">' + group.content.replaceAll("\n", "<br>") + '</p>';
		grouphtml += '</div>';
	}
	else {
		grouphtml += '<div class="clcard batch">';
		grouphtml += '<p class="clbatchtoggle">' + group.items.length + ' mods updated</p>';
		grouphtml += '<p class="clcontent">' + group.content.replaceAll("\n", "<br>") + '</p>';
		grouphtml += '<div class="clchips hidden">';
		for (let item of group.items) {
			grouphtml += '<a class="clchip" href="https://serilum.com/mods/?changelog=' + item.slug + '" data-slug="' + item.slug + '" target=_blank>' + item.modname + ' <span class="clver">' + item.version + '</span></a>';
		}
		grouphtml += '</div>';
		grouphtml += '</div>';
	}

	grouphtml += '</div>';
	return grouphtml;
}

function buildPager(totalpages) {
	if (totalpages <= 1) {
		$(".pager, .toppager").html("");
		return;
	}

	let pagerhtml = "";
	pagerhtml += '<span class="pagerbtn prev' + (currentpage === 0 ? ' disabled' : '') + '">&#8249; Prev</span>';
	pagerhtml += '<span class="pageinfo">Page ' + (currentpage + 1) + ' of ' + totalpages + '</span>';
	pagerhtml += '<span class="pagerbtn next' + (currentpage === totalpages - 1 ? ' disabled' : '') + '">Next &#8250;</span>';

	$(".pager, .toppager").html(pagerhtml);
}

function scrollToList() {
	// Land the list flush against the bottom of the sticky controls (which stick 1px under the nav).
	let controlstop = $(window).width() <= 620.5 ? 72 : 42;
	let target = $(".cllist").offset().top - controlstop - $(".clcontrols").outerHeight() - 20;

	$('html, body').scrollTop(target);
}

$(document).on('input', '#clsearch', function(e) {
	searchterm = $(this).val().toLowerCase().trim();
	currentpage = 0;
	applyFilter();
});

$(document).on('mouseup', '.clbatchtoggle', function(e) {
	if (!(e.which === 1)) { return; }

	$(this).toggleClass('open');
	$(this).siblings('.clchips').toggleClass('hidden');
});

$(document).on('mouseup', '.pagerbtn.prev', function(e) {
	if (!(e.which === 1)) { return; }
	if ($(this).hasClass('disabled')) { return; }

	currentpage -= 1;
	renderPage();
	scrollToList();
});

$(document).on('mouseup', '.pagerbtn.next', function(e) {
	if (!(e.which === 1)) { return; }
	if ($(this).hasClass('disabled')) { return; }

	currentpage += 1;
	renderPage();
	scrollToList();
});

function openModChangelog(mod) {
	console.log("Opening changelog for " + mod + ".");

	$("body").addClass("prompt");

	$.ajax({
		url: "https://data.serilum.com/changelog/" + mod + ".txt",
		type: "GET",
		dataType: 'text',
		success: function(data) {
			let content = formatChangelog(data);

			if (logofiletypes[mod] === undefined) {
				$.get("https://serilum.com/assets/data/logo/" + mod + ".png")
					.done(function() {
						content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + '.png">' + content;
						setRestModChangelog(content);
					}).fail(function() {
						content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + '.gif">' + content;
						setRestModChangelog(content);
				})

				return;
			}

			content = '<img class="clmodallogo" alt="logo" src="/assets/data/logo/' + mod + logofiletypes[mod] + '">' + content;
			setRestModChangelog(content);
		},
		error: function(data) {
			closeModChangelog();
			console.log("Mod " + mod + " not found.");
		}
	});
}

function setRestModChangelog(content) {
	$(".clmodal .clmodalcontent").html(content);
	$(".clmodal .clmodalcontent").scrollTop(0);

	$(".clmodal").fadeIn(100);
}

function closeModChangelog() {
	$(".clmodal").hide();
	$("body").removeClass("prompt");
}

$(document).on('mouseup', '.clmod, .clchip', function(e) {
	if (!(e.which === 1)) { return; }
	if (e.ctrlKey || e.metaKey || e.shiftKey) { return; }

	openModChangelog($(this).attr('data-slug'));
});
$(document).on('click', '.clmod, .clchip', function(e) {
	if (e.ctrlKey || e.metaKey || e.shiftKey) { return; }

	e.preventDefault();
});

$(document).on('mouseup', '.clmodal .clmodalclose p', function(e) {
	closeModChangelog();
});
$(document).on('mouseup', '.clmodal', function(e) {
	if (e.target === this) {
		closeModChangelog();
	}
});
$(document).on('keyup', function(e) {
	if (e.key === "Escape") {
		if ($(".clmodal").is(":visible")) {
			closeModChangelog();
		}
	}
});
