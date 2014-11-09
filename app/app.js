var it = {};

var app = angular.module('SocialCIA', ['pascalprecht.translate','ngAnimate','ngResource','ngRoute','ngTouch']);
app.config(function($routeProvider,$translateProvider,$controllerProvider) {
	app.lazy = {
		controller: $controllerProvider.register
	};

	function requires($q, module, view, id){
		var deferred = $q.defer();
		var includes = [];

		if(module && view)
			includes.push('modules/'+module+'/'+view+'/ctrl')
		else if(module)
			includes.push('modules/'+module+'/ctrl')

		//CAN ADD CUSTOM REQUIRES FOR VIEW... OR ANYTHING ELSE HERE.

		require(includes, function () {
			deferred.resolve();
		});
		return deferred.promise;
	}


	$routeProvider
	.when('/static/:view', {
		reloadOnSearch: false,
		templateUrl: 'views/main.html',
		controller: 'MainCtrl',
		resolve: {
			load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
				var pieces = $location.path().split('/');
				return requires($q, null, pieces[2], null)
			}]
		}
	})
	.when('/:module', {
		reloadOnSearch: false,
		templateUrl: 'views/main.html',
		controller: 'MainCtrl',
		resolve: {
			load: ['$q', '$rootScope', '$location', function ($q, $rootScope, $location) {
				var pieces = $location.path().split('/');
				return requires($q, pieces[1], null, null)
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
				return requires($q, null, pieces[1], pieces[2], pieces[3])
			}]
		}
	})
	.otherwise({
		redirectTo: '/static/home'
	});

	$translateProvider.useStaticFilesLoader({
		prefix: 'assets/languages/',
		suffix: '.json'
	});
	$translateProvider.uses('en');
});


angular.element(document).ready(function() {
	angular.bootstrap(document, ['SocialCIA']);
});