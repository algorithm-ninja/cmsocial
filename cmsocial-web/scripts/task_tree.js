'use strict';

/* Tasks page */

angular.module('cmsocial').controller('TaskTree', function(
    $scope, $stateParams, $state, $http, notificationHub,
    userManager, l10n, API_PREFIX) {
        $http
        .post(API_PREFIX + 'task', {
            'tag' : 'tree', // can be null
            'first' : 0,
            'last' : 50,
            'username' : userManager.getUser().username,
            'token' : userManager.getUser().token,
            'action' : 'list'
        })
        .success(function(data, status, headers, config) {
            //Build the tree according to the level of the tasks
            function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            }

            var catList = [];
            var cat2Tasks = {};
            for (var i = 0; i < data.tasks.length; i++) {
                catList.push(data.tasks[i].category);
                if (!(data.tasks[i].category in cat2Tasks)) {
                    cat2Tasks[data.tasks[i].category] = [];
                }
                cat2Tasks[data.tasks[i].category].push(data.tasks[i]);
            }
            catList = catList.filter(onlyUnique);
            
            function cmp(a, b) {
                if (a.difficulty > b.difficulty) {
                    return 1;
                }
                if (a.difficulty < b.difficulty) {
                    return -1;
                }
                return 0;
            }

            function createNode(node) {
                return {
                    "node": node,
                    "children": [],
                    "x": 0,
                    "y": 0,
                    "visible": false
                };
            }

            cat2Tasks["intro"].sort(cmp);
            let treeData = createNode(cat2Tasks["intro"][0]);

            let par = treeData;
            for (let j = 1; j < cat2Tasks["intro"].length; j++) {
                let cur = createNode(cat2Tasks["intro"][j]);
                par["children"].push(cur);
                par = cur;
            }
            let secondRoot = par;

            for (let i = 0; i < catList.length; i++) {
                if (catList[i] == "intro") {
                    continue;
                }
                cat2Tasks[catList[i]].sort(cmp);
                let par = secondRoot;
                for (let j = 0; j < cat2Tasks[catList[i]].length; j++) {
                    let cur = createNode(cat2Tasks[catList[i]][j]);
                    par["children"].push(cur);
                    par = cur;
                }
            }

            ///////////////////


            var cat_to_color = {
                'intro': '#2b7085',
                'data structures': '#DAF7A6',
                'graphs': '#FFC300',
                'math': '#FF5733',
                'dynamic programming': '#C70039',
                'brute force': '#900C3F',
                'sortings': '#581845'
            };

            let width =  $("#gemmadiv").width();
            let height = window.innerHeight * 2;
            let paddingTop = 50;
            let nodeRadius = 20;
            let nodeStrokeWidth = 5;
            let linkHeight = 80;
            let linkStrokeWidth = 5;
            let animationDelay = 100;
            // For the circle filling animation
            let numFrames = 60;
            let frameDelay = 10;

            // Perdete ogni speranza o voi che leggete sta porcata
            let timeouts = [];
            let _setTimeout = setTimeout;
            function myTimeout(a, b) {
                timeouts.push(_setTimeout(a, b));
            }
            setTimeout = myTimeout;

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var svgNS = svg.namespaceURI;
            svg.setAttribute('height', height + "px");
            svg.setAttribute('width', width + "px");
            svg.setAttribute('style', 'position:absolute;top:0;left:0');
            svg.id = "mysvg";
            document.getElementById("gemmadiv").appendChild(svg);
            let firstDraw = true;
            draw();

            function draw() {
                let oldwidth = width;
                width = $("#gemmadiv").width();
                height = paddingTop * 2 + linkHeight * 7;
                var svg = document.getElementById("mysvg");
                svg.setAttribute('height', height + "px");
                svg.setAttribute('width', width + "px");

                // Clear previous animation and redraw
                if(firstDraw || width != oldwidth) {
                    for(let i of timeouts)
                        clearTimeout(i);
                    timeouts = [];
                    drawSvg();
                }
                firstDraw = false;
                //animationDelay = 0;
                //frameDelay = 0;
            };
            window.onresize = draw;
            
            function drawSvg() {
                $("#mysvg").empty();
                
                // This function assumes that the tree has at most a SINGLE split point
                function visit(u, depth, siblings, childIdx, visible) {
                    u.visible = visible;
                    u.y = depth * linkHeight + paddingTop;
                    //console.log(u.y); qui va bene
                    u.x = width / (siblings + 1) * (childIdx + 1);
                    for(let i = 0; i < u.children.length; i++) {
                        let v = u.children[i];
                        if(visible && u.node.score != undefined && u.node.score >= 50) {
                            visit(v, depth + 1, Math.max(siblings, u.children.length), childIdx + i, true);
                        }
                        else {
                            visit(v, depth + 1, Math.max(siblings, u.children.length), childIdx + i, false);
                        }
                    }
                }
                visit(treeData, 0, 1, 0, true);

                function drawNode(node) {
                    if (node.node.score == undefined) {
                        node.node.score = 0;
                    }

                    // Fake node for hidden problems
                    if(!node.visible) {
                        // Node background
                        let bkg = document.createElementNS(svgNS, 'circle');
                        bkg.setAttribute("fill", "#ddd");
                        bkg.setAttribute("fill-opacity", 1);
                        bkg.setAttribute("cx", node.x);
                        bkg.setAttribute("cy", node.y);
                        bkg.setAttribute("r", nodeRadius + nodeStrokeWidth / 2);
                        bkg.setAttribute('stroke-width', 0);
                        svg.appendChild(bkg);

                        // Node text
                        let text = document.createElementNS(svgNS, "text");
                        text.setAttributeNS(null,"font-size","20px");
                        text.setAttributeNS(null,"x", node.x);
                        text.setAttributeNS(null,"y", node.y);
                        text.setAttribute('text-anchor', 'middle');
                        text.setAttribute('dominant-baseline', 'central');
                        text.textContent = '?';
                        svg.appendChild(text);

                        return;
                    }

                    // Draw links (in white)
                    let linkPaths = [];
                    for(let child of node.children) {
                        console.log("drawing link from " + node.node.name + " to " + child.node.name);
                        var path = document.createElementNS(svgNS, 'line');
                        path.setAttribute('x1', node.x);
                        path.setAttribute('y1', node.y);
                        path.setAttribute('x2', child.x);
                        path.setAttribute('y2', child.y - nodeRadius / 2);
                        path.setAttribute('stroke', 'none');
                        path.setAttribute('stroke-width', linkStrokeWidth);
                        svg.appendChild(path);
                        linkPaths.push(path);
                    }

                    // Node background
                    let bkg = document.createElementNS(svgNS, 'circle');
                    bkg.setAttribute("fill", "white");
                    bkg.setAttribute("fill-opacity", 1);
                    bkg.setAttribute("cx", node.x);
                    bkg.setAttribute("cy", node.y);
                    bkg.setAttribute("r", nodeRadius + nodeStrokeWidth / 2);
                    bkg.setAttribute('stroke-width', 0);
                    svg.appendChild(bkg);

                    // Node color
                    let color = document.createElementNS(svgNS, 'circle');
                    color.setAttribute("stroke", cat_to_color[node.node.category]);
                    color.setAttribute("stroke-opacity", 0.5);
                    color.setAttribute("fill", cat_to_color[node.node.category]);
                    color.setAttribute("fill-opacity", 0.6);
                    color.setAttribute("cx", node.x);
                    color.setAttribute("cy", node.y);
                    color.setAttribute("r", nodeRadius + nodeStrokeWidth / 2);
                    color.setAttribute('stroke-width', 0);
                    color.setAttribute('id', node.node.name);
                    svg.appendChild(color);

                    // Node stroke
                    let scoreAngle = 3.59999 * node.node.score;
                    let arc = describeArc(node.x, node.y, nodeRadius, 0, 0);
                    let stroke = document.createElementNS(svgNS, 'path');
                    stroke.setAttribute("stroke", cat_to_color[node.node.category]);
                    stroke.setAttribute("fill", "none");
                    stroke.setAttribute("d", arc);
                    stroke.setAttribute('stroke-width', nodeStrokeWidth);
                    stroke.setAttribute('id', node.node.name);
                    svg.appendChild(stroke);

                    // Node text
                    let text = document.createElementNS(svgNS, "text");
                    text.setAttributeNS(null,"font-size","15px");
                    text.setAttributeNS(null,"x", node.x);
                    text.setAttributeNS(null,"y", node.y);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'central');
                    text.textContent = node.node.name;
                    svg.appendChild(text);

                    // Node link
                    let anchor = document.createElementNS(svgNS, "a");
                    let link = document.createElementNS(svgNS, 'circle');
                    link.setAttribute("fill", "white");
                    link.setAttribute("fill-opacity", 0);
                    link.setAttribute("cx", node.x);
                    link.setAttribute("cy", node.y);
                    link.setAttribute("r", nodeRadius + nodeStrokeWidth / 2);
                    link.setAttribute('stroke-width', 0);
                    anchor.setAttribute('href', 'https://digit.cms.di.unipi.it/#/task/' + node.node.name);
                    anchor.appendChild(link);
                    svg.appendChild(anchor);
                    
                    // Animation
                    function updateCircle(frame) {
                        stroke.setAttribute("d", describeArc(node.x, node.y, nodeRadius, 0, scoreAngle / numFrames * (frame + 1)));
                        if(frame < numFrames - 1) {
                            setTimeout(function() {
                                updateCircle(frame + 1);
                            }, frameDelay);
                        }
                        if(frame == numFrames / 2) {
                            // Animation finished, fill in the links and draw the next nodes
                            for(let i = 0; i < node.children.length; i++) {
                                linkPaths[i].setAttribute('stroke', cat_to_color[node.children[i].node.category]);
                                setTimeout(function() {drawNode(node.children[i])}, animationDelay);
                            }
                        }
                    }
                    setTimeout(function() {updateCircle(0);}, frameDelay);
                }

                drawNode(treeData);
            }
        })
        .error(function(data, status, headers, config) {
            notificationHub.serverError(status);
        });
    }
);
