/**
  * Data logger class. Contains the data for a trip.
  *
  **/
var Logger = function() {
	
	this.entries = [];
	
	this.modes = [];
	
	// Meta data for the trip
	this.meta = {
		startTime: Date.now(),
		distance: 0,
		purpose: 0
	};
};

Logger.MODE = ({
	0: "unknown",
	1: "bus",
	2: "tram",
	3: "subway",
	4: "walk",
	5: "bicycle",
	6: "boat",
	7: "car",
});

Logger.TRIP_PURPOSE = {
	0: "Unknown purpose",
	1: "Work",
	2: "Business",
	3: "School",
	4: "Accompany others",
	5: "Shopping service",
	6: "Leisure",
	7: "Home",
};

Logger.prototype.updateMode = function(travelMode) {

	if(travelMode == this.getActiveMode())
		return;
	
	this.modes.push({
		mode: travelMode,
		time: Date.now(),
		startDistance: this.meta.distance
	});
};

Logger.prototype.getActiveMode = function() {
	
	if(this.modes.length > 0)
		return (this.modes[this.modes.length - 1]).mode;
	
	return 0;
};

Logger.prototype.updateDistance = function(coords) {
	
	if(this._lastCoords !== undefined) {
		var d = Logger.getCoordPointDistance(this._lastCoords, coords);
		this.meta.distance += d;
	}
	
	this._lastCoords = coords;
	
	app.receivedEvent('distanceupdate');
	
};

/**
  * Add new entry to the log
  * 
  **/
Logger.prototype.addEntry = function(position) {

	console.log("Adding entry", position);


	this.updateDistance(position.coords);
	
	this.entries.push({
		timestamp: position.timestamp,
		latitude: position.coords.latitude,
		longitude: position.coords.longitude,
		altitude: position.coords.altitude,
		accuracy: position.coords.accuracy,
		altitudeAccuracy: position.coords.altitudeAccuracy,
		heading: position.coords.heading,
		speed: position.coords.speed
	});

};

Logger.prototype.__defineSetter__("Purpose", function(value) {
	this.meta.purpose = Number(value);
});

Logger.prototype.__defineGetter__("Purpose", function() {
	return this.meta.purpose;
});

Logger.getCoordPointDistance = function(p0, p1) {
	
	var deg2rad = Math.PI / 180;
	var dlong = (p1.longitude - p0.longitude) * deg2rad;
	var dlat = (p1.latitude - p0.latitude) * deg2rad;
	var a = Math.pow(Math.sin(dlat / 2.0), 2) + Math.cos(p0.latitude * deg2rad) * Math.cos(p1.latitude * deg2rad) * Math.pow(Math.sin(dlong / 2.0), 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = 6367 * c;
	
	return d;
	
};

/** 
  * Get set of logger data with fields for server API/storage
  *
  **/
Logger.prototype.toSerializableObject = function() {
	
	var out = [];

	for(var i = 0; i < this.entries.length; i++) {
	
		var entry = this.entries[i];
	
		var outEntry = {};
		
		for(var i in entry) {
			if(entry[i] !== undefined && entry[i] !== null)
				outEntry[i] = entry[i];
		}
	
		out.push(outEntry);
	
	}

	return {
		meta: this.meta,
		entries: out,
		modes: this.modes
	};
};