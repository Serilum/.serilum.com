$(document).ready(function(e) { 
	loadChangelogData();
});

function loadChangelogData() {
	$.ajax({
		url: "/assets/data/changelog_data.json",
		type: "GET",
		dataType: 'json',
		success: function(changelogdata){
			var clhtml = "";

			clhtml += '<div class="header">';
			clhtml += "<h1>Global Mod Changelog</h1>";
			clhtml += "<p>This page contains an overview of all changelog submitted. An easy way to see if your favourite mod has been updated lately.</p>";
			clhtml += "<p>You can click the mod names to look at the current source code on Github.</p>";
			clhtml += '</div>';

			var lasttimestamp = "";
			for (key of changelogdata["keys"]) {
				linedata = changelogdata["entries"][key];

				line = '<div id="' + key + '" class="clline">';

				if (lasttimestamp != linedata["timestamp"]) {
					line += '<p class="timestamp">' + linedata["timestamp"] + '</p>';
					lasttimestamp = linedata["timestamp"];
				}

				line += '<p class="modname"><a href="https://serilum.com/source-code/?mod=' + linedata["modid"] + '" target=_blank>' + linedata["modname"] + ' (' + linedata["version"] + ')</a></p>';
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