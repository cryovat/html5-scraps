// Namespaces

function Winterday() {
}

Winterday.Util = new function()
{
}

// Utility functions

Winterday.Util.wrapText = function(text, context, maxWidth) {
	
		var tokens = text.split(' ').reverse();
		var lines = new Array();
		var tmp = ''
		
		while (tokens.length > 0) {
		
			if (tmp.length > 0) tmp += ' ';
		
			if (context.measureText(tmp + tokens[tokens.length - 1]).width < maxWidth)
			{
				tmp += tokens.pop();
			}
			else 
			{
				lines.push(tmp);
				tmp = '';
			}
		}
		
		if (tmp.length > 0)
			lines.push(tmp);
			
		return lines;
}

Winterday.Util.getById = function(list, id) {
  for(var i in list) {
    if (list[i].id == id)
      return list[i];
  }
}

// Assets

Winterday.Assets = function() {

}

Winterday.Loadable =  function(src) {

  this.src = src;
  
	this.load = function (loadCallback)
	{
    this.image = new Image();
    this.image.addEventListener('load', loadCallback, false);
    this.image.src = this.src;
	}

}

Winterday.Loadable.loadableItems = 0;
Winterday.Loadable.loadedCount = 0;
Winterday.Loadable.allLoaded = function() {

  Winterday.Loadable.loadableItems == Winterday.Loadable.loadedCount;

}

Winterday.Loadable.loadingText = function() {

  return "Loading [" + Winterday.Loadable.loadedCount + "/" + Winterday.Loadable.loadableItems + "]";

}

Winterday.Loadable.loadAll = function(list) {
    
  Winterday.Loadable.loadableItems += list.length;
  for (var i in list) {
    list[i].load(function() { Winterday.Loadable.loadedCount += 1; console.info('Successfully loaded: ' + this.src); });
	}
    
}

function mouseoverSpot(s) {
  return (s.x < mouseX && mouseX < (s.x + s.width)) && (s.y < mouseY && mouseY < (s.y + s.height))
}

Winterday.Scene = function(src, id, title, description, hotspots, exits, intro, items)
{
    this.src = src;
    this.id = id;
    this.exits = exits;
    this.intro = intro;
	this.items = items;
    this.title = title;
    this.seen = false;
    this.hotspots = hotspots;
    this.description = description;
    this.draw = function(context) {
		context.save();
		context.fill = "#fff";
       context.drawImage(this.image, 0, 0);
	   
	   if (this.items) {
			for (var i = 0; i < this.items.length; i++)
			{
				var itemData = this.items[i];
				var item = Winterday.Util.getById(Winterday.Assets.items, itemData.id);
				
				if (!item.inventory)
					item.draw(context, itemData.x, itemData.y);
			}
	   }
	   
	   context.restore();
    }

	this.activeItem = function() {
		for (var i in this.items) {
      
        var s = this.items[i];
		var itemData = Winterday.Util.getById(Winterday.Assets.items, items[i].id);
        if (mouseoverSpot(s) && !itemData.inventory)
		{
          return itemData;
		}
      }
	}
 
    this.activeHotspot = function() {
      for (var i in hotspots) {
      
        var s = hotspots[i];
        if (mouseoverSpot(s))
          return s;
      }
    }
    
    this.getTargets = function (list) {
      var targets = new Array();
      
      targets.push({label: "Stay (" + this.title + ")", target: this.id});
      
      for (var e in exits) {
      
        for (var scene in list) {
        
          if (exits[e] == list[scene].id)
          {
            targets.push({label: list[scene].title, target: list[scene].id});
          }
                
        }
      
      }
      
      return targets;
    
    }
    
    /*
    this.handleClick = function() {
    
      if (!this.hotspots)
        return;
              
      var s = this.activeHotspot();
      
      if (s) {
        pushUi(new Array(tb));
        setScript(s.script);
      }
    }*/
}

Winterday.Scene.prototype = new Winterday.Loadable();

Winterday.Scene.setScene = function(scene) {
  Winterday.Scene.current = scene;
}

Winterday.Item = function(src, id, title, pickup, description) {
	this.src = src;
	this.id = id;
	this.title = title;
	this.pickup = pickup;
	this.description = description;
	this.inventory = false;
	this.draw = function(context, x, y) {	
		context.drawImage(this.image, x, y);	
	}
}

