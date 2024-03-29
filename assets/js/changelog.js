$(document).ready(function(e) { 
	loadChangelogData();
});

function loadChangelogData() {
	$.ajax({
		url: "/assets/data/changelog_data.json",
		type: "GET",
		dataType: 'json',
		success: function(changelogdata){
			let clhtml = "";

			clhtml += '<div class="header">';
			clhtml += "<h1>Global Mod Changelog</h1>";
			clhtml += "<p>This page contains an overview of all changelog submitted. An easy way to see if your favourite mod has been updated lately.</p>";
			clhtml += "<p>You can click the mod names to look at the complete changelog.</p>";
			clhtml += '</div>';

			let lasttimestamp = "";
			for (let key of changelogdata["keys"]) {
				let linedata = changelogdata["entries"][key];

				let line = '<div id="' + key + '" class="clline">';

				if (lasttimestamp !== linedata["timestamp"]) {
					line += '<p class="timestamp">' + linedata["timestamp"] + '</p>';
					lasttimestamp = linedata["timestamp"];
				}

				line += '<p class="modname"><a href="https://serilum.com/mods/?changelog=' + linedata["slug"] + '" target=_blank>' + linedata["modname"] + ' (' + linedata["version"] + ')</a></p>';
				line += '<p class="separator">=========</p>'
				line += '<p class="content">' + linedata["content"].replaceAll("\n", "<br>") + '</p>'

				line += '</div>';

				clhtml += line;
			}

			$(".changelogwrapper .insidechangelog").html(clhtml);
		},
		error: function(data) { }
	});
}