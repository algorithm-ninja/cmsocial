'use strict';

/* Tasks page */

angular.module('cmsocial').controller('TaskTree', function(
    $scope, $stateParams, $state, $http, notificationHub,
    userManager, l10n, API_PREFIX) {
        $http.post(API_PREFIX + 'task', {
            'tag' : 'tree', // can be null
            'first' : 0,
            'last' : 50,
            'username' : userManager.getUser().username,
            'token' : userManager.getUser().token,
            'action' : 'list'
        })
        .success(function(data, status, headers, config) {
            $scope.tasks = data['tasks'];

            //Build the tree according to the level of the tasks
            var dynTree = {
                "name": "my root",
                "parent": "null",
                "children": []
            };

            dynTree.children = {
                "name": "bay",
                "parent": dynTree.name,
                "children": []
            };

            console.log(dynTree);
            console.log($state);
            var treeData = {
                "name": "Top Level",
                "parent": "null",
                "children": [
                {
                    "name": "Level 2: A",
                    "parent": "Top Level",
                    "children": [
                    {
                        "name": "Son of A",
                        "parent": "Level 2: A"
                    },
                    {
                        "name": "Daughter of A",
                        "parent": "Level 2: A"
                    }
                    ]
                },
                {
                    "name": "Level 2: B",
                    "parent": "Top Level"
                }
                ]
            };
              
              // ************** Generate the tree diagram	 *****************
              var margin = {top: 40, right: 120, bottom: 20, left: 120},
                  width = 960 - margin.right - margin.left,
                  height = 500 - margin.top - margin.bottom;
                  
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
              
                // Declare the nodes…
                var node = svg.selectAll("g.node")
                    .data(nodes, function(d) { return d.id || (d.id = ++i); });
              
                // Enter the nodes.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) { 
                        return "translate(" + d.x + "," + d.y + ")"; });
              
                nodeEnter.append("circle")
                    .attr("r", 10)
                    .style("fill", "#fff");
              
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
