$(document).ready(function(e) {
	populateMemberTable();

	var intervalId = window.setInterval(function(){
		if ($(".avatarwrapper #rick").is(":visible")) {
			$(".avatarwrapper #rick").fadeOut(2500).delay(1000).fadeIn(2500);
		}
	}, 10000);
});

function populateMemberTable() {
	$.ajax({
		url: "https://raw.githubusercontent.com/Serilum/.data-workflow/main/membership/data/members.json",
		type: "GET",
		dataType: 'json',
		success: function(data){
			if ("combined" in data) {
				var tablehtml = "<tr>";

				var i = 2;
				for (var member of data["combined"]) {
					if (i < 0) {
						i = 2;
						tablehtml += "</tr><tr>";
					}

					tablehtml += "<td><p>" + member + "</p></td>";
					i-=1;
				}

				while (i >= 0) {
					tablehtml += "<td></td>";
					i -= 1;
				}

				tablehtml += "</tr>";

				$("#membertable").html(tablehtml).fadeIn(500);
			}
		},
		error: function(data) { }
	});
}

$("#guide").on('click', function(e) {
	$("body").addClass("noscroll");
	$(".modal").show();
});

$(".modal").on('click', function(e) {
	$("body").removeClass("noscroll");
	$(".modal").hide();
	$('.modal iframe').attr('src', function(i, val) { return val; });
});