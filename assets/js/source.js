var sourceurl = "https://github.com/ricksouth/serilum-mc-mod-sources/tree/main/sources/";
var fabricsourceurl = "https://github.com/ricksouth/serilum-mc-mods/tree/master/sources-fabric/";
var forgesourceurl = "https://github.com/ricksouth/serilum-mc-mods/tree/master/sources/";

$(document).ready(function(e) {
	var url = document.URL;

	if (url.includes("?mod=")) {
		var mod = url.split("?mod=")[1];
		var modname = mod.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())
		modname = modname.replaceAll("Tnt ", "TNT ").replaceAll("Gui ", "GUI ").replaceAll("Op ", "OP ");
		modname = modname.replaceAll(" A ", " a ").replaceAll(" And ", " and ");
		modname = modname.replaceAll("Pumpkillagers", "Pumpkillager's")

		var fabricurl = sourceurl + modname
		var forgeurl = sourceurl + modname

		$("#modname").html(modname);
		$("#fabricsclink").attr('href', fabricurl);
		$("#forgesclink").attr('href', forgeurl);

		$.ajax({
			url: "/assets/data/mod_data.json",
			type: "GET",
			dataType: 'json',
			success: function(data){
				if (modname in data) {
					var md = data[modname];

					$(".modlogo").html('<img src="/assets/data/logo/' + mod + md["logo_file_type"] + '">');

					var fabricvl = md["fabric_versions"].length
					var forgevl = md["forge_versions"].length

					if (fabricvl != 0 || forgevl != 0) {
						if (fabricvl == 0 && forgevl != 0) {
							$("#fabricsclink h3").show();
							$(".scfabric").addClass("unavailable").unwrap();
						}
						else if (fabricvl != 0 && forgevl == 0) {
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