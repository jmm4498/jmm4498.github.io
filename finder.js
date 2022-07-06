var ROW = 30;
var COL = 60;
var s_ID;
var d_ID;
var lastButtonIDNode;
var lastButtonIDAlg;
var speed = 0;
var steps = 0;
var selected_s = false;
var selected_d = false;
var alg_type = 0;
var node_type = 0;
var mousedown = false;
var SRCCOLOR = 'rgb(173, 51, 255)';
var DSTCOLOR = 'rgb(255, 102, 102)';
var WALLCOLOR = 'rgb(0, 0 , 0)';
var PATHCOLOR = 'rgb(255, 204, 0)';
var BASECOLOR = 'rgb(255, 255, 255)';
var HILLCOLOR = 'rgb(102, 153, 153)';
var VISITEDCOLOR = 'rgb(0, 255, 255)';

var HIGHLIGHTBUTTONCOLOR = '#7532a8';
var DEFAULTBUTTONCOLOR = '#0a6bff';

var drawQueue = new Array();

function set_td(id, value, color) {
    let td = document.getElementById(id);
    td.setAttribute('value', value);
    td.style.backgroundColor = color;
}

async function set_td_delay(id, value, color, delay) {
    let td = document.getElementById(id);
    await new Promise(done => setTimeout(() => done(), delay));  
    td.setAttribute('value', value);
    td.style.backgroundColor = color;
} 

function reset_td(id) {
    set_td(id, 0, BASECOLOR);
}

function reset_all_td() {
    for(var i = 0; i < ROW * COL; i++) {
        reset_td(i);
    }
}

function highlightButton(toHighlight, type) {
    let highlight = document.getElementById(toHighlight);
    highlight.style.backgroundColor = HIGHLIGHTBUTTONCOLOR;

    var restore;
    if(type == 0) { //node type
        if(lastButtonIDNode) {
            restore = document.getElementById(lastButtonIDNode);
            restore.style.backgroundColor = DEFAULTBUTTONCOLOR;
        }
        lastButtonIDNode = toHighlight;    
    } else { //alg type
        if(lastButtonIDAlg) {
            restore = document.getElementById(lastButtonIDAlg);
            restore.style.backgroundColor = DEFAULTBUTTONCOLOR;
        }
        lastButtonIDAlg = toHighlight;
    }
}

function td_click(id) {
    if(node_type == 0) {
        if(selected_s) {
            reset_td(s_ID);
        }
        set_td(id, 'v', SRCCOLOR);
        s_ID = id;
        selected_s = true;
    } else if(node_type == 1) {
        if(selected_d) {
            reset_td(d_ID);
        }
        set_td(id, 'd', DSTCOLOR);
        d_ID = id;
        selected_d = true;
    } else if(node_type == 2) {
        set_td(id, 'w', WALLCOLOR);
    } else if(node_type == 3) {
        set_td(id, 'h', HILLCOLOR);
    }
}

function fill(id) {
    if(mousedown == true) {
        if(node_type == 2) {
            set_td(id, 'w', WALLCOLOR);
        } else if(node_type == 3) {
            set_td(id, 'h', HILLCOLOR);
        }
    }
}

function calcColor() {
    let blue = 255 - (steps * 0.4);
    let red = 0 + (steps * 0.4);
    return 'rgb(' + red + ', 255, ' + blue + ')'; 
}

function create_td(id) {
    let td = document.createElement('td');
    td.setAttribute('id', id);
    td.setAttribute('value', 0);
    td.setAttribute('onclick', "td_click(" + id + ")");
    td.setAttribute('onmousemove', "fill(" + id + ")");
    td.setAttribute('onmousedown', "mousedown=true;");
    td.setAttribute('onmouseup', "mousedown=false;");
   // td.HTML = id; /** for debugging. Shows ID in each node on screen */
    return td;
}

function createTable(r, c) {
    let body = document.getElementById('main-table');
    let table = document.createElement('table');

    table.style.width = '100%';
    table.setAttribute('border', '1');

    var tbdy = document.createElement('tbody');

    let id = 0;
    for(var i = 0; i < r; i++) {
        var tr = document.createElement('tr');
        for(var j = 0; j < c; j++) {
            let td = create_td(id);
            tr.appendChild(td);
            id += 1;
        }
        tbdy.appendChild(tr);
    }
    table.appendChild(tbdy);
    body.appendChild(table);
}

