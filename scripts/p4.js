function Coord(x, y){
    this.x = x;
    this.y = y;
    this.equals = function(acoord){
        return ((this.x==acoord.x) && (this.y== acoord.y));
    };
    this.isAdj = function(acoord){
        return((Math.abs(acoord.x - this.x)<=1) && (Math.abs(acoord.y - this.y)<=1));
    };
    this.isStraight = function(acoord){
        return((acoord.x == this.x) || (acoord.y == this.y));
    };
    this.toString = function(){
        return "(" + this.x + "," + this.y + ")";
    }
}
    
function Model(map){
    this.map = map;//map object
    this.grid;
    this.width = map.width;
    this.height = map.height;
    
    this.setGrid = function(data){
        this.grid = data;
    };
    
    this.getMapPos = function(coord){
        //returns model coord based on screen coord
        return new Coord(Math.floor((coord.x - obSettings.origin.x)/obSettings.zoomfactor), Math.floor((coord.y - obSettings.origin.y)/obSettings.zoomfactor));
    };
    
    this.getScreenPos = function(coord){
        //returns screen coord based on model coord
        return new Coord(coord.x*obSettings.zoomfactor - obSettings.origin.x, coord.y*obSettings.zoomfactor - obSettings.origin.y);
    };
    
    this.coordToPos = function(coord){
        //string position = row * width + column 
        return coord.y * this.width + coord.x;
    };
    
    this.posToCoord = function(pos){
        var col = pos % this.width; //% = mod
        var row = Math.floor(pos/this.width);
        return new Coord(col, row);
    };
    
    this.getCost = function(coord){
        var pos = this.coordToPos(coord);
        var terrain = this.grid[pos];
        return obSettings.costs[terrain];       
    };
    
    this.locateTraversible = function(coord){
        //BFS to find closest traversible coord
        var q = [];
        var closed = [];
        var current = coord;
        var adjlist;
        var msg="";
        q.push(current);
        while (!this.isTraversible(current)){
            adjlist = this.getAdjacents(current);
            for(var i = 0; i< adjlist.length; i++){
                if (!this.containsCoord(closed,adjlist[i]) && !this.containsCoord(q,adjlist[i])){
                    q.push(adjlist[i]);
                }
            }
            closed.push(current);
            current = q.shift();
        }
        return current
    };
    
    this.containsCoord = function(alist,coord){
    /*  Checks for coord in list of coords.
        alist: list of coord objects
        coord: {x: int, y: int}
        Returns true if alist contains coord, false otherwise.
    */
        for(var i = 0; i< alist.length; i++){
            if (coord.equals(alist[i])){
                return true;
            }
        }
        return false;
    };
    
    this.isOnMap = function(coord){
        return (coord.x < this.width && coord.x >= 0 && coord.y < this.height && coord.y >= 0)
    };
    
    this.isTraversible = function(coord){
        //returns true/false based on whether terrain cost is 'infinite'
        var pos = this.coordToPos(coord);
        var terrain = this.grid[pos];
        return isFinite(obSettings.costs[terrain]);
    };

    this.isAdj = function(coord, parent){
        return(Math.abs(coord.x - parent.x)<=1 && Math.abs(coord.y - parent.y)<=1);
    };
    
    this.isStraight = function(coord, parent){
        return((coord.x - parent.x == 0) || (coord.y - parent.y == 0));
    };
    
    this.cutsCorner = function(coord, parent){
    //if either straight adjacents are blocked, return false
        var dX = parent.x - coord.x;
        var dY = parent.y - coord.y;
        return !(this.isTraversible({x:coord.x, y:coord.y + dY}) && this.isTraversible({x:coord.x + dX, y:coord.y}));
    };
    
    this.getSafeAdjacents = function(coord){
        //getsAdjacents and performs all checks
        var adjlist = (obSettings.diagonals ? this.getAdjacents(coord) : this.getStraightAdjacents(coord));
        var returnlist = [];
        for(var i=0; i<adjlist.length; i++){ 
            if(this.isOnMap(adjlist[i]) && this.isTraversible(adjlist[i]) && !(this.cutsCorner(adjlist[i],coord))){
                returnlist.push(adjlist[i]);
            }
        }
        return returnlist;
    };
    
    this.getAdjacents = function(coord){
        //returns all 8 with no checks.
        var coords = [];
        coords.push(new Coord(coord.x-1, coord.y-1));
        coords.push(new Coord(coord.x-1, coord.y));
        coords.push(new Coord(coord.x-1, coord.y+1));
        coords.push(new Coord(coord.x, coord.y-1));
        coords.push(new Coord( coord.x, coord.y+1));
        coords.push(new Coord(coord.x+1, coord.y-1));
        coords.push(new Coord(coord.x+1, coord.y));
        coords.push(new Coord(coord.x+1, coord.y+1));      
        return coords;
    };
    
    this.getStraightAdjacents = function(coord){
        //returns 4 with no checks.
        var coords = [];
        coords.push(new Coord(coord.x-1, coord.y));
        coords.push(new Coord(coord.x, coord.y-1));
        coords.push(new Coord(coord.x, coord.y+1));
        coords.push(new Coord(coord.x+1, coord.y));    
        return coords;
    };
    
}

