//  LSC Candidate Map (schools with vacancies)
//
//	web services

//  2/2014




var fusionTableId 		= "1L74zSOKyr3_LRBNjydBwQI1YRhJTOEE-8P18VY8" ; // CandidateMonitorReport-2-18-14
var googleAPIkey 		= "AIzaSyDBgH1Z_xKIjf1FVwvexUWfW-2FEhUjvF8";
var googleAPIurl 		= "https://www.googleapis.com/fusiontables/v1/query";
var map;
var markersArray		= []; 			//for the marker array
var infoWindowsas		= null; 		// infowindow
var latlngbounds        = null; 		// for panning and zooming to include all searched markers
var selectedSchoolID	= null; 		// passing of info for poping selected school infowindow
var searchtype			= null; 		// flag for legend click bypass of openinfowindow //allschools
var chicago				= new google.maps.LatLng(41.839, -87.67); // default center of map




function initialize() {
	
	clearSearch();
	
	
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
		mapTypeControl: true,
			mapTypeControlOptions: {
      			style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
				position: google.maps.ControlPosition.RIGHT_TOP
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
	//get the action schools for the dropdown
	queryForSchoolsDD();
}



// SchoolId	Lat	Lng	FinanceId	SchoolName	SchoolNetworkName	SchoolType	PARENT_MAX	PARENT_CAND	PARENT_STAT	COMMUNITY_MAX	COMMUNITY_CAND	COMMUNITY_STAT	TEACHER_MAX	TEACHER_CAND	TEACHER_STAT	STUDENT_MAX	STUDENT_CAND	STUDENT_STAT	NONTCHSTAFF_MAX	NONTCHSTAFF_CAND	NONTCHSTAFF_STAT	ADVOCATE_MAX	ADVOCATE_CAND	ADVOCATE_STAT	JROTC_INSTR_MAX	JROTC_INSTR_CAND	JROTC_INSTR_STAT	BUSINESS_MAX	BUSINESS_CAND	BUSINESS_STAT	COMMANDANT_MAX	COMMANDANT_CAND	COMMANDANT_STAT	CADET_CMDR_MAX	CADET_CMDR_CAND	CADET_CMDR_STAT	ED_EXPERT_MAX	ED_EXPERT_CAND	ED_EXPERT_STAT	JudgeApplCt	CandidateCt	QuorumCt	SortNetwork


function queryForSchoolsDD(){
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM "+ fusionTableId + " ORDER BY SchoolName " ;
	encodeQuery(query, createSchoolDropdown);
}

function createSchoolDropdown(d) {
	if( d.rows != null ) {
		var ulist 		= d.rows;
		var ulistlength = d.rows.length;
		var nameDropdown = "<select id='ddSchoolName' onchange='changeName(this);' class='input-xlarge pull-left' style='width:310px;'>"
		nameDropdown += '<option value="">-- Select a School --<\/option>';
		for (var i = 0; i < ulistlength; i++) { //start loop
			var sid				= (ulist[i][0]);
			var sname			= (ulist[i][3]);
			var ParentStat		= (ulist[i][9]);
			var CommunityStat 	= (ulist[i][12]);

			if( ParentStat == "I" || CommunityStat == "I" ) {
				var headcolor = "#B20000";
			}else{
				var headcolor = "#1E5F08";
			}	

			nameDropdown += "<option value='"+sid+"' style='color:"+headcolor+";' >"+sname+"</option>"
			//nameDropdown += "<option value='"+sid+"'>"+sname+"</option>"
		}
		nameDropdown += "</select>"
		$('#input-schoolname').html(nameDropdown);

	}else{//nothing returned
		alert("List of schools could not be retrieved. Please refresh your browser.");
		return;
	}
	mapAllSchools(d) 
}




//called from school dd
function changeName(sel) {
	clearSearch();
	$('#waiting').fadeIn();
	//	var nSchool = sel.options[sel.selectedIndex].value; 
	var nSchool = $("#ddSchoolName").val();
	selectedSchoolID = nSchool;
 var ddsn = $("#ddSchoolName option:selected").text();
	_trackClickEventWithGA("Search", "School Name DropDown LSC", ddsn); 
	if (nSchool != "") {	
	 querySchools(nSchool);
	}else{//name is not selected from dd - reset
		alert("Please select a school from the drop down.");
		$('#waiting').hide();
	}
}



/*
function mapQueryAll() {
	var nSchool = $("#ddSchoolName").val();
	ActionLayer = new google.maps.FusionTablesLayer({
		query: {
			from:   fusionTableId,
			select: " 'ID' , 'Lat', 'Lng' ",
			where:  " 'ID' = '" + nSchool + "'"
			}, 
			map:map,
			options: {suppressInfoWindows: true }
		});
		
	$('#waiting').hide();
}*/



function querySchools(nSchool) { // called only from dropdown
	clearSearch();
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM "+fusionTableId + " WHERE SchoolId = '" + nSchool + "'" + " ORDER BY SchoolName ";	
	encodeQuery(query, mapAllSchools);
}



//SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT
function mapAllSchools(d) {//one school or all schools
	if( d.rows != null ) {
		var ulist 		= d.rows;
		var ulistlength = d.rows.length;
		for (var i = 0; i < ulistlength; i++) {//start loop for infowindow
			infoWindowsas	= new google.maps.InfoWindow();
			var lat			= (ulist[i][1]);
			var lng			= (ulist[i][2]);
			var position	= new google.maps.LatLng(lat,lng);
			var pstat 		= ulist[i][9];
			var cstat 		= ulist[i][12];
			if(pstat == "I" || cstat == "I" || pstat == "" || cstat == "" ){ 
				 var image  = 'images/red_ex.png' ; 
				}else{
				 var image  = 'images/green_star.png' ;
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
	$('#waiting').hide();
} // end mapAllSchools






function setMapZoom() {
	if (searchtype == "allschools") {
		map.setZoom(11);
		map.setCenter(chicago);
	} else {//one school
		map.fitBounds(latlngbounds);			//fits all the markers on the map
		//map.setZoom(map.getZoom()-1);	//zoom one click out
	}
	if(map.getZoom()>17){
		map.setZoom(17);
	}
	if (searchtype == "allschools" ) {
		// don't pop any windows if clicking on legend
	}else{
		query4infowindowData(selectedSchoolID);
	}	
}	



// popup infowindow called when user clicks on a marker on the map
function markerClick(map, m, ifw) {
  return function() {
		var ht = m.sname + " " + m.address;
		_trackClickEventWithGA("Click", "Marker on Map LSC", ht);
		ifw.close(map);
			 query4infowindowData(m.sid);
	};
	
}




// popup infowindow called
function query4infowindowData(id) {
	var query = "SELECT SchoolId, Lat, Lng, SchoolName, Address, Phone, SchoolType, PARENT_MAX, PARENT_CAND, PARENT_STAT, COMMUNITY_MAX, COMMUNITY_CAND, COMMUNITY_STAT FROM " + fusionTableId + " WHERE SchoolId = '" + id + "'" + " ORDER BY SchoolName ";
	
	encodeQuery(query, openInfoWindow);
}





//  popup infowindow
function openInfoWindow(j) {
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
	
	if( ParentStat == "I" || CommunityStat == "I" ) {
		var headcolor = "#B20000";
	}else{
		var headcolor = "#1E5F08";
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
			contents +=	"<div style='max-width:350px; color:#1E5F08; '>Community Candidates Total: <strong>" + CommunityCandidate + "</strong></div>"
		}

		//if (ParentStat == "I" || CommunityStat == "I" ) {
			contents +=	"<div style='max-width:350px; font-size:90%; padding-top:4px;'>Data from 3/23/2014</div>"
			//};

		contents +=	"</div>" ;

		contents += "<div style='color:#555555; background-color: #FFF; padding:0px; margin:4px 0px 0px 0px; line-height:16px; font-size:12px;'>" ;
		//if (PDFlink != "" ) {
		//	contents +=	"<a class='link-pdf-facts'  style='padding:0px; margin:0px; color:" + headcolor + "' href='"+PDFlink+" ' " + 
		//" target='_blank' >View more details (PDF)</a><br />"}
	
	dirAddress = address.replace(" ", "+");
	contents +=	"<a class='link-get-directions'  style='padding:0px; margin:0px; color:" + headcolor + "' href='http://maps.google.com/maps?daddr=" +
				dirAddress + "' target='_blank' >Get directions to this school</a><br /><br />"	
	contents +=	"</div></div>"
	 

	if (searchtype == "legendschools") {
		if(map.getZoom() < 13) {
			map.setZoom(13);
		}
		//welcomingchanges
		//if( mapview !== "options" ) {
	 // var wlat = lat;
		//	var wlng = (lng-.01);
		//	var wpos = new google.maps.LatLng(wlat,wlng);
		//	map.setCenter(wpos);
		//}
	}
	 infoWindowsas.setOptions({ 
    	pixelOffset: new google.maps.Size(-1, -22)
     }); 
	infoWindowsas.setContent(contents);
	infoWindowsas.setPosition(position);
	infoWindowsas.open(map);
	$('#waiting').hide();
	}//end not null
	
}





	
	
		



function clearSearch() {
	if (infoWindowsas) {
		infoWindowsas.close(map);}
	deleteMarkers();
	latlngbounds = new google.maps.LatLngBounds(null);
	searchtype = null;
	
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









// reset btn removes "?Schools=1234,5678 from the url
function resetmap() {
	var pageurl = top.location.href
	if(pageurl.indexOf("?") >=0) {
		var x = pageurl.split('?')[0];
		top.location.href = x;

	} else {
	initialize();
	}
}







function ajaxerror() {
	alert("Your school(s) cannot be found. Please click Reset Map and try again.");
	$('#waiting').hide();	
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



// toggles welcoming panel when Results tab clicked //// NOT USED
/*function toggleWpMovingContainerXXX() {
	//console.log("toggling");
    var $marginLefty = $('#wpMovingContainer');
	$marginLefty.animate({
      marginLeft: parseInt($marginLefty.css('marginLeft'),10) == 0 ? $marginLefty.outerWidth() : 0
    });
}*/
 
function closeWpMovingContainer() {// closes welcoming panel
    var $marginLefty = $('#wpMovingContainer');
	$marginLefty.animate({
      marginLeft: 0
	  }, 10, function() {
		  //animation complete
    });
	$('#resultstypearrow').html('R<br />e<br />s<br />u<br />l<br />t<br />s<br /><span style="color:#FAC158;">&#9658</span><br />');
}

function toggleWpMovingContainer() {// toggles welcoming panel
    var $marginLefty = $('#wpMovingContainer');
	if(parseInt($marginLefty.css('marginLeft')) == 0) {
		$marginLefty.animate({marginLeft: $marginLefty.outerWidth() }, 200);
		$('#resultstypearrow').html('R<br />e<br />s<br />u<br />l<br />t<br />s<br /><span style="color:#FAC158;">&#9668</span><br />');
	  }else{
		$marginLefty.animate({marginLeft: 0 },200);
		$('#resultstypearrow').html('R<br />e<br />s<br />u<br />l<br />t<br />s<br /><span style="color:#FAC158;">&#9658</span><br />');
	}
}



//not used
function toggleOptionSchools() {
	if (optionson == false) {
		$('#btnOption').val("Hide Nearby Schools");
		optionson = true;
		$('#ddlRadius').show();
	}else{
		optionson = false;
		$('#btnOption').val("Show Nearby Schools");
		$('#ddlRadius').hide();
	}
	$('#btnChangeName').click();
}


