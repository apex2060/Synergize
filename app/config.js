app.factory('config', function ($rootScope, $http) {
	var config = {
		parseRoot: 			'https://api.parse.com/1/',
	 	parseAppId: 		'UyyjJrdTcGKPyHfzKurLCBkRCY8ZAgDKky84SMfj',
	 	parseJsKey: 		'6quC8SNnmPZCCwxbuhjFykm4agspv3UZKGgsqWVV',
	 	parseRestApiKey: 	'ixN7LroBlq4mmMp9L07mgetwwOFJc2tCeTr9xN1F',
	 	googleApiKey: 		'AIzaSyBtf7NRN1PA58x9b3E_UKENB36jCyqdH0I',
	};

	Parse.initialize(config.parseAppId, config.parseJsKey);
	$http.defaults.headers.common['X-Parse-Application-Id'] = config.parseAppId;
	$http.defaults.headers.common['X-Parse-REST-API-Key'] = config.parseRestApiKey;
	$http.defaults.headers.common['Content-Type'] = 'application/json';

	return config;
});