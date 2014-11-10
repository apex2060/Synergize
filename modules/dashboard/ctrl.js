var DashboardCtrl = app.lazy.controller('DashboardCtrl', function($rootScope, $scope, $routeParams, config, userService, taskService){
	
	var tools = {
		init:function(){
			if(!$rootScope.tasks){
				userService.user().then(function(){
					//Do things than need to be done once the user is authenticated.
					// Load message, alert, task (count)
					// Initialize call center << 
					taskService.init().then(function(taskList){
						console.log(taskList)
						$rootScope.tasks = taskList;
					});
				});
			}
		},
		task:{
			reload:function(){
				taskService.reload().then(function(taskList){
					$rootScope.tasks = taskList;
				});
			},
			add:function(task){
				$rootScope.alert('success', 'Task Added')
				taskService.add(task);
			},
		}
	}

	$scope.tools = tools;
	tools.init();
	it.DashboardCtrl=$scope;
});