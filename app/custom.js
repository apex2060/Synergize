var lib = {}

Array.prototype.random = function () {
	return this[Math.floor(Math.random() * this.length)]
}

Array.prototype.randomRemove = function () {
	return this.splice(Math.floor(Math.random() * this.length), 1)[0];
}

Array.prototype.max = function() {
	return Math.max.apply(null, this)
}
Array.prototype.min = function() {
	return Math.min.apply(null, this)
}
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return !(a.indexOf(i) > -1);});
};
Array.prototype.find = function(key, value){
	for(var i=0; i<this.length; i++){
		console.log(this[i])
		if(this[i][key]==value)
			return this[i];
	}
}













var windowState = {
	onActive: null,
	onInactive: null,
	isActive: true,
	hidden: "hidden",
	setActive: function(activeCallback){
		windowState.onActive = activeCallback;
	},
	setInactive: function(inactiveCallback){
		windowState.onInactive = inactiveCallback;
	},
	stateChange: function(evt){
		var v = 'visible', h = 'hidden',
		evtMap = { 
			focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h 
		};

		evt = evt || window.event;
		if (((evt.type in evtMap) && evtMap[evt.type]=='hidden') || this[windowState.hidden]){
			windowState.isActive = false;
			if(typeof(windowState.onInactive)=='function')
				windowState.onInactive();
		}else{
			windowState.isActive = true;
			if(typeof(windowState.onActive)=='function')
				windowState.onActive();
		}
	},
	setup:function(){
		if (windowState.hidden in document)
			document.addEventListener("visibilitychange", windowState.stateChange);
		else if ((windowState.hidden = "mozHidden") in document)
			document.addEventListener("mozvisibilitychange", windowState.stateChange);
		else if ((windowState.hidden = "webkitHidden") in document)
			document.addEventListener("webkitvisibilitychange", windowState.stateChange);
		else if ((windowState.hidden = "msHidden") in document)
			document.addEventListener("msvisibilitychange", windowState.stateChange);
		else if ('onfocusin' in document)
			document.onfocusin = document.onfocusout = windowState.stateChange;
		else
			window.onpageshow = window.onpagehide 
				= window.onfocus = window.onblur = windowState.stateChange;
	}
}