function neighbors(id) {
    let n = new Array();

    if(id - COL >= 0) {
        n.push(id - COL);
    } 
    if(id % COL != 0) {
        n.push(id - 1);
    }
    if((id + 1) % COL != 0) {
        n.push(id + 1);
    }
    if(id + COL < ROW * COL) {
        n.push(id + COL);
    }
    return n;
}

function getValue(td) {
    return td.getAttribute('value');
}

function backtrack(prev) {
    let c = d_ID;
    while(c != s_ID) {
        drawQueue.push(new Array(c, "v", PATHCOLOR));
        c = prev[c];
    }
    drawQueue.push(new Array(d_ID, "v", DSTCOLOR));
}

function getCost(id) {
    let val = getValue(id);
    
    if(val == "h") {
        return 15;
    }

    return 1;
}

async function drawWithQueue() {
    for(var i = 0; i < drawQueue.length; i++) {
        let id = drawQueue[i][0];
        let value = drawQueue[i][1];
        let color = drawQueue[i][2];

        set_td(id, value, color);

        await new Promise(done => setTimeout(() => done(), speed));
    }
}

function djikstra() {
    const prev = new Array();
    const queue = new PriorityQueue();
    const distance = new Array(ROW * COL);

    for(var i = 0; i < ROW * COL; i++) {
        distance[i] = Number.MAX_VALUE;
    }

    distance[s_ID] = 0;
    queue.enqueue(s_ID, 0);

    while(!queue.isEmpty()) {
        steps++;
        let n_id = queue.dequeue().element;
        if(n_id == d_ID) {
            return [true, prev];
        }

        let n = neighbors(n_id);

        for(var i = 0; i < n.length; i++) {
            let toAdd = document.getElementById(n[i]);
            if(getValue(toAdd) != "w" && getValue(toAdd) != "v") {
                let d = distance[n_id] + getCost(toAdd);

                if(d < distance[n[i]]) {
                    distance[n[i]] = d;
                }

                prev[n[i]] = n_id;

                if(n[i] != d_ID){
                    set_td(n[i], 'v', 'white');
                }
                queue.enqueue(n[i], distance[n[i]]);
                drawQueue.push(new Array(n[i], "v", calcColor()));
            }
        }
    }
    return [false, new Array(0)];
}

function bfs() {
    const prev = new Array();
    const queue = new Array();
    
    queue.push(s_ID);

    while(queue.length) {
        steps++;
        let n_id = queue.shift();
    
        if(n_id == d_ID) {
            return [true, prev];
        }

        let n = neighbors(n_id);
        for(var i = 0; i < n.length; i++) {
            let toAdd = document.getElementById(n[i]);
            if(getValue(toAdd) != "w" && getValue(toAdd) != "v") {
                queue.push(n[i]);
                prev[n[i]] = n_id;
 
                if(n[i] != d_ID){
                    set_td(n[i], 'v', 'white');
                }
        
                drawQueue.push(new Array(n[i], "v", calcColor()));
            }
        }
    }
    return [false, new Array(0)];
}

function dfs() {
    const prev = new Array();
    const stack = new Array();

    stack.push(s_ID);

    while(stack.length) {
        steps++;
        let n_id = stack.pop();

        if(n_id == d_ID) {
            return [true, prev];
        }

        let n = neighbors(n_id);

        for(var i = 0; i < n.length; i++) {
            let toAdd = document.getElementById(n[i]);
            if(getValue(toAdd) != "w" && getValue(toAdd) != "v") {
                stack.push(n[i]);

                prev[n[i]] = n_id;
                if(n[i] != d_ID){
                    set_td(n[i], 'v', 'white');
                }
                drawQueue.push(new Array(n[i], "v", calcColor()));
            }
        }
    }
    return [false, new Array(0)];
}

function reset() {
    steps = 0;
    selected_s = false;
    selected_d = false;
    
    reset_all_td();
    drawQueue = new Array();
}


function start() {

    var ret = [false, new Array(0)];

    if(selected_s && selected_d) {
        if(alg_type == 0) {
            ret = djikstra();
        } else if(alg_type == 1) {
            ret = bfs();
        } else if (alg_type == 2) {
            ret = dfs();
        }
        steps = 0;
        if(ret[0]) {
            backtrack(ret[1]);
            drawWithQueue();
        }
    }
 }

/**
 * create a NxM table
 */
createTable(ROW, COL);

startButton.addEventListener('click', event => {start(); });