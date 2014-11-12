var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $routeParams, config, userService, dataService){
	$rootScope.rp = $routeParams;
	$rootScope.config = config;
	var taskResource = new dataService.resource('Task', 'taskList');

	var rootTools = {
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
				rootTools.alert.add('success','login complete');
				var token = gapi.auth.getToken();
				rootTools.alert.add('success',token);
				it.token = token;
			});
		},
		url:function(){
			if(!$routeParams.module)
				return 'views/'+$routeParams.view+'.html';
			else if(!$routeParams.view)
				return 'modules/'+$routeParams.module+'/main.html';
			else
				return 'modules/'+$routeParams.module+'/'+$routeParams.view+'/main.html';
		},
		init:function(){
			if(!$rootScope.temp){
				$rootScope.alerts = [];
				$rootScope.temp = {};
				userService.user().then(function(){
					//Do things than need to be done once the user is authenticated.
					// Load message, alert, task (count)
					rootTools.task.init();
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
					$rootScope.tasks = data.results;
					console.log('tasks from main')
				});
				taskResource.item.list().then(function(data){
					$rootScope.tasks = data.results;	
				});
			}
		},
	}
	$rootScope.alert = rootTools.alert.add;
	$rootScope.rootTools = rootTools;
	rootTools.init();
	it.MainCtrl=$scope;
});