(function() {
	var target = document.body.getAttribute('data-target');
	var event = document.body.getAttribute('data-event');

	var redirected = false;
	function go() {
		if (redirected) { return; }
		redirected = true;
		window.location.replace(target);
	}

	var s = document.createElement('script');
	s.defer = true;
	s.src = 'https://um.serilum.com/script.js';
	s.setAttribute('data-website-' + 'id', 'a2fe372b-5d79-4e16-98d7-6c8f2862d3f5');
	s.setAttribute('data-do' + 'mains', 'serilum.com');
	s.setAttribute('data-exclude-search', 'true');
	s.onload = function() {
		try {
			var ref = window[['u','m','a','m','i'].join('')];
			if (ref && event) {
				var p = ref.track(event);
				if (p && p.then) { p.then(go, go); return; }
			}
		} catch(x){}
		go();
	};
	s.onerror = go;
	document.head.appendChild(s);

	setTimeout(go, 1000);
})();
