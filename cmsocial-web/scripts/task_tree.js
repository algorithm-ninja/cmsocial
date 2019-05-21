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
            console.log(userManager.getUser().username);
            //console.log(data.tasks);

            //Build the tree according to the level of the tasks
            function onlyUnique(value, index, self) { 
                return self.indexOf(value) === index;
            }

            var catList = []
            var cat2Tasks = {}
            for (var i = 0; i < data.tasks.length; i++) {
                catList.push(t[i].category);
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

            cat2Tasks["intro"].sort(cmp);
            var treeData = {
                "name": cat2Tasks["intro"][0].name,
                "parent": "null",
                "children": []
            };

            var par = treeData;
            for (var j = 1; j < cat2Tasks["intro"].length; j++) {
                var cur = {
                    "name": cat2Tasks["intro"][j]["name"],
                    "parent": par["name"],
                    "children": []
                };
                par["children"].push(cur);
                par = cur;
            }
            var secondRoot = par;

            for (var i = 0; i < catList.length; i++) {
                if (catList[i] == "intro") {
                    continue;
                }
                cat2Tasks[catList[i]].sort(cmp);
                var par = secondRoot;
                for (var j = 0; j < cat2Tasks[catList[i]].length; j++) {
                    var cur = {
                        "name": cat2Tasks[catList[i]][j]["name"],
                        "parent": par["name"],
                        "children": []
                    };
                    par["children"].push(cur);
                    par = cur;
                }
            }
              
            // ************** Generate the tree diagram	 *****************
            var margin = {top: 40, right: 120, bottom: 20, left: 120},
                width = 960 - margin.right - margin.left,
                height = 800 - margin.top - margin.bottom;
                
            var i = 0;
            
            var tree = d3.layout.tree()
                .size([height, width]);
            
            var diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.x, d.y]; });
            
            var svg = d3.select("gemmadiv").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            var root = treeData;
            
            update(root);
            
            function update(source) {
            
                // Compute the new tree layout.
                var nodes = tree.nodes(root).reverse(),
                    links = tree.links(nodes);
                
                // Normalize for fixed-depth.
                nodes.forEach(function(d) { d.y = d.depth * 100; });
                
                // Declare the nodes
                var node = svg.selectAll("g.node")
                    .data(nodes, function(d) { return d.id || (d.id = ++i); });
                
                // Enter the nodes.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { 
                        return "translate(" + d.x + "," + d.y + ")"; });

                var path1 = svg.append('path')
                    .attr("class", "circle-bg")
                    .attr("d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");

                var path2 = svg.append('path')
                    .attr("class", "circle")
                    .attr("stroke-dasharray", "30, 100")
                    //.attr("stroke", "#ff9f00")
                    .attr("d", "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831");

                                
                nodeEnter.append("text")
                    .attr("y", function(d) { 
                        return d.children || d._children ? -18 : 18; })
                    .attr("dy", ".35em")
                    .attr("text-anchor", "middle")
                    .text(function(d) { return d.name; })
                    .style("fill-opacity", 1);
                
                // Declare the links…
                var link = svg.selectAll("path.link")
                    .data(links, function(d) { return d.target.id; });
                
                // Enter the links.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .attr("d", diagonal);
            }
        })
        .error(function(data, status, headers, config) {
            notificationHub.serverError(status);
        });
    }
);
