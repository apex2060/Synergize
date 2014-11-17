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
 				});
 				userService.getRoles(data).then(function(roles){
 					data.roles = roles;
	 				$rootScope.user=data;
	 				$rootScope.$broadcast('authenticated', data);
 				})
 			}).error(function(){
				//Prompt for login
			});
 		},
 		login:function(user, signup){
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
				if(!signup)
				window.location.hash='#/dashboard';
 			}).error(function(error){
 				$rootScope.alert('error', error)
 				$rootScope.error = error;
			});
 		},
 		signup:function(user){
 			if(user){
	 			user.fullName = user.firstName + ' ' + user.lastName
	 			if(user.password!=user.password2){
	 				$rootScope.alert('error', 'Your passwords do not match.')
	 			}else{
	 				$rootScope.error = null;
	 				delete user.password2;
	 				$http.post(config.parseRoot+'users', user).success(function(data){
	 					userService.login(user, true);
	 					window.location.hash='#/welcome'
	 				}).error(function(error){
	 					$rootScope.alert('error', error)
	 					$rootScope.error = error;
	 				});
	 			}
	 		}else{
	 			$rootScope.alert('error', 'Please enter your information.')
	 		}
 		},
 		getRoles:function(user){
			var deferred = $q.defer();
			var roleQry = 'where={"users":{"__type":"Pointer","className":"_User","objectId":"'+user.objectId+'"}}'
			$http.get(config.parseRoot+'classes/_Role?'+roleQry).success(function(data){
				deferred.resolve(data.results);
			}).error(function(data){
				deferred.reject(data);
			});
			return deferred.promise;
		},
		is:function(roleName){
			if($rootScope.user && $rootScope.user.roles)
				for(var i=0; i<$rootScope.user.roles.length; i++)
					if($rootScope.user.roles[i].name==roleName)
						return true;
			return false;
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











app.factory('dataService', function ($rootScope, $http, $q, config, Firebase) {
	var siteConfig = config;
	//Set local dataStore obj if it doesn't exist
	if(!localStorage.getItem('FBPDS'))
		localStorage.setItem('FBPDS', angular.toJson({
			resource: {},
			resourceList: [],
			notLocal:[], 
			wip: {},
			lastRequest: ''
		}))

	//Load local dataStore
	var dataStore = angular.fromJson(localStorage.getItem('FBPDS'));
	windowState.setup();

	var DS = {
		data: function(){
			return dataStore;
		},
		resourceList: function(){
			return dataStore.resourceList;
		},
		localSave:function(){
			var tempData = angular.fromJson(angular.toJson(dataStore))
				for(var i=0; i<tempData.notLocal.length; i++)
					delete tempData.resource[tempData.notLocal[i]]
			localStorage.setItem('FBPDS', angular.toJson(tempData))
		},
		wip: {
			add: function(identifier, object){
				if(object.objectId){
					if(!dataStore.wip[identifier])
						dataStore.wip[identifier] = {};
					dataStore.wip[identifier][object.objectId] = object;
					DS.localSave();
				}
			},
			remove: function(identifier, objectId){
				if(typeof(objectId)=='object')
					objectId = objectId.objectId

				if(dataStore.wip[identifier])
					delete dataStore.wip[identifier][objectId];
			},
			list: function(){
				return dataStore.wip;
			},
			isInEdit: function(identifier, object){
				if(dataStore.wip[identifier])
					return !!dataStore.wip[identifier][object.objectId]
			},
			keepResource: function(identifier, resource){
				if(dataStore.wip[identifier])
					for(var i=0; i<resource.length; i++)
						if(dataStore.wip[identifier][resource[i].objectId])
							resource[i] = dataStore.wip[identifier][resource[i].objectId]
				return resource;
			}
		},
		resource: function(userConfig){
			//The when changes to this data occur, this will broadcast on the listenId;
			var resource = this;
			
			var defautParams = {
				liveStreams: [],
				className: userConfig.className,
				identifier: 'resource/'+userConfig.className,
				isLive: true,
				isLocal: true,
				query: false,
				params: false
			}
			resource.config = angular.extend(defautParams, userConfig)
			resource.listenId = 'DS-'+resource.config.identifier;

			
			resource.addListener = function(callback){
				$rootScope.$on(resource.listenId, function(evt,newData){
					callback(newData);
				});
			},
			resource.addLiveStream = function(identifier){
				var tempRef = new Firebase(siteConfig.fireRoot+identifier)
				resource.config.liveStreams.push(tempRef);
			}
 			resource.setQuery = function(query){
				resource.config.query = query;
			}
			resource.loadData = function(lastUpdate){
				var deferred 	= $q.defer();
				var className 	= resource.config.className
				var identifier 	= resource.config.identifier

				//We were getting multiple requests when the controller was re-initiated.
				if(!lastUpdate)
					lastUpdate = new Date().getTime();
				if(dataStore.lastRequest != lastUpdate){
					dataStore.lastRequest = lastUpdate
					var query = '';
					if(resource.config.params)
						query = resource.config.query
					else if(resource.config.query)
						query = siteConfig.parseRoot+'classes/'+className+'?'+query;
					else
						query = siteConfig.parseRoot+'classes/'+className;

					if(resource.config.params)
						$http.post(query, resource.config.params).success(function(data){
							dataStore.resource[identifier] = {
								identifier: identifier,
								results: DS.wip.keepResource(identifier, data.result),
								liveSync: lastUpdate
							}

							DS.localSave();
							$rootScope.$broadcast(resource.listenId, dataStore.resource[identifier]);
							deferred.resolve(dataStore.resource[identifier]);
						}).error(function(data){
							deferred.reject(data);
						});
					else
						$http.get(query).success(function(data){
							dataStore.resource[identifier] = {
								identifier: identifier,
								results: DS.wip.keepResource(identifier, data.results),
								liveSync: lastUpdate
							}

							DS.localSave();
							$rootScope.$broadcast(resource.listenId, dataStore.resource[identifier]);
							deferred.resolve(dataStore.resource[identifier]);
						}).error(function(data){
							deferred.reject(data);
						});
				}else{
					deferred.resolve(dataStore.resource[identifier]);
				}
				return deferred.promise;
			}
			resource.broadcast = function(timestamp){
				fireBroadcast(timestamp);
			}
			function fireBroadcast(timestamp){
				for(var i=0; i<resource.config.liveStreams.length; i++)
					resource.config.liveStreams[i].set(timestamp);
				if(resource.config.liveRef)
					resource.config.liveRef.set(timestamp)
				else
					resource.loadData();
			}

			
			if(resource.config.isLive){
				resource.config.liveRef = new Firebase(siteConfig.fireRoot+resource.config.identifier)
				resource.config.liveRef.on('value', function(dataSnapshot) {
					if(dataStore.resource[resource.config.identifier])
						var lastUpdate = dataStore.resource[resource.config.identifier].liveSync;
					if(dataSnapshot.val() != lastUpdate){
						if(windowState.isActive){
							resource.loadData(dataSnapshot.val())
						}else{
							windowState.setActive(function(){
								console.log('IS ACTIVE')
								resource.loadData(dataSnapshot.val())
							})
						}
					}else{
						$rootScope.$broadcast(resource.listenId, dataStore.resource[resource.config.identifier]);
					}
				});
			}
			if(!resource.config.isLocal){
				if(dataStore.notLocal && dataStore.notLocal.indexOf(resource.config.identifier) == -1)
					dataStore.notLocal.push(resource.config.identifier)
			}
			if(dataStore.resourceList.indexOf(resource.config.identifier) == -1)
				dataStore.resourceList.push(resource.config.identifier)


			this.item = {
				list: function(){
					var deferred = $q.defer();
					var className 	= resource.config.className
					var identifier 	= resource.config.identifier
					if(dataStore.resource[identifier]){
						deferred.resolve(dataStore.resource[identifier]);
						if(!resource.config.isLive)
							resource.loadData()
					}else{
						resource.loadData().then(function(data){
							deferred.resolve(data);
						})
					}
					return deferred.promise;
				},
				get: function(objectId){
					var deferred = $q.defer();
					var className 	= resource.config.className
					var identifier 	= resource.config.identifier

					var resourceList = dataStore.resource[identifier].results;
					var requestedResource = false;
					for(var i=0; i<resourceList.length; i++){
						if(resourceList[i].objectId == objectId)
							requestedResource = resourceList[i]
					}
					if(requestedResource)
						deferred.resolve(requestedResource);
					else
						$http.get(siteConfig.parseRoot+'classes/'+className+'/'+objectId).success(function(data){
							deferred.resolve(data);
						}).error(function(data){
							deferred.reject(data);
						});
					return deferred.promise;
				},
				save: function(object){
					if(!object)
						object = {};
					if(object.objectId)
						return this.update(object)
					else
						return this.add(object)
				},
				add: function(object){
					var deferred = $q.defer();
					var className = resource.config.className;
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					$http.post(siteConfig.parseRoot+'classes/'+className, object).success(function(data){
						DS.wip.remove(identifier, objectId)
						fireBroadcast(data.createdAt)
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				},
				update: function(object){
					object = angular.fromJson(angular.toJson(object))
					var deferred = $q.defer();
					var className = resource.config.className;
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					delete object.objectId;
					delete object.createdAt;
					delete object.updatedAt;

					$http.put(siteConfig.parseRoot+'classes/'+className+'/'+objectId, object).success(function(data){
						DS.wip.remove(identifier, objectId)
						fireBroadcast(data.updatedAt)
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				},
				remove: function(object){
					var deferred = $q.defer();
					var className = resource.config.className
					var identifier = resource.config.identifier;
					var objectId = object.objectId;

					$http.delete(siteConfig.parseRoot+'classes/'+className+'/'+object.objectId).success(function(data){
						var deletedAt = new Date();
						DS.wip.remove(identifier, objectId)
						fireBroadcast(deletedAt.toISOString())
						deferred.resolve(data);
					}).error(function(error, data){
						resource.loadData();
						deferred.reject(data);
					});
					return deferred.promise;
				}
			}
			this.remove = function(){
				var identifier = resource.config.identifier;

				var posInNotLocal = dataStore.notLocal.indexOf[identifier]
				if(posInNotLocal != -1)
					dataStore.notLocal.splice(posInNotLocal, 1)
				delete dataStore.resource[identifier]
				var posInResourceList = dataStore.resourceList.indexOf[identifier]
				if(posInResourceList != -1)
					dataStore.notLocal.splice(posInResourceList, 1)
				delete dataStore.wip[identifier]

				DS.localSave();
			}
		},
		parse:{
			pointer:function(className, objectId){
				return {
					__type: 	'Pointer',
					className: 	className,
					objectId: 	objectId
				}
			},
			acl: function(read, write){
				var acl = {};
					acl[$rootScope.user.objectId] = {
						read: true,
						write: true
					}
					if(read && write)
						acl['*'] = {
							read: read,
							write: write
						}
					else if(read)
						acl['*'] = {
							read: read
						}
				return acl;
			}
		}
	}
	it.DS = DS;
	return DS;
});




















app.factory('fileService', function ($http, $q, config) {
	var fileService = {
		upload:function(details,b64,successCallback,errorCallback){
			var deferred = $q.defer();
			var file = new Parse.File(details.name, { base64: b64});
			file.save().then(function(data) {
				deferred.resolve(data);
			}, function(error) {
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



