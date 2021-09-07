$.cookie.json = true;



var minTempo = 40;
var maxTempo = 250;

var selectedHitPoint = 0;
var guiInited = false;
var DM = new DataManager();

var selectedMatch;



$( document ).on( "mobileinit" , function () {
   // $.mobile.toolbar.prototype.options.addBackBtn = true;
   
});
  
  

$(document).ready(function() {



 	//$.mobile.toolbar.prototype.options.addBackBtn = true;
    
    $(".tempoSelect").each(function(i, el){
			
			TempoPicker(this);
	});
	
	$("#tempo-slider").slider();
	
	

});


$(document).unload(function(){
	
	return confirm("Do you want to quit BeatSyncLog?");
	
		
});


$( document ).on( "pagebeforecreate", "#project-list-page", function(event) {



	$projectList = $("<ul>", {"data-role":"listview", id:"project-list"});
	
	var pgID = "#" + event.currentTarget.id;
	var $target = $(pgID + " .ui-content");
	$target.append($projectList);
	
	
	
	$("#addProjectBtn").click(function(){
		
		var defaultProject = DM.addProject();
		
				
	});
	
	
	

});


$( document ).on( "pagebeforeshow", "#project-list-page", function(event) {


	if(DM.firstRun){
	
		// jump to edit-project
		DM.firstRun = false;
		$.mobile.changePage('#project-settings-page');
		return;
		
	}
	
	
	guiInited = true;
	
	
	// PROJECT LIST
	$projectList = $("#project-list");
	$projectList.html("");
	
		
	for(var i = 0; i < DM.data.length; i++){
		
		var project = DM.getProject(i);
		$listElement = $("<li>");
		$linkElement = $("<a href='#project-edit-page'>" + project.name + "</a>");
		$listElement.append($linkElement);
		
		$linkElement.click(function(event){
			
			var index = $(this).parent().index();
			var curProject = DM.selectProject( index );
			curProject.editCnt++;					
		});
		
		$projectList.append($listElement);
		
	}
	$projectList.listview("refresh");
	
	

});







$( document ).on( "pagebeforecreate", "#project-edit-page", function(event) {

	
	
	
	var project = DM.getSelectedProject();
	
	$("#tempo-slider").change(function() {
		var tempo = decimals( $("#tempo-slider").val(), 1);
		selectedMatch = project.tempoToMatch(tempo);
				
		indicateSelectedMatch(project, {dontUpdateSlider: true});
		
	});
	
	drawHitPointsList();
	

});



$( document ).on( "pagebeforeshow", "#project-edit-page", function(event) {
	
	var project = DM.getSelectedProject();
	
	$(".projectNameLabel").html( project.name );
	$(".tempoLabel").html( project.tempo + "bpm");
	$(".frameRateLabel").html( project.fps + "fps");
	$(".subBeatsLabel").html( project.subBeats );
	
	drawHitPointsList();
	
	$("#hitPoint-list").listview("refresh");
	
});





$( document ).on( "pagebeforecreate", "#project-settings-page", function(event) {
	
	
	var project = DM.getSelectedProject();
	
	
	function updateData(e){
		
		if(!pageIsReady){return}
		
		var data = {
			name : $("#project-settings-page #projectName").val(),
			fps : parseInt($("#project-settings-page #frameRate").val()),
			subBeats : parseInt($("#project-settings-page #subBeats").val()),
			tempo : parseInt($("#project-settings-page #tempoSelect").val())
		}
		
		if(data.name.length){
			project.updateMatches();
			displayMatches(project);
			DM.updateProject(data);
		} else {
			
			console.log(e);
			if(e){e.preventDefault();}
			alert("Please type a project name");
			
		}
		
		
	}
	
		
	$("#projectEditDoneBtn").click(function(e){
		
		updateData(e);
		
	});
	
	
	$('#projectName').keypress(function(e) {
	    if(e.which == 13) {
	    	e.preventDefault();
	        $(this).blur();
	        $('#projectEditDoneBtn').focus().click();
	    }
	});
	
	$('#projectName').on("blur", function(e){
		
		updateData();
		
	});
	
	
	
	
	$("#deleteProjectBtn").click(function(){
		
		var project = DM.getSelectedProject();
		if( confirm("Do you want to delete " + project.name + "?") ) {
		
			var defaultProject = DM.deleteSelectedProject();
		} else {
			return false;
		}
				
	});
	
	
	
	
	
	$("#" + event.currentTarget.id + " select").on("change", function(){
		
		updateData();
			
	});
	
	
	
	
});


