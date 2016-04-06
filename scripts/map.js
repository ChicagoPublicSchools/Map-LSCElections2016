//  LSC Vacancies Map (Community and Parent vacancies)

//	web services

//  4/2016


var fusionTableId 					= "142zjKh-oFZIGF8GKTcUrivcwS4U4OzhfJUN7QAxQ" ; // LSCvacancies_2016 as of 3/22/2016
var LSCdistrictsTableId 		= "1WRXaOoaBmKqjOOqYfd7ltc8pPHbKhMUtQ_gy6joW" ; // LSC Voting Districts SY16/17
var googleAPIkey          	= "AIzaSyDBgH1Z_xKIjf1FVwvexUWfW-2FEhUjvF8";
var googleAPIurl          	= "https://www.googleapis.com/fusiontables/v1/query";
var APIurl                	= "https://secure.cps.edu/json/lscvacancies2016?callback=test";
var heatmap 								= null;
var heatMapData 						= [];
var studentCountArray 			= [];
var map;
var geocoder;
var addrMarker							= null;
var addrMarkerImage       	= 'images/yellow-pin-lg.png';
var geoaddress            	= null; // geocoded pin placement address
var searchPolyAttendance  	= null; 		// lsc boundary layer
var markersArray						= []; 			// for the marker array
var infoWindowsas						= null; 		// infowindow
var latlngbounds        		= null; 		// for panning and zooming to include all searched markers
var selectedSchoolID				= null; 		// passing of info for poping selected school infowindow
var searchtype							= null; 		// allschools, oneschool, address
var chicago;


function initializeMap() {

	clearSearch();
	//getStudentCount();


	var grayStyles = [
		{
			"featureType": "road",
			"elementType": "geometry.fill",
			"stylers": [
				{ "lightness": 1 },
				{ "saturation": -100 }
			]
		},{
			"featureType": "road.highway.controlled_access",
			"elementType": "geometry.stroke",
			"stylers": [
				{ "saturation": -100 },
				{ "visibility": "off" }
			]
		},{
			"featureType": "road",
			"elementType": "geometry.stroke",
			"stylers": [
				{ "visibility": "off" }
			]
		},{
			"featureType": "road.local",
			"elementType": "geometry.fill",
			"stylers": [
				{ "color": "#808080" },
				{ "lightness": 50 }
			]
		},{
			"featureType": "road",
			"elementType": "labels.text.stroke",
			"stylers": [
				{ "saturation": -100 },
				{ "gamma": 9.91 }
			]
		},{
			"featureType": "landscape",
			"stylers": [
				{ "saturation": -70 }
			]
		},{
			"featureType": "administrative",
			"stylers": [
				{ "visibility": "on" }
			]
		},{
			"featureType": "poi",
			"stylers": [
				{ "saturation": -50 }
			]
		},{
			"featureType": "road",
			"elementType": "labels",
			"stylers": [
				{ "saturation": -70 }
			]
		},{
			"featureType": "transit",
			"stylers": [
				{ "saturation": -70 }
			]
		}
	]
	geocoder                = new google.maps.Geocoder();
	chicago									= new google.maps.LatLng(41.839, -87.67); // default center of map
	var myOptions = {
		styles: grayStyles,
		zoom: 10,
		center: chicago,
		disableDefaultUI: true,
		scrollwheel: false,
		navigationControl: true,
		panControl: false,
		zoomControl: true,
		scaleControl: false,
		mapTypeControl: false,
		mapTypeControlOptions: {
			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
			position: google.maps.ControlPosition.RIGHT_BOTTOM
		},
		zoomControl: true,
		zoomControlOptions: {
			style: google.maps.ZoomControlStyle.SMALL,
			position: google.maps.ControlPosition.RIGHT_BOTTOM
		},
		//navigationControlOptions: {style: google.maps.NavigationControlStyle.LARGE },
		mapTypeId: google.maps.MapTypeId.ROADMAP //TERRAIN
	};

	map = new google.maps.Map($("#map_canvas")[0], myOptions);

	//get the schools for the dropdown
	//queryForSchoolsDD();

	mapQueryAll("all");


}

