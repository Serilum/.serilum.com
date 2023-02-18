var dateoptions = { year: 'numeric', month: 'long', day: 'numeric' };
var platformurl = { "github" : '<a class="github" href="https://github.com/sponsors/ricksouth" target=_blank>Github</a>', "kofi" : '<a class="kofi" href="https://ko-fi.com/ricksouth" target=_blank>Ko-Fi</a>', "patreon" : '<a class="patreon" href="https://patreon.com/ricksouth" target=_blank>Patreon</a>' };

var textsymbols = [ "٩(ˊᗜˋ*)و", "＼(^o^)／", "ヽ(ヅ)ノ", "٩( ^ᴗ^ )۶", "(✿◠‿◠)", "٩( ᐛ )و", "(~˘▾˘)~", "（＾∀＾）", "ヽ(•‿•)ノ", "(ﾉ^_^)ﾉ", "~(˘▾˘)~" ]

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
					var feedkeys = [];
					var feedentries = {};

					var memberkeys = memberdata["keys"];
					var memberentries = memberdata["entries"];

					for (key of memberkeys.sort(function (a, b) {  return b - a;  })) {
						subentries = memberentries[key]
						for (subentry of subentries) {
							var ymd = key;
							if (!feedkeys.includes(ymd)) {
								feedkeys.push(ymd);
								feedentries[ymd] = [];
							}

							var name = subentry["name"];
							var platform = subentry["platform"];
							var emoji = textsymbols[Math.floor(Math.random()*textsymbols.length)];

							var s = ymd.split('');
							var fdate = new Date(s[0] + s[1] + s[2] + s[3], parseInt(s[4] + s[5])-1, s[6] + s[7]);

							feedentryhtml = '				<li class="feed-item" data-content="' + name[0].toUpperCase() + '" data-time="' + fdate.toLocaleDateString("en-US", dateoptions) + '" data-color="' + platform + '">';
							feedentryhtml += '					<section>';
							feedentryhtml += '						<p><span class="name heart">' + name + '</span> supported the mods via ' + platformurl[platform] + '! &nbsp; <span class="emoji">' + emoji + '</span></p>';
							feedentryhtml += '					</section>';
							feedentryhtml += '				</li>';

							feedentries[ymd].push(feedentryhtml);
						}
					}

					var announcementkeys = announcementdata["keys"];
					var announcemententries = announcementdata["entries"];

					for (key of announcementkeys.sort(function (a, b) {  return b - a;  })) {
						subentries = announcemententries[key]
						for (subentry of subentries) {
							var ymd = key;
							if (!feedkeys.includes(ymd)) {
								feedkeys.push(ymd);
								feedentries[ymd] = [];
							}

							var content = subentry;
							for (word of content.split(" ")) {
								if (word.includes("cdn.discordapp.com")) {
									content = content.replace(word, '<img src="' + word + '">');
								}
								else if (word.includes("https://")) {
									content = content.replace(word, '<a class="url" href="' + word + '" target=_blank>' + word + '</a>');
								}
							}

							var s = ymd.split('');
							var fdate = new Date(s[0] + s[1] + s[2] + s[3], parseInt(s[4] + s[5])-1, s[6] + s[7]);

							feedentryhtml = '				<li class="feed-item" data-content="A" data-time="' + fdate.toLocaleDateString("en-US", dateoptions) + '" data-color="discord">';
							feedentryhtml += '					<section>';
							feedentryhtml += '						<p class="announcementheader">📢 <span class="name">Rick | Serilum</span> via <span class="discord"><a href="https://ntms.link/discord" target=_blank>Discord</a></span>:</p>';
							feedentryhtml += '						<p class="announcementcontent">' + content + '</p>';
							feedentryhtml += '					</section>';
							feedentryhtml += '				</li>';

							feedentries[ymd].push(feedentryhtml);
						}
					}

					var feedhtml = "";
					for (key of feedkeys.sort(function (a, b) {  return b - a;  })) {
						subentries = feedentries[key]
						for (feedentryhtml of subentries) {
							feedhtml += feedentryhtml;
						}						
					}

					feedhtml += "<br><br><br>";

					$("#feed").html(feedhtml);
				},
				error: function(data) { }
			});
		},
		error: function(data) { }
	});
}