Winterday.Item.prototype = new Winterday.Loadable();

Winterday.Assets.items = [new Winterday.Item("box.png", "box", "Small red box", "boxget", "boxdesc")];
var scenes = [new Winterday.Scene('spawn.png', 'start', 'Hill', 'hill', [], ['oi'], "intro", [{id: "box", x: 100, y: 150, width: 16, height: 16}]),
    new Winterday.Scene('deadend.png', 'oi', 'Dead end', 'deadend-desc', [{x: 104, y: 36, width: 107, height: 58, script: 'goaway'}, {x: 55, y: 124, width: 64, height: 111, script: 'tracks'}], ['start'])];
var loadedScenes = 0;

function scenesLoaded() {
	return loadedScenes == scenes.length;
}

var i = 0;
var mouseX = -1;
var mouseY = -1;
var mouseDown = false;
var uiStack = new Array();
var controls = new Array();
var gradient;
var tb = null;
var exploreUI = null;
var sceneUI = null;
var choices = new Array();
var scripts = [
    ['intro', [
      {t: "Sheesh..."},
      {t: "Breakdown. In the middle of nowhere... In bloody faraway, inbred, ruddy, impoverished hicksville..."},
      {t: "It's cold here. I better find some shelter quick."}
    ]],
    ['hill', [
      {t: "It's a white vast hill..."},
    ]],
    ["west", [
    {
        t: "I plod westwards..."
    }, {
        t: "This road seems eerily familiar..."
    }, {
        t: "What can it be?"
    }, ]],
    ["east", [
    {
        setScene: 'oi'
    }, {
        t: "I turn eastwards and come upon a dead end."
    }]],
    ['goaway', [
      {t: "That's not very friendly, now is it?"}
    ]],
    ['tracks', [
      {t: "Tracks in the snow..."},
      {t: "Someone must have come by here recently."}
    ]],
    ['deadend-desc', [
      {t: "Figures. A sign of life and it's unfriendly..."}
    ]],
	['boxget', [
		{t: "Who left this little box lying around here?"}
	]],
	['boxdesc', [
		{t: "It's a mysterious red box..."}
	]],
];

var activeSeq = -1;
var seqIndex = -1;

var pushUi = function (ui) {
  uiStack.push(controls);
  controls = ui;
  
  return ui;
}

var popUi = function () {
  controls = uiStack.pop();
}

function setScript(name)
{
    for (i in scripts)
    {
        if (scripts[i][0] == name)
        {
            if (controls != sceneUi)
              pushUi(sceneUi);
            
            activeSeq = i;
            seqIndex = -1;
            advanceStory();            
            return;
        }
    }
    alert("Warning, script not found: " + name);
}

function current()
{
    return scripts[activeSeq][1];
}

function moveNext()
{
    seqIndex += 1;
    var c = current();
    return (seqIndex < c.length) ? c[seqIndex] : null;
}

function UIControl(x, y, width, height, tag) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.tag = tag;
    this.visible = true;
    this.acceptInput = true;
    
	this.draw = function(context, hot) {
	
	}
	
    this.isHot = function ()
    {
        return (this.acceptInput && (this.x < mouseX && mouseX < (this.x + this.width)) && (this.y < mouseY && mouseY < (this.y + this.height)));
    }
}

function HotspotControl() {
  this.x = 0;
  this.y = 0;
  this.width = 320;
  this.height = 240;
  
  this.click = function() {

	  
	  var i = Winterday.Scene.current.activeItem();
      var s = Winterday.Scene.current.activeHotspot();
      
	  if (i) {
		pushUi(new Array(tb));
		i.inventory = true;
		setScript(i.pickup);
	  }
      else if (s) {
        pushUi(new Array(tb));
        setScript(s.script);
      }
      else if (Winterday.Scene.current.description)
      {
        pushUi(new Array(tb));
        setScript(Winterday.Scene.current.description);        
      }
      
  }
}

HotspotControl.prototype = new UIControl();