function getStudentCount(){
	$.ajax({
		type:       "GET" ,
		url:        "https://secure.cps.edu/json/lscvacancies2016?callback=?",
		dataType:   "jsonp",
		error:      function (jqXHR, exception) {
			// net::ERR_NAME_NOT_RESOLVED
			// above error is not called when dev is not available
			// alert("An error has occurred getting student count information.");
			console.log(jqXHR, exception);
		},
		success:    function(d){
									$.each(d,function(i,r){
										console.log(r);
	                  //  studentCountArray.push({
										//
	                  //    });
	                 });

			// for (var i = 0; i < d.length; i++) {
			// 	var sid    =  (d[i].SchoolId);
			// 	var slat     		=  (d[i].Lat);
			// 	var slng     		=  (d[i].Lng);
			// 	var sname     		=  (d[i].SchoolName);
			// 	var saddress     =  (d[i].Address);
			// 	var sphone     	=  (d[i].Phone);
			// 	var stype     		=  (d[i].SchoolType);
			// 	var ptmax        =  (d[i].PARENT_MAX);
			// 	var ptcand       =  (d[i].PARENT_CAND);
			// 	var ptstat       =  (d[i].PARENT_STAT);
			// 	var cmmax        =  (d[i].COMMUNITY_MAX);
			// 	var cmcand       =  (d[i].COMMUNITY_CAND);
			// 	var cmstat       =  (d[i].COMMUNITY_STAT);
			// 	studentCountArray.push({id:sid, lat:slat, lng:slng, name:sname, address:saddress , phone:sphone, type:stype, pmax:ptmax, pcand:ptcand, pstat:ptstat, cmax:cmmax , ccand:cmcand, cstat:cmstat  });
			// }

			$("#btnHeatmap").removeClass("hidden");
			$("#btnSignups").removeClass("hidden");
		},
	});
}


// called from initialize script "all" displays all SchoolTypes
// when called from the legend displays by SchoolType
function mapQueryAll(st) {
	clearSearch();
	$("#txtSearchAddress").val('');
	searchtype = "allschools";
	var query="";
	if(st==="all") {
		query = "SELECT ID, Lat, Long, Name, Address, Phone, Type, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT  FROM "+ fusionTableId + " ORDER BY Name ";
	}
	encodeQuery(query, createMarkers);

	// if(!isMobile()) {
	// 	$("#txtSearchAddress").focus();
	// }

}


// an address search displays one elementary, one highschool, one library, one park.
function addressSearch() {
	var theInput = $.trim( $("#txtSearchAddress").val().toUpperCase() );
	var address = theInput;
	if (address !== "" ) {
		clearSearch();
		if (address.toLowerCase().indexOf("chicago, illinois") === -1) {
			address = address + " chicago, illinois";
		}
		geocoder.geocode({ 'address': address }, function (results, status) {
			if (status === google.maps.GeocoderStatus.OK) {
				geoaddress = (results[0].formatted_address);
				map.setCenter(results[0].geometry.location);
				if (addrMarker) { addrMarker.setMap(null); }
				addrMarker = new google.maps.Marker({
					position: results[0].geometry.location,
					map: map,
					icon: addrMarkerImage,
					animation: google.maps.Animation.DROP,
					title: geoaddress
				});
				searchtype="address";
				$("#txtSearchAddress").val(geoaddress);
				_trackClickEventWithGA("Search", "Address LSC", geoaddress);

				map.panTo(addrMarker.position);

				// schools whose boundaries encompass the loc
				whereClause = " WHERE " ;
				whereClause += " ST_INTERSECTS('geometry', CIRCLE(LATLNG"+addrMarker.position+ "," + .00001 + "))";
				//whereClause += " ORDER BY 'Name'";
				var query = "SELECT ID FROM "+ LSCdistrictsTableId + whereClause;
				//console.log(query);
				encodeQuery(query, addressQuery);


			} else {//geocoder status not ok
				alert("We could not find your address: " + status);
			}
		});
	} else {//didn't enter an address
	alert("Please enter an address.");
}

}

