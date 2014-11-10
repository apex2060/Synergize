app.factory('userService', function ($rootScope, $http, $q, config) {
	var userService = {
		user:function(){
			var deferred = $q.defer();
			if($rootScope.user)
				deferred.resolve($rootScope.user);
			else{
				userService.init();
				$rootScope.$on('authenticated', function(event,user) {
					deferred.resolve(user);
				});
			}
			return deferred.promise;
		},
 		init:function(){
 			if(localStorage.user){
				var localUser = angular.fromJson(localStorage.user);
				Parse.User.become(localUser.sessionToken)
				$http.defaults.headers.common['X-Parse-Session-Token'] = localUser.sessionToken;
			}
 			$http.get(config.parseRoot+'users/me').success(function(data){
 				//Add a weird hack because /me does not return all information stored in the user object.
 				$http.get(config.parseRoot+'users/'+data.objectId).success(function(data){
 					$rootScope.user=data;
	 				$rootScope.$broadcast('authenticated', data);
 				});
 			}).error(function(){
				//Prompt for login
			});
 		},
 		loginModal:function(){
 			$('#userLoginModal').modal('show');
 		},
 		login:function(user){
 			var login = {
 				username:user.username,
 				password:user.password
 			}
 			$http.get(config.parseRoot+"login", {params: login}).success(function(data){
 				Parse.User.become(data.sessionToken);
 				$http.defaults.headers.common['X-Parse-Session-Token'] = data.sessionToken;
 				localStorage.user=angular.toJson(data);
 				$rootScope.user=data;
				$rootScope.$broadcast('authenticated', data);
 				$('#userLoginModal').modal('hide');
 			}).error(function(error){
 				$rootScope.alert.add('error', error)
 				$rootScope.error = error;
			});
 		},
 		signupModal:function(){
 			$('#userSignupModal').modal('show');
 		},
 		signup:function(user){
 			if(user){
	 			user.fullName = user.firstName + ' ' + user.lastName
	 			user.username = user.email;
	 			if(user.password!=user.password2){
	 				$rootScope.alert.add('error', 'Your passwords do not match.')
	 			}else{
	 				$rootScope.error = null;
	 				delete user.password2;
	 				$http.post(config.parseRoot+'users', user).success(function(data){
	 					$('#userSignupModal').modal('hide');
	 					window.location.hash='#/main/welcome'
	 					userService.login(user);
	 				}).error(function(error){
	 					$rootScope.alert.add('error', error)
	 					$rootScope.error = error;
	 				});
	 			}
	 		}else{
	 			$rootScope.alert.add('error', 'Please enter your information.')
	 		}
 		},
 		logout:function(){
 			localStorage.clear();
 			$rootScope.user=null;
 			Parse.User.logOut()
 		}
 	}
	it.userService = userService;
	return userService;
});









app.factory('taskService', function ($rootScope, $http, $q, config, userService) {
	var taskList = false;
	var taskService = {
		init:function(){
			var deferred = $q.defer();
			userService.user().then(function(){
				if(localStorage.taskList){
					taskList = angular.fromJson(localStorage.taskList)
					deferred.resolve(taskList);
				}else{
					$http.get(config.parseRoot+'classes/Task')
					.success(function(data){
						taskList = data.results;
						localStorage.taskList = angular.toJson(taskList)
						deferred.resolve(taskList);
					})
				}
			})
			return deferred.promise;
		},
		reload:function(){
			var deferred = $q.defer();
			userService.user().then(function(){
				$http.get(config.parseRoot+'classes/Task')
				.success(function(data){
					taskList = data.results;
					localStorage.taskList = angular.toJson(taskList)
					deferred.resolve(taskList);
				})
			});
			return deferred.promise;
		},
		list:function(){
			return taskService.init();
		},
		add:function(task){
			var deferred = $q.defer();
			$http.post(config.parseRoot+'classes/Task', task)
			.success(function(data){
				console.log(data)
				it.newTask = data;
				deferred.resolve(data);
			})
			return deferred.promise;
		}
	}
	it.taskService = taskService;
	return taskService;
});













app.factory('fileService', function ($http, $q, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var deferred = $q.defer();
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				console.log('save success',data)
				deferred.resolve(data);
			}, function(error) {
				console.log('save error',error)
				deferred.reject(error);
			});
			return deferred.promise;
		}
	}

	it.fileService = fileService;
	return fileService;
});



app.factory('qrService', function () {
	var qrService = {
		create:function(text, size){
			if(!size)
				size = 256;
			return 'https://api.qrserver.com/v1/create-qr-code/?size='+size+'x'+size+'&data='+text
			// return 'https://chart.googleapis.com/chart?'+
		}
	}

	it.qrService = qrService;
	return qrService;
});



