const dateoptions = { year: 'numeric', month: 'long', day: 'numeric' };
const platformurl = { "github" : '<a class="github" href="https://github.com/sponsors/ricksouth" target=_blank>Github</a>', "kofi" : '<a class="kofi" href="https://ko-fi.com/ricksouth" target=_blank>Ko-Fi</a>', "patreon" : '<a class="patreon" href="https://patreon.com/ricksouth" target=_blank>Patreon</a>' };

const textsymbols = [ "٩(ˊᗜˋ*)و", "＼(^o^)／", "ヽ(ヅ)ノ", "٩( ^ᴗ^ )۶", "(✿◠‿◠)", "٩( ᐛ )و", "(~˘▾˘)~", "（＾∀＾）", "ヽ(•‿•)ノ", "(ﾉ^_^)ﾉ", "~(˘▾˘)~" ]

$(document).ready(function(e) { 
	loadFeedData();
});

function loadFeedData() {
	$.ajax({
		url: "https://raw.githubusercontent.com/ricksouth/ricksouth-data-workflow/main/membership/feed.json",
		type: "GET",
		dataType: 'json',
		success: function(memberdata){
			$.ajax({
				url: "https://ntmsdata.com/data/feed/announcements.json",
				type: "GET",
				dataType: 'json',
				success: function(announcementdata){
					let feedkeys = [];
					let feedentries = {};

					let memberkeys = memberdata["keys"];
					let memberentries = memberdata["entries"];

					for (let key of memberkeys.sort(function (a, b) {  return b - a;  })) {
						let subentries = memberentries[key]
						for (let subentry of subentries) {
							let ymd = key;
							if (!feedkeys.includes(ymd)) {
								feedkeys.push(ymd);
								feedentries[ymd] = [];
							}

							let name = subentry["name"];
							let platform = subentry["platform"];
							let emoji = textsymbols[Math.floor(Math.random()*textsymbols.length)];

							let s = ymd.split('');
							let fdate = new Date(s[0] + s[1] + s[2] + s[3], parseInt(s[4] + s[5])-1, s[6] + s[7]);

							let feedentryhtml = '				<li class="feed-item" data-content="' + name[0].toUpperCase() + '" data-time="' + fdate.toLocaleDateString("en-US", dateoptions) + '" data-color="' + platform + '">';
							feedentryhtml += '					<section>';
							feedentryhtml += '						<p><span class="name heart">' + name + '</span> supported the mods via ' + platformurl[platform] + '! &nbsp; <span class="emoji">' + emoji + '</span></p>';
							feedentryhtml += '					</section>';
							feedentryhtml += '				</li>';

							feedentries[ymd].push(feedentryhtml);
						}
					}

					let announcementkeys = announcementdata["keys"];
					let announcemententries = announcementdata["entries"];

					for (let key of announcementkeys.sort(function (a, b) {  return b - a;  })) {
						let subentries = announcemententries[key]
						for (let subentry of subentries) {
							let ymd = key;
							if (!feedkeys.includes(ymd)) {
								feedkeys.push(ymd);
								feedentries[ymd] = [];
							}

							let content = subentry;
							for (let word of content.split(" ")) {
								if (word.includes("cdn.discordapp.com")) {
									content = content.replace(word, '<img alt="img" src="' + word + '">');
								}
								else if (word.includes("https://")) {
									content = content.replace(word, '<a class="url" href="' + word + '" target=_blank>' + word + '</a>');
								}
							}

							let s = ymd.split('');
							let fdate = new Date(s[0] + s[1] + s[2] + s[3], parseInt(s[4] + s[5])-1, s[6] + s[7]);

							let feedentryhtml = '				<li class="feed-item" data-content="D" data-time="' + fdate.toLocaleDateString("en-US", dateoptions) + '" data-color="discord">';
							feedentryhtml += '					<section>';
							feedentryhtml += '						<p class="announcementheader">📢 <span class="name">Rick | Serilum</span> via <span class="discord"><a href="https://ntms.link/discord" target=_blank>Discord</a></span>:</p>';
							feedentryhtml += '						<p class="announcementcontent">' + content + '</p>';
							feedentryhtml += '					</section>';
							feedentryhtml += '				</li>';

							feedentries[ymd].push(feedentryhtml);
						}
					}

					let feedhtml = "";
					for (let key of feedkeys.sort(function (a, b) {  return b - a;  })) {
						let subentries = feedentries[key]
						for (let feedentryhtml of subentries) {
							feedhtml += feedentryhtml;
						}						
					}

					feedhtml += "<br><br><br>";

					$("#feed").html(feedhtml);
				},
				error: function(data) { },
				cache: false
			});
		},
		error: function(data) { },
		cache: false
	});
}