function addressQuery(d) {
	var query =  "" ;
	var addressMarkersArray=[];
	if( d.rows !== null && d.rows !== undefined ) {
		for (var i = 0; i < d.rows.length; i++) {
			var sid = d.rows[i][0];
			addressMarkersArray.push(sid);
		}
	}
	query = "SELECT ID, Lat, Long, Name, Address, Phone, Type, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT  FROM "+ fusionTableId + " WHERE ID IN (" + addressMarkersArray + ") ORDER BY Name ";
	encodeQuery(query, createMarkers);
}

// SELECT ID, Lat, Long, Name, Address, Phone, Type,
// PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT
// creates markers and infowindow data
function createMarkers(d) {
	//console.log(d);
	var ulist =  "" ;
	var ulistlength= "" ;
	if( d.rows !== null && d.rows !== undefined ) {
		ulist 		= d.rows;
		ulistlength = d.rows.length;
		for (var i = 0; i < ulistlength; i++) {
			var sid 		        = ulist[i][0];
			var slat			      = ulist[i][1];
			var slng			      = ulist[i][2];
			var	sname 				= ulist[i][3].toUpperCase();
			var	saddress			= ulist[i][4];
			var	sphone	 			= ulist[i][5];
			var stype			  	= ulist[i][6];
			var pmax			  	= ulist[i][7];
			var pcand			  	= ulist[i][8];
			var pstat			  	= ulist[i][9];
			var cmax			  	= ulist[i][10];
			var ccand			  	= ulist[i][11];
			var cstat			  	= ulist[i][12];
			var sposition	  	= new google.maps.LatLng(slat,slng);
			var image       	= getImage(pstat, cstat);
			var sweight       = getWeight(sid);
			var attending     = getAttending(sid);

			var marker 		  = new google.maps.Marker({
				id 					  : sid,
				lat           : slat,
				lng           : slng,
				name 				  : sname,
				address		 		: saddress,
				phone	 				: sphone,
				type 		      : stype,
				pmax					: pmax,
				pcand					: pcand,
				pstat					: pstat,
				cmax					: cmax,
				ccand					: ccand,
				cstat					: cstat,
				position	 		: sposition,
				rowid 			 	: i,
				icon 					: image,
				map 					: map,
				weight        : sweight,
				attending     : attending
			});

			if(marker.weight !== 0) {
				heatMapData.push({location:marker.position, weight:marker.weight});
			}

			latlngbounds.extend(sposition);
			var fn = markerClick(map, marker, infoWindowsas);
			google.maps.event.addListener(marker, 'click', fn);
			markersArray.push(marker);
			infoWindowsas	= new google.maps.InfoWindow();

		} // end loop

		google.maps.event.addListener(infoWindowsas, 'closeclick', closeinfowindow );
		createResultsList();

	}else{  // nothing returned from query
		// will happen if address loc is not within a boundary or bad query
		results = "<span style='color:red;'>There was a problem with the search. Please check your address and search again or call 311 to find your preferred school.</span>";
		$("#resultList").html(results);
		return;
	}

	setMapZoom();

	// if there is jsonp data then initialize the heat map but don't view it until button is clicked.
	// map also displays circles based on signup numbers.
	if(isHeatMapData()) {
		heatmap = new google.maps.visualization.HeatmapLayer({
			data: heatMapData,
			dissipating: true,
			radius:40 //, don't display just yet
			//map: map
		});
		$("#btnHeatmap").removeClass("hidden");
		$("#btnSignups").removeClass("hidden");
	}else {
		$("#btnHeatmap").removeClass("hidden").addClass("hidden");
		$("#btnSignups").removeClass("hidden").addClass("hidden");
	}
}

function closeinfowindow() {
	if (searchPolyAttendance != null) {
		searchPolyAttendance.setMap(null);
	}
}

