var MainCtrl = app.controller('MainCtrl', function($rootScope, $scope, $q, $routeParams, config, userService, dataService){
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
					rootTools.task.init();
					rootTools.contact.init();
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
	}
	$rootScope.alert = rootTools.alert.add;
	$rootScope.rootTools = rootTools;
	rootTools.init();
	it.MainCtrl=$scope;
});