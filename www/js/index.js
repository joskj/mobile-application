var app = {
	
	session: null,
	location: null,
	isTracking: false,
	log: null,
	server: new ServerAPI("http://129.241.110.230/Smio/BackendService.svc"),
	map: null,

    // Application Constructor
    initialize: function() {
    
		console.log("Initializing application");
		
		app.session = new Session();
		app.location = new GeoLocation({}, app.onLocationUpdate);
		
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        
        //document.addEventListener('deviceready', this.onDeviceReady, false);
        window.addEventListener('load', this.onDeviceReady, false);
        
        //this.onDeviceReady();
        //window.addEventListener("load", this.onDeviceReady, false);
        
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        
        app.receivedEvent('deviceready');
        
        console.log("Device ready");
        
        $.mobile.changePage("pages/main.html");
        
        
    },
    
    // Update DOM on a Received Event
    receivedEvent: function(id) {
		
        console.log('Received Event: ' + id);
        
        var username, password, password2;
        
        switch(id) {
			
			case "onusercreation":
				
				console.log("Request to create new user");
				
				username = $("#usernameInput")[0].value;
				password = $("#passwordInput")[0].value;
				password2 = $("#passwordInputConfirm")[0].value;
				
				// @TODO validate input
				
				app.createUser(username, password);
				
				break;
				
			case "onloginrequest":
				
				username = $("#usernameInput")[0].value;
				password = $("#passwordInput")[0].value;
				
				app.signIn(username, password);
				
				break;
			
			case "loginsuccess":
				
				console.log("Login was OK");
				$.mobile.changePage("../pages/tracking.html");
				
				break;
			
			case "ontrackstart":
				
				app.startTracking();
				
				break;
				
			case "ontrackend":
				
				app.stopTracking();
				
				var tripPurpose = $("#selectDestination option:selected").val();
				
				app.log.Purpose = parseInt(tripPurpose, 10);
				
				$.mobile.changePage("../pages/trackingList.html");
				
				break;
			
			case "savetrip":
				// Save trip locally
				console.log("Saving trip locally");
				app.storeLocalTrip();
				
				console.log("changing to history page");
				
				$.mobile.changePage("../pages/history.html");
				
				break;
				
			case "uploadtrip":
				
				// Save locally and upload
				
				var id = app.storeLocalTrip();
				
				app.uploadTrip(id);
				
				console.log("Uploading trip");
				
				break;
				
			case "discardtrip":
				
				// Discard
				console.log("Discarding trip");
				
				// Go back to tracking
				$.mobile.changePage("../pages/tracking.html");
				
				break;
			
			case "distanceupdate":
			
				if($.mobile.activePage.attr('id') == "tracking") {
					
					var d = app.log.meta.distance;
					
					var unit = "km";
					
					if(d < 1) {
						unit = "m";
						// Convert to meters
						d = Math.round(d * 1000);
					} else {
						// Round to two decimal precision
						d = Math.round(d * 100) / 100;
					}
					
					$("#totaldistance").html(d.toString() + " " + unit);
					
					console.log("Updating time!");
					
					var seconds = Math.floor( (Date.now() - app.log.meta.startTime) / 1000.0 );
					var minutes = Math.floor(seconds / 60);
					
					
					if(minutes > 0) {
						seconds -= 60 * minutes;
					}
					
					var timestr = minutes + ":" + seconds;
					
					$("#totalduration").html(timestr);
					
				}
			
				break;
			
			default:
				
				console.warn("Unknown event " + id);
        }
        
    },
    
    restoreListValue: function(id, value) {
		
		var el = $('#' + id);
		
		el.val(value).attr("selected", true).siblings('option').removeAttr('selected');
		el.selectmenu('refresh', true);
    
		//$(id).attr("value", this.session.getLocalUserInfo(fields[i]));
		//$(id).selectmenu();
		//$(id).selectmenu('refresh', true);
    },
    
    // Restore user info from local data
    // Called when userinfo.html is loaded
    
    restoreUserInfo: function() {
		
		// Restore selection lists
    
		var fields = ['birthyear', 'maritalStatus', 'numChildren', 'residence', 'area', 'occupation'];
    
		for(var i = 0; i < fields.length; i++) {
			
			var id = fields[i];
			
			app.restoreListValue(id, this.session.getLocalUserInfo(id));
			
		}
		
		// Restore radio check buttons
		
		var radiobuttons = ['Gender', 'travelcard'];
		
		for(var i = 0; i < radiobuttons.length; i++) {
			
			var value = this.session.getLocalUserInfo(radiobuttons[i]);
			
			if(value != 'none') {
				
				$('#' + value).attr("checked", true).checkboxradio("refresh", true);
			
			}
			
		}
		
    },
    
    // User info update
    
    onUserInfoChanged: function(elem) {
		
		var key = elem.id;
		var value = elem.value;
		
		// Validate?
		
		this.session.updateLocalUserInfo(key, value);
		
    },
    
    storeLocalTrip: function() {
    
		if(!(this.log instanceof Logger)) {
			console.warn("App: Attempted to store local trip, but no trip was in memory!");
			return;
		}
		
		return app.session.addLocalLog(this.log);
    
    },
    
    uploadTrip: function(id, callback) {
		
		callback = callback || (function() { 
			$.mobile.changePage("../pages/history.html");
		}).bind(this);
		
		console.log("SUBMITTING TRIP TO REMOTE SERVER");
		
		var jsonObj = {
			
			id: id,
			
			user: {
				userName: app.session.userData.username,
				pinCode: app.session.userData.password,
			},
			
			person: app.session.getUserInfoObject(),
			trip: this.session.getLocalLog(id).log
			
		};
		
		console.log(JSON.stringify(jsonObj));
		
		this.server.submitReport(jsonObj, (function(e) {
			
			console.log("done! response: ", e);
			
			if(e.InsertTripDataRESTResult  == "ok") {
				console.log("Marking log as synched");
				// e.InsertTripDataRESTResult
				app.session.setLogSynched(id);
			} else {
				console.warn("Trip synch failed! Do something about it!");
			}
			
			callback();
			
		}).bind(this));
		
    },
    
    onLocationUpdate: function(data) {
		
		if(!app.isTracking) {
			console.warn("App: Received location update, but we're not tracking");
			return;
		}
		
		console.log("Received location update");
		
		app.log.addEntry(data);
		
		// Update map
		
		app.map.update(data);
		
    },
    
    startTracking: function() {
    
		if(app.isTracking) {
			console.warn("Tracking was started, but we're already tracking!");
			return;
		}
    
		app.isTracking = true;
		app.map = new MapHelper();
		app.log = new Logger();
		app.location.start();
    
		console.log("Started tracking");
		
    },
    
    stopTracking: function() {
		
		if(!app.isTracking) {
			console.warn("Received request to stop tracking while tracking is inactive");
			return;
		}
		
		app.isTracking = false;
		app.location.stop();
		
		console.log("Stopped tracking");
		
    },
    
    /**
      * Create a new user
      * 
      **/
    createUser: function(username, password) {
		
		var onServerResponse = (function(response) {
		
			console.warn("SERVER RESPONSE: ", response);
		
			
			// @TODO create on remote server
			// Create locally for now
			
			var r = false;
			
			try {
				r = app.session.createLocalUser(username, password);
			} catch(e) {
				console.warn("App: User creation exception: " + e);
			}
			
			if(r === true) {
				// OK => sign in
				app.session.login(username, password);
				app.receivedEvent('loginsuccess');
			} else {
				console.warn("App: Failed to create local user");
			}
			
		
		}).bind(this);
		
		var userObj = {
			user: {
				userName: username,
				pinCode: password,
			}
		};
		
		this.server.createUser(userObj, onServerResponse);
		//onServerResponse();
		
    },
    
    /**
      * Sign in an existing user
      * 
      **/
    signIn: function(username, password) {
		
		var login_ok = false;
		var err_msg = "";
		
		try {
			
			login_ok = app.session.login(username, password);
						
		} catch(e) {
		
			err_msg = e;
			
		}
		
		if(login_ok)
			app.receivedEvent('loginsuccess');
		else {
			// @TODO: Handle login fail
			alert("Failed to sign in: " + err_msg);
		}
    
    },
    
};
