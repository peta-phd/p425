const GROUND = [255,127,36,255];
const TREES = [34,139,34,255];
const SWAMP = [139,139,0,255];
const WATER = [72,209,204,255];
const OOB = [0,0,0,255];
const DEFAULT_WIDTH = 512;
const DEFAULT_HEIGHT = 512;
const PATH = "rgba(255,255,051,0.8)";

function Settings(){
/*holds config settings and running values (effectively global variables)*/
    var self = this;
    this.gui = true;
    this.speed = 100;
    this.deadline = Infinity;
    this.diagonals = true;
    this.cutcorners = false;
    this.freetime = 0;
    this.dynamic = false;
    this.strict = true;
    this.costs = {'O':Infinity,'@':Infinity,'T':Infinity,'G':1,'.':1,'W':5,'S':10};
    this.width = DEFAULT_WIDTH;
    this.height = DEFAULT_HEIGHT;
    this.start=null;
    this.waypoints = [];
    this.currentwp = 0; //waypoint index
    this.goals = [];
    this.agentstr="";

    this.searchagent = null;
    this.zoomfactor;
    this.mode;  //mouseover 0 = display pos/click and drag
    this.current;   //search position
    this.obGoals = [];
    this.path = []; //array of coords only
    this.obSteps = [];
    this.searchstate;
    this.intervalid = 0;
    this.origin = new Coord(0,0);
    this.dragstart;
    this.mousedown;
    this.steps = 0;
    this.cost = 0;
    this.mapname = "Default";
    this.currentStep=0;
    
    this.getCurrentWp = function(){
        if(self.currentwp < self.waypoints.length){
            return self.waypoints[self.currentwp];
        }else{
            return null;
        }
    }
    
    this.partialReset = function(){
        //doesn't reset start/goals or algorithm
        this.mode = 0;
        this.searchstate = 0;
        this.current = this.start;
        this.searchstate = 0;
        this.mousedown = false;
        if(this.intervalid!=0)clearInterval(obSettings.intervalid);
        this.steps = 0;
        this.cost = 0;
        this.path = [];
        this.obSteps = [];
        this.currentStep = 0;
        this.currentwp = 0;
        
    };
    
    this.reset = function(){
        this.partialReset();
        this.zoomfactor = 1;
        this.origin.x = 0;
        this.origin.y = 0;
        this.start = null;
        this.goals = [];
        this.obGoals = [];
        this.waypoints=[];
    };
    
    this.reset();
}