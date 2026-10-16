$(document).ready(function(e) {
	console.log("Loading https://serilum.com/privacy");
	setContactAddress();
});

function setContactAddress() {
	let contactaddress = ["privacy", "serilum.com"].join("@");
	$(".contactaddress").attr("href", "mailto:" + contactaddress).text(contactaddress);
}
