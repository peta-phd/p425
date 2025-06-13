OCT_CONST = Math.sqrt(2) - 1;

function Pq(){
//Priority Queue
    this.q = [];
    this.insert = function(anode){
        for(var i=0; i<this.q.length; i++){
            if(anode.isLessThan(this.q[i])){
                break;
            }
        }
        this.q.splice(i,0,anode);
    };
    this.getLength = function(){
        return this.q.length;
    };
    this.pop = function(){
        return this.q.splice(0,1)[0];
    }
}

function Node(coord, g, h, parent){
    this.coord = coord;
    this.parent = parent;
    this.g = g;
    this.h = h;
    this.f = g+h;
    
    this.isLessThan = function(node1){
        return (this.f < node1.f);
    };
    this.toString = function(){
        return ("coord: " + coord.toString() + "\n parent: " + parent.toString() + "\ng: " + g +
            "\nh: " + h + "\nf: " + f);
    };
}
   
function octile(coord, goals){
    var xlen, ylen;
    var returnval = Infinity;
    for(var i=0; i<goals.length; i++){
        xlen = Math.abs(coord.x - goals[i].x);
        ylen = Math.abs(coord.y - goals[i].y);
        returnval = Math.min((Math.max(xlen, ylen) + OCT_CONST * Math.min(xlen, ylen)), returnval);
    }
    return returnval;
}

function Algos(model){
    var self = this;
    this.model = model;
    /*any function on algolist may be called with coord and set of goals 
        and expected to return next step*/
    this.algolist = ["random", "astar"];
    this.savedpath;
    this.step;
    this.built = false;
    
    this.reset = function(){
        self.built = false;
    };
    
    this.register = function(){
        //register available algorithms with controller
        return this.algolist;
    };
    
    this.setModel = function(model){
        this.model = model;
    };
    
    this.random = function(coord, goals){
    //internal random search agent. Given coord, returns random legal adjacent
        var adjlist = self.model.getAdjacents(coord);
        var listcopy = [];
        var listlength = 0;
        for(var i = 0; i < adjlist.length; i++){
            //exclude any coords not traversible
            if(self.model.isTraversible(adjlist[i])){
                listcopy.push(adjlist[i]);
                listlength++;
            }
        }
        var choice = Math.floor(Math.random() * listlength);
        return listcopy[choice];
    };
   
    this.astar = function(coord, goals){
        //alert(self.built);
        if(self.built){
            return this.savedpath[this.step--];
        }else{
            this.savedpath = buildPath(coord,goals);
            this.step = this.savedpath.length-1;
            return this.savedpath[this.step--];
        }
        
        function buildPath(start,goals){
            var numgoals = goals.length;
            var model = self.model;
            //var goal = goals[0];
            var path = [];
            var closedlist = {}; //dic, string to coord
            var openlist = new Pq();
            var current_node, parent_coord, adjlist, adjlength, adj_coord, g, h;
            var multiplier;
            
            var newnode = new Node(start, 0, octile(start, goals), null);
            openlist.insert(newnode);
            
            while(openlist.getLength() > 0){
                current_node = openlist.pop();
                current_coord = current_node.coord;
                if(current_coord.toString() in closedlist){
                    continue;
                }
                closedlist[current_coord.toString()] = current_node.parent;
                for(var i=0; i<numgoals; i++){
                    if(current_coord.equals(goals[i])){
                        //goal found
                        path = [];
                        while(!(current_coord.equals(start))){
                            path.push(current_coord);
                            current_coord = closedlist[current_coord.toString()];
                        }
                        self.built = true;
                        return path;
                    }
                }
                adjlist = model.getSafeAdjacents(current_coord);
                for(var i = 0; i < adjlist.length; i++){
                    adjcoord = adjlist[i];
                    if(!(adjcoord.toString() in closedlist)){
                        if(!(model.isStraight(current_coord, adjlist[i]))){
                            multiplier = SQRT2;
                        }else{  
                            multiplier = 1;
                        }
                        g = current_node.g + (model.getCost(adjcoord) * multiplier);
                        h = octile(adjcoord, goals);
                        openlist.insert(new Node(adjcoord, g, h, current_coord));
                    }
                }
            }
            return [null];    //path not found
        };
        
    };
   
}