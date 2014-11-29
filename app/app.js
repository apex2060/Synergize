var it = {};

var app = angular.module('Synergize', ['pascalprecht.translate','ngAnimate','ngResource','ngRoute','ngTouch','ngDraggable','firebase']);
app.config(function($routeProvider,$compileProvider,$translateProvider,$controllerProvider,$provide) {
	app.lazy = {
		controller: $controllerProvider.register,
		factory: 	$provide.factory,
		service: 	$provide.service,
	};

	function requires($q, module, view, id){
		var deferred = $q.defer();
		var includes = [];
		
		if(module)
			includes.push('modules/'+module+'/ctrl');
			
		var subModules = ['admin','dashboard'];
		if(subModules.indexOf(module) != -1)
			if(view)
				includes.push('modules/'+module+'/'+view+'/ctrl');
		else
			deferred.resolve();

		if(includes.length)
			require(includes, function () {
				deferred.resolve();
			});
		else
			deferred.resolve();
			
		return deferred.promise;
	}


	$routeProvider
	.when('/:view', {
		reloadOnSearch: false,
		templateUrl: 'views/main.html',
		controller: 'MainCtrl',
		resolve: {
			load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
				var pieces = $location.path().split('/');
				return requires($q, null, pieces[1], null)
			}]
		}
	})
	.when('/:module/:view', {
		reloadOnSearch: false,
		templateUrl: 'views/main.html',
		controller: 'MainCtrl',
		resolve: {
			load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
				var pieces = $location.path().split('/');
				return requires($q, pieces[1], pieces[2], null)
			}]
		}
	})
	.when('/:module/:view/:id', {
		reloadOnSearch: false,
		templateUrl: 'views/main.html',
		controller: 'MainCtrl',
		resolve: {
			load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
				var pieces = $location.path().split('/');
				return requires($q, pieces[1], pieces[2], pieces[3])
			}]
		}
	})
	.otherwise({
		redirectTo: '/home'
	});

	$compileProvider.aHrefSanitizationWhitelist(/^\s*(mailto|tel|sms):/);
	$translateProvider.useStaticFilesLoader({
		prefix: 'assets/languages/',
		suffix: '.json'
	});
	$translateProvider.uses('en');
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['Synergize']);
});