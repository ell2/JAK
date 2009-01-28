/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

/**
 * @overview Prace s VML
 * @version 3.0
 * @author Wendigo, Zara
 */ 

/**
 * Tento soubor obsahuje vetsi mnozstvi hacku, zpusobenych primarne VML nekompatibilitou IE6/7 a IE8rc1. Jmenujme zejmena tyto:
 * 1) namespaces.add MUSI obsahovat treti parametr, bez nej se nezapne VML v IE8
 * 2) stylesheet s vml\:* MUSI byt pritomen, bez nej se v IE6/7 nerenderuje pruhlednost a oble konce car
 * 3) IE8 neumoznuje zmenu atributu prvku pres setAttribute, ale jen pres primy pristup k vlastnosti
 * 4) IE8 neumi vyrobit vml:shape pres createElement - je nutno pouzit innerHTML nejakeho rodice
 * 5) IE8 nerespektuje podznacky vml:fill a vml:stroke pridane za behu - je nutno je mit pritomny uz pri vyrobe prvku
 * 6) Prvky lze vyrabet pouze v kontejneru, ktery je pripnuty do stranky (proto constructor.tmp)
 * 7) Prvkum lze menit vlastnosti jen pokud jsou pripnuty do stranky (proto constructor.storage)
 *
 * Dusledek: nove prvky se vyrabi pres innerHTML prvku constructor.tmp a pak se presouvaji do constructor.storage, kde
 * se jim daji menit vlastnosti a nebudou prepsany pri tvorbe dalsiho prvku. Je velmi doporuceno _nemit_ ve strance deklaraci
 * prefixu vml:, nebot bude s nejvetsi pravdepodobnosti stejne spatne.
 */

 
/**
 * @class VML
 * @augments SZN.Vector.Canvas
 */ 
SZN.VML = SZN.ClassMaker.makeClass({
	NAME: "VML",
	VERSION: "2.1",
	CLASS: "class",
	IMPLEMENT: SZN.Vector.Canvas
})

/**
 * @see SZN.Vector.Canvas
 */
SZN.VML.prototype.$constructor = function(width, height) {
    if (SZN.Browser.client == "ie" && !document.namespaces["vml"]) {
        document.namespaces.add("vml", "urn:schemas-microsoft-com:vml", "#default#VML");
		var s = document.createStyleSheet();
		s.cssText = "vml\\:*{behavior:url(#default#VML);";
    }
	
	var storage = SZN.cEl("div", false, false, {display:"none"});
	var tmp = SZN.cEl("div", false, false, {display:"none"});
	document.body.insertBefore(storage, document.body.firstChild);
	document.body.insertBefore(tmp, document.body.firstChild);
	
	this.constructor.storage = storage;
	this.constructor.tmp = tmp;
	
	var el = SZN.cEl("div",false,false,{position:"absolute", overflow:"hidden"});
	this.canvas = el;
	this.resize(width, height);
};

/**
 * destruktor
 */   
SZN.VML.prototype.$destructor = function() {
	if (this.canvas.parentNode && this.canvas.parentNode.nodeType == 1) { this.canvas.parentNode.removeChild(this.canvas); }
	this.canvas = null;
};

/**
 * @see SZN.Vector#setScale
 */   
SZN.VML.prototype.setScale = function(scale) {
	this.canvas.style.zoom = scale;
}

/**
 * @see SZN.Vector#clear
 */   
SZN.VML.prototype.clear = function() {
	SZN.Dom.clear(this.canvas);
};

/**
 * @see SZN.Vector#resize
 */   
SZN.VML.prototype.resize = function(width, height) {
	this.canvas.style.width = width+"px";
	this.canvas.style.height = height+"px";
};

/**
 * @see SZN.Vector#getContainer
 */   
SZN.VML.prototype.getContainer = function() {
	return this.canvas;
};

/**
 * @see SZN.Vector#getContent
 */   
SZN.VML.prototype.getContent = function() {
	return this.canvas;
};

/**
 * @see SZN.Vector#polyline
 */   
