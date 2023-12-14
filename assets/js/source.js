const sourceurl = "https://github.com/orgs/Serilum/repositories";
const fabricsourceurl = "https://github.com/orgs/Serilum/repositories";
const forgesourceurl = "https://github.com/orgs/Serilum/repositories";

$(document).ready(function(e) {
	let url = document.URL;

	if (url.includes("?mod=")) {
		let mod = url.split("?mod=")[1];
		let modname = mod.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())
		modname = modname.replaceAll("Tnt ", "TNT ").replaceAll("Gui ", "GUI ").replaceAll("Op ", "OP ");
		modname = modname.replaceAll(" A ", " a ").replaceAll(" And ", " and ");
		modname = modname.replaceAll("Pumpkillagers", "Pumpkillager's")

		let fabricurl = sourceurl + modname
		let forgeurl = sourceurl + modname

		$("#modname").html(modname);
		$("#fabricsclink").attr('href', fabricurl);
		$("#forgesclink").attr('href', forgeurl);

		$.ajax({
			url: "/assets/data/mod_data.json",
			type: "GET",
			dataType: 'json',
			success: function(data){
				if (modname in data) {
					let md = data[modname];

					$(".modlogo").html('<img alt="logo" src="/assets/data/logo/' + mod + md["logo_file_type"] + '">');

					let fabricvl = md["fabric_versions"].length
					let forgevl = md["forge_versions"].length

					if (fabricvl !== 0 || forgevl !== 0) {
						if (fabricvl === 0 && forgevl !== 0) {
							$("#fabricsclink h3").show();
							$(".scfabric").addClass("unavailable").unwrap();
						}
						else if (fabricvl !== 0 && forgevl === 0) {
							$("#forgesclink h3").show();
							$(".scforge").addClass("unavailable").unwrap();
						}

						return;
					}
				}

				window.location.assign("/");
			},
			error: function(data) { }
		});

		return;
	}

	window.location.assign("/");
});