function createResultsList() {
	//console.log("createResultsList: "+markersArray.length);
	var results = "";
	if (markersArray) {

		// sort alphabetically by name
		// thanks to: http://stackoverflow.com/questions/14208651/javascript-sort-key-value-pair-object-based-on-value
		// markersArray = markersArray.sort(function (a, b) {
		// 	return a.name.localeCompare( b.name );
		// });
		results += "<div id='locationcount'><span>"+markersArray.length+" locations</span><button id='btnHeatmap' class='btn btn-default btn-xs pull-right hidden' onclick='toggleHeatmap()' style='margin-right:10px;'>Heatmap</button><button id='btnSignups' class='btn btn-default btn-xs pull-right hidden' onclick='toggleSignupCircles()' style='margin-right:10px;'>Signups</button></div>";
		for (i in markersArray) {
			var linkcolor = getLinkColor(markersArray[i].pstat, markersArray[i].cstat );
			results += "" +
			"<div id='resultList"+markersArray[i].id+"' class='resultsrow' onclick=' openInfoWindow(&quot;"+
			markersArray[i].id+"&quot;,&quot;"+
			markersArray[i].name+"&quot;,&quot;"+
			markersArray[i].address+"&quot;,&quot;"+
			markersArray[i].phone+"&quot;,&quot;"+
			markersArray[i].type+"&quot;,"+
			markersArray[i].lat+","+
			markersArray[i].lng+","+
			markersArray[i].weight+","+
			markersArray[i].attending+",&quot;"+
			markersArray[i].pmax+"&quot;,&quot;"+
			markersArray[i].pcand+"&quot;,&quot;"+
			markersArray[i].pstat+"&quot;,&quot;"+
			markersArray[i].cmax+"&quot;,&quot;"+
			markersArray[i].ccand+"&quot;,&quot;"+
			markersArray[i].cstat+"&quot;);  '>" +
			"<img src='" +markersArray[i].icon+ "' />" ;
			if (markersArray[i].weight === 0) {
				results +="<span style='color:"+linkcolor+ "; ' >"+markersArray[i].name+"</span>";
			}else{
				results +="<span style='color:"+linkcolor+ "; ' >"+markersArray[i].name+" - "+markersArray[i].attending+" / "+markersArray[i].weight+"</span>";
			}
			results +="</div>" ;
		}

	}

	$("#resultList").html(results);
	$("#resultListContainer").scrollTop(0);



}

function displayLSCBoundary(id) {
	//show the boundaries of the school
	if (searchPolyAttendance != null) {
		searchPolyAttendance.setMap(null);
	}
	searchPolyAttendance = null;

	var wh="'ID' = '" + id + "'" ;
	searchPolyAttendance = new google.maps.FusionTablesLayer({
		query: {
			from:   LSCdistrictsTableId,
			select: "geometry",
			where:  wh
		},
		styles: [
			{ polygonOptions: { fillColor: "#0b5394", fillOpacity: .10, strokeColor: "#0149da", strokeWeight: 3 } },
		],
		suppressInfoWindows: true
	});
	searchPolyAttendance.setMap(map);
}