$( document ).on( "pagebeforeshow", "#project-settings-page", function(event) {

	pageIsReady = false;
	
	var project = DM.getSelectedProject();
    $("#project-edit-page").attr("data-edit-count", project.editCnt);
   
   
	var pgID = "#" + event.currentTarget.id;
	$(pgID + " #projectName").val( project.name );
	$(pgID + " #frameRate").val( project.fps );
	$(pgID + " #subBeats").val( project.subBeats );
	$(pgID + " #tempoSelect").val( project.tempo );
	
	$(pgID + " select").selectmenu("refresh");
	
	
	pageIsReady = true;
	
	
		
	

});









$( document ).on( "pagebeforecreate", "#hitPoint-list-page", function(event) {

	
	$("#addHitPointBtn").click(function(){
		var project = DM.getSelectedProject();
		project.addHitPoint();
		drawHitPointsList();
		
	});
	
	

});


$( document ).on( "pagecreate", "#hitPoint-list-page", function(event) {
	
	var project = DM.getSelectedProject();
	
	$("#tempo-slider").change(function() {
		var tempo = decimals( $("#tempo-slider").val(), 1);
		selectedMatch = project.tempoToMatch(tempo);
				
		indicateSelectedMatch(project, {dontUpdateSlider: true});
		
	});
});

$( document ).on( "pagebeforeshow", "#hitPoint-list-page", function(event) {

	drawHitPointsList();

});



function drawHitPointsList(){
		
		
	var project = DM.getSelectedProject();	
	project.updateMatches();
	
	
	$("#hitPoint-list").html("");
	
	
	var musicStart = project.newHitPoint({time: project.musicStart, name: ""});	
	$("#hitPoint-list").append( HitPointView(musicStart) );
	
	for(var i = 0; i < project.hitPoints.length; i++){
	
		matches = project.matches.length ? project.matches[0].hitPoints[i] : null;
		$("#hitPoint-list").append( HitPointView( project.hitPoints[i], matches ) );
		
		
	}
	
	var $addBtn = $("<a>",  {
		href: "#",
		"data-role": "button",
		"data-icon": "plus",
		"data-iconpos": "right",
		id: "addHitPointBtn",
		class: "ui-icon-plus"
	}).html("&nbsp;");
	
	
	
	
	$addBtn.click(function(){
		project.addHitPoint();
		drawHitPointsList();
		$("#hitPoint-list").listview("refresh");
	});
	
	
	
	$("#hitPoint-list").append( $("<li>").append($addBtn) );
	
	
	displayMatches(project);
		
}
	
	

var timePicker;
var hitPoint;
var pageIsReady = false;

$( document ).on( "pagebeforecreate", "#hitPoint-edit-page", function(event, ui) {

	console.log("pagebeforecreate > #hitPoint-edit-page");
	
	var project = DM.getSelectedProject();		
	timePicker = new TimePicker("#hitPoint-time-picker", project);
	
	pgID = "#" + event.currentTarget.id;
	
	function updateProjectData(){
	
		var project = DM.getSelectedProject();
		
		if(!pageIsReady){return};
		
		if(selectedHitPoint < 0) {
			
			// music start
			project.musicStart = timePicker.time();
			
		} else {
			hitPoint.name = $("#hitPoint-name").val();
			hitPoint.time = timePicker.time();
			hitPoint.important = $("#hitPointImportant").prop("checked");
			hitPoint.allowSubBeat = $("#hitPointAllowSubBeat").prop("checked");
		}
		
		
		
		project.updateMatches();
		displayMatches(project);
				
		DM.save();
		
		
	}

	$("#hitPointEditDoneBtn").click(function(){
		
		updateProjectData();
		
	});
	
	
	$('#hitPoint-name').keypress(function(e) {
	    if(e.which == 13) {
	    	e.preventDefault();
	        $(this).blur();
	        $('#hitPointEditDoneBtn').focus().click();
	    }
	});
	
	$('#hitPoint-name').on("blur", function(){
		
		updateProjectData();
		
	});
	
	$(pgID + " select, " + pgID + " input").on("change", function(){
		
		updateProjectData();
		
	});
	
	$("#deleteHitPointBtn").click(function(){
		var project = DM.getSelectedProject();
		if(project.hitPoints.length > 1) {
			
			var hitPointName = project.hitPoints[selectedHitPoint].name;
				
			if( confirm("Do you want to delete " + hitPointName + "?") ) {
			
				project.hitPoints.splice(selectedHitPoint, 1);
				selectedHitPoint = Math.min(selectedHitPoint, project.hitPoints.length-1);
				updateProjectData();
			} else {
				return false;
			}
	


			
		} else {
			alert("You can't delete the last hitpoint!");
			return false;
		}
		
		
	});
	
	

	
});


