var TREE = (function () {
    "use strict";
	
    var uID = 0,
	//TODO: Add data structure to store: First, Middle, Last Name, DOB, Age, etc.
	Tree = function (data, text, state) {
		this.uid = uID += 1;
		this.parentId = -1;
		this.text = text;
		this.width = 250;
		this.height = 50;
		this.color = "#777777";
		this.bgcolor = "#292E33";
		this.treeData = {};
		this.xPos = 0;
		this.yPos = 0;
		this.prelim = 0;
		this.modifier = 0;
		this.leftNeighbor = null;
		this.rightNeighbor = null;
		this.parentTree = null;
		this.children = [];
		this.state = state || 0;
		this.selected = false;
		this.data = data;
	};
	
    /**
     * Gets the vertical level of the tree.
     * @return {number} The number of levels from the root node.
     */
    Tree.prototype.getLevel = function () {
        return this.parentId === -1 ? 0 : this.parentTree.getLevel() + 1;
    };

    Tree.prototype.numChildren = function () {
        return this.children.length;
    };

    Tree.prototype.getLeftSibling = function () {
        return this.leftNeighbor && this.leftNeighbor.parentTree === this.parentTree ? this.leftNeighbor : null;
    };

    Tree.prototype.getRightSibling = function () {
        return this.rightNeighbor && this.rightNeighbor.parentTree === this.parentTree ? this.rightNeighbor : null;
    };

    Tree.prototype.getChildAt = function (index) {
        return this.children[index];
    };

    Tree.prototype.getChild = function (id) {
        var i;
        for (i = 0; i < this.children.length; i++) {
            if (this.children[i].uid === id) {
                return this.children[i];
            }
        }
    };

    Tree.prototype.getChildrenCenter = function () {
        var firstChild = this.getFirstChild(),
            lastChild = this.getLastChild();
        return firstChild.prelim + (lastChild.prelim - firstChild.prelim + lastChild.width) / 2;
    };

    Tree.prototype.getFirstChild = function () {
        return this.getChildAt(0);
    };

    Tree.prototype.getLastChild = function () {
        return this.getChildAt(this.numChildren() - 1);
    };

    Tree.prototype.addChild = function (tree) {
        tree.parentTree = this;
        tree.parentId = this.uid;
        this.children.push(tree);
    };

    Tree.prototype.getDescendent = function (id) {
        var children = this.children;
        var found;
        if (this.getChild(id)) {
            return this.getChild(id);
        }
        else {
            for (var i = 0; i < children.length; i++) {
                found = children[i].getDescendent(id);
                if (found) {
                    return found;
                }
            }
        }
    };

    return {
		STATE_WAITING  : 0,
		STATE_ACTIVE   : 1,
		STATE_COMPLETE : 2,
		STATE_PROCESSED : 3,
		
        create: function (data, text, state) {
            return new Tree(data, text, state);
        },

        destroy: function (tree) {
            if (!tree.parentTree) {
                alert("Removing root node not supported at this time");
                return;
            }
            var children = tree.parentTree.children;
            for (var i = 0; i < children.length; i++) {
                if (children[i].uid === tree.uid) {
                    children.splice(i, 1);
                    break;
                }
            }
        },
		
		getBounds: function (tree) {
            var nodeList = TREE.getNodeList(tree);
			
			var bounds = {minX: Number.MAX_VALUE, minY: Number.MAX_VALUE, maxX: Number.MIN_VALUE, maxY: Number.MIN_VALUE};
			
            for (var i = 0; i < nodeList.length; i++) {
                if(nodeList[i].xPos < bounds.minX) bounds.minX = nodeList[i].xPos;
				if(nodeList[i].yPos < bounds.minY) bounds.minY = nodeList[i].yPos;
                if(nodeList[i].xPos + nodeList[i].width  > bounds.maxX) bounds.maxX = nodeList[i].xPos + nodeList[i].width;
				if(nodeList[i].yPos + nodeList[i].height > bounds.maxY) bounds.maxY = nodeList[i].yPos + nodeList[i].height;
            }
			
            return bounds;
        },

        getNodeList: function (tree) {
            var nodeList = [];
            nodeList.push(tree);
            for (var i = 0; i < tree.numChildren(); i++) {
                nodeList = nodeList.concat(this.getNodeList(tree.getChildAt(i)));
            }
            return nodeList;
        },

        clear: function (context) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        },

        //TODO: Refactor firstwalk, secondwalk, apportion to be more readable, consise.
        draw: function (context, tree) {
            var config = {
                    maxDepth: 100,
                    levelSeparation: 40,
                    siblingSeparation: 20,
                    subtreeSeparation: 20,
                    topXAdjustment: 0,
                    topYAdjustment: 20
                },
                maxLevelHeight = [],
                maxLevelWidth = [],
                previousLevelTree = [],
                rootXOffset = 0,
                rootYOffset = 0,

                setLevelHeight = function (tree, level) {
                    maxLevelHeight[level] = tree.height;
                },

                setLevelWidth = function (tree, level) {
                    maxLevelWidth[level] = tree.width;
                },

                setNeighbors = function (tree, level) {
                    tree.leftNeighbor = previousLevelTree[level];
                    if (tree.leftNeighbor)
                        tree.leftNeighbor.rightNeighbor = tree;
                    previousLevelTree[level] = tree;
                },

            //Determine the leftmost descendent of a node at a given depth.
            //This seems to be incorrect
                getLeftMost = function (tree, level, maxlevel) {
                    if (level >= maxlevel) return tree;
                    if (tree.numChildren() === 0) return null;
                    var n = tree.numChildren();
                    for (var i = 0; i < n; i++) {
                        var iChild = tree.getChildAt(i);
                        var leftmostDescendant = getLeftMost(iChild, level + 1, maxlevel);
                        if (leftmostDescendant !== null)
                            return leftmostDescendant;
                    }
                    return null;
                },

                getNodeSize = function (tree) {
                    return tree.width;
                },

            //TODO: This needs to be reworked...such ulgy...much sadness
                apportion = function (tree, level) {
                    var firstChild = tree.getFirstChild(),
                        firstChildLeftNeighbor = firstChild.leftNeighbor,
                        modifierSumRight,
                        modifierSumLeft,
                        rightAncestor,
                        leftAncestor,
                        totalGap,
                        subtreeAux,
                        numSubtrees,
                        subtreeMoveAux,
                        singleGap;
						
                    for (var k = config.maxDepth - level, j = 1; firstChild && firstChildLeftNeighbor && j <= k;) {
                        modifierSumRight = 0;
                        modifierSumLeft = 0;
                        rightAncestor = firstChild;
                        leftAncestor = firstChildLeftNeighbor;
                        for (var l = 0; l < j; l++) {
                            rightAncestor = rightAncestor.parentTree;
                            leftAncestor = leftAncestor.parentTree;
                            modifierSumRight += rightAncestor.modifier;
                            modifierSumLeft += leftAncestor.modifier;
                        }
                        totalGap = (firstChildLeftNeighbor.prelim + modifierSumLeft + getNodeSize(firstChildLeftNeighbor) + config.subtreeSeparation) - (firstChild.prelim + modifierSumRight);
                        if (totalGap > 0) {
                            subtreeAux = tree;
                            numSubtrees = 0;
                            while(subtreeAux && subtreeAux != leftAncestor){
                                numSubtrees++;
                                subtreeAux = subtreeAux.getLeftSibling();
                            }
                            if (subtreeAux) {
                                subtreeMoveAux = tree;
                                singleGap = totalGap / numSubtrees;
                                while(subtreeMoveAux != leftAncestor){
                                    subtreeMoveAux.prelim += totalGap;
                                    subtreeMoveAux.modifier += totalGap;
                                    totalGap -= singleGap;
                                    subtreeMoveAux = subtreeMoveAux.getLeftSibling();
                                }
                            }
                        }
                        if (!firstChild.numChildren())
                            firstChild = getLeftMost(tree, 0, ++j);
                        else
                            firstChild = firstChild.getFirstChild();
                        if (firstChild)
                            firstChildLeftNeighbor = firstChild.leftNeighbor;
                    }
                },

                firstWalk = function (tree, level) {
                    var leftSibling = null;
                    tree.xPos = 0;
                    tree.yPos = 0;
                    tree.prelim = 0;
                    tree.modifier = 0;
                    tree.leftNeighbor = null;
                    tree.rightNeighbor = null;
                    setLevelHeight(tree, level);
                    setLevelWidth(tree, level);
                    setNeighbors(tree, level);
                    if (tree.numChildren() === 0 || level == config.maxDepth) {
                        leftSibling = tree.getLeftSibling();
                        if (leftSibling !== null)
                            tree.prelim = leftSibling.prelim + getNodeSize(leftSibling) + config.siblingSeparation;
                        else
                            tree.prelim = 0;
                    }
                    else {
                        var n = tree.numChildren();
                        for (var i = 0; i < n; i++) {
                            firstWalk(tree.getChildAt(i), level + 1);
                        }
                        var midPoint = tree.getChildrenCenter();
                        midPoint -= getNodeSize(tree) / 2;
                        leftSibling = tree.getLeftSibling();
                        if (leftSibling) {
                            tree.prelim = leftSibling.prelim + getNodeSize(leftSibling) + config.siblingSeparation;
                            tree.modifier = tree.prelim - midPoint;
                            apportion(tree, level);
                        }
                        else {
                            tree.prelim = midPoint;
                        }
                    }
                },

                secondWalk = function (tree, level, X, Y) {
                    if (level <= config.maxDepth) {
                        tree.xPos = rootXOffset + tree.prelim + X;
                        tree.yPos = rootYOffset + Y;
                        if (tree.numChildren())
                            secondWalk(tree.getFirstChild(), level + 1, X + tree.modifier, Y + maxLevelHeight[level] + config.levelSeparation);
                        var rightSibling = tree.getRightSibling();
                        if (rightSibling)
                            secondWalk(rightSibling, level, X, Y);
                    }
                },

                findMinX = function (tree) {
                    var nodes = TREE.getNodeList(tree);
                    var min = 0;
                    for (var i = 0; i < nodes.length; i++){
                        if(nodes[i].xPos < min)
                            min = nodes[i].xPos;
                    }
                    return min;
                },

                positionTree = function (tree) {
                    maxLevelHeight = [];
                    maxLevelWidth = [];
                    previousLevelTree = [];
                    firstWalk(tree, 0);
                    rootXOffset = config.topXAdjustment + tree.xPos;
                    rootYOffset = config.topYAdjustment + tree.yPos;
                    secondWalk(tree, 0, 0, 0);
                    rootXOffset += Math.abs(findMinX(tree));
                    secondWalk(tree, 0, 0, 0);
                },
				
                treeColor = function (tree) {
					if (tree.state == TREE.STATE_PROCESSED)
					{
						return tree.selected ? '#693B2F' : '#3F2923';
					}
					
                    if (tree.state == TREE.STATE_COMPLETE)
					{
						return tree.selected ? '#3A641C' : '#2F411F';
					}
					
                    if (tree.state == TREE.STATE_ACTIVE)
					{
						return tree.selected ? '#772844' : '#411F2B';
					}
					
					return tree.selected ? '#3A4651' : '#292E33';
                },

                drawSelection = function (tree) {
					if (tree.selected) {
						context.beginPath();
						context.moveTo(tree.xPos, tree.yPos);
						context.lineTo(tree.xPos, tree.yPos + tree.height);
						context.lineTo(tree.xPos + tree.width, tree.yPos + tree.height);
						context.lineTo(tree.xPos + tree.width, tree.yPos);
						context.lineTo(tree.xPos, tree.yPos);
						context.closePath();
					
						context.lineWidth = 2;
						context.strokeStyle = '#8C9CAD';
						context.stroke();
					}
					
                    for (var i = 0; tree.numChildren() > 0 && i < tree.numChildren(); i++) {
                        drawSelection(tree.getChildAt(i));
                    }
                },
				
				drawNode = function (tree) {
                    var x = tree.xPos,
                        y = tree.yPos,
                        width = tree.width,
                        height = tree.height,
                        text = tree.text;

					context.fillStyle = treeColor(tree);
                    context.beginPath();
                    context.moveTo(x, y);
                    context.lineTo(x, y + height);
                    context.lineTo(x + width, y + height);
                    context.lineTo(x + width, y);
                    context.lineTo(x, y);
					context.closePath();
					
                    context.fill();
					
					context.lineWidth = 2;
					context.strokeStyle = '#292E33';

                    if (tree.children.length > 0) {
                        context.beginPath();
                        context.moveTo(x + width / 2, y + height);
                        context.lineTo(x + width / 2, y + height + config.levelSeparation / 2);
                        context.moveTo(tree.getFirstChild().xPos + tree.getFirstChild().width / 2, y + height + config.levelSeparation / 2);
                        context.lineTo(tree.getLastChild().xPos + tree.getLastChild().width / 2, y + height + config.levelSeparation / 2);
                        context.stroke();
                    }
					
                    if (tree.parentId != -1) {
                        context.beginPath();
                        context.moveTo(x + width / 2, y);
                        context.lineTo(x + width / 2, y - config.levelSeparation / 2);
                        context.stroke();
                    }
					
					context.textBaseline = 'middle';
					context.font = 'bold 12px Droid Sans Mono';
					context.fillStyle = "#BFBFBF";
                    context.fillText(text, (x + width / 2) - context.measureText(text).width / 2, y + height / 2);
					
                    for (var i = 0; tree.numChildren() > 0 && i < tree.numChildren(); i++) {
                        drawNode(tree.getChildAt(i));
                    }
                };

            positionTree(tree);
            this.clear(context);
            drawNode(tree);
			drawSelection(tree);
        }
		
		
    };
}());