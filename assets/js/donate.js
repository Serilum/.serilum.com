$(document).ready(function(e) {
	populateMembers();
});

function populateMembers() {
	$.ajax({
		url: "https://workflow.serilum.com/membership/data/members.json",
		type: "GET",
		dataType: 'json',
		success: function(data){
			if (!("combined" in data)) {
				return;
			}

			let specific = data["combined_specific"] || {};

			let memberhtml = "";
			for (let member of data["combined"]) {
				let platform = specific[member];
				let title = platform ? ' title="' + platform + '"' : '';

				memberhtml += '<span class="memberchip"' + title + '>' + member + '</span>';
			}

			$(".memberlist").html(memberhtml);
			$(".members").show();
		},
		error: function(data) { }
	});
}