$( document ).on( "pagebeforeshow", "#hitPoint-edit-page", function(event, ui) {

	pageIsReady = false;
	console.log("pagebeforeshow > #hitPoint-edit-page");
	
	
	var project = DM.getSelectedProject();
	var pgID = "#" + event.currentTarget.id;

	if(selectedHitPoint >= 0){
		
		hitPoint = project.hitPoints[selectedHitPoint];
		
		
		// show switches + deleteButton
		$(pgID + " .switch, " + pgID + " .ui-flipswitch, #deleteHitPointBtn").show();
		
		// enable edit of name
		$("#hitPoint-name").textinput('enable');
		
		$("#hitPointImportant").prop('checked', hitPoint.important).flipswitch("refresh");
		$("#hitPointAllowSubBeat").prop('checked', hitPoint.allowSubBeat).flipswitch("refresh");

	} else {
		
		// music start
		hitPoint = project.newHitPoint({time: project.musicStart, name: "Music Start"});
		
		//hitPoint-music-start
		
		
		// disable edit of name
		$("#hitPoint-name").textinput('disable');
		
		// disable delete + important & allowSubBeats
		$(pgID + " .switch, " + pgID + " .ui-flipswitch, #deleteHitPointBtn").hide();
		
	}
	
	
	$("#hitPoint-name").val(hitPoint.name);
	timePicker.update(hitPoint);
	
	pageIsReady = true;
});






function displayMatches(project){
	
	// byt ut denna till att bara visa bästa träffen
	if(!project.matches){return;}
	if(!project.matches.length){return;}
	selectedMatch = project.bestMatch;
	
	$(".match-result").html("");
	var nrOfImportantHitpoints = project.importantHitPoints().length;
	
	project.matches.forEach(function(thisMatch, index){
		
		$tempoElement = $("<span>",  {class: 'found-match', 'data-tempo': thisMatch.tempo});
		var size = 40;
		var unit = "px";
		
		// out
		var out = thisMatch.ranges.OUT.length / nrOfImportantHitpoints * 30;
		$out = $("<div>").css({ 
			height: size + unit, 
			width: size + unit , 
			marginLeft: -(size/2) + unit,
			marginTop: -(size/2) + unit
		});
		
		// good
		var good = thisMatch.ranges.IN.length / nrOfImportantHitpoints * size;
		$good = $("<div>").css({ 
			height: good + unit, 
			width: good + unit, 
			marginLeft: -(good/2)+unit,
			marginTop: -(good/2)+unit 
		});
		
		
		// bad
		var badSize = good + thisMatch.ranges.BETWEEN.length / nrOfImportantHitpoints * size;
		$bad = $("<div>").css({ 
			height: badSize + unit, 
			width: badSize + unit , 
			marginLeft: -(badSize/2) + unit,
			marginTop: -(badSize/2) + unit
		});
		
		$tempoElement.append($out);
		$tempoElement.append($bad);
		$tempoElement.append($good);
		
		
		
		
		
		
		// text label
		$label = $("<div>").html(thisMatch.tempo);
		$tempoElement.append($label);
		
		// border
		$tempoElement.append( $("<div>", {class: "border"}) );
		
		$tempoElement.click(function(){
			
			selectedMatch = project.matches[index];
			
			// indicate selected state
			indicateSelectedMatch(project);
			
		});
		
		
		
			
		$(".match-result").append($tempoElement);
	});
	
	
	$(".match-result").css("display", "table");
	$(".match-instruction").css("display", "none");
	indicateSelectedMatch(project);
	
	
}

function updateMatchesOnHitPoints(selectedMatchObject){
	
	if(!selectedMatchObject){return};
	var project = DM.getSelectedProject();
	
	var $listElements = $("#hitPoint-list > li");
	
	$listElements.each(function(index){
		
		if(index == 0 || index == $listElements.length - 1){
			// music start || add new element
			
		} else {
				
			// ordinary hitpoint
			$diff = $(this).find(".hitPoint-diff");
			var targetMatchPoint = selectedMatchObject.hitPoints[index-1];
			
			if(targetMatchPoint.important) {
				
				$diff.html(decimals(targetMatchPoint.diffInFrames, 0, "floor"));
				$diff.css("left", (targetMatchPoint.timeDiff * 80 + 40) + "%");
				
				var matchQuality;
				if(targetMatchPoint.absDiffFrames < acceptableRange.afterFrames){
					matchQuality = "good";
				} else if(targetMatchPoint.absDiffFrames < acceptableRange.outAfterFrames){
					matchQuality = "bad";		
				} else {
					matchQuality = "miss";
				}
				$diff.attr("data-quality", matchQuality);
				
				$(this).find(".hitPoint-beat").html(targetMatchPoint.beat);
			
			}
			
		}
	});
	
	
	
}



