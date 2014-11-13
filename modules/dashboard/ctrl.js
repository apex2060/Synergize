var DashboardCtrl = app.lazy.controller('DashboardCtrl', function($rootScope, $scope, $routeParams, $timeout, config, userService, dataService){
	var taskResource 	= new dataService.resource('Task', 'taskList');
	var contactResource = new dataService.resource('Contact', 'contactList');
	it.tr = taskResource;
	it.cr = contactResource;
	
	var tools = {
		init:function(){
			userService.user().then(function(){
				// tools.task.init();
				tools.contact.init();
				tools.timeline.init();
			});
		},
		task:{
			item: taskResource.item,
			init: function(){
				// The task list is being registered in the main controller, we would call this again if we wanted to setup a custom listener and handle the data differently within the dashboard. 
				// taskResource.addListener(function(data){
				// 	console.log('tasks from dashboard')
				// 	$rootScope.tasks = data.results;	
				// });
				// taskResource.item.list().then(function(data){
				// 	$rootScope.tasks = data.results;	
				// });
			},
			add:function(){
				taskResource.item.add($rootScope.temp.task).then(function(){
					$rootScope.temp.task = {};
				})
			}
		},
		contact:{
			item: contactResource.item,
			init: function(){
				//Do something on controller init
			},
			add:function(){
				var contact = $rootScope.temp.contact
				if(!contact)
					exit;
				contact.fullName = contact.firstName+' '+contact.lastName;
				contactResource.item.add($rootScope.temp.contact).then(function(){
					$rootScope.temp.contact = {};
				})
			}
		},
		timeline:{
			init:function(){
				var color = ['gray','yellow','purple','orange',''];
				var style = ['default','primary','success','info','warning','danger']
				var side = ['left','right'];
				var icon = ['search','user','phone','at','institution','envelope','road',false]
				var words = ['something','everyone','love','loves','enjoys','serve','work','silver','blue'];
				var tf = [true,false];
				
				$scope.timeline = [];
				function addEvent(i){
					var link = {
						text: words.random()+' '+words.random(),
						style: style.random(),
						url: '#/'+words.random()
					};
					var event = {
						isMilestone: (i%10==0),
						color: color.random(),
						side: side.random(),
						icon: icon.random(),
						moment: moment(chance.birthday()).calendar(),
						title: words.random()+' '+words.random()+' '+words.random(),
						body: words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random()+' '+words.random(),
					};
					if(tf.random())
						event.link = link;
					$scope.timeline.unshift(event);
				}
				for(var i=0; i<20; i++)
					addEvent(i)
				
				addMore(0);
				function addMore(i){
					i++;
					addEvent(i);
					$timeout(function(){addMore(i);},i*1000)
				}
			}
		}
	}

	$scope.tools = tools;
	tools.init();
	it.DashboardCtrl=$scope;
});