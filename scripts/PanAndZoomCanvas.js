let canvas = document.getElementById("canvas");
let ctx = canvas.getContext('2d')
let cnt = document.getElementById("cnt")

let cameraOffset = { x: 0, y: 0 };

let cameraZoom = 1
let MAX_ZOOM = 1.5
let MIN_ZOOM = 0.4
let SCROLL_SENSITIVITY = 0.0005

let isDragging = false
let dragStart = { x: 0, y: 0 }

let initialPinchDistance = null
let lastZoom = cameraZoom

let tree = null;
let nodes = [];

canvas.addEventListener("click", function (event) {
	var rect = canvas.parentNode.getBoundingClientRect();
	var x = ((event.pageX - canvas.offsetLeft - rect.width  / 2) * (1 / cameraZoom)) - cameraOffset.x;
	var y = ((event.pageY - canvas.offsetTop  - rect.height / 2) * (1 / cameraZoom)) - cameraOffset.y;
	
	var selectedNode = null;
	
	for (var i = 0; i < nodes.length; i++) {
		if (x > nodes[i].xPos && y > nodes[i].yPos && x < nodes[i].xPos + nodes[i].width && y < nodes[i].yPos + nodes[i].height) {
			nodes[i].selected = true;
			
			selectedNode = nodes[i];
		} else {
			nodes[i].selected = false;
		}
	}
	
	canvas.dispatchEvent(new CustomEvent('nodeSelected', { detail: selectedNode != null ? selectedNode.data : null } ));
	
}, false);

canvas.addEventListener("mousemove", function (event) {
	var rect = canvas.parentNode.getBoundingClientRect();
	var x = ((event.pageX - canvas.offsetLeft - rect.width  / 2) * (1 / cameraZoom)) - cameraOffset.x;
	var y = ((event.pageY - canvas.offsetTop  - rect.height / 2) * (1 / cameraZoom)) - cameraOffset.y;
	for (var i = 0; i < nodes.length; i++) {
		if (x > nodes[i].xPos && y > nodes[i].yPos && x < nodes[i].xPos + nodes[i].width && y < nodes[i].yPos + nodes[i].height) {
			canvas.style.cursor = "pointer";
			break;
		}
		else {
			canvas.style.cursor = "auto";
		}
	}
}, false);

function draw()
{
	var rect = canvas.parentNode.getBoundingClientRect();
	canvas.width = rect.width;
	canvas.height = rect.height;
    
    // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at
    ctx.translate( rect.width / 2, rect.height / 2 );
    ctx.scale(cameraZoom, cameraZoom);
    ctx.translate( cameraOffset.x,  cameraOffset.y );
    ctx.clearRect(-rect.width / 2, -rect.height / 2, rect.width, rect.height);
	
	if (tree != null)
	{
		TREE.draw(ctx, tree);
	}
	
	/*
	ctx.beginPath();
	ctx.moveTo(-rect.width/2, -rect.height/2);
	ctx.lineTo(+rect.width/2, -rect.height/2);
	ctx.lineTo(+rect.width/2, +rect.height/2);
	ctx.lineTo(-rect.width/2, +rect.height/2);
	ctx.lineTo(-rect.width/2, -rect.height/2);
	ctx.stroke();
	
	var box = TREE.getBounds(tree);
	
	ctx.beginPath();
	ctx.moveTo(box.minX, box.minY);
	ctx.lineTo(box.maxX, box.minY);
	ctx.lineTo(box.maxX, box.maxY);
	ctx.lineTo(box.minX, box.maxY);
	ctx.lineTo(box.minX, box.minY);
	ctx.stroke();
	*/
	
	ctx.translate( -cameraOffset.x,  -cameraOffset.y );
	ctx.scale(1.0 / cameraZoom, 1.0 / cameraZoom);
	
	let zoomTextOffset = {x: 10, y: 10};
	ctx.textBaseline = 'top';
	ctx.font = 'bold 16px Droid Sans Mono';
	ctx.fillStyle = "#373E44";
	ctx.fillText("x" + cameraZoom.toFixed(2), -rect.width / 2 + zoomTextOffset.x, -rect.height / 2 + zoomTextOffset.y);

    requestAnimationFrame( draw );
}

