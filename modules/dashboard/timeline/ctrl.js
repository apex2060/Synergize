var TimelineCtrl = app.lazy.controller('TimelineCtrl', function($rootScope, $scope, $routeParams, $timeout, $http, $q, $sce, config, userService, dataService, contactService){
	$scope.timeline = [];
	
	var tools = {
		init:function(){
			tools.timeline.init();
		},
		sms:function(message){
			var packet = {
				contactId: 	$routeParams.id,
				message: 	message
			}
			$http.post(config.parseRoot+'functions/sendSMS', packet).success(function(response){
				console.log('SMS', response);
			})
		},
		timeline:{
			init:function(){
				userService.user().then(function(user){
					var four;
					if($routeParams.id)
						four={
							for: 'contact',
							forId: $routeParams.id
						}
					else
						four={
							for: 'agent',
							forId: user.objectId
						}
					$http.post(config.parseRoot+'functions/timeline', four).success(function(data){
						var timeline = data.result;
						it.tl = timeline;
						var events = timeline.events;
						for(var i=0; i<events.length; i++){
							$scope.timeline.unshift(tools.timeline.format(events[i]));
						}
					})
				});
			},
			format:function(event){
				var format = {
					agent: {
						call: function(event){
							var evt = {};
								evt.original= event;
								evt.icon 	= 'phone';
								evt.moment 	= moment(event.updatedAt).calendar();
								
							if(event.call)
								evt.body 	= $sce.trustAsHtml('You made a phone call as: '+event.call.intNumber);
							
							if(event.call.status == 'ringing')
								evt.color 	= 'yellow'
							else
								evt.color 	= 'gray'
							if(event.call.direction == 'outbound')
								evt.side 	= 'right'
							else
								evt.side 	= 'left'
							if(event.contact)
								evt.title 	= 'To: '+event.contact.fullName;
							else
								evt.title 	= 'To: '+event.call.extNumber;
							
							return evt;
						},
						smms: function(event){
							function html(messages){
								var html = '<div class="parent"><h5>Conversation</h5><ul class="chat child">'
								for(var i=0; i<messages.length; i++){
									var message = messages[i];
									var side = "left";
									if(message.account)
										side = "right";
										html +='<li class="'+side+'"><p class="message">'+message.body+'</p><span class="from">'+message.from+'</span></li>';
								}
								html += '</ul></div>';
								return html;
							}
							var evt = {};
								evt.original= event;
								evt.icon 	= 'comments';
								evt.moment 	= moment(event.updatedAt).calendar();
								evt.body 	= $sce.trustAsHtml(html(event.smms.messages));
								evt.color 	= 'gray'
								
							if(event.smms.direction == 'outbound'){
								evt.title 	= 'From: '
								evt.side 	= 'right'
							}else{
								evt.title 	= 'To: '
								evt.side 	= 'left'
							}
							if(event.contact)
								evt.title 	+= event.contact.fullName;
							else
								evt.title 	+= event.smms.intNumber;
							
							return evt;
						},
						email: function(event){
							var evt = {};
								evt.original= event;
								evt.icon 	= 'envelope';
								evt.moment 	= moment(event.updatedAt).calendar();
								
							if(event.email)
								evt.body 	= $sce.trustAsHtml(event.email.bodyHtml);
							
							evt.color 	= 'gray';
							if(event.direction=='in'){
								evt.title 	= "From: ";
								evt.side 	= 'left';
							}else{
								evt.title 	= "To: ";
								evt.side 	= 'right';
							}
							if(event.contact)
								evt.title += event.contact.fullName;
							else
								evt.title += event.email.From;
	
							return evt;
						}
					},
					client: {
						call: function(event){
							console.log('event', event)
							var evt = {};
								evt.original= event;
								evt.icon 	= 'phone';
								evt.moment 	= moment(event.updatedAt).calendar();
								
							if(event.call)
								evt.body 	= $sce.trustAsHtml('Client Number: '+event.call.extNumber);
							
							if(event.call && event.call.status == 'ringing')
								evt.color 	= 'yellow'
							else
								evt.color 	= 'gray'
							if(event.call && event.call.direction == 'outbound'){
								evt.title 	= 'From: '
								evt.side 	= 'right'
							}else{
								evt.title 	= 'To: '
								evt.side 	= 'left'
							}
							if(event.agent)
								evt.title 	+= event.agent.fullName;
							else if(event.call)
								evt.title 	+= event.call.intNumber;
							
							return evt;
						},
						smms: function(event){
							function html(messages){
								var html = '<div class="parent"><h5>Conversation</h5><ul class="chat child">'
								for(var i=0; i<messages.length; i++){
									var message = messages[i];
									var side = "left";
									if(message.account)
										side = "right";
										html +='<li class="'+side+'"><p class="message">'+message.body+'</p><span class="from">'+message.from+'</span></li>';
								}
								html += '</ul></div>';
								return html;
							}
							var evt = {};
								evt.original= event;
								evt.icon 	= 'comments';
								evt.moment 	= moment(event.updatedAt).calendar();
								evt.body 	= $sce.trustAsHtml(html(event.smms.messages));
								evt.color 	= 'gray'
								
							if(event.smms.direction == 'outbound'){
								evt.title 	= 'From: '
								evt.side 	= 'right'
							}else{
								evt.title 	= 'To: '
								evt.side 	= 'left'
							}
							if(event.agent)
								evt.title 	+= event.agent.fullName;
							else
								evt.title 	+= event.smms.extNumber;
							
							return evt;
						},
						email: function(event){
							var evt = {};
								evt.original= event;
								evt.icon 	= 'envelope';
								evt.moment 	= moment(event.updatedAt).calendar();
								
							if(event.email)
								evt.body 	= $sce.trustAsHtml(event.email.bodyHtml);
							
							evt.color 	= 'gray';
							if(event.direction=='in'){
								evt.title 	= "To: ";
								evt.side 	= 'left';
							}else{
								evt.title 	= "From: ";
								evt.side 	= 'right';
							}
							if(event.agent)
								evt.title += event.agent.fullName;
							else
								evt.title += event.email.To;

							return evt;
						},
					}
				}
				
				var view = 'agent'
				if($routeParams.id)
					view = 'client'
				
				return format[view][event.type](event);
			},
			demoInit:function(){
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
	it.TimelineCtrl=$scope;
});