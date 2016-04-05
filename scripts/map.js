//  LSC Vacancies Map (Community and Parent vacancies)

//	web services

//  4/2016


LSCdistrictsTableId
//var fusionTableId 					= "142zjKh-oFZIGF8GKTcUrivcwS4U4OzhfJUN7QAxQ" ; // merge of LSCvacancies_2016 and LSC Voting Districts SY16/17
var fusionTableId 					= "142zjKh-oFZIGF8GKTcUrivcwS4U4OzhfJUN7QAxQ" ; // LSCvacancies_2016 as of 3/22/2016
var LSCdistrictsTableId 		= "1WRXaOoaBmKqjOOqYfd7ltc8pPHbKhMUtQ_gy6joW" ; // LSC Voting Districts SY16/17
var googleAPIkey          	= "AIzaSyDBgH1Z_xKIjf1FVwvexUWfW-2FEhUjvF8";
var googleAPIurl          	= "https://www.googleapis.com/fusiontables/v1/query";
var APIurl                	= "http://dev.secure.cps.edu/json/jsondemo";
var heatmap 								= null;
var heatMapData 						=[];
var studentCountArray 			=[];
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
      url:        "http://dev.secure.cps.edu/json/jsondemo",
      dataType:   "jsonp",
      error:      function (jqXHR, exception) {
                    // net::ERR_NAME_NOT_RESOLVED
                    // above error is not called when dev is not available
                    // alert("An error has occurred getting student count information.");
										console.log(jqXHR, exception);
                  },
      success:    function(d){
                   for (var i = 0; i < d.length; i++) {
                      var schoolid        =  (d[i].LOCATION_SCHOOL_ID);
                      var signups         =  (d[i].SIGNUPS);
                      var totolatt        =  (d[i].AttendedTotal);
                      studentCountArray.push({id:schoolid, weight:signups, attending:totolatt });
                    }
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
	        pixelOffset: new google.maps.Size(0, -28)
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




	// clear map items before doing a search


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

	/*if(map.getZoom()>17){
		map.setZoom(17);
	}*/

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








//////////////////////////////////////////////////////////








function queryForSchoolsDD(){
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM "+ fusionTableId + " ORDER BY SchoolName " ;
	encodeQuery(query, createSchoolDropdown);
}

function createSchoolDropdown(d) {
	if( d.rows != null ) {
		var ulist 		= d.rows;
		var ulistlength = d.rows.length;
		var nameDropdown = "<select id='ddSchoolName' onchange='changeName(this);' class='form-control pull-left' >" ;
		nameDropdown += '<option value="">Select a School<\/option>';
		for (var i = 0; i < ulistlength; i++) { //start loop
			var sid				= (ulist[i][0]);
			var sname			= (ulist[i][3]);
			var ParentStat		= (ulist[i][9]);
			var CommunityStat 	= (ulist[i][12]);
      var headcolor = "";
			if( ParentStat === "I" || CommunityStat === "I" ) {
				 headcolor = "#B20000";
			}else{
				 headcolor = "#1E5F08";
			}

			nameDropdown += "<option value='"+sid+"' style='color:"+headcolor+";' >"+sname+"</option>" ;
			//nameDropdown += "<option value='"+sid+"'>"+sname+"</option>"
		}
		nameDropdown += "</select>" ;
		$('#input-schoolname').html(nameDropdown);

	}else{//nothing returned
		alert("List of schools could not be retrieved. Please refresh your browser.");
		return;
	}
	mapAllSchools(d) ;
}

//called from school dd
function changeName(sel) {
	clearSearch();
	//$('#waiting').fadeIn();
	//	var nSchool = sel.options[sel.selectedIndex].value;
	var nSchool = $("#ddSchoolName").val();
	selectedSchoolID = nSchool;
  var ddsn = $("#ddSchoolName option:selected").text();
	_trackClickEventWithGA("Search", "School Name DropDown LSC", ddsn);
	if (nSchool !== "") {
	 querySchools(nSchool);
	}else{//name is not selected from dd - reset
		alert("Please select a school from the drop down.");
		//$('#waiting').hide();
	}
}



function querySchools(nSchool) { // called only from dropdown
	clearSearch();
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM "+fusionTableId + " WHERE SchoolId = '" + nSchool + "'" + " ORDER BY SchoolName ";
	encodeQuery(query, mapAllSchools);
}




//SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT
function mapAllSchools2(d) {//one school or all schools

		var ulist =  "" ;
		var ulistlength= "" ;
	if( d.rows !== null ) {
		 ulist 		= d.rows;
		 ulistlength = d.rows.length;
		for (var i = 0; i < ulistlength; i++) {//start loop for infowindow
			infoWindowsas	= new google.maps.InfoWindow();
			var lat			= (ulist[i][1]);
			var lng			= (ulist[i][2]);
			var position	= new google.maps.LatLng(lat,lng);
			var pstat 		= ulist[i][9];
			var cstat 		= ulist[i][12];
      var image = "";
			if(pstat === "I" || cstat === "I" || pstat === "" || cstat === "" ){
				  image  = 'images/red_ex.png' ;
				}else{
				  image  = 'images/green_star.png' ;
				}
			var marker 		= new google.maps.Marker({
				position	 		: position,
				rowid 			 	: i,
				sid 				: ulist[i][0],
				// sname 				: ulist[i][3],
				// address		 		: ulist[i][4],
				// Phone	 			: ulist[i][5],
				// SchoolType 			: ulist[i][6],
				// ParentMax 			: ulist[i][7],
				// ParentCandidate		: ulist[i][8],
				// ParentStat 			: ulist[i][9],
				// CommunityMax 		: ulist[i][10],
				// CommunityCandidate	: ulist[i][11],
				// CommunityStat 		: ulist[i][12],
				icon 				: image,
				map 				: map
				});
			latlngbounds.extend(position);
			var fn = markerClick(map, marker, infoWindowsas);
			google.maps.event.addListener(marker, 'click', fn);
			markersArray.push(marker);
		}
	}//end of d.row!=null
	if(ulistlength>1){
	 searchtype = "allschools";
	}else{
	 searchtype = "oneschool";
	}
	setMapZoom();
	//$('#waiting').hide();
} // end mapAllSchools




function displayLSCBoundary2(id) {
  //show the LSC boundaries of the school
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



function setMapZoom2() {
	if (searchtype === "allschools") {
		map.setZoom(11);
		map.setCenter(chicago);
	} else {//one school
		map.fitBounds(latlngbounds);			//fits all the markers on the map
		map.setZoom(14);//map.setZoom(map.getZoom()-1);	//zoom one click out
	}
	/*if(map.getZoom()>17){
		map.setZoom(17);
	}*/
	if (searchtype === "allschools" ) {
		// don't pop any windows if clicking on legend
	}else{
		query4infowindowData(selectedSchoolID);
	}
}




// popup infowindow called when user clicks on a marker on the map
function markerClick2(map, m, ifw) {
  return function() {
		var ht = m.sname + " " + m.address;
		_trackClickEventWithGA("Click", "Marker on Map LSC", ht);
		ifw.close(map);
		query4infowindowData(m.sid);
	};

}




// popup infowindow called
function query4infowindowData2(id) {
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM " + fusionTableId + " WHERE SchoolId = '" + id + "'" + " ORDER BY SchoolName ";

	encodeQuery(query, openInfoWindow);
}



//  popup infowindow
function openInfoWindow2(j) {
	if( j.rows != null ) {

		var sid 				= j.rows[0][0];
		var sname 				= j.rows[0][3];
		var address		 		= j.rows[0][4];
		var Phone	 			= j.rows[0][5];
		var SchoolType 			= j.rows[0][6];
		var ParentMax 			= j.rows[0][7];
		var ParentCandidate		= j.rows[0][8];
		var ParentStat 			= j.rows[0][9];
		var CommunityMax 		= j.rows[0][10];
		var CommunityCandidate	= j.rows[0][11];
		var CommunityStat 		= j.rows[0][12];
		var lat 				= j.rows[0][1];
		var lng 				= j.rows[0][2];
		var position 			= new google.maps.LatLng(lat,lng);
	var headcolor ="";
	if( ParentStat == "I" || CommunityStat == "I" ) {
		 headcolor = "#B20000";
	}else{
		 headcolor = "#1E5F08";
	}



    var contents = "<div style='line-height:1.35; font-size:12px;'>" +
		"<h2  style='font-family:arial, san-serif; font-size:16px; line-height:18px; color:" + headcolor + "; margin:0px;'>" + sname + "</h2>" +
		"<p   style='font-family:arial, san-serif; line-height:16px; color:#777777; margin:0px; padding-bottom:4px;'>" + address + "<br />" + Phone + "</p>" +

		"<div style='color:#555555; background-color: #FFF; border-top:1px solid " + headcolor + "; border-bottom:1px solid " + headcolor +
		"; padding:8px 0px; margin:0px 0px 4px 0px; line-height:16px; font-size:12px;'>" ;

		if (ParentStat == "I" ) {
			var parentNeed = (ParentMax-ParentCandidate);
		    contents +=	"<div style='max-width:350px; color:#B20000; '>Parent Candidates Needed: <strong>" + parentNeed + "</strong></div>"
		}else{
			contents +=	"<div style='max-width:350px; color:#1E5F08; '>Parent Candidates Total: <strong>" + ParentCandidate + "</strong></div>"
		}

		if (CommunityStat == "I" ) {
			var communityNeed = (CommunityMax-CommunityCandidate);
		    contents +=	"<div style='max-width:350px; color:#B20000; '>Community Candidates Needed: <strong>" + communityNeed + "</strong></div>"
		    }else{
			contents +=	"<div style='max-width:350px; color:#1E5F08; '>Community Candidates Total: <strong>" + CommunityCandidate + "</strong></div>";
		}

		//if (ParentStat == "I" || CommunityStat == "I" ) {
			contents +=	"<div style='max-width:350px; font-size:90%; padding-top:4px;'>"+ vacancyDate+"</div>";
			//};

		contents +=	"</div>" ;

		contents += "<div style='color:#555555; background-color: #FFF; padding:0px; margin:4px 0px 0px 0px; line-height:16px; font-size:12px;'>" ;
		//if (PDFlink != "" ) {
		//	contents +=	"<a class='link-pdf-facts'  style='padding:0px; margin:0px; color:" + headcolor + "' href='"+PDFlink+" ' " +
		//" target='_blank' >View more details (PDF)</a><br />"}

	dirAddress = address.replace(" ", "+");
	contents +=	"<a class='link-get-directions'  style='padding:0px; margin:0px; color:" + headcolor + "' href='http://maps.google.com/maps?daddr=" +
				dirAddress + "' target='_blank' >Get directions to this school</a><br /><br />"	;
	contents +=	"</div></div>";


	//if (searchtype == "legendschools") {
  //		if(map.getZoom() < 13) {
  //			map.setZoom(13);
  //		}
		//welcomingchanges
		//if( mapview !== "options" ) {
	 // var wlat = lat;
		//	var wlng = (lng-.01);
		//	var wpos = new google.maps.LatLng(wlat,wlng);
		//	map.setCenter(wpos);
		//}
	//}



  displayLSCBoundary(sid);
	infoWindowsas.setOptions({
    	pixelOffset: new google.maps.Size(-1, -22)
     });
	infoWindowsas.setContent(contents);
	infoWindowsas.setPosition(position);
	infoWindowsas.open(map);
	//$('#waiting').hide();
	}//end not null

}


// an address search displays the boundaries of the LSC
function addressSearch2() {
	clearSearch();
	var theInput = $.trim( $("#txtSearchAddress").val().toUpperCase() );
  var address = theInput;
  if (address != "" ) {
    if (address.toLowerCase().indexOf("chicago, illinois") == -1) {
      address = address + " chicago, illinois";
    }
    geocoder.geocode({ 'address': address }, function (results, status) {

      if (status == google.maps.GeocoderStatus.OK) {
        geoaddress = (results[0].formatted_address);
        map.setCenter(results[0].geometry.location);
        //radiusLoc = results[0].geometry.location;
        map.setZoom(14);
        if (addrMarker) { addrMarker.setMap(null); }
        addrMarker = new google.maps.Marker({
          position: results[0].geometry.location,
          map: map,
          icon: addrMarkerImage,
          animation: google.maps.Animation.DROP,
          title: geoaddress
        });
        //_trackClickEventWithGA("Search", "Address", geoaddress);
        //_trackClickEventWithGA("Search", "Address", theAddress);
        map.panTo(addrMarker.position);
        //positionMarkersOnMap();
        whereClause = " "
        //whereClause += "ID NOT EQUAL TO '' ";
        //whereClause += " AND Boundary not equal to 'Citywide' ";
        whereClause += " WHERE ST_INTERSECTS('geometry', CIRCLE(LATLNG"+results[0].geometry.location.toString() + "," + .00001 + "))";
        //whereClause += " ORDER BY 'School Name'";
        var query = "SELECT ID FROM " + LSCdistrictsTableId + whereClause;

        encodeQuery(query, mapAllSchools);

      } else {//geocoder status not ok
        alert("We could not find your address: " + status);
      }
    });
  } else {//didn't enter an address
    alert("Please enter an address.");
  }
  //  if( $( window ).width() > 480 ) {
  //   map.panTo(addrMarker.position);
  //   map.panBy(-calcPinLocation(), 0);
  // }
}



// adds commas to a string
function addCommas(nStr) {
    nStr += '';
    x = nStr.split('.');
    x1 = x[0];
    x2 = x.length > 1 ? '.' + x[1] : '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + ',' + '$2');
    }
    return x1 + x2;
}








  // Data Service

  // http://localhost/SchoolProfile/dataservice.asmx/GetAllSchools?callback=ted

  // http://localhost/SchoolProfile/dataservice.asmx/GetSchoolsForSchoolIds?callback=ted&schoolIds=609832;609893

  // http://localhost/SchoolProfile/dataservice.asmx/GetDistinctSchoolNames?callback=ted

  // schoolinfo.cps.edu/schoolprofile/

  // $(document).ready(function(){
  //  jQuery.getJSON("http://ical.cps.edu/KeyEvents?callback=?",
  //  function(data))
  // });
