/**
  * Class for server communication
  *
  **/
var ServerAPI = function(serverUri) {
	
	this.serverUri = serverUri;
	
};

ServerAPI.Request = {
	INSERT_USER: "InsertNewUserREST",
	INSERT_TRIP: "InsertTripDataREST",
	RESET_PASS_REQ: "SendEmailForNewPasswordREST",
	RESET_PASS: "ResetPasswordREST",
	DELETE_USER: "DeleteUserREST",
	DELETE_TRIP: "DeleteTripByIdREST",
};

ServerAPI.prototype.getUri = function(action) {

	var uriComponents = [
		this.serverUri,
		action
	];

	return uriComponents.join("/");

};

ServerAPI.prototype.submitData = function(action, obj, callback) {

	var objJSON = JSON.stringify(obj);
	var xmlhttp = new XMLHttpRequest();

	var apiUri = this.getUri(action);
	var _callback = this.onServerResponse.bind(this, callback);

	console.log("Sending this:", objJSON);

	$.ajax({
		type: 'POST',
		url: apiUri,
		data: objJSON,
		contentType: "application/json",
		crossDomain: true,
		//dataType: XMLHttpRequest,
		dataType: 'json',
		success: _callback,
		error: function(e) {
			console.warn("Ajax error", e);
			window.wtf = e.responseText;
		},
	});
	
};

ServerAPI.prototype.onServerResponse = function(callback, obj) {
	
	console.log("onserverresponse", obj);
	
	// @TODO: Handle server response in case of error
	
	callback(obj);
	
	
};

/**
  * Create a new user
  * 
  **/
ServerAPI.prototype.createUser = function(userObj, callback) {

	console.log("ServerAPI: Inserting new user", userObj);
	this.submitData(ServerAPI.Request.INSERT_USER, userObj, callback);

};

ServerAPI.prototype.submitReport = function(obj, callback) {

	// @TODO
	this.submitData(ServerAPI.Request.INSERT_TRIP, obj, callback);

};

ServerAPI.prototype.requestPasswordReset = function(obj, callback) {
	
	this.submitData(ServerAPI.Request.RESET_PASS_REQ, obj, callback);

};

ServerAPI.prototype.requestNewPassword = function(obj, callback) {

	this.submitData(ServerAPI.Request.RESET_PASS, obj, callback);
};

ServerAPI.prototype.deleteUser = function(obj, callback) {
	
	this.submitData(ServerAPI.Request.DELETE_USER, obj, callback);
	
};

ServerAPI.prototype.deleteTrip = function(obj, callback) {
	
	this.submitData(ServerAPI.Request.DELETE_TRIP, obj, callback);
	
};