function indicateSelectedMatch(project, options){
	
	options = options || {};
	
	$(".match-result > span > .border").css("visibility", "hidden");
	$(".match-result > span[data-tempo='" + selectedMatch.tempo + "'] > .border").css("visibility", "visible");
	
	
	updateMatchesOnHitPoints( selectedMatch );
	
	
	if(!options.dontUpdateSlider){
	
		$("#tempo-slider").prop({
			min: project.initTempo,
			max: project.stopTempo,
			value: selectedMatch.tempo
		}).slider("refresh");
		
	
		
	}	
}
			
			
			

function HitPointView(curHitPoint, curMatch){
	
	var classNames = curHitPoint.important ? "important" : "";
	$listElement = $("<li>", {class: classNames});
	
	/*
	var nameSpan = "<span class='hitPoint-name'>" + curHitPoint.name + "</span>";
	var timeSpan = "<span class='hitPoint-time'>" + curHitPoint.timeString() + "</span>";
	*/
	var $nameSpan = $("<span>", {class: 'hitPoint-name'}).html(curHitPoint.name);
	
	var $beatSpan = $("<span>", {class: 'hitPoint-beat'});

	var $diffContainer = $("<span>", {class: 'hitPoint-diff-container'});
	var $diffSpan = $("<span>", {class: 'hitPoint-diff'});
			
	$diffContainer.append($diffSpan);

	
	var $timeSpan = $("<span>", {class: 'hitPoint-time'}).html(curHitPoint.timeString());
	
	$linkElement = $("<a>", {href:'#hitPoint-edit-page'}).append($nameSpan);
	$linkElement.append($beatSpan);
	$linkElement.append($diffContainer);
	$linkElement.append($timeSpan);
	
	$listElement.append($linkElement);
	
	$linkElement.click(function(event){
		
		// -1 offset for not counting "Music Start"
		selectedHitPoint = $(this).parent().index()-1;
		var project = DM.getSelectedProject();
		hitPoint = project.hitPoints[selectedHitPoint];
		
	});	
	
	return $listElement;
}




function Picker(target, unit, minVal, maxVal){
	
	for(var i = minVal; i <= maxVal; i++){
		
		var $newElement = $("<option>", {value: i});
		$newElement.html(i + " " + unit);
		$(target).append($newElement);
		
	}
	
	
}




function TempoPicker(target){
	
	Picker(target, "bpm", minTempo, maxTempo);
	
}




var timePickerID = 0;

function TimePicker(target, project){
	
	$(target).html("<legend>Time</legend>");
	this.target = target;
	this.project = project;
	
	var timePickerData = [
	
		{
			id: "hour",
			unit: "h",
			minVal: 0,
			maxVal: 23
			
		},
		
		{
			id: "minute",
			unit: "min",
			minVal: 0,
			maxVal: 59	
		},
		
		{
			id: "second",
			unit: "s",
			minVal: 0,
			maxVal: 59	
		},
		
		{
			id: "frame",
			unit: "fr",
			minVal: 0,
			maxVal: project.fps-1
		}
	
	
	];
	
	
	for(var i=0; i<timePickerData.length; i++){
		
		var data = timePickerData[i];
		var idString = data.id+timePickerID;
		var $label = $("<label>", {for:idString});
		$label.html(data.unit);
		
		var $select = $("<select>", {name:idString, id:idString, "data-iconpos": "none"});
		for(var j=data.minVal; j<=data.maxVal; j++){
			
			var $option = $("<option>", {value: j});
			var leadingZero = j < 10 ? "0" : "";
			$option.html(leadingZero + j + " " + data.unit);
			$select.append($option);
			
		}
		$(target).append($label);
		$(target).append($select);
		$select.selectmenu();
	}
	//$(target).controlgroup();
	//$(target).selectmenu("refresh");
    
	//timePickerID++;
	
	this.time = function(){
		
		$selects = $(this.target + " select");
		
		var timeArray = [];
		
		$.each($selects, function(index, element){
		
			timeArray.push( $(element).val() );
		
		});
		
		return this.project.timeArrayToSeconds(timeArray);
		
	}
	
	this.update = function(curHitPoint){
		
		
		$selects = $(this.target + " select");
		
		hourElement = $selects.get(0);
		minuteElement = $selects.get(1);
		secondElement = $selects.get(2);
		frElement = $selects.get(3);
		
		
		
		// adjust number of frames
		$(frElement).html("");
		
		for(var j=0; j<this.project.fps; j++){
			
			var $option = $("<option>", {value: j});
			var leadingZero = j < 10 ? "0" : "";
			$option.html(leadingZero + j + " fr");
			$(frElement).append($option);
			
		}
		

		// update values
		var timeArray = curHitPoint.timeArray();
		$(frElement).val(timeArray.pop());
		$(secondElement).val(timeArray.pop());
		$(minuteElement).val(timeArray.pop());
		$(hourElement).val(timeArray.pop());
		$selects.selectmenu("refresh");
		
	}
}
