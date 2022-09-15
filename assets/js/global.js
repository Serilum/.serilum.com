$(document).ready(function(e) { 
	console.log("Loading https://serilum.com/")

	loadAndSetMembers();

	var modloadertoggle = Cookies.get('modloadertoggle');
	if (modloadertoggle != undefined) {
		if (modloadertoggle === 'true') {
			enableForge(false);
		}
		else {
			enableFabric(false);
			$(".toggle input").prop('checked', false);
		}
	}
});

var memberdata = null;
function loadAndSetMembers() {
	if (memberdata != null) {
		var keys = Object.keys(memberdata);

		var randommember = keys[keys.length * Math.random() << 0];
		var rmplatform = memberdata[randommember];
		
		$(".randommember").html(randommember);
		$(".randomplatform").html(rmplatform);
	}
	else {
		$.ajax({
			url: "https://raw.githubusercontent.com/ricksouth/ricksouth-data-workflow/main/membership/members.json",
			type: "GET",
			dataType: 'json',
			success: function(md){
				if ("combined_specific" in md) {
					memberdata = md["combined_specific"];

					var keys = Object.keys(memberdata);

					var randommember = keys[keys.length * Math.random() << 0];
					var rmplatform = memberdata[randommember];
					
					$(".randommember").html(randommember);
					$(".randomplatform").html(rmplatform);
					$(".insidefooter").fadeIn(1500);
				}
			},
			error: function(data) { }
		});
	}

	setTimeout(loadAndSetMembers, 5000);
}

$(".toggle input").change(function() {
	var checked = $(this).is(":checked");

	if (checked) {
		enableForge(true);
	}
	else {
		enableFabric(true);
	}
	
	Cookies.set('modloadertoggle', checked, { expires: 365 });
});

function enableFabric(toast) {
	$("body").removeClass("defaultforge").addClass("defaultfabric");

	if (toast) {
		showToast("Fabric set as the default mod loader.");
	}

	if (window.location.href.indexOf("mods")) {
		$(".modrow .dependencies a").show();
		$(".dependency_fabricapi").show();
		$(".modrow.hasfabric .dependency_collective").attr('href', "https://curseforge.com/minecraft/mc-mods/collective-fabric")
		$(".modrow:not(.hasfabric) .dependencies a").hide();
	}
}

function enableForge(toast) {
	$("body").removeClass("defaultfabric").addClass("defaultforge");

	if (toast) {
		showToast("Forge set as the default mod loader.");
	}

	if (window.location.href.indexOf("mods")) {
		$(".modrow .dependencies a").show();
		$(".dependency_fabricapi").hide();
		$(".modrow.hasfabric .dependency_collective").attr('href', "https://curseforge.com/minecraft/mc-mods/collective")
		$(".modrow:not(.hasforge) .dependencies a").hide();
	}
}

var toastnumber = 0;
function showToast(message) {
	var toastid = 'toast_' + toastnumber;
	var toasthtml = '<div id="' + toastid + '" class="toast">' + message + '</div>';
	$(".toasterwrapper").append(toasthtml);

	window[toastid + "_0"] = setTimeout(function(){ 
		$("#" + toastid).fadeOut(1000);
		window[toastid + "_1"] = setTimeout(function(){ 
			$("#" + toastid).remove();
		}, 1000);
	}, 5000);
	toastnumber+=1;
}