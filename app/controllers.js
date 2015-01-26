var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $q, $routeParams, $http, config, userService, dataService){
	$rootScope.rp = $routeParams;
	$rootScope.config = config;
	var taskResource = new dataService.resource({className: 'Task', identifier:'taskList'});
	var contactResource = new dataService.resource({className: 'Contact', identifier:'contactList'});
		
	var callListDefer = $q.defer();
	userService.user().then(function(user){
		var calls = new dataService.resource({
			className: 'Calls', 
			identifier:'callList',
			query: 'order=-updatedAt&limit=10&include=agent'
		});
			// calls.setQuery('order=-updatedAt&limit=10&include=agent');
		callListDefer.resolve(calls);
		calls.item.list().then(function(data){
			$rootScope.calls = data.results;
			// tools.formatAll($rootScope.calls);
		})
		$rootScope.$on(calls.listenId, function(event, data){
			if(data){
				$rootScope.calls = data.results;
				// tools.formatAll($rootScope.calls);
			}
		})
	});
	var callListPromise = callListDefer.promise;
	
	
	var tools = {
		user: userService,
		auth:function(){
			var config = {
				'client_id': '565032103820-70r475n76136diauosq8i3et19d2khmf.apps.googleusercontent.com',
				'scope': 	' https://www.googleapis.com/auth/urlshortener'+
							' https://mail.google.com/'+
							' https://www.googleapis.com/auth/gmail.modify'+
							' https://www.googleapis.com/auth/gmail.readonly'
			};
			gapi.auth.authorize(config, function() {
				tools.alert.add('success','login complete');
				var token = gapi.auth.getToken();
				tools.alert.add('success',token);
				it.token = token;
			});
		},
		nav:function(url){
			window.location=url;
		},
		url:function(){
			var subModules = ['admin','dashboard'];
			if(subModules.indexOf($routeParams.module) != -1)
				if($routeParams.view)
					return 'modules/'+$routeParams.module+'/'+$routeParams.view+'/main.html';
				else
					return 'views/404.html';
			else if($routeParams.module && $routeParams.view)
				return 'modules/'+$routeParams.module+'/'+$routeParams.view+'.html';
			else
				return 'views/'+$routeParams.view+'.html';
		},
		init:function(){
			if(!$rootScope.temp){
				$rootScope.alerts = [];
				$rootScope.temp = {};
				userService.user().then(function(){
					//Do things than need to be done once the user is authenticated.
					// Load message, alert, task (count)
					tools.task.init();
					tools.contact.init();
				});
				$scope.$on('$viewContentLoaded', function(event) {
					// ga('send', 'pageview', $location.path());
				});
			}
		},
		alert:{
			add:function(type, message){
				if(type == 'error')
					type = 'danger';

				var alert = {
					type: 'alert-'+type,
					message: message
				}
				$rootScope.alerts.push(alert)
				return alert;
			},
			dismiss:function(alert){
				var alertIndex = $rootScope.alerts.indexOf(alert);
				if(alertIndex != -1)
					$rootScope.alerts.splice(alertIndex, 1);
			}
		},
		task:{
			init:function(){
				taskResource.addListener(function(data){
					if(data)
						$rootScope.tasks = data.results;
				});
				taskResource.item.list().then(function(data){
					if(data)
						$rootScope.tasks = data.results;	
				});
			}
		},
		contact:{
			init:function(){
				contactResource.addListener(function(data){
					if(data)
						$rootScope.contacts = data.results;
				});
				contactResource.item.list().then(function(data){
					if(data)
						$rootScope.contacts = data.results;	
				});
			}
		},
		twilio:{
			token:function(){
				return $http.post(config.parseRoot+'functions/clientKey', {})
			},
			init:function(){
				$scope.twilio = {
					status: 'connecting',
					callStatus: 'ended',
					connection: {},
					presence: []
				}
				tools.twilio.token().success(function(response){
					console.log(response);
					var data = response.result;
					Twilio.Device.setup(data.token);

					Twilio.Device.ready(function (device) {
						$scope.twilio.device = device;
						$scope.twilio.status = 'ready';
					});
					Twilio.Device.offline(function (device) {
						$scope.twilio.device = device;
						$scope.twilio.status = 'offline';
					});
					Twilio.Device.error(function (error) {
						$scope.twilio.error = error;
					});

					Twilio.Device.incoming(function(connection) {
						$scope.$apply(function(){
							$scope.twilio.call = connection.parameters;
							console.log(connection.parameters)
							$scope.twilio.callStatus = 'incoming';
							$scope.twilio.connection = connection;
						});
					});
					Twilio.Device.connect(function(connection) {
						$scope.$apply(function(){
							$scope.twilio.call = connection.parameters;
							console.log(connection.parameters)
							$scope.twilio.callStatus = 'connected';
							// $scope.twilio.connection = connection.parameters;
						});
					});
					Twilio.Device.disconnect(function(connection) {
						$scope.twilio.call = connection.parameters;
						console.log(connection.parameters)
						$scope.twilio.callStatus = 'ended';
						$scope.twilio.connection = connection.parameters;
					});
					Twilio.Device.presence(function(presenceEvent) {
						$scope.$apply(function(){
							$scope.twilio.presence.push(presenceEvent)
						});
					});
				})
			},
			accept:function(){
				$scope.twilio.connection.accept();
			},
			hangup:function(){
				Twilio.Device.disconnectAll();
			},
			call:function(number){
				if(!number){
					tools.alert('No number to call...')
					return;
				}
				number = number.replace(/\D/g,'');
				$scope.twilio.connection = Twilio.Device.connect({
					"PhoneNumber": number,
					"CallerName": $rootScope.user.fullName,
					"AgentId": $rootScope.user.objectId
				});
			}
		}
	}
	
	$rootScope.rootTools = tools;
	$scope.tools = tools;
	$rootScope.alert = tools.alert.add;
	
	tools.init();
	it.MainCtrl=$scope;
});