function box(x, y, width, height, tag)
{
    this.fill = '#d00';
    this.stroke = '#FFF';
    this.hot = '#f00';
    this.down = '#F88';
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.acceptInput = true;
    this.visible = true;
    this.tag = tag;
    this.draw = function (context, hot)
    {
        if (!this.visible) return;
		//console.info("Drawing box: " + this.x + ":" + this.y + " at " + this.width + "x" + this.height);
        context.save();
        context.shadowOffsetX = 5;
        context.shadowOffsetY = 5;
        context.shadowBlur = 4;
        context.shadowColor = 'rgba(0,0,0, 0.5)';
        context.fillRect(this.x, this.y, this.width, this.height);
        context.restore();
        context.save();
        context.fillStyle = (this.acceptInput && this.isHot()) ? ((mouseDown) ? this.down : this.hot) : this.fill;
        context.fillRect(this.x, this.y, this.width, this.height);
        context.strokeStyle = this.stroke;
        context.strokeRect(this.x, this.y, this.width, this.height);
        if (this.drawContent) this.drawContent(context, hot);
        context.restore();
    }
	
	    this.isHot = function ()
    {
        return (this.acceptInput && (this.x < mouseX && mouseX < (this.x + this.width)) && (this.y < mouseY && mouseY < (this.y + this.height)));
    }
}

box.prototype = new UIControl();

function button(x, y, width, height, text, click, tag)
{
    var o = new box(x, y, width, height, tag);
    o.text = text;
    o.click = click;
    o.drawContent = function (context, hot)
    {
        context.fillStyle = '#FFF';
        context.textBaseline = 'middle';
        context.textAlign = "center";
        context.fillText(this.text, this.x + (this.width / 2), this.y + (this.height / 2));
        context.textAlign = 'center';
    }
    return o;
}

Winterday.Controls = function() {}

Winterday.Controls.InventoryButton = function(x, y, item)
{
	this.x = x;
	this.fill = "black";
	this.y = y;
	this.width = Winterday.Controls.InventoryButton.ITEM_WIDTH + Winterday.Controls.InventoryButton.PADDING * 2;
	this.height = Winterday.Controls.InventoryButton.ITEM_HEIGHT + Winterday.Controls.InventoryButton.PADDING * 2;
	this.item = item;
	this.drawContent = function (context, hot) {
		context.drawImage(this.item.image, this.x + Winterday.Controls.InventoryButton.PADDING, this.y + Winterday.Controls.InventoryButton.PADDING, Winterday.Controls.InventoryButton.ITEM_WIDTH, Winterday.Controls.InventoryButton.ITEM_HEIGHT);
	}
	this.click = function() {
		setScript(this.item.description);
	}
}

Winterday.Controls.InventoryButton.ITEM_WIDTH = 32;
Winterday.Controls.InventoryButton.ITEM_HEIGHT = 32;
Winterday.Controls.InventoryButton.PADDING = 4;
Winterday.Controls.InventoryButton.prototype = new box();

function Textbox(x, y, width, height, content, tag)
{
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.tag = tag;
    this.fill = null;
    this.content = content;
    this.current = '';
    this.paddingX = 4;
    this.paddingY = 2;
    this.setText = function (text, block)
    {
      if (!this.visible) this.visible = true;
    
        this.current = '';
        this.content = text;
        this.acceptInput = !block;
    }
    this.drawContent = function (context, hot)
    {
        if (!this.fill)
        {
            var gradient = context.createLinearGradient(0, this.y, 0, y + this.height);
            gradient.addColorStop(0, '#6699FF');
            gradient.addColorStop(1, '#CCCCFF');
            this.fill = gradient;
            this.hot = gradient;
            this.down = '#00EEFF';
        }
        if (this.content && this.current.length < this.content.length)
        {
            this.current = this.content.substring(0, this.current.length + 1);
            //this.acceptInput = this.current.length == this.content.length;
        }
        else
        {
            this.current = this.content;
        }
        context.fillStyle = "#FFF";
        context.textBaseline = "top";
        context.textAlign = "left";
		
		var lines = Winterday.Util.wrapText(this.current, context, this.width);
		
		for (var i = 0; i < lines.length; i++)
		{
		    context.fillText(lines[i], this.x + this.paddingX, this.y + this.paddingY + (i * 14));
		}
    }
}

