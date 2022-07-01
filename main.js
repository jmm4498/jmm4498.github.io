var canvas;
var context;

var WIDTH = 35; //how many tiles wide
var HEIGHT = 35; //how many tiles tall
var tileSize = 20; //size of each tile in pixels
var setStart = false; //true when source tile is chosen
var mousedown = false; //true when mouse is clicked down
var algorithm = 0;
var tile = 0;
var setDestination = false; //true when destination tile is chosen
var sx; //source tile x
var sy; //source tile y
var dx; //destination tile x
var dy; //destination tile y
var p_x; //holds previous x mouse coord; used for drag event
var p_y; //holds previous y mouse coord; used for drag event
var map = new Array(WIDTH); //2d array which represents the 'map'
let HILLCOST = 15;
let PATHCOLOR = 'rgb(201, 20, 187)';

//queue of tiles to be drawn to the screen after the path is calculated
var drawQueue = new Array(WIDTH * HEIGHT * 2); 
var qHead = 0;

function initDrawQueue() {
    drawQueue = new Array(WIDTH * HEIGHT * 2);
    qHead = 0;

    for(var i = 0; i < drawQueue.length; i++) {
        drawQueue[i] = new Array(3);
    }
}


/* 
Initializes the map values
*/
function init_map() {
    for(var i = 0; i < map.length; i++) {
        map[i] = new Array(HEIGHT);
        for(var j = 0; j < map[i].length; j++) {
            map[i][j] = '_';
        }
    }
    initDrawQueue();
}

/*
Parameters : x, y two integers that are the coordinates for a tile
which will need to updated in the future
*/
function addToDrawQueue(x, y, color) {
     drawQueue[qHead][0] = x;
     drawQueue[qHead][1] = y;
     drawQueue[qHead][2] = color;
     qHead++;
}

/*
Parameters :
x, y : (x, y) values in a 2D coordinate system
Returns:
A 1D representation of the 2D input
*/
function twoD_oneD(x, y) {
    return y * HEIGHT + x;
}

init_map();

/* 
Parameters:
x, y : (x, y) coordinate of a tile
Colors a given tile based on its map[][] value
*/
function draw(x, y, color) {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    context.linewidth = 3;
    context.font = 'Georgia 22px';
    context.fillStyle = color;
    context.fillRect(x*tileSize,y*tileSize,tileSize,tileSize);
    context.strokeRect(x*tileSize,y*tileSize,tileSize,tileSize);
}


/* 
Utility function to call draw() on all tiles
*/
function drawAll() {                   
    for (var x=0;x<WIDTH;x++){
        for (var y=0;y<HEIGHT;y++){
            draw(x,y, 'white');
        }
    }
}

/*
Called when a click on the map is performed
Depending on the state of setStart and setDestination, may draw
a start tile, destination tile, or a wall tile
*/
function onEvent(event) {
    var rect = canvas.getBoundingClientRect();
    var color;
    var X = event.x-rect.left;
    var Y = event.y-rect.top;
    var x = Math.floor(X / tileSize);
    var y = Math.floor(Y / tileSize);

    if(tile == 0) {
        map[x][y] = 's';
        color = 'blue';
        if(setStart) { // A source was previously chosen, so should be reset
            map[sx][sy] = '_'; 
            draw(sx, sy, 'white');
        }
        sx = x;
        sy = y;
        setStart = true;
    } else if(tile == 1) {
        map[x][y] = 'd';
        color = 'yellow';
        if(setDestination) { // A destination was previously chosen, so should be reset
            map[dx][dy] = '_';
            draw(dx, dy, 'white');
        }
        dx = x;
        dy = y;
        setDestination = true;
    } else if(tile == 2) {
        map[x][y] = '|';
        color = 'black';
    } else if(tile == 3) {
        map[x][y] = 'h';
        color = 'purple';
    }

    //store the x and y in p_x and p_y so that if a drag event with a wall
    //occurs, it will begin drawing walls properly
    p_x = x;
    p_y = y;
    draw(x, y, color);
}

