    var reader; //GLOBAL File Reader object for demo purpose only

    function loadFile(input) {
    	document.getElementById('ve1').setAttribute('src',input.value);
    	var URL = window.URL || window.webkitURL;
    	var file = input.value;

    	var fileURL = URL.createObjectURL(file);

    }


    /* read text input */
    function readText(filePath) {
    	document.getElementById('timeline').setAttribute('disabled','');
    	document.getElementById('timeline edited').removeAttribute('disabled');
        var output = ""; //placeholder for text output        
        reader.onload = function (e) {
            output = e.target.result;
            var lines = output.split('\n');
            readLines(lines);
        };//end onload()
        reader.readAsText(filePath.files[0]);
        return true;
    }

    function readLines(lines) {
    	var splitlines = new Array(lines.length);
    	for (var i = 0; i < lines.length; i++) {
    		var split = splitLine(lines[i]);
    		splitlines[i] = split;
    	}
    	localStorage.setItem("lines", JSON.stringify(splitlines));
		localStorage.setItem("i", 0);
		createSimplifiedTimeline(splitlines);
    }


    function createSimplifiedTimeline(lines){
    	localStorage.removeItem("edited");
    	var total = 0;
    	var atCount = 0;

    	for (var i = 0; i < lines.length; i++) {
    		console.log("i = ",i);
    		console.log("atCount = ",atCount);
    		console.log("current total ", total);
    		if(lines[i][0][0] == "title" || lines[i][0][0][0] == "load"){
    			//load or title card
    			document.getElementById("message").innerHTML = lines[i][1][0][0];
    		}
    		if (atCount == 0 && i != 0 && lines[i][0][0] == "at") {
    			console.log("this is working");
    			var start = 0;
    			var end = lines[i][1][0];
				total += parseFloat(end)-parseFloat(start);
				atCount++;
				continue;
    		}
    		if(lines[i][0][0] == "at" && atCount > 0){
    			console.log("CHECK IT ",i)
    			var start;
    			var end;
    			if (lines[i][1][0].length == 1) {
    				// If old syntax
	    			start = lines[i-1][2][0][0];
	    			end = lines[i][1][0][0];
    			}
    			if (lines[i][1][0].length == 2) {
    				// If new syntax
	    			start = lines[i-1][2][0][1];
	    			end = lines[i][1][0][1];
    			}
				total += parseFloat(end)-parseFloat(start);
				atCount++;
    		}
    		if(i == lines.length-1){
    			var start;
    			var end;
    			if (lines[i][1][0].length == 1) {
    				// If old syntax
	    			start = lines[i][2][0];
	    			end = document.getElementById('ve1').duration;
    			}
    			if (lines[i][1][0].length == 2) {
    				// If new syntax
	    			start = lines[i][2][0][1];
	    			end = document.getElementById('ve1').duration;
    			}
				total += parseFloat(end)-parseFloat(start);
				atCount++;
				continue;
    		}
    	}

    	atCount = 0;
    	console.log("lines ", lines);

    	for (var j = 0; j < lines.length; j++) {
    		console.log("i 2 ", j);
    		console.log("atCount 2 ", atCount);
    		if(atCount == 0 && lines[j][0][0][0] == "at"){
				atCount++;
				continue;
    		}
    		if(lines[j][0][0][0] == "at" && atCount > 0){
    			var start;
    			var end;
    			if (lines[j][1][0].length == 1) {
	    			start = lines[j-1][2][0];
	    			end = lines[j][1][0];
    			}
    			if (lines[j][1][0].length == 2) {
	    			start = lines[j-1][2][0][1];
	    			end = lines[j][1][0][1];
    			}
    			createClip(1,start,end,total);
				atCount++;
    		}
    		if(j == lines.length-1){
    			var start;
    			if (lines[j][1][0].length == 1) {
	    			start = lines[j][2][0];
    			}
    			end = document.getElementById('ve1').duration;
    			createClip(1,start,end,total);
    		}
			console.log("created clip:"+ j);
    	}

    	localStorage.setItem("total", total);

    	var counter = 0;
    	var refreshRate = 0.04;
    	var oneSec = ((1/total)*100)/(1/refreshRate);
        var newTime;
        var oldTime;

        calculateEditedValue(0.00,true);

    	window.setInterval(function () {
	        //check if paused
	        paused = document.getElementById("ve1").paused;
	        var vidTime = document.getElementById("ve1").currentTime;

	        value = document.getElementById('timeline edited').value;

	        oldTime = newTime;

        	newTime = calculateEditedValue(value, false);

        	var calculate = false;


	        if(parseFloat(counter).toFixed(6) != parseFloat(value).toFixed(6)){
	        	newTime = calculateEditedValue(value, total);
	        	counter = parseFloat(value);
	        	calculate = true;
	        }

	        if (newTime > oldTime+2 || newTime < oldTime-1) {
	        	document.getElementById("ve1").currentTime = newTime;
	        }

	        if (calculate) {
	        	document.getElementById("ve1").currentTime = newTime;
	        }

	        if(paused == false){
		        counter = counter + oneSec;
	        }
	        if(counter != total){
		        document.getElementById('timeline edited').value = counter;
		        var oldValue = (newTime/document.getElementById('ve1').duration)*100;
		        document.getElementById('timeline').value = oldValue;
	        }
	    }, 1000*refreshRate);
    }


    function calculateEditedValue(value, update){
		var edited = JSON.parse(localStorage.getItem('edited'));
		var total = JSON.parse(localStorage.getItem('total'));
		var value = (parseFloat(value))/100;
		var oldTotal = document.getElementById('ve1').duration;
		
		var totalCount = 0;


		// calculate place in edited video
		for (var i = 0; i < edited.length; i++) {
			var start = edited[i][0];
			var end = edited[i][1];
			var oldCount = totalCount;
			totalCount += (end-start)/total;

			if (value >= oldCount && value < totalCount) {
				var time = end-start;
				var valuePer = (value-oldCount)/(totalCount-oldCount);
				var currentTime = start+(time * valuePer);

				if(update == true){
					document.getElementById("ve1").currentTime = currentTime;
					return;
				}

				return currentTime;
			}
		}

    }


    function createClip(video, start, end, totalTime) {
    	var location = document.getElementById('placeClips');
    	var duration = end - start;
		var text = start + " to " + end;


		var edited = JSON.parse(localStorage.getItem('edited'));
		var editedText = [parseFloat(start), parseFloat(end)];
		var finalEdit;
		var editedQuestion = edited;
		if(editedQuestion == null){
			edited = [editedText];
			localStorage.setItem('edited', JSON.stringify(edited));
		}else{
			// edited = [edited];
			editedText = [editedText];
			var finalEdit = edited.concat(editedText);
			localStorage.setItem('edited', JSON.stringify(finalEdit));
		}


    	if(video == 1){
			time = (duration/totalTime)*100;
			time = Number.parseFloat(time).toFixed(2);
    	}
    	location.innerHTML = location.innerHTML+ "<div class='clip' style='width:"+time+"%;overflow:hidden;'>"+text+"</div>";

    }


	function splitLine(line) {
		var split = line.split('(');
		var subline = [split.length];
		for (var i = split.length - 1; i >= 0; i--) {
			subline[i] = split[i].split(')');
			for (var j = 0; j < subline[i].length; j++) {
				subline[i][j] = subline[i][j].split(',');
			}
		}
		return subline;
	}



	function pauseVideo(Video) {
		if (Video == 1) {
			document.getElementById('ve1').pause();
		}
		refreshTimeline();
	 	document.getElementById('togglePlay').setAttribute('onclick','playVideo(1);');
	 	document.getElementById('togglePlay').innerHTML = ">";
	}


	function playVideo(Video) {
		if (Video == 1) {
			document.getElementById('ve1').play();
		}

	 	document.getElementById('togglePlay').setAttribute('onclick','pauseVideo(1);');
	 	document.getElementById('togglePlay').innerHTML = "||";
	}


	function refreshTime(e){
		var percent = e.value;
		var newTime = document.getElementById('ve1').duration * (percent/100);

		// refreshTime
		document.getElementById('ve1').currentTime = newTime;

	}

	function refreshTimeline(){
		var totalTime = document.getElementById('ve1').duration;
		var currentTime = document.getElementById('ve1').currentTime;
		var result = (currentTime/totalTime)*100;
		document.getElementById('timeline').value = result;
	}