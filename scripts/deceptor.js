const ASCII_A = 65;

function deceptorDector(){
    alert("deceptor.js is available");
}

function Goal(model, coord){
    if(!obSettings.obGoals.length) Goal.currentId = 0;
    this.id = String.fromCharCode(ASCII_A + Goal.currentId++);   //A, B, C, D...
    this.coord = coord;
    this.opt_cost = getOptCost(model, obSettings.start, coord);
    this.real = false;
    this.resetId = function(){
        Goal.currentId = 0;
    };
}

Goal.currentId = 0; //static int corresponding to ASCII value of next goal id

function Step(model, coord, g){
    this.model = model;
    this.coord = coord;
    this.g = g; //path cost so far
    this.goalcosts = [];    //optimal cost from this step to each goal
    this.goalprobs = [];
    this.sim;
    this.dissim;
    
    this.getSim = function(){
        if(typeof this.sim == 'undefined'){
            var realgoalprob = this.getGoalprob(0);    //Always assume real goal is goal A
            var max = 0;
            for(var i=1; i<obSettings.goals.length; i++){
                diff = this.getGoalprob(i) - realgoalprob;
                max=Math.max(max, diff);
            }
            this.sim = max;
        }
        return this.sim;
    };
    this.getDissim = function(){
        if(typeof this.dissim == 'undefined'){
            var sum = 0;
            var goalprob = 0;
            var numgoals = obSettings.goals.length;
            for(var i=0; i<obSettings.goals.length; i++){
                goalprob = this.getGoalprob(i);
                if(goalprob){
                    sum += (goalprob * Math.log2(goalprob));
                }
            }
            this.dissim = Math.abs(sum);
        }
        return this.dissim;
    };
    this.getGoalcosts = function(goal){
        if(typeof this.goalcosts[goal] == 'undefined'){
            for(var i = 0; i<obSettings.goals.length; i++){
                this.goalcosts[i]= this.getOptCost(this.model, this.coord, obSettings.goals[i]);
            }   
        }
        return this.goalcosts[goal];
    };
    this.getGoalprob = function(goal){
        if(typeof this.goalprobs[goal] == 'undefined'){
            var goaltot = 0;
            var goaltot2 = 0;     
            //cost from here to goal
            for(var i = 0; i<obSettings.goals.length; i++){
                this.goalcosts[i]= getOptCost(this.model, this.coord, obSettings.goals[i]);
            }       
            //opt cost start to goal
            if (typeof obSettings.obGoals[obSettings.goals.length-1] == 'undefined') {
                calcGoals(this.model.map);//calculates optimal path cost for each goal
            }
            //delta g = cost so far + cost to goal - opt cost start to goal
            for(var i = 0; i<obSettings.goals.length; i++){
                this.goalprobs.push((g + this.goalcosts[i]) - obSettings.obGoals[i].opt_cost);
                goaltot+=this.goalprobs[i];
            }
            // prob(g) = 1 - (delta)/total deltas)
            if(!goaltot) goaltot = 1;
            for(var i = 0; i<obSettings.goals.length; i++){
                this.goalprobs[i] = 1 - this.goalprobs[i]/goaltot;
                goaltot2+=this.goalprobs[i];
            }
            //and re-calc yet again based on totals so probs add up to 1
            for(var i = 0; i<obSettings.goals.length; i++){
                this.goalprobs[i] = this.goalprobs[i]/goaltot2;
            }
        }

        return this.goalprobs[goal];
    };
}

function Path(model, start, obs, goals){
    var self = this;
    
    this.makeSteps = function(model, start){
        var multiplier, next;
        var current = start;
        var g=0;
        for(var i = 0; i< self.path.length; i++){
            next = self.path[i];
            if(!(model.isStraight(current, next))){
                multiplier = SQRT2;
            }else{  
                multiplier = 1;
            }
            g += model.getCost(next) * multiplier;
            obSettings.obSteps.push(new Step(model, next, g));
            current = next;
        }
        self.cost = g;
    };
    
    this.fillGaps = function(model,start,obs,goals){
        var extras;
        var path = getSeg(model, start, [obs[0]])
        var j = path.length-1;
        for(var i = 0; i<obs.length; i++){
            if(model.isAdj(obs[i],path[j])){
                path.push(obs[i]);
            }else{
                extras = getSeg(model, path[j], [obs[i]]);
                path = path.concat(extras);
            }
            j=path.length-1;    //last filled slot
        }
        extras = getSeg(model,path[j],goals);
        path = path.concat(extras); 
        return path
    };
    
    this.model = model;
    this.start = start;
    
    if(typeof obSettings.path[0] == 'undefined')
        this.path = this.fillGaps(model,start,obs,goals);
    else 
        this.path = obSettings.path;
    //this.steps = [];
    this.makeSteps(model,start);//TODO bring these inside path (currently still settings)
    //this.goal = this.steps[this.steps.length-1];
    //this.cost;
    
    this.getPath = function(){
        return self.path;
    };
}

function calcGoals(map){
    var g;
    Goal.currentId = 0;
    for(var i = 0; i<obSettings.goals.length; i++){
        g = new Goal(map.model, obSettings.goals[i]);
        obSettings.obGoals[i] = g;
        map.labelGoal(g);
    }
}

function showStepDetails(i){
    var goalprob,tempid;      
    var step = obSettings.obSteps[i];
    var htmlstr = "Cost so far: " + step.g;
    htmlstr+= "<br><b>Sim: " + step.getSim().toFixed(5);
    htmlstr+= "<br>Dissim: " + step.getDissim().toFixed(5) + "</b>";
    for(var j=0; j<obSettings.goals.length; j++){
        goalprob = step.getGoalprob(j);
        htmlstr+= "<br><u>Goal "+obSettings.obGoals[j].id+"</u>"
        htmlstr += "<br>Optcost frm start: "+ obSettings.obGoals[j].opt_cost;
        htmlstr += "<br>Optcost to goal: "+ step.getGoalcosts(j);
        htmlstr+= "<br><b>P("+obSettings.obGoals[j].id+"): "+ goalprob.toFixed(3) + "</b>";
    }
    document.getElementById("spnStep").innerHTML = " " + (i+1) 
    document.getElementById("stepbox").style.visibility = "visible";
    document.getElementById("spnGoals").innerHTML = htmlstr;
}

 
function getSeg(model, start, goals){
    var path = [];
    var closedlist = {}; //dic, string to coord
    var openlist = new Pq();
    var current_node, parent_coord, adjlist, adjlength, adj_coord, g, h;
    var multiplier;
    var numgoals = goals.length;
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
                path = [];  //include goal (not start)
                while(!(current_coord.equals(start))){
                    path.push(current_coord);
                    current_coord = closedlist[current_coord.toString()];
                }
                self.built = true;
                return path.reverse();
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
}

function getOptCost(model, start, goal){
    var path = [];
    var closedlist = {}; //dic, string to coord
    var openlist = new Pq();
    var current_node, parent_coord, adjlist, adjlength, adj_coord, g, h;
    var multiplier;
    
    var newnode = new Node(start, 0, octile(start, [goal]), null);
    openlist.insert(newnode);
    
    while(openlist.getLength() > 0){
        current_node = openlist.pop();
        current_coord = current_node.coord;
        if(current_coord.toString() in closedlist){
            continue;
        }
        closedlist[current_coord.toString()] = current_node.parent;

        if(current_coord.equals(goal)){
            return current_node.g;  //only cost needed
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
                h = octile(adjcoord, [goal]);
                openlist.insert(new Node(adjcoord, g, h, current_coord));
            }
        }
    }
    return null;    //path not found
}

