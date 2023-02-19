const curseforgebase = "https://curseforge.com/minecraft/mc-mods/";
const modrinthbase = "https://modrinth.com/mod/";

$(document).ready(function(e) {
	let url = document.URL;

	if (url.includes("?")) {
		let mod = url.replaceAll("?mod=", "?").split("?")[1];
		let modname = mod.replaceAll("-", " ").replace(/\b\w/g, l => l.toUpperCase())
		modname = modname.replaceAll("Tnt ", "TNT ").replaceAll("Gui ", "GUI ").replaceAll("Op ", "OP ");
		modname = modname.replaceAll(" A ", " a ").replaceAll(" And ", " and ");
		modname = modname.replaceAll("Pumpkillagers", "Pumpkillager's")

		let cf_fabric_url = curseforgebase + mod + "-fabric"
		if (mod === "gui-clock" || mod === "gui-compass" || mod === "villager-names") {
			cf_fabric_url += "-version"
		}

		let cf_forge_url = curseforgebase + mod
		let mr_url = modrinthbase + mod
		if (mod === "villager-names") {
			mr_url += "-serilum"
		}

		$(".modname").html(modname);
		$("#cffabriclink").attr('href', cf_fabric_url);
		$("#cfforgelink").attr('href', cf_forge_url);
		$("#mrlink").attr('href', mr_url);

		let changelogurl = "/mods?changelog=" + mod
		$("#changelogurl").attr('href', changelogurl);

		$.ajax({
			url: "/assets/data/mod_data.json",
			type: "GET",
			dataType: 'json',
			success: function(data){
				if (modname in data) {
					let md = data[modname];

					$(".modlogo").html('<img class="ml" alt="logo" src="/assets/data/logo/' + mod + md["logo_file_type"] + '">');

					let fabricvl = md["fabric_versions"].length
					let forgevl = md["forge_versions"].length

					if (fabricvl !== 0 || forgevl !== 0) {
						if (fabricvl === 0 && forgevl !== 0) {
							$("#cffabriclink h3").show();
							$(".cffabric").addClass("unavailable").unwrap();
							$("#mrlink img").attr('src', "/assets/images/mod-mr-forge.png")
							$("#mrlink p").html("Forge");
						}
						else if (fabricvl !== 0 && forgevl === 0) {
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