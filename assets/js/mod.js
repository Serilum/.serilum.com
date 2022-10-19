var curseforgebase = "https://curseforge.com/minecraft/mc-mods/";
var modrinthbase = "https://modrinth.com/mod/";

$(document).ready(function(e) {
	var url = document.URL;

	if (url.includes("?")) {
		var mod = url.replaceAll("?mod=", "?").split("?")[1];
		var modname = mod.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())
		modname = modname.replaceAll("Tnt ", "TNT ").replaceAll("Gui ", "GUI ").replaceAll("Op ", "OP ");
		modname = modname.replaceAll(" A ", " a ").replaceAll(" And ", " and ");
		modname = modname.replaceAll("Pumpkillagers", "Pumpkillager's")

		var cf_fabric_url = curseforgebase + mod + "-fabric"
		if (mod == "gui-clock" || mod == "gui-compass" || mod == "villager-names") {
			cf_fabric_url += "-version"
		}

		var cf_forge_url = curseforgebase + mod
		var mr_url = modrinthbase + mod
		if (mod == "villager-names") {
			mr_url += "-serilum"
		}

		$(".modname").html(modname);
		$("#cffabriclink").attr('href', cf_fabric_url);
		$("#cfforgelink").attr('href', cf_forge_url);
		$("#mrlink").attr('href', mr_url);

		var changelogurl = "/mods?changelog=" + mod
		$("#changelogurl").attr('href', changelogurl);

		$.ajax({
			url: "/assets/data/mod_data.json",
			type: "GET",
			dataType: 'json',
			success: function(data){
				if (modname in data) {
					var md = data[modname];

					$(".modlogo").html('<img class="ml" src="/assets/data/logo/' + mod + md["logo_file_type"] + '">');

					var fabricvl = md["fabric_versions"].length
					var forgevl = md["forge_versions"].length

					if (fabricvl != 0 || forgevl != 0) {
						if (fabricvl == 0 && forgevl != 0) {
							$("#cffabriclink h3").show();
							$(".cffabric").addClass("unavailable").unwrap();
							$("#mrlink img").attr('src', "/assets/images/mod-mr-forge.png")
							$("#mrlink p").html("Forge");
						}
						else if (fabricvl != 0 && forgevl == 0) {
							$("#cfforgelink h3").show();
							$(".cfforge").addClass("unavailable").unwrap();
							$("#mrlink img").attr('src', "/assets/images/mod-mr-fabric.png")
							$("#mrlink p").html("Fabric");
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