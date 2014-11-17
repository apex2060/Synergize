// CONTROLLERS
var SetupCtrl = app.lazy.controller('SetupCtrl', function($rootScope, $scope, $http, $q, config, initSetupService, roleService){
	var tools = {
		email:function(fun){
			$http.post(config.parseRoot+'functions/'+fun, {}).success(function(data){
				$scope.response = data;
			}).error(function(error, data){
				$scope.response = {error:error,data:data};
			});
		},
		setup:function(){
			roleService.detailedRoles().then(function(roles){
				$rootScope.data.roles = roles;
				roleService.unassigned().then(function(unassigned){
					$rootScope.data.unassigned = unassigned;
				})
			})
		},
		userRoles:roleService,
		user:{
			editRoles:function(user){
				$rootScope.temp.user = user;
				$('#adminUserModal').modal('show');
				// ga('send', 'event', 'admin', 'editRoles');
			}
		},
		roles:{
			setup:function(){	//This is a one time only thing - used to initiate the website roles.
				initSetupService.setup($rootScope.user,config.roles).then(function(results){
					$rootScope.data.roles = results;
				})
			}
		}
	}

	tools.setup();
	$scope.$on('authenticated', function() {
		tools.setup();
	})
	$rootScope.$on('role-reassigned', function(event,unassigned){
		$rootScope.data.unassigned = unassigned;
	})
	$scope.tools = tools;
	it.SetupCtrl=$scope;
});







// SERVICES
app.lazy.factory('roleService', function ($rootScope, $http, $q, config) {
	var userList = [];
	var roleList = [];
	var unassigned = false;
	var roleService = {
		reassign:function(){
			var deferred = $q.defer();
			roleService.listUsers().then(function(users){
				var users = angular.fromJson(angular.toJson(users))
				var assignedUsers = [];
				for(var i=0; i<roleList.length; i++)
					for(var u=0; u<roleList[i].users.length; u++)
						assignedUsers.push(roleList[i].users[u].objectId)	

				unassigned = [];
				for(var i=0; i<users.length; i++)
					if(assignedUsers.indexOf(users[i].objectId) == -1)
						unassigned.push(users[i])

				$rootScope.$broadcast('role-reassigned', unassigned)
				deferred.resolve(unassigned);
			})
			return deferred.promise;
		},
		unassigned:function(){
			var deferred = $q.defer();
			if(unassigned){
				deferred.resolve(unassigned);
			}else{
				roleService.reassign().then(function(){
					deferred.resolve(unassigned);
				});
			}
			return deferred.promise;
		},
		detailedRoles:function(){
			var deferred = $q.defer();
			roleService.listRoles().then(function(roles){
				if(!$rootScope.data)
					$rootScope.data = {};
				$rootScope.data.roles = [];
				var listToGet = [];
				for(var i=0; i<roles.length; i++){
					listToGet.push(roleService.roleUserList(roles[i]))
				}
				$q.all(listToGet).then(function(roles){
					roleList = roles;
					deferred.resolve(roles);
				})
			})
			return deferred.promise;
		},
		listRoles:function(){
			var deferred = $q.defer();
			$http.get(config.parseRoot+'classes/_Role').success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		roleUserList:function(role){
			var deferred = $q.defer();
			var roleQry = 'where={"$relatedTo":{"object":{"__type":"Pointer","className":"_Role","objectId":"'+role.objectId+'"},"key":"users"}}'
			$http.get(config.parseRoot+'classes/_User?'+roleQry).success(function(data){
				role.users = data.results;
				deferred.resolve(role);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		listUsers:function(){
			var deferred = $q.defer();
			$http.get(config.parseRoot+'classes/_User').success(function(data){
				userList = data.results;
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		toggleUserRole:function(user,role){
			if(roleService.hasRole(user,role))
				roleService.deleteUserRole(user,role)
			else
				roleService.addUserRole(user,role)
		},
		addUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				role.users.push(user);
				roleService.reassign();
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		deleteUserRole:function(user,role){
			var deferred = $q.defer();
			var request = {
				users: {
					"__op": "RemoveRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": user.objectId
					}]
				}
			}
			$http.put(config.parseRoot+'classes/_Role/'+role.objectId, request).success(function(data){
				role.users.splice(role.users.indexOf(user), 1)
				roleService.reassign();
				deferred.resolve(data);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		hasRole:function(user, role){
			if(user && role && role.users)
				for(var i=0; i<role.users.length; i++)
					if(user.objectId==role.users[i].objectId)
						return true
			return false;
		},
		roleList:function(){
			return roleList;
		}
	}
	it.roleService = roleService;
	return roleService;
});










app.lazy.factory('initSetupService', function($rootScope, $http, $q, config){
	//1st time admin user login
	//Setup permissions and assign 1st user as admin
	var privateData = {}
	var initSetupService = {
		setup:function(user, roleList){
			var deferred = $q.defer();
			if(!user || !user.objectId){
				console.error('You must create an account before you can setup roles.')
				deferred.reject();
			}else{
				var createdRoles = [];
				var superAdmin = user.objectId;
				initSetupService.setAdminRole(superAdmin).then(
					function(adminRole){
						privateData.adminRole = adminRole;
						createdRoles.push(adminRole);
						roleSetupArray = [];
						for(var i=0; i<roleList.length; i++)
							roleSetupArray.push(initSetupService.setOtherRole(roleList[i]))
						$q.all(roleSetupArray).then(function(data){
							for(var i=0; i<data.length; i++)
								createdRoles.push(data[i]);
							deferred.resolve(createdRoles);
						});
					}
				)
			}
			return deferred.promise;
		},
		setAdminRole:function(superAdmin){
			var deferred = $q.defer();
			var adminRole = {
				name: 'Admin',
				ACL: {
					"*":{
						read: true
					}
				},
				users: {
					"__op": "AddRelation",
					"objects": [{
						"__type": "Pointer",
						"className": "_User",
						"objectId": superAdmin
					}]
				}
			};
			adminRole.ACL[superAdmin] = {
				read: true,
				write: true
			}
			$http.post('https://api.parse.com/1/classes/_Role', adminRole).success(function(data){
				adminRole.response = data;
				deferred.resolve(adminRole);
			}).error(function(error, data){
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		},
		setOtherRole:function(roleName){
			var deferred = $q.defer();
			var roleParams = {
				name: roleName,
				ACL: {
					"*":{
						read: true
					},
					"role:Admin":{
						read: true,
						write: true
					}
				},
				roles: {
					"__op": "AddRelation",
					"objects": [
					{
						"__type": "Pointer",
						"className": "_Role",
						"objectId": privateData.adminRole.response.objectId
					}
					]
				}
			};
			$http.post('https://api.parse.com/1/classes/_Role', roleParams).success(function(data){
				roleParams.response = data;
				deferred.resolve(roleParams);
			}).error(function(error, data){
				deferred.reject({error:error,data:data});
			});

			return deferred.promise;
		}
	}
	it.initSetupService = initSetupService;
	return initSetupService;
});