// populates the info window
// called from markerclick and resultslist click
function openInfoWindow(id, name, address, phone, type, lat, lng, weight, attending, pmax, pcand, pstat, cmax, ccand, cstat) {
	var sposition	  = new google.maps.LatLng(lat,lng);
	//var headcolor   = getLinkColor(pstat, cstat);
	var typeText   	= getType(type);
	var parentNeed = (pmax-pcand);
	var communityNeed = (cmax-ccand);

	var contents = "<div class='googft-info-window'>" +
	"<h4>" + name + "</h4>" +
	"<p>" + "<span>" + typeText + "</span><br />" + address +
	"<br /><a style='color:#333;' href='tel:"+phone+"'>" + phone + "</a></p>" ;

	if (pstat == "I" ) {
		contents +=	"<div style='color:#B20000;'>Parent Candidates Needed: <strong>" + parentNeed + "</strong></div>"
	}else{
		contents +=	"<div style='color:#1E5F08;'>Parent Candidates Total: <strong>" + pcand + "</strong></div>"
	}
	if (cstat == "I" ) {
		contents +=	"<div style='color:#B20000;'>Community Candidates Needed: <strong>" + communityNeed + "</strong></div>"
	}else{
		contents +=	"<div style='color:#1E5F08;'>Community Candidates Total: <strong>" + ccand + "</strong></div>";
	}

	// if(isHeatMapData()) {
	//   if(weight>0) {
	//     contents +=	"<p><span style='font-weight:bold'>Signups: </span>" + getWeight(id) + "<br />";
	//     contents +=	"<span style='font-weight:bold'>Attending: </span>" + getAttending(id) + "</p>";
	//   }
	// }

	contents += "<div class='directionsdiv'>" ;
	var startaddr = "";
	if (addrMarker !== null) {
		startaddr = "saddr="+ geoaddress + "&";
	}
	var destaddr = "daddr="+address;//.replace(" ", "+");

	contents +=	"<a class='link-get-directions'  style='color:#333;' href='http://maps.google.com/maps?";
	contents += startaddr + destaddr + "' target='_blank' >Get directions</a><br />"	;
	contents +=	"</div></div>";
	displayLSCBoundary(id);
	hopscotch.endTour();

	// have the info window appear in the center of the circles and offset higher on the pngs.
	if( isMarkerImage() ) {
		infoWindowsas.setOptions({
			pixelOffset: new google.maps.Size(0, -14)
		});
	}else{
		infoWindowsas.setOptions({
			pixelOffset: new google.maps.Size(0, 0)
		});
	}
	infoWindowsas.setContent(contents);
	infoWindowsas.setPosition(sposition);
	infoWindowsas.open(map);
	map.panTo(sposition);
	positionMarkersOnMap();
}

// popup infowindow called when user clicks on a marker on the map
function markerClick(map, m, ifw) {
	return function() {
		_trackClickEventWithGA("Click", "Marker on Map LSC", m.name);
		openInfoWindow(m.id, m.name, m.address, m.phone, m.type, m.lat, m.lng, m.weight, m.attending, m.pmax, m.pcand, m.pstat, m.cmax, m.ccand, m.cstat);
	};
}

function setMapZoom() {
	if (searchtype === "allschools") {
		//map.fitBounds(latlngbounds);
		map.setCenter(chicago);
		map.setZoom(11);
		positionMarkersOnMap();

	}	else if (searchtype === "address") {
		//map.fitBounds(latlngbounds);
		map.panTo(addrMarker.position);
		map.setZoom(13);
		positionMarkersOnMap();

	} else if (searchtype === "oneschool") {//not used
		//one school from dd
		map.fitBounds(latlngbounds);
		map.setZoom(14);//map.setZoom(map.getZoom()-1);	//zoom one click out
		query4infowindowData(selectedSchoolID);
	}

}

function toggleHeatmap() {
	if(heatmap) {
		heatmap.setMap(heatmap.getMap() ? null : map);
		if (heatmap.getMap() !== null) {
			clearMarkers();
			if (infoWindowsas) {
				infoWindowsas.close(map);
			}
		}else{
			showMarkers();
		}
	}
}

function toggleSignupCircles() {
	if (markersArray) {
		if( isMarkerImage() ) {
			for (i in markersArray) {
				var newimage = getCircle(markersArray[i].weight, markersArray[i].type );
				markersArray[i].setIcon(newimage);
			}
		}else{
			for (i in markersArray) {
				var newimage = getImage(markersArray[i].type);
				markersArray[i].setIcon(newimage);
			}
		}
	}
}

function getCircle(magnitude, type) {
	var c = getLinkColor(type);
	var circle = {
		path: google.maps.SymbolPath.CIRCLE,
		fillColor: c,
		fillOpacity: .4,
		scale: magnitude,//Math.pow(1, magnitude) / 2,
		strokeColor: c,
		strokeWeight: 1
	};
	return circle;
}