function populateDummyData(tree) {
    tree.addChild(TREE.create("Aerion dfg dgdf gdf g"));
    tree.addChild(TREE.create("Daeron", TREE.STATE_PROCESSED));
    tree.addChild(TREE.create("Aemon"));
    tree.addChild(TREE.create("Aegon V", TREE.STATE_PROCESSED));
    tree.addChild(TREE.create("Rhae"));
    tree.addChild(TREE.create("Daella"));
    tree.getChildAt(0).addChild(TREE.create("Maegor", TREE.STATE_PROCESSED));
    tree.getChildAt(1).addChild(TREE.create("Vaella"));
    tree.getChildAt(3).addChild(TREE.create("Duncan"));
    tree.getChildAt(3).addChild(TREE.create("Jaehaerys II"));
    tree.getChildAt(3).addChild(TREE.create("Shaera", TREE.STATE_PROCESSED));
    tree.getChildAt(3).addChild(TREE.create("Daeron"));
    tree.getChildAt(3).addChild(TREE.create("Rhaelle"));
    tree.getDescendent(11).addChild(TREE.create("Aerys II"));
    tree.getDescendent(11).addChild(TREE.create("Rhaella"));
    tree.getDescendent(15).addChild(TREE.create("Rhaegar", TREE.STATE_ACTIVE));
    tree.getDescendent(15).addChild(TREE.create("Shaena"));
    tree.getDescendent(15).addChild(TREE.create("Daeron"));
    tree.getDescendent(15).addChild(TREE.create("Aegon"));
    tree.getDescendent(15).addChild(TREE.create("Jaehaerys"));
    tree.getDescendent(15).addChild(TREE.create("Viserys"));
    tree.getDescendent(15).addChild(TREE.create("Daenerys"));
    tree.getDescendent(17).addChild(TREE.create("Rhaenys", TREE.STATE_COMPLETE));
    tree.getDescendent(17).addChild(TREE.create("Aegon"));
    tree.getDescendent(23).addChild(TREE.create("Rhaego"));
}


canvas.addEventListener('mousedown', onPointerDown)
canvas.addEventListener('touchstart', (e) => handleTouch(e, onPointerDown))
canvas.addEventListener('mouseup', onPointerUp)
canvas.addEventListener('touchend',  (e) => handleTouch(e, onPointerUp))
canvas.addEventListener('mousemove', onPointerMove)
canvas.addEventListener('touchmove', (e) => handleTouch(e, onPointerMove))
canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY))


// Ready, set, go
draw()



// Gets the relevant location from a mouse or single touch event
function getEventLocation(e)
{
    if (e.touches && e.touches.length == 1)
    {
        return { x:e.touches[0].clientX, y: e.touches[0].clientY }
    }
    else if (e.clientX && e.clientY)
    {
        return { x: e.clientX, y: e.clientY }        
    }
}

function drawRect(x, y, width, height)
{
    ctx.fillRect( x, y, width, height )
}


function onPointerDown(e)
{
    isDragging = true
    dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
    dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
}

function onPointerUp(e)
{
    isDragging = false
    initialPinchDistance = null
    lastZoom = cameraZoom
}

function onPointerMove(e)
{
    if (isDragging)
    {
        cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
        cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
    }
}

function handleTouch(e, singleTouchHandler)
{
    if ( e.touches.length == 1 )
    {
        singleTouchHandler(e)
    }
    else if (e.type == "touchmove" && e.touches.length == 2)
    {
        isDragging = false
        handlePinch(e)
    }
}

function handlePinch(e)
{
    e.preventDefault()
    
    let touch1 = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    let touch2 = { x: e.touches[1].clientX, y: e.touches[1].clientY }
    
    // This is distance squared, but no need for an expensive sqrt as it's only used in ratio
    let currentDistance = (touch1.x - touch2.x)**2 + (touch1.y - touch2.y)**2
    
    if (initialPinchDistance == null)
    {
        initialPinchDistance = currentDistance
    }
    else
    {
        adjustZoom( null, currentDistance/initialPinchDistance )
    }
}

function adjustZoom(zoomAmount, zoomFactor)
{
    if (!isDragging)
    {
        if (zoomAmount)
        {
            cameraZoom += zoomAmount
        }
        else if (zoomFactor)
        {
            console.log(zoomFactor)
            cameraZoom = zoomFactor*lastZoom
        }
        
        cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
    }
}