/*! hvcs-toc-auto-close.js — close the mobile ToC when a link is clicked */
(function () {
	'use strict';

	var cb = document.getElementById('hvcs-menu-toggle');
	var toc = document.getElementById('hvcs-toc');
	if (!cb || !toc) return;

	// Close when any ToC link is clicked
	toc.addEventListener('click', function (e) {
		var a = e.target && e.target.closest('a[href]');
		if (!a) return;

		var href = a.getAttribute('href') || '';
		var samePageHash =
			href.startsWith('#') ||
			(a.origin === location.origin && a.pathname === location.pathname && a.hash);

		// Let the browser position the anchor, then close
		if (samePageHash) {
			requestAnimationFrame(function () { cb.checked = false; });
		} else {
			// Navigating away — also fine to close immediately
			cb.checked = false;
		}
	});

	// Close if the fragment changes (e.g., user pastes a #link)
	window.addEventListener('hashchange', function () {
		cb.checked = false;
	});

	// Bonus: Esc to close
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape') cb.checked = false;
	});
})();