function isMarkerImage(){
	if (markersArray) {
		if($.type( markersArray[0].icon ) === "string") {
			return true; // marker is an image
		} else {
			return false; // marker is an object - circles
		}
	}
}

function isHeatMapData() {
	if(heatMapData.length>0) {
		return true;
	} else {
		return false;
	}
}

function isMobile() {
	if( $( window ).width() > 767 ) {
		return false;
	}else{
		return true;
	}
}

//centers the markers on the right side of the viewport on larger displays
//centers the markers on the middle bottom of the screen on mobile displays
function positionMarkersOnMap() {
	if( $( window ).width() > 767 ) {
		map.panBy(-calcPinLocation(), 0);
	} else {
		map.panBy(0 , -($( window ).height() / 2.5 )) ;
	}
}

function calcPinLocation() {
	var w=$( window ).width() / 4;
	return(w);
}

function getType(stype) {
	var mytype = "School";
	if( stype === "HS" ) {
		mytype = "High School";
	}else if (stype === "ES"){
		mytype = "Elementary School";
	}else if (stype === "MS"){
		mytype = "Middle School";
	}
	return mytype;
}

function getWeight(sid){
	return 0;
	// var result = $.grep(studentCountArray, function(e){ return e.id == sid; });
	// if (result.length === 0) {
	//   return 0;
	// } else if (result.length === 1) {
	//   return result[0].weight;
	// } else {
	//   return result[0].weight;
	// }
}

function getAttending(sid){
	return 0;
	// var result = $.grep(studentCountArray, function(e){ return e.id == sid; });
	// if (result.length === 0) {
	//   return 0;
	// } else if (result.length === 1) {
	//   return result[0].attending;
	// } else {
	//   return result[0].attending;
	// }
}

function getLinkColor(pstat, cstat) {
	var linkcolor = "#333";
	if( pstat == "I" || cstat == "I" ) {
		linkcolor = "#B20000";
	}else{
		linkcolor = "#1E5F08";
	}
	return linkcolor;
}

function getImage(pstat, cstat) {
	var image = "images/number_star.png";
	if(pstat === "I" || cstat === "I" || pstat === "" || cstat === "" ){
		image  = 'images/red_ex.png' ;
	}else{
		image  = 'images/green_star.png' ;
	}
	return image;

}

// reset btn
function resetmap() {
	var pageurl = top.location.href
	if(pageurl.indexOf("?") >=0) {
		var x = pageurl.split('?')[0];
		top.location.href = x;
	} else {
		$("#txtSearchAddress").val('');
		initializeMap();
	}
	hopscotch.endTour();
}

function clearSearch() {
	if (searchPolyAttendance != null) {
		searchPolyAttendance.setMap(null);
	}
	if (infoWindowsas) {
		infoWindowsas.close(map);
	}
	deleteMarkers();
	latlngbounds = new google.maps.LatLngBounds(null);
	searchtype = null;
	searchPolyAttendance = null;
}

// lists the markers from the map
function listMarkers() {
	if (markersArray) {
		for (i in markersArray) {
			console.log(markersArray[i].sid);
		}
	}
}

// Removes the markers from the map, but keeps them in the array
function clearMarkers() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
	}
}

// Shows any markers currently in the array
function showMarkers() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(map);
		}
	}
}

// Deletes all markers in the array by removing references to them
function deleteMarkers() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
		markersArray.length = 0;
	}
}

// encodes the query, returns json, and calls sf if success
function encodeQuery(q,sf) {
	var encodedQuery = encodeURIComponent(q);
	var url = [googleAPIurl];
	url.push('?sql=' + encodedQuery);
	url.push('&key='+ googleAPIkey);
	url.push('&callback=?');
	$.ajax({
		url: url.join(''),
		dataType: "jsonp",
		success: sf,
		error: function () {alert("AJAX ERROR for " + q ); }
	});
}