SZN.VML.prototype.polyline = function() {
	var el = this._build("<vml:polyline><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:polyline>");
	
	el.style.position = "absolute";
	el.filled = false;

	return el;
};

/**
 * @see SZN.Vector#circle
 */   
SZN.VML.prototype.circle = function() {
	var el = this._build("<vml:oval><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:oval>");

	el.style.position = "absolute";
	el.filled = false;
	el.stroked = false;
	
	return el;
};

/**
 * @see SZN.Vector#polygon
 */   
SZN.VML.prototype.polygon = function() {
	var el = this._build("<vml:polyline><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:polyline>");

	el.filled = false;
	el.stroked = false;
	
	return el;
};

/**
 * @see SZN.Vector#path
 */   
SZN.VML.prototype.path = function() {
	var el = this._build("<vml:shape><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:shape>");
	
	el.filled = false;
	el.stroked = false;

	el.style.position = "absolute";
	el.style.width = "1px";
	el.style.height = "1px";    
	el.coordsize = "1,1";

	return el;
}

/**
 * @see SZN.Vector#setStroke
 */   
SZN.VML.prototype.setStroke = function(element, options) {
	if ("color" in options) { 
		element.strokecolor = options.color; 
	}
	if ("width" in options && options.width) { 
		element.stroked = true;
		element.strokeweight = options.width+"px";
	}
	if ("opacity" in options) {
		element.getElementsByTagName("stroke")[0].opacity = options.opacity; 
	}
}

/**
 * @see SZN.Vector#setFill
 */   
SZN.VML.prototype.setFill = function(element, options) {
	if ("color" in options) { 
		element.filled = true;
		element.fillcolor = options.color;
	}
	if ("opacity" in options) { 
		element.getElementsByTagName("fill")[0].opacity = options.opacity; 
	}
}

/**
 * @see SZN.Vector#setCenterRadius
 */   
SZN.VML.prototype.setCenterRadius = function(element, center, radius) {
	element.style.left = (center.getX()-radius) + "px";
	element.style.top  =  (center.getY()-radius) + "px";
	element.style.width  = (radius*2) +"px";
	element.style.height = (radius*2) + "px";
}

/**
 * @see SZN.Vector#setPoints
 */   
SZN.VML.prototype.setPoints = function(element, points, closed) {
	var arr = points.map(function(item) { return item.join(" "); });
	if (closed) { arr.push(points[0].join(" ")); }
	element.points.value = arr.join(", ");
}

/**
 * parsovani formatu do datove struktury
 * @param {string} format formatovaci retezec
 */   
SZN.VML.prototype._analyzeFormat = function(format) {
	var data = [];
	var ptr = 0;
	var current = "";
	var obj = false;
	
	while (ptr < format.length) {	
		if (!current) {
		}
		var ch = format.charAt(ptr);
		if (ch.match(/[a-z]/i)) { /* command */
			if (current) { obj.parameters.push(parseFloat(current)); }
			if (obj) { data.push(obj); }
			obj = {
				command:ch,
				parameters:[]
			}
			current = "";
		} else if (ch.match(/[ ,]/)) { /* separator */
			if (current) { obj.parameters.push(parseFloat(current)); }
			current = "";
		} else { /* numba */
			current += ch;
		}
		ptr++;
	}
	if (current) { obj.parameters.push(parseFloat(current)); }
	if (obj) { data.push(obj); }
	return data;
}


/**
 * serializace datove struktury formatu do retezce
 * @param {array} data pole prikazu pro kreslitko
 */   
SZN.VML.prototype._serializeFormat = function(data) {
	var s = "";
	for (var i=0;i<data.length;i++) {
		var cmd = data[i];
		var numbers = cmd.parameters.map(function(item) { return Math.round(item); });
		s += cmd.command + " " + numbers.join(" ") + " ";
	}
	return s;
}

/**
 * vypocet kruhove vysece pro VML
 * @param {array} parameters parametry SVG elipsy
 * @param {vec2d} coords souradnice prvniho bodu
 */   