/*
Parameters : event object which gives x/y coord of mouse
Compares the current x/y position with the last known event x/y to
determine if a click and drag has been performed, and colors the tiles
that the mouse will move over, if the mouse is still down
*/
function onDrag(event) {
    if(mousedown && tile == 2) {
        var rect=canvas.getBoundingClientRect();
        var X= event.x-rect.left;                
        var Y= event.y-rect.top;
        var  x= Math.floor(X/tileSize);
        var  y= Math.floor(Y/tileSize);

        //if the last x/y is different than the current, draw over the current
        if(p_x != x && p_y == y || p_y != y && p_x == x) {
            p_x = x;
            p_y = y;
            map[x][y] = '|';
            draw(x, y, 'black');
        }
    }
}

/*
Resets the start/end destinations and the map array
*/
function reset() {
    setStart = false;
    setDestination = false;

    init_map();
    drawAll();
}

/* 
Parameters:
x, y : (x, y) coordinates for a given tile
Returns:
A list of all the immediate neighbors for the corresponding tile
*/
function neighbors(x, y) {
    var toRet = [];

    if(x + 1 < WIDTH)
        toRet.push([x + 1, y]);
    if(x - 1 >= 0)
        toRet.push([x - 1, y]);
    if(y + 1 < HEIGHT)
        toRet.push([x, y + 1]);
    if(y - 1 >= 0)
        toRet.push([x, y - 1]);

    return toRet;
}

/* 
Parameters : x, y coordinate of a point
Returns : cost from (x, y) to source
*/
function getCost(x, y) {
    let c = map[x][y];

    if(c == "h")
        return HILLCOST;
    return 1;
}
/*
Parameters : x, y coordinate of a point
Returns : Distance of x,y 
*/
function getDistance(x, y) {
    let distance = Math.sqrt(((x - sx) * (x - sx)) + ((y - sy) * (y - sy)));
    return distance;
}  


function calcColor(x, y, b) {
    let d = getDistance(x, y);

    let blue = b - (d * 5.5);
    console.log(b);

    return 'rgb(0, 255, ' + blue + ')'; 
}


/*
Breadth-First Search
Parameters: 
x_1, y_1 : x/y values of the source tile
x_2, y_2 : x/y values of the destination tile
Returns: A list containing: true/false if path is found and a list
representing the path starting from the destination. The path list is
empty if no such path is found
*/
function bfs(x_1, y_1, x_2, y_2) {

    const prev = new Array(HEIGHT * WIDTH);
    const queue = new Array(HEIGHT * WIDTH);
    const visited = new Array(HEIGHT * WIDTH);

    for(var i = 0; i < HEIGHT * WIDTH; i++) {
        visited[i] = false;
    }

    var src = twoD_oneD(x_1, y_1);
    var goal = twoD_oneD(x_2, y_2);

    visited[src] = true;

    queue.push(src);

    while(queue.length) {
        let v = queue.shift();

        if(v == goal){
            return [true, prev];
        }

        var x = v % WIDTH;
        var y = Math.floor(v / HEIGHT);

        var n = neighbors(x, y);
        for(let i = 0; i < n.length; i++) {
            let toAdd = twoD_oneD(n[i][0], n[i][1]);
            if(map[x][y] != '|' && !visited[toAdd]){
                queue.push(toAdd);
                if(x == sx && y == sy) {
                    addToDrawQueue(x, y, 'blue');
                } else {
                    addToDrawQueue(x, y, calcColor(x, y, 255));
                }
                
                prev[toAdd] = v;
                visited[toAdd] = true;
            }
        }
    }

    return [false, new Array(0)];
}


/*
Depth-First Search
Parameters: 
x_1, y_1 : x/y values of the source tile
x_2, y_2 : x/y values of the destination tile
Returns: A list containing: true/false if path is found and a list
representing the path starting from the destination. The path list is
empty if no such path is found
*/
function dfs(x_1, y_1, x_2, y_2) {
    const prev = new Array(HEIGHT * WIDTH);
    const stack = new Array(HEIGHT * WIDTH);
    const visited = new Array(HEIGHT * WIDTH);

    for(var i = 0; i < HEIGHT * WIDTH; i++) {
        visited[i] = false;
    }

    var src = twoD_oneD(x_1, y_1);
    var goal = twoD_oneD(x_2, y_2);

    visited[src] = true;

    stack.push(src);

    while(stack.length) {
        let v = stack.pop();

        if(v == goal){
            return [true, prev];
        }

        var x = v % WIDTH;
        var y = Math.floor(v / HEIGHT);

        var n = neighbors(x, y);
        for(let i = 0; i < n.length; i++) {
            let toAdd = twoD_oneD(n[i][0], n[i][1]);
            if(map[x][y] != '|' && !visited[toAdd]){
                stack.push(toAdd);
                if(x == sx && y == sy) {
                    addToDrawQueue(x, y, 'blue');
                } else {
                    addToDrawQueue(x, y, calcColor(x, y, 255));
                }
                visited[toAdd] = true;
                prev[toAdd] = v;
            }
        }
    }

    return [false, new Array(0)];
}


