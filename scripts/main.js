/**
 * 
 */
var obSettings = new Settings();
SQRT2 = 1.5//Math.sqrt(2);
RIGHT_MOUSE = 2

 window.onload = function() {   
 //initialise onscreen elements
    var obMap = new Map();
    var obAlgos = new Algos(obMap.model);
    
	var filebtn = document.getElementById('btnFile');
    var slider = document.getElementById('rngSlider');
    var resetbtn = document.getElementById('btnReset');
    var startbtn = document.getElementById('btnStart');
    var goalbtn = document.getElementById('btnGoal');
    var waybtn = document.getElementById('btnWay');
    var groundbtn = document.getElementById('btnGround');
    var waterbtn = document.getElementById('btnWater');
    var treebtn = document.getElementById('btnTree');
    var swampbtn = document.getElementById('btnSwamp');
    var oobbtn = document.getElementById('btnOob');
    var mapbtn = document.getElementById('btnMap');
    var searchbtn = document.getElementById('btnSearch');
    var stopbtn = document.getElementById('btnStop');
    var savebtn = document.getElementById('btnSave');
    var toplayer = document.getElementById('cvsLayer4');
    var stickybtn = document.getElementById('stickybtns');
    var agentmenu = document.getElementById("mnuAgents");
    var agentform = document.getElementById("frmAgents");
    var configbtn = document.getElementById("btnConfig");
    var cancelbtn = document.getElementById("frmCancel");
    var submitbtn = document.getElementById("frmSubmit");
    var clearbtn = document.getElementById("btnClear");
    var drawbtn = document.getElementById("btnDraw");
    var deltabtn = document.getElementById("btnDelta");
    var shownextbtn = document.getElementById("btnNext");
    var showprevbtn = document.getElementById("btnPrev");
    
    //var obSettings.searchagent = null;
    var algos = obAlgos.register();
    
    //initialise dynamic interface elements
    var htmlstr = "";
    var htmlstr2 = "";
    for(var i=0; i<algos.length; i++){
        htmlstr+= "<li><a href='#'>"+ algos[i] + "</a></li>";
        htmlstr2 += "<option value='"+ algos[i] + "'>" + algos[i] + "</option>\n";
    }
    agentmenu.innerHTML = htmlstr;
    agentform.innerHTML = htmlstr2;
    
    resetSlider();
    
    //**********************************
    function statusText(txtstr, right){
        //write to status bar
        var status = document.getElementById('cvsStatus');
        var statusctx = status.getContext("2d");
        var width = Math.floor(status.width/2);
        statusctx.font = "12px Arial";
        if(right){
           // get pixel width of text to right-justify
            var strlength = statusctx.measureText(txtstr).width;
            statusctx.clearRect(width,0, width, status.height);
            statusctx.fillText(txtstr, status.width-strlength, 15);
        }else{
            statusctx.clearRect(0,0, width, status.height);
            statusctx.fillText(txtstr, 5, 15);
        }
    }
    
    function clearStatus(){
        var status = document.getElementById('cvsStatus');
        var statusctx = status.getContext("2d");
        statusctx.clearRect(0,0, status.width, status.height);
    }

    function getMouseCoord(e){
        //return coord object based on mouse event - relative to top layer (i.e. unzoomed zeroed canvas)
        var rect = toplayer.getBoundingClientRect();
        return new Coord(Math.floor(e.clientX - rect.left), Math.floor(e.clientY - rect.top));
    }
    
    function resetSlider(){
        while (slider.value>1){
            slider.stepDown();
        }
    }
    
    function cleanUp(){
        obAlgos.reset();
        obMap.reposition();
        clearStatus();
        document.getElementById("imgPlay").src="images/play.gif";
        var nodes = Array.prototype.slice.call(stickybtn.childNodes);
        for (var i=0; i< nodes.length; i++){
            nodes[i].className = "unstuck";
        }
        drawbtn.className = "unstuck";
        document.getElementById("stepbox").style.visibility = "hidden";
        obMap.waylyr.style.visibility = "visible";
    }
   
    function parseCoords(astring){
        /*astring is a string in the format "(12,14)(24,15)..."
        returns array of Coord objects.*/
        astring = astring.trim();
        var pair;
        var coords = [];
        var stripped = astring.slice(1,astring.length-1);
        var anarray = stripped.split(")(");
        if(anarray!="")
            for(var i=0; i<anarray.length; i++){
                pair = anarray[i].split(",");
                coords.push(new Coord(parseInt(pair[0]),parseInt(pair[1])));
            }
        return coords;
    }
    
    function setAgent(agentstr){
        var success = false;
        for(var i = 0;i<algos.length;i++){
            if(agentstr==algos[i]){
                obSettings.agentstr = agentstr;
                obSettings.searchagent = obAlgos[agentstr];
                success = true;
                break;
            }
        }
        if(success){
            statusText(obSettings.agentstr + " selected.");
        }else{
            statusText("Agent not found.");
        }
    };
    
    function setStart(modelcoord){
        var goodcoord = obMap.model.locateTraversible(modelcoord);
        obSettings.start = goodcoord;
        obSettings.current = goodcoord;
        obMap.setStart(goodcoord);
    }
    
    function setGoal(modelcoord){
        var goodcoord = obMap.model.locateTraversible(modelcoord);
        obSettings.goals.push(goodcoord);
        obMap.setGoal(goodcoord);
    }
    
    function setWay(modelcoord){
        var goodcoord = obMap.model.locateTraversible(modelcoord);
        obSettings.waypoints.push(goodcoord);
        obMap.setWay(goodcoord);
    }
    
    function generateObPath(){
        obPath = new Path(obMap.model, obSettings.start, obSettings.waypoints, obSettings.goals);
    }
    
    function drawPath(){
        statusText("Completing path...", true)
        obMap.clearLayer(obMap.pathlyr);    
        obMap.waylyr.style.visibility = "hidden";
        obPath = new Path(obMap.model, obSettings.start, obSettings.waypoints, obSettings.goals);
        obSettings.path = obPath.getPath();
        obMap.plotPoints(obMap.pathlyr, obSettings.path, PATH);
    }
    

//***     EVENT LISTENERS     ***

/*next and prev buttons only available after right-clicking path built path*/
    shownextbtn.addEventListener('click', function(e){
        var oldstep = obSettings.currentStep;
        if((obSettings.currentStep + 1) < obSettings.path.length){
            obSettings.currentStep++;
        }
        showStepDetails(obSettings.currentStep);
        obMap.highlightPath(obSettings.obSteps[oldstep].coord, obSettings.obSteps[obSettings.currentStep].coord);
    });
    
    showprevbtn.addEventListener('click', function(e){
        var oldstep = obSettings.currentStep;
        if(obSettings.currentStep){
            obSettings.currentStep--;
        }
        showStepDetails(obSettings.currentStep);
        obMap.highlightPath(obSettings.obSteps[oldstep].coord, obSettings.obSteps[obSettings.currentStep].coord);
    });
    
	filebtn.addEventListener('change', function(e) {
        //file button is hidden by css, but this event is called when Load Map... is clicked
    	var mappat = /.*\.map$/;     //regex for .map extension
        var typestring = "type octile"; //identifies movingai map type
		var file = filebtn.files[0];
        
        if (file.name.match(mappat)){
			var reader = new FileReader();
			reader.onload = function(e) {
                if (reader.result.substring(0,typestring.length)==typestring){
                    obMap.buildMap(reader.result);
                    obSettings.reset();
                    resetSlider();
                    clearStatus();
                    obAlgos.reset();
                    document.getElementById("imgPlay").src="images/play.gif";
                }else{
                    statusText("Badly formed .map file!", false);
                }
			}
			reader.readAsText(file);
            obSettings.mapname = file.name;
            statusText("Loaded " + obSettings.mapname, false);
		} else {
            statusText("File type not supported!", false);
		}
	});
    
    slider.addEventListener('change',function(e) {
        var oldzoom = obSettings.zoomfactor;
        var newzoom = slider.value;
        var oldorigin = obSettings.origin;
        var screencentre = new Coord(256,256);
        var scalechange = newzoom - oldzoom;
        var centrepoint = obMap.model.getMapPos(screencentre);

        obSettings.origin.x = oldorigin.x - scalechange*centrepoint.x;
        obSettings.origin.y = oldorigin.y - scalechange*centrepoint.y;
        
        obSettings.zoomfactor = newzoom;
        obMap.reposition();
    });
    
    agentmenu.addEventListener('click',function(e){
        var agentstr = e.target.innerHTML;
        setAgent(agentstr);
    });
    
    cancelbtn.addEventListener('click',function(e){
        //hides config form without doing anything
        document.getElementById('overlay').style.visibility = 'hidden';
    });
    
    submitbtn.addEventListener('click',function(e){
        //processes config form
        var radiobuttons, setting, coords;
        setAgent(document.getElementById('frmAgents').value);
        coords = document.getElementById('frmStart').value;
        if(coords){
            setting = parseCoords(coords);
            setStart(setting[0]);
        }else{
            obSettings.start = null;
            obMap.clearLayer(obMap.startlyr);
        }
        coords = document.getElementById('frmWay').value;
        if(coords){
            setting = parseCoords(coords);
            obSettings.waypoints.length = 0;
            obMap.clearLayer(obMap.waylyr);
            for(var i = 0;i<setting.length;i++){
                setWay(setting[i]);
            }
        }else{
            obSettings.waypoints = [];
            obMap.clearLayer(obMap.waylyr);
        }
        
        coords = document.getElementById('frmGoals').value;
        if(coords){
            setting = parseCoords(coords);
            obSettings.goals.length = 0;
            obMap.clearLayer(obMap.goallyr);
            for(var i = 0;i<setting.length;i++){
                setGoal(setting[i]);
            }
        }else{
            obSettings.goals = [];
            obMap.clearLayer(obMap.goallyr);    
        }
        obSettings.speed = document.getElementById('frmSpeed').value;
        obSettings.deadline = document.getElementById('frmDeadline').value;
        radiobuttons = document.getElementsByName('frmCut');
            but = radiobuttons[0]
            if(but.checked){
                obSettings.cutcorners = Boolean(but.value);
            }else{
                obSettings.cutcorners = !Boolean(but.value);
            }
        radiobuttons = document.getElementsByName('frmDiag');
            but = radiobuttons[0]
            if(but.checked){
                obSettings.diagonals = Boolean(but.value);
            }else{
                obSettings.diagonals = !Boolean(but.value);
            }
        radiobuttons = document.getElementsByName('frmStrict');
            but = radiobuttons[0]
            if(but.checked){
                obSettings.strict = Boolean(but.value);
            }else{
                obSettings.strict = !Boolean(but.value);
            }
        obSettings.costs['G'] = document.getElementById('frmG').value;
        obSettings.costs['T'] = document.getElementById('frmT').value;
        obSettings.costs['W'] = document.getElementById('frmW').value;
        obSettings.costs['S'] = document.getElementById('frmS').value;
        document.getElementById('overlay').style.visibility = 'hidden';
    });
    
    configbtn.addEventListener('click',function(e){
        //displays config form - populated with current settings
        var arraylength = 0;
        var htmlstr = "";
        document.getElementById('frmAgents').value = obSettings.agentstr;
        document.getElementById('frmMapName').innerHTML = obSettings.mapname;
        if(obSettings.start != null)
            document.getElementById('frmStart').value = obSettings.start.toString();
        else
            document.getElementById('frmStart').value = "";
            
        arraylength = obSettings.waypoints.length;
        if(arraylength)
            htmlstr = "";
            for(var i = 0; i<arraylength; i++){
                htmlstr += obSettings.waypoints[i].toString();
            }
        document.getElementById('frmWay').value = htmlstr;
        htmlstr="";
        arraylength = obSettings.goals.length;
        if(arraylength){
            htmlstr = "";
            for(var i = 0; i<arraylength; i++){
                htmlstr += obSettings.goals[i].toString();
            }
        }
        document.getElementById('frmGoals').value = htmlstr;
        
        document.getElementById('frmSpeed').value = obSettings.speed;
        document.getElementById('frmDeadline').value = obSettings.deadline;
        
        var selstr = "frmCut_" + obSettings.cutcorners.toString();
        document.getElementById(selstr).checked = true;
        selstr = "frmDiag_" + obSettings.diagonals.toString();
        document.getElementById(selstr).checked = true;
        selstr = "frmStrict_" + obSettings.strict.toString();
        document.getElementById(selstr).checked = true;

        document.getElementById('frmG').value = obSettings.costs['G'];
        document.getElementById('frmT').value = obSettings.costs['T'];
        document.getElementById('frmW').value = obSettings.costs['W'];
        document.getElementById('frmS').value = obSettings.costs['S'];
        
        document.getElementById('overlay').style.visibility = 'visible';
    });
    
    resetbtn.addEventListener('click',function(e) {
        obSettings.partialReset();
        cleanUp();
    });
    
    clearbtn.addEventListener('click',function(e) {
        obSettings.reset();
        resetSlider();
        cleanUp();
        obMap.clearLayers();
    });
    
    startbtn.addEventListener('click',function(e) {
    //set start location. toggle mode
        if(obSettings.mode == 1){
            obSettings.mode = 0;
        }else{ 
            obSettings.mode = 1;
        }
    });
    
    goalbtn.addEventListener('click',function(e) {
    //set goal location. toggle mode
        if(obSettings.mode == 2){
            obSettings.mode = 0;
        }else{ 
            obSettings.mode = 2;
        }
    });
    
    waybtn.addEventListener('click',function(e) {
    //set goal location. toggle mode
        if(obSettings.mode == 11){
            obSettings.mode = 0;
        }else{ 
            obSettings.mode = 11;
        }
    });
    
    searchbtn.addEventListener('click',function(e){
        if(obSettings.start==null || typeof(obSettings.goals[0]) == "undefined"){
            statusText("Missing start or goal!", false);
            return;
        }else if(obSettings.searchagent == null){
            statusText("No search agent selected!", false);
            return;
        }
        //toggle search/pause: searchstate 1 = searching, 2 = paused, 3 = stopped, 4 = goal found.
        if(obSettings.searchstate == 1){    //already searching, so pause
            clearInterval(obSettings.intervalid);
            obSettings.searchstate = 2;
            document.getElementById("imgPlay").src="images/play.gif";
            statusText("Paused.", true);
        }else{  //not started or paused, so start
            if(obSettings.searchstate == 0 || obSettings.searchstate ==2){
                obSettings.searchstate = 1;
                document.getElementById("imgPlay").src="images/pause.gif";
                //*** PLAY (SEARCH) FUNCTION ***
                obSettings.intervalid = setInterval(function(){ 
                    var multiplier, searchgoals;
                    var wp = false;
                    var current = obSettings.current; //retrieve saved coord
                    var currentgoal = obSettings.getCurrentWp();
                    if(currentgoal!==null){
                        searchgoals = [currentgoal];
                        wp = true;
                    }else{
                        searchgoals = obSettings.goals;
                    }
                    
                    try{
                        obSettings.current = obSettings.searchagent(current, searchgoals);
                        
                        if(!obSettings.current){
                            alert("current: "+ current+ ", goal: "+searchgoals[0]);
                        throw "Path not found.";//agent returned null
                        }
                        obSettings.path.push(obSettings.current);
                        if(!(obMap.model.isStraight(current, obSettings.current))){
                            multiplier = SQRT2;
                        }else{  
                            multiplier = 1;
                        }
                        obSettings.cost += (obMap.model.getCost(obSettings.current) * multiplier);
                        obSettings.steps++;
                        obMap.plot(obMap.pathlyr, obSettings.current, PATH);
                        var numgoals = searchgoals.length;
                        for(var i=0; i<numgoals; i++){
                            if(obSettings.current.equals(searchgoals[i])){
                                if(!wp){
                                    obSettings.searchstate = 4;    //goal found
                                    clearInterval(obSettings.intervalid);
                                    statusText("Arrived!", true);
                                    statusText("Total steps: " + obSettings.steps + " | Total Cost: " + obSettings.cost, false);
                                }else{
                                    obSettings.currentwp++;
                                    obAlgos.reset();
                                }
                            }
                        }
                        if(obSettings.searchstate !=4){
                            statusText("Searching. "+ obSettings.current.toString(), true);
                            statusText("Steps: " + obSettings.steps + " | Cost: " + obSettings.cost, false); 
                        }
                    }
                    catch(err){
                        stopbtn.click();
                        statusText(err, false);
                    }
                },obSettings.speed);
                //*** END PLAY ***   
            }
        }
    });
    
    stopbtn.addEventListener('click',function(e){
        if(obSettings.searchstate == 1 || obSettings.searchstate == 2){
            obSettings.searchstate = 3;
            statusText("Stopped.", true);
            statusText("Total steps: " + obSettings.steps + " | Total Cost: " + obSettings.cost, false);
            clearInterval(obSettings.intervalid);
        }
    });
    
    mapbtn.addEventListener('click',function(e) {
        //hand off to hidden file button event
        filebtn.click();
    });
    
    savebtn.addEventListener('click',function(e) {
        var mapstring = obMap.getMovingAI();
        var blob = new Blob([mapstring], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "a1.map");
    });
    
    stickybtn.addEventListener('click',function(e) {
    //toggle mode for all sticky map modification buttons
        if (e.target !== e.currentTarget){ 
            var stickybuttons = ["btnGround","btnWater","btnSwamp","btnTree","btnOob"];
            if(obSettings.mode > 0){
                var newmode = stickybuttons.indexOf(e.target.id) + 4;
                if(newmode == obSettings.mode){
                    obSettings.mode = 0;
                    e.target.className = "unstuck";
                }else{
                    //convert childnodes to ordinary array so can iterate through
                    var nodes = Array.prototype.slice.call(e.currentTarget.childNodes);
                    for (var i=0; i< nodes.length; i++){
                        nodes[i].className = "unstuck";
                    }
                    e.target.className = "sticky";
                    obSettings.mode = newmode;
                }
            }else{ 
                obSettings.mode = stickybuttons.indexOf(e.target.id) + 4;
                e.target.className = "sticky";
            }
        }
    });
    
    drawbtn.addEventListener('click',function(e) {
        if(obSettings.mode == 0) {
            obSettings.mode = 10;
            drawbtn.className = "sticky";
        }else{
            obSettings.mode = 0;
            drawbtn.className = "unstuck";
        }
    });
    
    deltabtn.addEventListener('click',function(e){
        if(typeof obSettings.path[0] !== 'undefined')
            generateObPath();
    });
    
    //*** MAP EVENTS ***//
    toplayer.oncontextmenu = function (e) { //inhibit right-click menu on map
        e.preventDefault();
    };
    
    toplayer.addEventListener('mousedown', function(e){
        var coord = getMouseCoord(e);//screen coord
        if(e.button == RIGHT_MOUSE){
            //check for path - if exists, find step number
            if(obSettings.path[0]){
                var pos = obMap.model.getMapPos(coord);
                for(var i = 0; i< obSettings.path.length; i++){
                    if(pos.equals(obSettings.path[i])){
                        obSettings.currentStep = i;
                        showStepDetails(i);
                        break;
                    }
                }
            }
        }else{
            obSettings.mousedown = true;
            switch(obSettings.mode){
                case 1:     //setting start
                    break;
                case 2:      //setting goal
                    break;
                case 11:      //setting waypoint
                    break;
                case 0:    //dragging mouse, so set start pos
                    obSettings.mode = 3;
                    obSettings.dragstart = coord;//screen coord      
                    break;
                case 10:    //draw mode
                    if(obSettings.path[0]) {
                        statusText("Path already drawn. Reset to continue.");
                        obSettings.mode = 0;
                        drawbtn.className = "unstuck";
                    }else{
                        var plotpos = obMap.model.getMapPos(coord);
                        obSettings.waypoints[obSettings.steps++]=plotpos;
                        obMap.plot(obMap.waylyr, plotpos, PATH);
                    }
                    break;
                default:
                    obSettings.dragstart = coord;//screen coord      
                    break;
            }
        }
    });
    
    
    toplayer.addEventListener('mousemove', function(e){
        //TODO: if mousedown, show map while it's moving or marquee if 3<mode<10
        if(obSettings.searchstate != 1){        
            var coord = obMap.model.getMapPos(getMouseCoord(e));//real/model coord
            if(obMap.model.isOnMap(coord)){
                var message = coord.toString();
                statusText(message, true);
            }
            switch(obSettings.mode){
                case 10:
                    if(obSettings.mousedown){
                        obSettings.waypoints[obSettings.steps++]=coord;
                        obMap.plot(obMap.waylyr, coord, PATH);
                    }
                    break;
            }
        }
    });
    
    toplayer.addEventListener('mouseout', function(e){
        if(obSettings.searchstate != 1){
            var searchstates = ["","Searching.","Paused.","Stopped.", "Arrived!"];
            statusText(searchstates[obSettings.searchstate],true);
        }
    });
    
    toplayer.addEventListener('mouseup', function(e){
        var coord = getMouseCoord(e);//screen coord
        var modelcoord = obMap.model.getMapPos(coord);//real/model coord
        if(obSettings.mousedown){
            switch(obSettings.mode){
                case 3: //pan
                    var oldcoord = obSettings.dragstart;
                    //toplayer screen coord offsets - i.e. how far it's moved. n.b. origin starts at and resets to 0,0.
                    obSettings.origin.x = obSettings.origin.x + coord.x - oldcoord.x;
                    obSettings.origin.y = obSettings.origin.y + coord.y - oldcoord.y;    
                    obMap.reposition(); //based on origin and zoomfactor
                    break;
                case 1: //set start
                    setStart(modelcoord);
                    break;
                case 2: //set goal
                    setGoal(modelcoord);
                    break;
                case 11: //set goal
                    setWay(modelcoord);
                    break;
                case 10: //draw
                    drawPath();
                    obSettings.mode = 0;
                    drawbtn.className = "unstuck";
                    break;
                default:
                    obSettings.dragstop = coord;          
                    obMap.modifyTerrain(obSettings.mode);
                    
                    var nodes = Array.prototype.slice.call(document.getElementById("stickybtns").childNodes);
                    for (var i=0; i< nodes.length; i++){
                        nodes[i].className = "unstuck";
                    }
                    obSettings.mode = 0;
                    break;
            }
            obSettings.mousedown = false;
            obSettings.mode = 0;
        }
    });
    
}

