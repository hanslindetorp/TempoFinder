/*
	
	Att göra:
	Sortera hitpoints efter tidskod när man ändrar
	Ändra så att beatet visas i förhållande till hitpoint
	
	Sent beat hamnar till höger om mitten (tvärt om mot nu)
	
	
	*/

var projectID = 0;
var mxOffsetFrames = 3;

var acceptableRange = {};
acceptableRange.beforeFrames = -2;
acceptableRange.afterFrames = 3;
acceptableRange.before = acceptableRange.beforeFrames/25;
acceptableRange.after = acceptableRange.afterFrames/25;
acceptableRange.outBeforeFrames = -5;
acceptableRange.outAfterFrames = 6;
acceptableRange.outBefore = acceptableRange.outBeforeFrames/25;
acceptableRange.outAfter = acceptableRange.outAfterFrames/25;



FLOOR = "floor";
ROUND = "round";
CEIL = "ceil";

function Project(data){
	
	
	var self = this;
	
	var hitPointID = 0;
	
	function HitPoint(data){
		
		if(data){
			for(var j in data) this[j]=data[j];
			
			
		} else if(self.hitPoints.length){
			
			// create new from template
			var lastHitPoint = self.hitPoints[self.hitPoints.length-1];
			
			this.name = getIncrementedName(lastHitPoint.name);
			this.time = lastHitPoint.time + 2;
			this.important = lastHitPoint.important;
			this.allowSubBeat = lastHitPoint.allowSubBeat;
			
		} else {
		
			// create from default values
			this.name = "Hit 1";
			this.time = 0;
			this.important = true;
			this.allowSubBeat = false;
		}
		
		hitPointID++;
		
		
		this.timeString = function(){
			
			return self.secondsToTimeString(this.time);
			
		}
		
		
		this.timeArray = function(){
			
			return self.secondsToTimeArray(this.time);
		}
		
	}
	
	this.newHitPoint = function(data){
		return new HitPoint(data);
	}
	
	this.addHitPoint = function(data){
		this.hitPoints.push( new HitPoint(data) );
	}

	
	this.update = function(data){
		
		for(var i in data) this[i]=data[i];
		
		this.initTempo = self.getInitTempo();
		this.stopTempo = self.getStopTempo();
		this.lastUpdated = new Date().getTime();
	}
	
	
	
	
	this.secondsToTimeString = function(seconds){
    
    
	    var FF = Math.floor(seconds * this.fps) % this.fps;
	    var SS = Math.floor(seconds) % 60;
	    var MM = Math.floor(seconds / 60) % 60;
	    var HH = Math.floor(seconds / (60 * 60));
	    
	    FF = (FF < 10 ? "0": "") + FF;
	    SS = (SS < 10 ? "0": "") + SS;
	    MM = (MM < 10 ? "0": "") + MM;
	    HH = (FF < 10 ? "0": "") + HH;
	    
	    var timeString = HH + ":" + MM + ":" + SS + ";" + FF;
	    
	    return timeString;
	    
	}
	
	
	
	
	this.secondsToTimeArray = function(seconds){
	    
	    var FF = Math.floor(seconds * this.fps) % this.fps;
	    var SS = Math.floor(seconds) % 60;
	    var MM = Math.floor(seconds / 60) % 60;
	    var HH = Math.floor(seconds / (60 * 60));
	    
	    return [HH,MM,SS,FF];
	    
	}
	
	this.timeArrayToSeconds = function(timeArray){
		
	    var FF = parseInt(timeArray.pop());
	    var SS = parseInt(timeArray.pop());
	    var MM = parseInt(timeArray.pop());
	    var HH = parseInt(timeArray.pop());
		
		var seconds = HH * 60 * 60 + MM * 60 + SS + FF / self.fps;
		
		return seconds;
	}
	
	
	this.tempoToMatch = function(targetTempo){
		
		if(!this.matches){return};
		
		var targetMatch;
		this.allMatches.forEach(function(curMatch, index){
			
			if(curMatch.tempo == targetTempo){
				targetMatch = curMatch;
			}
			return false
			
		});
		return targetMatch;
	}
	
	this.updateMatches = function(){
		
		var matches = [];
		
		// loop through possible tempos
		
		// allow music start offset
		var mxOffs = mxOffsetFrames / this.fps;
		var musicStartMin = this.musicStart - mxOffs;
		var musicStartMax = musicStartMin + mxOffs;
		var frameLength = 1 / this.fps;
		var nrOfImportantHPs = this.importantHitPoints().length;

		
		for(var curTempo = this.initTempo; curTempo < this.stopTempo; curTempo += this.stepFactor){
			

			//console.log("curTempo = " + curTempo);			
			var roundedTempo = Math.round(curTempo * this.stepNr) / this.stepNr;
			
			
			//for(var f = -mxOffsetFrames; f<=mxOffsetFrames; f++){
			//for(var mxTime = musicStartMin; mxTime<musicStartMax; mxTime+=frameLength){
						
						
				var mxTime = this.musicStart; // + f / this.fps;
										
				var curMatch = {};
				
				if(mxTime == this.musicStart){
				
					//console.log("curTempo = " + roundedTempo);
					
					if(roundedTempo == this.tempo){
					
						//console.log("mxTime = " + mxTime + ", curTempo = " + roundedTempo);
					
					}
					
				}
				
				//console.log("mxTime = " + mxTime + ", curTempo = " + curTempo);			
				curMatch.tempo = roundedTempo;
				var beatLength = 60 / roundedTempo;
				var beatFactor = 1 / beatLength;

				curMatch.hitPoints = [];
				curMatch.totalDiff = 0;
				curMatch.minDiff = 1000;
				curMatch.maxDiff = 0;
				curMatch.totalErrorFrames = 0;
				
				curMatch.ranges = {};
				curMatch.ranges.IN = [];
				curMatch.ranges.BETWEEN = [];
				curMatch.ranges.OUT = [];
				

				curMatch.mxOffsTime = mxTime - this.musicStart;
				curMatch.mxOffsFrames = decimals(curMatch.mxOffsTime * this.fps, 1, ROUND);
				//curMatch.mxOffsFrames = Math.round(curMatch.mxOffsTime * this.fps * 10) / 10;
				
				
				
				for(var i = 0; i<this.hitPoints.length; i++){
					
					var curHitPoint = this.hitPoints[i];
					var matchHitPoint = {};
					matchHitPoint.important = curHitPoint.important;
					
					matchHitPoint.name = curHitPoint.name;
					matchHitPoint.beat = Math.round((curHitPoint.time - mxTime) / beatLength) + 1;
					
					
					// add code for subBeat
					
					
					var musicTime = curHitPoint.time - mxTime;
					
					// find the miss match
					var beat = Math.round(musicTime / beatLength);
					var idealTime = beat * beatLength;
					matchHitPoint.timeDiff = musicTime - idealTime;
					
					
					matchHitPoint.diffInFrames = matchHitPoint.timeDiff * this.fps;
					matchHitPoint.absDiffFrames = Math.abs(matchHitPoint.diffInFrames);
					matchHitPoint.absDiff = Math.abs(matchHitPoint.timeDiff);
					
					curMatch.minDiff = Math.min(curMatch.minDiff, matchHitPoint.absDiff);
					curMatch.maxDiff = Math.max(curMatch.maxDiff, matchHitPoint.absDiff);
					
					
					if(curHitPoint.important){
						
							
						curMatch.totalDiff += matchHitPoint.absDiffFrames;
						
						// add to quality category
						if(matchHitPoint.timeDiff < 0){
							
							// before beat
							if(matchHitPoint.timeDiff > acceptableRange.before){
								
								curMatch.ranges.IN.push(matchHitPoint);
							} else {
								
								if(matchHitPoint.timeDiff > acceptableRange.outBefore){
									curMatch.ranges.BETWEEN.push(matchHitPoint);
								} else {
									curMatch.ranges.OUT.push(matchHitPoint);
								}
								
								curMatch.totalErrorFrames += matchHitPoint.absDiffFrames;
								
							}
						} else {
							
							// after beat
							if(matchHitPoint.timeDiff < acceptableRange.after){
								
								curMatch.ranges.IN.push(matchHitPoint);
							} else {
								
								if(matchHitPoint.timeDiff < acceptableRange.outAfter){
									curMatch.ranges.BETWEEN.push(matchHitPoint);
								} else {
									curMatch.ranges.OUT.push(matchHitPoint);
								}
								curMatch.totalErrorFrames += matchHitPoint.absDiffFrames;
				
							}
						}
						
					}
						
						
					curMatch.hitPoints.push(matchHitPoint);
					
				}
				
				
			//}
			
			curMatch.avgDiff = decimals(curMatch.totalDiff / nrOfImportantHPs, 1, ROUND);
			matches.push(curMatch);
			
		}
		
		
		// sort in quality order
		matches.sort(function(a,b){
			
			if(a.tempo == self.tempo){
				//console.log(a);
			}
			
			if(a.ranges.IN.length > b.ranges.IN.length){
			
				// more matched hitpoints
				return -1;
			} else if(a.ranges.IN.length < b.ranges.IN.length){
				
				// less matches hitpoints
				return 1;
			} else {
				
				// same number of matched hitpoints
				// compare totalErrorFrames
				var tempoDiffA = Math.abs(self.tempo - a.tempo);
				var tempoDiffB = Math.abs(self.tempo - b.tempo);
				
				
				// prioritice the nearest tempo if tempo difference is more than 1% of ideal tempo
				if(Math.abs(tempoDiffA - tempoDiffB) / self.tempo > 0.02){
					return tempoDiffA < tempoDiffB ? -1 : 1;
				}
				
				// else look at totalErrorFrames
				return a.totalDiff < b.totalDiff ? -1 : 1;
			}
		});
		this.allMatches = matches;
		
		
		// filter the best matches with noticable tempo difference
		matches = this.filterMatches(matches);
		this.bestMatch = matches[0];
		
		// sort in tempo order
		matches.sort(function(a,b){
			
			return a.tempo < b.tempo ? -1 : 1;
			
		});
		
		this.matches = matches;
		
		selectedMatch = 0;
		return matches;
		
	}
	
	
	this.filterMatches = function(matches, max){
		
		var filteredMatches = [];
		var lastMatch = 0;
		var lastFilteredMatch = 0;
		max = max || 5;
		
		matches.forEach(function(curMatch){
			
			if(filteredMatches.length < max)
			
			if(lastMatch == 0 || (self.matchDiffersFromMatches(curMatch, filteredMatches, 0.02) && curMatch.tempo - lastMatch.tempo > 0.1 )){
				
				curMatch.qualityIndex = filteredMatches.length;
				filteredMatches.push(curMatch);
				lastFilteredMatch = curMatch;
				
			}
			
			lastMatch = curMatch;
			
		});
		
		return filteredMatches;
	}
	
	this.matchDiffersFromMatches = function(targetMatch, matches, amount){
		
		
		var diff = true;
		matches.forEach(function(curMatch){
			
			if(Math.abs(curMatch.tempo - targetMatch.tempo) / self.tempo < amount){
				
				diff = false;
			}
			
		}); 
		
		return diff;
		
		
	}
	
	
	
	this.hitPoints = [];
	if(data){
		for(var j in data) this[j]=data[j];
		
		this.hitPoints = [];
		for(var i = 0; i<data.hitPoints.length; i++){
			
			this.addHitPoint(data.hitPoints[i]);
			
		}
		
		
		
	} else {
	
		this.id = ++projectID;
		
		this.name = "Project " + this.id;
		this.tempo = 100;
		this.fps = 25;
		this.subBeats = 2;
		this.musicStart = 0;
		
		
		this.rangeFactor = 0.3;
		this.stepFactor = 0.1;
		this.stepNr = Math.floor(1/this.stepFactor);
		this.initTempo = this.getInitTempo();
		this.stopTempo = this.getStopTempo();
		
		this.addHitPoint();
		this.lastUpdated = new Date().getTime();
		
		this.editCnt = 0;
		
	}
				
	
}