/*
Djikstra's Algorithm Search
Parameters;
x_1. y_1 : x,y values of the source tile
x_2, y_2 : x,y values of the destination tile
Returns: A list containing: true/false if a path was found and a list representing
the path starting from the source tile to the destination. The list is empty if no
such path is found
*/
function djikstra(x_1, y_1, x_2, y_2) {
    const queue = new PriorityQueue();
    const prev = new Array(HEIGHT * WIDTH);
    const visited = new Array(HEIGHT * WIDTH);
    const distance = new Array(HEIGHT * WIDTH);

    var src = twoD_oneD(x_1, y_1);
    var goal = twoD_oneD(x_2, y_2);

    visited[src] = true;
    distance[src] = 0;

    for(var i = 0; i < HEIGHT * WIDTH; i++) {
        visited[i] = false;
        if(i != src) {
            distance[i] = Number.MAX_VALUE;
        }
    }

    queue.enqueue(src, 0);

    while(!queue.isEmpty()) {
        let v = queue.dequeue().element;

        if(v == goal){
            return [true, prev];
        }

        var x = v % WIDTH;
        var y = Math.floor(v / HEIGHT);

        var n = neighbors(x, y);

        for(let i = 0; i < n.length; i++) {

            let toAdd = twoD_oneD(n[i][0], n[i][1]);
            if(map[x][y] != '|' && !visited[toAdd]){
                let d = distance[v] + getCost(x, y);

                if(d < distance[toAdd]) {
                    distance[toAdd] = d;
                }

                queue.enqueue(toAdd, distance[toAdd]);

                if(x == sx && y == sy) {
                    addToDrawQueue(x, y, 'blue');
                } else {
                    addToDrawQueue(x, y, calcColor(x, y, 255));
                }
                
                prev[toAdd] = v;
                visited[toAdd] = true;
            }
        }
    }

    return [false, new Array(0)];
}

function setMessage(message, id) {
    let p = document.getElementById(id);
    p.innerHTML = message;
}


function setAlgorithm(alg, message) {
    algorithm = alg;
    setMessage(message, 'message-alg');
}

function setTile(t, message) {
    tile = t;
    setMessage(message, 'message-tile');
}

/*
Draws a path to the map from the start tile to destination tile
Parameters:
prev : A list containing the previous tile in the path for a given tile
sx, sy : (x, y) of the start tile
dx, dy : (x, y) of the destination tile
*/
function backtrack(prev, sx, sy, dx, dy) {
    let s = twoD_oneD(sx, sy);
    let d = twoD_oneD(dx, dy);
    let path = new Array();

    let p = d;
    while(p != s) {
        path.push(p);

        let x = p % WIDTH;
        let y = Math.floor(p / HEIGHT);

        if(map[x][y] != 's' && map[x][y] != 'd') {
            //draw(x, y, 'green');
          addToDrawQueue(x, y, PATHCOLOR);
        }
        p = prev[p];
    }
    //draw(sx, sy, 'blue');
    addToDrawQueue(sx, sy, 'blue');
}

async function drawWithQueue() {
    for(var i = 0; i < qHead; i++) {
        let x = drawQueue[i][0];
        let y = drawQueue[i][1];
        let color = drawQueue[i][2];
        draw(x, y, color);
        await new Promise(done => setTimeout(() => done(), 0));
    }
}

drawAll();

let startButton = document.getElementById("startButton");
let resetButton = document.getElementById("resetButton");

resetButton.addEventListener('click', event => reset());

startButton.addEventListener('click', event => {

    var ret;

    if(setStart && setDestination) {
        if(algorithm == 0) {
            ret = djikstra(sx, sy, dx, dy);
        } else if(algorithm == 1) {
            ret = bfs(sx, sy, dx, dy);
        } else if(algorithm == 2) {
            ret = dfs(sx, sy, dx, dy);
        }

        if(ret[0] == true) {
            backtrack(ret[1], sx, sy, dx, dy);
        }
    
        drawWithQueue();
    }     
});