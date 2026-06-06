const rowsperpage = 50;

let inputData = {};
let currentpage = 0;

$(document).ready(function(e) {
	console.log("Loading feature requests page.")

	$(".reqtable").html('<p class="reqloading">Loading feature requests💚</p>');

	setRequestsContent();
});

$(window).on( "resize", function() {
	resizeTableHeader();
	updateStickyOffsets();
});

function setRequestsContent() {
	$.ajax({
		url: "https://workflow.serilum.com/issue-tracker/data/feature-request-data.min.json",
		type: "GET",
		dataType: 'json',
		success: function(inp){
			inputData = inp;

			let lastupdated = inp["last_updated"];
			let hoursago = timeSince(Date.parse(lastupdated)) + " ago";

			$("#lastupdated").html(hoursago);

			currentpage = getPageFromUrl();
			populateTable(inp["issues_sorted_reaction_count"]);

			$("#reaction_count").addClass("sort sortnormal");
		},
		error: function(data) {
			$(".reqtable").html('<p class="reqloading">Could not load feature requests. Please try again later.</p>');
		}
	});
}

function populateTable(sorted) {
	let data = inputData["data"];

	let html = "<table id='requesttable'><tr class='headerrow'><th id='reaction_count'><p>🧮</p></th><th id='number'><p>#</p></th><th id='mod_name'><p>Mod</p></th><th id='title'><p>Title</p></th><th id='opened_by'><p>Author</p></th></tr>"

	let firstrow = true;
	for (let sortedarr of sorted) {
		let issuenum = sortedarr[0];

		let issuedata = data["mod-feature"][issuenum];
		if (issuedata === undefined) {
			continue;
		}

		let reaction_count = issuedata["reaction_count"]
		let issuetitle = issuedata["title"];
		let modname = issuedata["mod_name"];
		if (modname === "") {
			continue
		}

		let openedby = issuedata["opened_by"];

		let rowclass = "";
		if (firstrow) {
			rowclass = " class=\"first\"";
		}
		html += "<tr id='" + issuenum + "'" + rowclass + "><td class='rc'><p>" + reaction_count + "</p></td><td class='inum'><p>" + issuenum + "</p></td><td class='t_mo'><p>" + modname + "</p></td><td class='t_ti'><p>" + issuetitle + "</p></td><td class='t_op'><p>" + openedby + "</p></td></tr>";

		firstrow = false;
	}

	html += "</table>";

	$(".reqtable").html(html);

	$(".reqwrapper").addClass("loaded");

	resizeTableHeader();
	updateStickyOffsets();
	applyView();
}

function updateStickyOffsets() {
	let navheight = $(window).width() <= 620.5 ? 73 : 43;
	// -2: controls sit 1px under the nav, and the header tucks 1px under the controls (closes sticky seams).
	let offset = navheight + $(".reqcontrols").outerHeight() - 2;

	$("#requesttable .headerrow th").css("top", offset + "px");
}

function resizeTableHeader() {
	let width = $(this).width();

	if (width < 460) {
		$("#mod_name p").html("📂");
		$("#s_mod_name").html("in 📂");
		$("#title p").html("🗒");
		$("#s_title").html("in 🗒");
		$("#opened_by p").html("👩‍💻");
		$("#s_opened_by").html("in 👩‍💻");
	}
	else {
		$("#mod_name p").html("Mod");
		$("#s_mod_name").html("in Mod");
		$("#title p").html("Title");
		$("#s_title").html("in Title");
		$("#opened_by p").html("Author");
		$("#s_opened_by").html("in Author");
	}
}

$(document).on('mouseup', 'table tr:not(.headerrow)', function(e) {
	let issuenum = $(this).attr('id');
	let url = "https://github.com/Serilum/.issue-tracker/issues/" + issuenum

	_qa("request_open", { issue: issuenum });
	window.open(url, '_blank').focus();
});
$(document).on('mouseup', 'table tr.headerrow p', function(e) {
	let sorted = [];

	let th = $(this).parent();
	let identifier = th.attr('id');
	let data = inputData["data"]["mod-feature"];

	for (let keynum in data) {
		let entry = data[keynum];

		sorted.push([keynum, entry[identifier]]);
	}

	let reversed = th.hasClass("sortnormal");
	if (identifier === "reaction_count" || identifier === "number") {
		sorted.sort((b, a) => a[1] - b[1]);
	}
	else {
		sorted.sort((a, b) => a[1].toUpperCase().localeCompare(b[1].toUpperCase()));
	}

	if (reversed) {
		sorted = sorted.reverse();
	}

	currentpage = 0;
	populateTable(sorted);

	th = $("#" + identifier);
	if (reversed) {
		th.addClass("sort sortreverse");
	}
	else {
		th.addClass("sort sortnormal");
	}
});

