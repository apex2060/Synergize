// CONTROLLERS
var UserCtrl = app.lazy.controller('UserCtrl', function($rootScope, $scope, $http, $q, config, userService, fileService){
	var tools = {
		user:{
			init:function(){
				$rootScope.temp.user = angular.copy($rootScope.user);
			},
			update:function(profile){
				var profileUpdates = {
					firstName: profile.firstName,
					lastName: profile.lastName,
					email: profile.email,
					phone: profile.phone,
					pic: profile.pic
				}
				$http.put('https://api.parse.com/1/users/'+profile.objectId, profileUpdates).success(function(){
					$rootScope.user = angular.extend($rootScope.user, profileUpdates);
					$rootScope.alert('success', 'Profile Updated!')
				})
			},
			uploadPic:function(details, src){
				console.log('pic detals',details);
				$rootScope.temp.user.pic = {
					temp: true,
					status: 'uploading',
					class: 'grayscale',
					name: 'Image Uploading...',
					src: src
				}
	
				fileService.upload(details,src).then(function(data){
					$rootScope.temp.user.pic = {
						name: data.name(),
						src: data.url()
					}
				});
			}
		}
	}
	$scope.$on('authenticated', function() {
		tools.user.init();
	})
	$scope.tools = tools;
	it.UserCtrl=$scope;
});