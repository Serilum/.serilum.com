let inputData = {};

$(document).ready(function(e) {
	console.log("Loading feature requests page.")

	setRequestsContent();
});

$(window).on( "resize", function() {
	resizeTableHeader();
});

function setRequestsContent() {
	$.ajax({
		url: "https://raw.githubusercontent.com/Serilum/.data-workflow/main/issue-tracker/data/feature-request-data.min.json",
		type: "GET",
		dataType: 'json',
		success: function(inp){
			console.log(inp);
			inputData = inp;

			let lastupdated = inp["last_updated"];
			let hoursago = timeSince(Date.parse(lastupdated)) + " ago";
			if (hoursago.split(" ")[0] === "1") {
				hoursago = hoursago.replace("hours", "hour");
			}

			$(".requestswrapper #lastupdated").html(hoursago);

			populateTable(inp["issues_sorted_reaction_count"]);

			$("#reaction_count").addClass("sort sortnormal");
		},
		error: function(data) { }
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
		// console.log(issuedata);

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

	$(".requestswrapper .content").html(html);

	resizeTableHeader();
	updateFilterQuery();
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

	window.open(url, '_blank').focus();
});
$(document).on('mouseup', 'table tr.headerrow p', function(e) {
	let sorted = [];

	let th = $(this).parent();
	let identifier = th.attr('id');
	console.log(identifier);
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

	populateTable(sorted);

	th = $("#" + identifier);
	if (reversed) {
		th.addClass("sort sortreverse");
	}
	else {
		th.addClass("sort sortnormal");
	}
});

$(".filterwrapper #filtertext").on('input',function(e) {
	updateFilterQuery();
});

function updateFilterQuery() {
	let query = $("#filtertext").val().toLowerCase();
	if (!query.length) {
		$("#requesttable tr").show();
		setOddEven();
		return;
	}

	let identifier = "t_" + $('#filterselector').find(":selected").val().substring(0, 2);

	$("#requesttable tr:not(.headerrow)").each(function(e) {
		let row = $(this);

		console.log(row);
		let childRow = row.find("." + identifier + " p");
		console.log(childRow);

		if (childRow.html().toLowerCase().includes(query)) {
			row.show();
		}
		else {
			row.hide();
		}
	});

	setOddEven();
}

function setOddEven() {
	$("tr.odd").removeClass("odd");

	let odd = false;
	$("#requesttable tr:not(.headerrow)").each(function(e) {
		let row = $(this);
		if (!row.is(":visible")) {
			return true;
		}

		if (odd) {
			row.addClass("odd");
		}

		odd = !odd;
	});
}

function timeSince(date) {
	let seconds = Math.floor((new Date() - date) / 1000);
	let interval = seconds / 31536000;

	if (interval > 1) {
		return Math.floor(interval) + " years";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + " months";
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + " days";
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + " hours";
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + " minutes";
	}
	return Math.floor(seconds) + " seconds";
}