function Map(){
//properties
    this.canvas = document.getElementById('cvsMap');
    this.ctx = this.canvas.getContext("2d");
    this.pathlyr = document.getElementById('cvsLayer3a');
    this.waylyr = document.getElementById('cvsLayer3');
    this.startlyr = document.getElementById('cvsLayer1');
    this.goallyr = document.getElementById('cvsLayer2');
    this.png = new Image();
    this.ascii = "";
    this.mapdata=this.ctx.createImageData(512,512);
    this.width = 512;
    this.height = 512;

    this.model = new Model(this);
//methods
    this.setPoint = function(imagemap, pos, colour){
        for(var i=0;i<4;i++){
            imagemap.data[pos+i]=colour[i];
        }
    };
    
    this.setPointByTerrain = function(terrain, pos){   
        switch(terrain){
        case "W":
            this.setPoint(this.mapdata, pos, WATER);
            break;
        case "S":
            this.setPoint(this.mapdata, pos, SWAMP);
            break;
        case "T":
            this.setPoint(this.mapdata, pos, TREES);
            break;
        case "@":
            this.setPoint(this.mapdata, pos, OOB);
            break;
        case "O":
            this.setPoint(this.mapdata, pos, OOB);
            break;
        default:
            this.setPoint(this.mapdata, pos, GROUND);
        }
    };
    
    this.buildDefault = function(){
        //create default map - 512 x 512, ground
        for (var i=0;i<512*512*4;i+=4){
            this.setPoint(this.mapdata, i, GROUND);
            this.ascii = this.ascii + "G";
        }
        this.ctx.putImageData(this.mapdata,0,0);
        this.png.src = this.canvas.toDataURL("image/png");
        this.model.setGrid(this.ascii);
    };
    
    this.buildMap = function(movingai){
        //Build data map from movingai format text string, then convert to image object.
        //massage text string
        this.clearLayers();
        this.ascii=movingai.replace(/[\n\r]+/g, '');
        var startpos = this.ascii.indexOf("map")+3;
        this.ascii = this.ascii.substr(startpos,this.ascii.length);
        //populate data map from text data
        for (var j=0;j<this.ascii.length;j++){
            var terrain = this.ascii.charAt(j);
            var k = j*4
            this.setPointByTerrain(terrain, k)
        }
        //write to canvas
        this.ctx.putImageData(this.mapdata,0,0);
        //convert to image object
        this.png.src = this.canvas.toDataURL("image/png");
        //update model
        this.model.setGrid(this.ascii);
        //obSettings.reset();
    };
    
    this.setStart = function(coord){
        this.clearLayer(this.startlyr);
        this.drawCircle(this.startlyr, "rgba(0,255,0,0.5)", coord.x, coord.y);
    };
    
    
    this.setGoal = function(coord){
        this.drawCircle(this.goallyr, "rgba(255,0,0,0.5)", coord.x, coord.y);
    };
    
    this.setWay = function(coord){
        this.drawCircle(this.waylyr, "rgba(255,255,51,0.5)", coord.x, coord.y);
    };
    
    this.labelGoal = function(g){
        var goalctx = this.goallyr.getContext("2d");
        goalctx.fillStyle = "DarkSlateGray";
        goalctx.font = "12px Arial";
        goalctx.fillText(g.id, g.coord.x, g.coord.y);
    };
    
    this.highlightPath = function(oldcoord, newcoord){
        this.plot(this.pathlyr, oldcoord, PATH)
        this.plot(this.pathlyr, newcoord, "red");
    };
    
    this.drawCircle = function(lyr, color, x, y){
        var lyrctx = lyr.getContext("2d");
        lyrctx.setTransform(obSettings.zoomfactor,0,0,obSettings.zoomfactor,obSettings.origin.x,obSettings.origin.y);
        lyr.style.display = 'initial';       
        lyrctx.globalAlpha=0.7;
        lyrctx.strokeStyle = color;
        lyrctx.fillRect(x,y, 1, 1);
        lyrctx.lineWidth = 5;
        lyrctx.beginPath();
        lyrctx.arc(x, y, 5, 0, Math.PI*2); 
        lyrctx.stroke();
    };
    
    this.plot = function(lyr, coord, color){
        var lyrctx = lyr.getContext("2d");
        lyrctx.setTransform(obSettings.zoomfactor,0,0,obSettings.zoomfactor,obSettings.origin.x,obSettings.origin.y);
        lyr.style.display = 'initial';       
        //plot point
        lyrctx.fillStyle=color;
        lyrctx.fillRect(coord.x, coord.y, 1, 1);
    };

    this.plotPoints = function(lyr,pointlist, color){
        var arraylength = pointlist.length;
        for(var i=0;i<arraylength; i++){
            this.plot(lyr,pointlist[i], color);
        }
    };
    
    this.colorToRgba = function(color){
        //color must be one of color constants
        return "rgba(" + color[0] + "," +
            color[1] + "," + color[2] + "," + 
            color[3] + ")";
    };
    
    this.modifyTerrain = function(mode){
        //get real start/stop positions
        var start = this.model.getMapPos(obSettings.dragstart);
        var end = this.model.getMapPos(obSettings.dragstop);
        var character = ['G','W','S','T','@'][mode-4];
        //modify model
        var startx = Math.min(start.x,end.x);
        var endx = Math.max(start.x, end.x);
        var starty = Math.min(start.y, end.y);
        var endy = Math.max(start.y, end.y);
        var coord; var pos;
        for (var y = starty; y<endy; y++){
            for(var x = startx; x<endx; x++){  
                coord = new Coord(x, y);
                pos = this.model.coordToPos(coord); 
                this.ascii=this.ascii.substr(0,pos)+character+
                    this.ascii.substr(pos+1);
                this.setPointByTerrain(character, pos*4);
            }
        }
        
        this.ctx.putImageData(this.mapdata, 0,0);       
        this.png.src = this.canvas.toDataURL("image/png");
        this.model.setGrid(this.ascii);
    };
        
    this.clearLayers = function(){
        this.clearLayer(this.pathlyr);
        this.clearLayer(this.waylyr);
        this.clearLayer(this.startlyr);
        this.clearLayer(this.goallyr);
    };
    
    this.clearLayer = function(lyr){
        lyrctx = lyr.getContext("2d");
        lyrctx.clearRect(0, 0, this.width, this.height); 
        lyr.style.display = "none";
    };     
    
    this.reposition = function(){
        //don't shift outside canvas area - i.e. no white space
        //TODO - ALLOW FOR SMALL MAPS
        //obSettings.origin.x = Math.min(obSettings.origin.x,0);
        //obSettings.origin.y = Math.min(obSettings.origin.y,0);
        //obSettings.origin.x = Math.max(obSettings.origin.x,this.width - this.width*obSettings.zoomfactor);
        //obSettings.origin.y = Math.max(obSettings.origin.y,this.height - this.height*obSettings.zoomfactor);
        
        this.clearLayers()
        this.ctx.clearRect(0, 0, this.width, this.height); 
        
        this.ctx.setTransform(obSettings.zoomfactor,0,0,obSettings.zoomfactor,obSettings.origin.x,obSettings.origin.y);
        this.ctx.drawImage(this.png,0,0);
        if(obSettings.start!==null){ 
            this.setStart(obSettings.start);
        }
        if (typeof(obSettings.goals[0]) != "undefined"){
            var arraylength = obSettings.goals.length;
            for(var i = 0; i < arraylength; i++){
                this.setGoal(obSettings.goals[i]);
            }
            for(var i=0; i< obSettings.obGoals.length; i++){
                this.labelGoal(obSettings.obGoals[i]);
            }
        }
        if (typeof(obSettings.waypoints[0]) != "undefined"){
            var arraylength = obSettings.waypoints.length;
            for(var i = 0; i < arraylength; i++){
                this.setWay(obSettings.waypoints[i]);
            }
        }
        if (typeof(obSettings.path[0]) != "undefined"){
            this.plotPoints(this.pathlyr, obSettings.path, PATH);
        }
    };

    this.getMovingAI = function(){
        var asciistr =  "type octile\r\nheight "+this.height+"\r\nwidth "+ this.width + "\r\nmap\r\n";
        for(var i = 0; i < this.ascii.length; i += this.width){
            asciistr += this.ascii.substr(i,this.width);
            asciistr += "\r\n"
        }
        return asciistr;
    };

    this.buildDefault();   
}