Project.prototype.importantHitPoints = function(){
		
	var importantHPs = [];
	for(var i = 0; i<this.hitPoints.length; i++){
	
		var curHitPoint = this.hitPoints[i];
		if(curHitPoint.important){importantHPs.push(curHitPoint);}
	
	}
	return importantHPs;
	
}


Project.prototype.getInitTempo = function(){
	return Math.floor(this.tempo * (1-this.rangeFactor) * this.stepNr) / this.stepNr;
	
}

Project.prototype.getStopTempo = function(){
	return this.tempo * (1+this.rangeFactor);
}

	



function getIncrementedName(oldName){
	
	var oldNameArr = oldName.split(" ");
	var nr = parseInt(oldNameArr[oldNameArr.length-1]);
	if(nr >= 0){
		oldNameArr.pop();
	} else {
		nr = 0;
	}
	return oldNameArr.join(" ") + " " + (nr+1);
}


function DataManager(){
	
	
	this.save = function(){
		
		this.sort();
		
		for(var key in this.data) {
			
			var projectData = {};
			var project = this.data[key];
			
			for(var prop in project){
				if(typeof value !== "function") projectData[prop] = project[prop];
			}
		}
		if(typeof(Storage) !== "undefined") {
		    // Code for localStorage/sessionStorage.
		    localStorage.setItem( "data", JSON.stringify(this.data) );
		} else {
		    // Sorry! No Web Storage support..
		    return;
		}
		

		//$.cookie("data", this.data, 100);
	}
	
	this.sort = function(){
	
		this.data.sort(function(a,b){
			
			return a.lastUpdated > b.lastUpdated ? -1 : 1;
			
		});
	
	}
	
	
	this.getProject = function(id){
		
		if(typeof id === "undefined"){
		
			id = this.getSelectedProjectID();
		}
		return this.data[id];
		
	}
	
	this.getLastProject = function(){
		
		if(this.data.length){
			return this.data[this.data.length-1];
		} else {
			return;
		}
	}
	
	this.getSelectedProject = function(){
		
		return this.getProject();
	}
	this.getSelectedProjectID = function(){
		
		for(var i=0; i<this.data.length; i++){
			
			if(this.data[i].selected){return i;}
		}
		
	}
	
	this.updateProject = function(data, index){
		
		var project = this.getProject(index);
		project.update(data);
		
		this.save();
	}
	
	this.addProject = function(options){
		
		this.selectProject(); // deselect
		var newProject = new Project();
		newProject.selected = true;
		this.data.push(newProject);
	}
	
	this.deleteSelectedProject = function(){
		this.data.splice(this.getSelectedProjectID(), 1);
		this.selectProject(0);
		this.save();
	}
	
	this.selectProject = function(index){
	
		
		for(var i=0; i<this.data.length; i++){
			
			this.data[i].selected = (index == i);
		}
		
		return this.data[index];
	}
	
	this.data = [];
	
	if(typeof(Storage) !== "undefined") {
	    // Code for retrieving storage
	    var data = JSON.parse( localStorage.getItem("data") );
	   
	} else {
	    // Sorry! No Web Storage support..
	    return;
	}
		
	
	//var data = $.cookie("data");
	
	this.firstRun = true;
	
	if(data != null){
		
		if(data.length){
			
			for(var i=0; i<data.length; i++){
				
				var project = new Project(data[i]);
				this.data.push(project);
				projectID = Math.max(projectID, project.id);
				
			}
			this.firstRun = false;
			
		} 
	
	}
	
	if(this.firstRun){
		this.addProject();
		this.save();
	}
		
}


// helpers


function decimals(val, n, method){
	
	n = n || 0;
	var exp = Math.pow(10, n);
	
	switch(method){
		
		case "floor":
		val = Math.floor(val * exp) / exp;
		break;
		
		case "ceil":
		val = Math.ceil(val * exp) / exp;
		break;
		
		default:
		val = Math.round(val * exp) / exp;
		break;
	}
	
	return val;
}