Textbox.prototype = new box();

function advanceStory()
{
    if (!current())
    {
        alert("No active sequence!");
    }
    else
    {
        var cmd = moveNext();
        if (!cmd)
        {
        
          popUi();
          
          //if (!controls && Scene.current && Scene.current.hotspots)
          //{
            pushUi(exploreUi);
          //}
            
          return;
        }
        else if (cmd.t)
        {
            tb.setText(cmd.t);
            return;
        }
        else if (cmd.presentChoice)
        {
            tb.setText(cmd.presentChoice, true);
            presentChoices(choices, setScript, new Array(tb));
            return;
        }
        else if (cmd.addChoice)
        {
            choices.push(
            {
                label: cmd.addChoice,
                target: cmd.target
            });
        }
        else if (cmd.setScene)
        {
            setScene(cmd.setScene, true);
        }
        
        advanceStory();
    }
}

function setScene(id, blockIntro) {
  Winterday.Scene.current = Winterday.Util.getById(scenes, id);
  
  if (!Winterday.Scene.current.seen && !blockIntro && Winterday.Scene.current.intro) {
  
    Winterday.Scene.current.seen = true;
    setScript(Winterday.Scene.current.intro);
  
  }
}

function handleClick()
{
    for (var i in controls)
    {
        if (controls[i] && controls[i].isHot())
        {
          if (controls[i].click)
            controls[i].click();

          return;
        }
    }
}
function presentChoices(choices, f, extraControls)
{
    pushUi((extraControls) ? extraControls : new Array());

    var y = 0;
    var ctrlCount = controls.length;
    var numChoices = choices.length;
    var onclick = function ()
    {
        popUi();
        f(this.tag);
    }
    while (choices.length > 0)
    {
        var choice = choices.pop();
        controls.push(button(20, 20 + y, 280, 20, choice.label, onclick, choice.target));
        y += 30;
    }
}
function draw(canvas, context)
{
    if(!Winterday.Loadable.allLoaded())
    {
		context.fillStyle = '#d00';
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		if (Winterday.Scene.current) {
			Winterday.Scene.current.draw(context);
		}
		
		for (var i in controls)
		{
			controls[i].draw(context, false);
		}
		
    }
    else {
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fff';
      context.textBaseline = "top";
      context.textAlign = "left";
      context.fillText(Winterday.Loadable.loadingText(), 10, 10);
    }
}

function showNav() {

  presentChoices(Winterday.Scene.current.getTargets(scenes), setScene);

}

function showInventory() {

  var inventory = new Array();
  var items = Winterday.Assets.items;

	for (var i = 0; i < items.length; i++) {
    inventory.push(new Winterday.Controls.InventoryButton(15 + i * Winterday.Controls.InventoryButton.ITEM_WIDTH, 15, items[i]));
  }
  
  inventory.push(button(73, 146,174, 30, "Back", popUi));
  
  pushUi(inventory);

}

window.addEventListener('load', function ()
{
    var elem = document.getElementById('myCanvas');
    if (elem && elem.getContext)
    {
        elem.onmousedown = function (e)
        {
            mouseDown = true;
        }
        elem.onmouseup = function (e)
        {
            mouseDown = false;
            handleClick();
        }
        elem.onmousemove = function (e)
        {
            mouseX = e.clientX - elem.offsetLeft;
            mouseY = e.clientY - elem.offsetTop;
        }
        elem.onmouseout = function (e)
        {
            mouseX = -1;
            mouseY = -1;
            mouseDown = false;
        }
        var context = elem.getContext('2d');
        if (context)
        {
            this.fill = gradient;
            context.font = 'bold 12px Arial'
            setInterval(function ()
            {
                draw(elem, context);
            }, 1000 / 30);
            tb = new Textbox(10, 166, 300, 64, 'Loading...');
            tb.click = advanceStory;
            sceneUi = new Array(tb);
            exploreUi = new Array(button(10, 210, 40, 20, 'Move', showNav), button(270, 210, 40, 20, 'Inv', showInventory), new HotspotControl());
            Winterday.Loadable.loadAll(scenes);
			Winterday.Loadable.loadAll(Winterday.Assets.items);
            setScene("start");
        }
    }
}, false);