$("#filtertext").on('input',function(e) {
	currentpage = 0;
	applyView();
});

$("#filterselector").on('change',function(e) {
	currentpage = 0;
	applyView();
});

function applyView() {
	let query = $("#filtertext").val().toLowerCase();
	let identifier = "t_" + $('#filterselector').find(":selected").val().substring(0, 2);

	// Collect the rows that match the current filter (in their sorted order).
	let matched = [];
	$("#requesttable tr:not(.headerrow)").each(function(e) {
		let row = $(this);

		if (!query.length) {
			matched.push(row);
			return true;
		}

		let cell = row.find("." + identifier + " p");
		if (cell.length && cell.html().toLowerCase().includes(query)) {
			matched.push(row);
		}
	});

	let total = matched.length;
	let totalpages = Math.max(1, Math.ceil(total / rowsperpage));
	if (currentpage > totalpages - 1) { currentpage = totalpages - 1; }
	if (currentpage < 0) { currentpage = 0; }

	setPageInUrl(currentpage);

	let start = currentpage * rowsperpage;
	let end = start + rowsperpage;

	// Hide every row, then reveal and stripe the current page of matches.
	$("#requesttable tr:not(.headerrow)").hide().removeClass("odd");

	let odd = false;
	for (let i = start; i < end && i < total; i++) {
		matched[i].show();

		if (odd) {
			matched[i].addClass("odd");
		}

		odd = !odd;
	}

	$(".reqcount").html(total + (total === 1 ? " request" : " requests"));

	buildPager(totalpages);
}

function buildPager(totalpages) {
	if (totalpages <= 1) {
		$(".pager, .toppager").html("");
		return;
	}

	let html = "";
	html += '<span class="pagerbtn prev' + (currentpage === 0 ? ' disabled' : '') + '">&#8249; Prev</span>';
	html += '<span class="pageinfo">Page ' + (currentpage + 1) + ' of ' + totalpages + '</span>';
	html += '<span class="pagerbtn next' + (currentpage === totalpages - 1 ? ' disabled' : '') + '">Next &#8250;</span>';

	$(".pager, .toppager").html(html);
}

function scrollToTable() {
	// Land the table flush against the bottom of the sticky controls (which stick 1px under the nav).
	let controlstop = $(window).width() <= 620.5 ? 72 : 42;
	let target = $(".reqtable").offset().top - controlstop - $(".reqcontrols").outerHeight();

	$('html, body').scrollTop(target);
}

$(document).on('mouseup', '.pagerbtn.prev', function(e) {
	if (!(e.which === 1)) { return; }
	if ($(this).hasClass('disabled')) { return; }

	currentpage -= 1;
	applyView();
	scrollToTable();
});
$(document).on('mouseup', '.pagerbtn.next', function(e) {
	if (!(e.which === 1)) { return; }
	if ($(this).hasClass('disabled')) { return; }

	currentpage += 1;
	applyView();
	scrollToTable();
});

function timeSince(date) {
	let seconds = Math.floor((convertDateToUTC(new Date()) - date) / 1000);
	let interval = seconds / 31536000;
	let c;

	if (interval > 1) {
		c = Math.floor(interval);
		return c + " year" + sOrEmpty(c);
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		c = Math.floor(interval);
		return c + " month" + sOrEmpty(c);
	}
	interval = seconds / 86400;
	if (interval > 1) {
		c = Math.floor(interval);
		return c + " day" + sOrEmpty(c);
	}
	interval = seconds / 3600;
	if (interval > 1) {
		c = Math.floor(interval);
		return c + " hour" + sOrEmpty(c);
	}
	interval = seconds / 60;
	if (interval > 1) {
		c = Math.floor(interval);
		return c + " minute" + sOrEmpty(c);
	}
	c = Math.floor(seconds);
	return Math.floor(seconds) + " second" + sOrEmpty(c);
}

function convertDateToUTC(date) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

function sOrEmpty(c) {
	if (c === 1) {
		return "";
	}
	return "s";
}