SZN.VML.prototype._generateArc = function(parameters, coords) {
	function calcAngle(ux, uy, vx, vy) {
		var ta = Math.atan2(uy, ux);
		var tb = Math.atan2(vy, vx);
		if (tb >= ta) { return tb-ta; }
		return 2*Math.PI - (ta-tb);
	}
	
	function fixAngle(angle) {
		var a = angle;
		a = 360 * a / (2*Math.PI);
		return a * (2<<15);
	}

	/* parameters: radius_x, radius_y, x_rotation, large_flag, sweep_flag, end_x, end_y */
	/* output: center_x, center_y, radius_x, radius_y, angle_1, angle_2 */

	var r1 = parameters[0]; var r2 = parameters[1];
	var x = parameters[5]; var y = parameters[6];
	var cx = coords.getX(); var cy = coords.getY();
	var largeArcFlag = parameters[3];
	var sweepFlag = parameters[4];

	var xp, yp, cxp, cyp;
	var angle = parameters[2];

	/* slope fun&games ... see SVG spec, section F.6 */
	angle = angle*Math.PI/180.0;
	xp = Math.cos(angle)*(cx-x)/2.0 + Math.sin(angle)*(cy-y)/2.0;
	yp = -Math.sin(angle)*(cx-x)/2.0 + Math.cos(angle)*(cy-y)/2.0;

	/* make sure radii are large enough */
	var root = 0;
	var numerator = r1*r1*r2*r2 - r1*r1*yp*yp - r2*r2*xp*xp;
	if (numerator < 0.0) {
		var s = sqrt(1.0 - numerator/(r1*r1*r2*r2));
		r1 *= s;
		r2 *= s;
		root = 0.0;
	} else {
		root = Math.sqrt(numerator/(r1*r1*yp*yp + r2*r2*xp*xp));
		if (largeArcFlag == sweepFlag) { 
			root = -root;
		}
	}
	cxp = root*r1*yp/r2;
	cyp = -root*r2*xp/r1;

	var centerX = Math.cos(angle)*cxp - Math.sin(angle)*cyp + (cx+x)/2;
	var centerY = Math.sin(angle)*cxp + Math.cos(angle)*cyp + (cy+y)/2;
	
	var theta = calcAngle(1.0, 0.0,  (xp-cxp)/r1, (yp-cyp)/r2);
	var delta  = calcAngle((xp-cxp)/r1, (yp-cyp)/r2,  (-xp-cxp)/r1, (-yp-cyp)/r2);
	if (!sweepFlag && delta > 0) {
		delta -= 2.0*Math.PI;
	} else if (sweepFlag && delta < 0) {
		delta += 2.0*Math.PI;
	}

	coords.setX(x);
	coords.setY(y);
	return [centerX, centerY, r1, r2, -fixAngle(theta), -fixAngle(delta)];
}

/**
 * prevod formatovaciho retezce z SVG do VML
 * @param {string} format formatovaci retezec
 */   
SZN.VML.prototype._fixFormat = function(format) {
	var coords = new SZN.Vec2d(0,0);
	var data = this._analyzeFormat(format);
	for (var i=0;i<data.length;i++) {
		var cmd = data[i];
		switch (cmd.command) {
			case "M":
			case "L":
				coords.setX(cmd.parameters[0]);
				coords.setY(cmd.parameters[1]);
			break;
			case "C":
				coords.setX(cmd.parameters[4]);
				coords.setY(cmd.parameters[5]);
			break;
			case "z":
			case "Z":
				cmd.command = "X";
			break;
			case "A":
				cmd.command = "AE";
				cmd.parameters = this._generateArc(cmd.parameters, coords);
			break;
		}
	}
	data.push({command:"E", parameters:[]});
	return this._serializeFormat(data);
}

/**
 * Vyrobi prvek v bezpecnem skladisti
 */
SZN.VML.prototype._build = function(str) {
	this.constructor.tmp.innerHTML = str;
	var elm = this.constructor.tmp.firstChild;
	this.constructor.storage.appendChild(elm);
	return elm;
}

/**
 * @see SZN.Vector#setFormat
 */   
SZN.VML.prototype.setFormat = function(element, format) {
	var f = this._fixFormat(format);
	element.path = f;
}
