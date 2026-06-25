// Site analytics
var _qaRef = null;
function _qa(e, d) {
	try {
		if (!_qaRef) _qaRef = window[['u','m','a','m','i'].join('')];
		if (_qaRef) d ? _qaRef.track(e, d) : _qaRef.track(e);
	} catch(x){}
}
(function() {
	var s = document.createElement('script');
	s.defer = true;
	s.src = 'https://um.serilum.com/script.js';
	s.setAttribute('data-website-' + 'id', 'a2fe372b-5d79-4e16-98d7-6c8f2862d3f5');
	s.setAttribute('data-do' + 'mains', 'serilum.com');
	s.setAttribute('data-exclude-search', 'true');
	document.head.appendChild(s);
})();

$(document).ajaxError(function(event, jqXHR, settings, thrownError) {
	console.log("Could not load " + settings.url + " (status " + jqXHR.status + (thrownError ? ", " + thrownError : "") + ")");
});

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
			url: "https://workflow.serilum.com/membership/data/members.json",
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

	_qa("host_toggle", { host: checked ? "curseforge" : "modrinth" });

	$(".modcard .modlink,.modcard .loader,.modcard .dependency").each(function(e) {
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

function wrapURL(text) {
	let urlPattern = /\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^z`!()\[\]{};:'".,<>?«»“”‘’]))/ig;

	return text.replace(urlPattern, function (url) {
		return `<a href="${url.trim()}" target=_blank>${url.trim()}</a>`;
	});
}

function formatChangelog(data) {
	let blocks = data.split(/\n=+\n/);

	// No separators: fall back to the raw text so nothing is lost.
	if (blocks.length <= 1) {
		return '<div class="clmodalbody">' + wrapURL(data.trim().replaceAll("\n", "<br>")) + '</div>';
	}

	let headerlines = blocks[0].trim().split("\n");
	if (headerlines.length > 0 && headerlines[0].trim().toLowerCase() === "changelog:") {
		headerlines.shift();
	}

	let modtitle = headerlines.length > 0 ? headerlines[0].trim() : "";
	let modurl = "";
	for (let line of headerlines) {
		if (line.trim().startsWith("http")) {
			modurl = line.trim();
			break;
		}
	}

	let html = "";

	html += '<div class="clmodalhead">';
	if (modtitle !== "") {
		html += '<p class="clmodaltitle">' + modtitle + '</p>';
	}
	if (modurl !== "") {
		let slug = modurl.includes("/mc-mods/") ? modurl.split("/mc-mods/")[1].split(/[/?#]/)[0] : "";
		let mrslug = slug;
		if (modtitle === "Villager Names") {
			mrslug += "-serilum";
		}

		html += '<div class="clmodallinks">';
		html += '<a class="submenubtn clmodallink" href="' + modurl + '" target=_blank>View on CurseForge</a>';
		if (slug !== "") {
			html += '<a class="submenubtn clmodallink" href="https://modrinth.com/mod/' + mrslug + '" target=_blank>View on Modrinth</a>';
		}
		html += '</div>';
	}
	html += '</div>';

	for (let i = 1; i < blocks.length; i++) {
		let block = blocks[i].trim();
		if (block === "") { continue; }

		let match = block.match(/^(v[^\s:]+):\s*([\s\S]*)$/);

		html += '<div class="clmodalentry">';
		if (match) {
			html += '<p class="clmodalver">' + match[1] + '</p>';
			html += '<p class="clmodalbody">' + wrapURL(match[2].trim().replaceAll("\n", "<br>")) + '</p>';
		}
		else {
			html += '<p class="clmodalbody">' + wrapURL(block.replaceAll("\n", "<br>")) + '</p>';
		}
		html += '</div>';
	}

	return html;
}

function clHostLabel(url) {
	if (url.includes("curseforge")) { return "View on CurseForge"; }
	if (url.includes("modrinth")) { return "View on Modrinth"; }

	return "View mod page";
}

// Pagination state in the URL (?page=N, 1-indexed), shared by the changelog and requests pages.
function getPageFromUrl() {
	let params = new URLSearchParams(window.location.search);
	let page = parseInt(params.get("page"), 10);

	if (isNaN(page) || page < 1) {
		return 0;
	}

	return page - 1;
}

function setPageInUrl(pageindex) {
	if (!window.history.replaceState) {
		return;
	}

	let url = window.location.pathname;
	if (pageindex > 0) {
		url += "?page=" + (pageindex + 1);
	}

	window.history.replaceState(null, "", url);
}

const logobase = "https://workflow.serilum.com/web/logo/";

function logoSrc(slug, filetype, sizes) {
	if (!sizes || sizes.length === 0) {
		sizes = [128];
	}

	let pick = sizes.includes(256) ? 256 : sizes[sizes.length - 1];
	return logobase + pick + "/" + slug + filetype;
}

function logoSrcset(slug, filetype, sizes) {
	if (!sizes || sizes.length === 0) {
		sizes = [128];
	}

	let srcset = "";
	for (let s of sizes) {
		if (srcset !== "") {
			srcset += ", ";
		}
		srcset += logobase + s + "/" + slug + filetype + " " + s + "w";
	}

	return srcset;
}

function modSlug(modname) {
	return modname.toLowerCase().replaceAll(" ", "-").replaceAll("(", "").replaceAll(")", "").replaceAll("'", "").replaceAll("?", "").replaceAll("[", "").replaceAll("]", "");
}