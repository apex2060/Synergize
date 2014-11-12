var DashboardCtrl = app.lazy.controller('DashboardCtrl', function($rootScope, $scope, $routeParams, config, userService, dataService){
	
	var taskResource = new dataService.resource('Task', 'taskList');
	it.tr = taskResource;
	var tools = {
		init:function(){
			if(!$rootScope.tasks){
				userService.user().then(function(){
					tools.task.init();
					tools.timeline.init();
				});
			}
		},
		task:{
			init:function(){
				// The task list is being registered in the main controller, we would call this again if we wanted to setup a custom listener and handle the data differently within the dashboard. 
				// taskResource.addListener(function(data){
				// 	console.log('tasks from dashboard')
				// 	$rootScope.tasks = data.results;	
				// });
				// taskResource.item.list().then(function(data){
				// 	$rootScope.tasks = data.results;	
				// });
			}
		},
		timeline:{
			init:function(){
				var color = ['gray','yellow','purple','orange',''];
				var style = ['default','primary','success','info','warning','danger']
				var side = ['left','right'];
				var icon = ['search','user','phone','at','institution','envelope','road',false]
				var words = ['something','everyone','love','loves','enjoys','play','work','silver','blue'];
				var tf = [true,false];
				var timeline = [];
				for(var i=0; i<100; i++){
					var link = {
						text: words.random()+' '+words.random(),
						style: style.random(),
						url: '#/'+words.random()
					};
					
					var date = {
						isMilestone: (i%10==0),
						color: color.random(),
						side: side.random(),
						icon: icon.random(),
						moment: moment(chance.birthday()).calendar(),
						title: words.random()+' '+words.random()+' '+words.random(),
						body: words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random(),
					};
					if(tf.random())
						date.link = link;
					timeline.push(date);
				}
				$scope.timeline = timeline;
			}
		}
	}

	$scope.tools = tools;
	tools.init();
	it.DashboardCtrl=$scope;
});