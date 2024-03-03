$(document).ready(function(e) { 
	console.log("Loading https://serilum.com/")

	loadAndSetMembers();

	let modhosttoggle = Cookies.get('modhosttoggle');
	if (modhosttoggle !== undefined) {
		if (modhosttoggle === 'true') {
			enableCurseForge(false);
		}
		else {
			enableModrinth(false);
			$(".toggle input").prop('checked', false);
		}
	}
});

let memberdata = null;
function loadAndSetMembers() {
	if (memberdata != null) {
		let keys = Object.keys(memberdata);

		let randommember = keys[keys.length * Math.random() << 0];
		let rmplatform = memberdata[randommember];
		
		$(".randommember").html(randommember);
		$(".randomplatform").html(rmplatform);
	}
	else {
		$.ajax({
			url: "https://raw.githubusercontent.com/Serilum/.data-workflow/main/membership/data/members.json",
			type: "GET",
			dataType: 'json',
			success: function(md){
				if ("combined_specific" in md) {
					memberdata = md["combined_specific"];

					let keys = Object.keys(memberdata);

					let randommember = keys[keys.length * Math.random() << 0];
					let rmplatform = memberdata[randommember];
					
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
	let checked = $(this).is(":checked");

	if (checked) {
		enableCurseForge(true);
	}
	else {
		enableModrinth(true);
	}

	$(".modrow .versions a,.modrow .dependencies a").each(function(e) {
		let elem = $(this);
		let cururl = elem.attr('href');
		let ourl = elem.attr('value');

		elem.attr('href', ourl);
		elem.attr('value', cururl);
	});

	Cookies.set('modhosttoggle', checked, { expires: 365 });
});

function enableModrinth(toast) {
	$("body").removeClass("defaultcurseforge").addClass("defaultmodrinth");

	if (toast) {
		showToast("Modrinth set as the default mod host.", "#1BD96A");
	}

	if (window.location.href.indexOf("mods")) {
		//$(".modrow .dependencies a").show();
		//$(".dependency_fabricapi").show();
		//$(".modrow.hasfabric .dependency_collective").attr('href', "https://curseforge.com/minecraft/mc-mods/collective")
		//$(".modrow:not(.hasfabric) .dependencies a").hide();
	}
}

function enableCurseForge(toast) {
	$("body").removeClass("defaultmodrinth").addClass("defaultcurseforge");

	if (toast) {
		showToast("CurseForge set as the default mod host.", "#F16436");
	}

	if (window.location.href.indexOf("mods")) {
		//$(".modrow .dependencies a").show();
		//$(".dependency_fabricapi").hide();
		//$(".modrow.hasfabric .dependency_collective").attr('href', "https://curseforge.com/minecraft/mc-mods/collective")
		//$(".modrow:not(.hasforge) .dependencies a").hide();
	}
}

let toastnumber = 0;
function showToast(message, colour) {
	let toastid = 'toast_' + toastnumber;
	let toasthtml = '<div id="' + toastid + '" class="toast" style="background-color: ' + colour + ';">' + message + '</div>';
	$(".toasterwrapper").append(toasthtml);

	window[toastid + "_0"] = setTimeout(function(){ 
		$("#" + toastid).fadeOut(1000);
		window[toastid + "_1"] = setTimeout(function(){ 
			$("#" + toastid).remove();
		}, 1000);
	}, 5000);
	toastnumber+=1;
}