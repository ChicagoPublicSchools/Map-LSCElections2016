/*!
 * Google Analytics Library
 * https://github.com/open-city/google-analytics-lib
 *
 * Copyright 2012, Nick Rougeux and Derek Eder of Open City
 * Licensed under the MIT license.
 * https://github.com/open-city/google-analytics-lib/wiki/License
 *
 * Date: 5/9/2012
 *
 */



var analyticsTrackingCode = 'UA-33983846-4'; // cps.edu

var _gaq = _gaq || [];
_gaq.push(['_setAccount', analyticsTrackingCode]);
_gaq.push(['_trackPageview']);

(function() {
var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

_trackClickEventWithGA = function (category, action, label) {
	if (typeof(_gaq) != 'undefined')
    _gaq.push(['_setAccount', analyticsTrackingCode]);
		_gaq.push(['_trackEvent', category, action, label]);
};

jQuery(function () {

	jQuery('a').click(function () {
		var $a   = jQuery(this);
		var href = $a.attr("href");
		var cls  = $a.attr("class");
		
//		console.log("hi"+cls + " " + href );

//		if (cls == "link-more-school-info") {
//			_trackClickEventWithGA("Click", "View More School Info", href);
//		}
//		if (cls == "link-apply-to-school") {
//			_trackClickEventWithGA("Click", "Apply to School", href);
//		}
//		if (cls == "link-closing-info") {
//			_trackClickEventWithGA("Click", "School Closing Info", href);
//		}
				
		if (href != undefined){
			if (href.match(/^http/i) && !href.match(document.domain)) {
				_trackClickEventWithGA("Outgoing", "Click", href);
			}
		}	

	});
});


