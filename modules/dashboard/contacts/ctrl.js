var ContactCtrl = app.lazy.controller('ContactCtrl', function($rootScope, $scope, $routeParams, $timeout, config, userService, dataService, contactService){
	var contactResource = new dataService.resource({className: 'Contact', identifier:'contactList'});
	var groupResource = new dataService.resource({className: 'Group', identifier:'groupList'});
	
	var tools = {
		contact: angular.extend(contactService, {
			focus: function(smallContact){
				contactResource.item.list().then(function(data){
					var contactList = data.results;
					for(var i=0; i<contactList.length; i++)
						if(contactList[i].objectId == smallContact.objectId)
							tools.contact.view(contactList[i])
				})
			},
			generate:function(){
				$rootScope.temp.contact = {
					firstName: chance.first(),
					lastName: chance.last(),
					phone: chance.phone(),
					email: chance.email()
				}
			}
		}),
		call:{
			focus: function(call){
				$rootScope.temp.contact = {
					phone: 	call.extNumber,
					city: 	call.city,
					state: 	call.state
				}
			}	
		},
		group:{
			init:function(){
				if(localStorage.contactGroups)
					$rootScope.groups = angular.fromJson(localStorage.contactGroups)
				else
					$rootScope.groups = [];
					
				$scope.$watch('groups', function(groups){
					localStorage.setItem('contactGroups', angular.toJson(groups));
				}, true);
			},
			create: function(parentGroup){
				if(!parentGroup){
					$scope.groups.push({
						createdOn: new moment().toISOString(),
						title: false,
						description: '',
						groups: [],
						contacts: []
					});
				}else{
					if(!parentGroup.groups)
						parentGroup.groups = [];
					parentGroup.groups.push({
						createdOn: new moment().toISOString(),
						title: false,
						description: '',
						groups: [],
						contacts: [],
						isChild: true
					});
				}
			},
			edit:function(group){
				group.tempTitle = group.title;
				delete group.title;
			},
			set:function(group){
				group.title = group.tempTitle;
				delete group.tempTitle;
			},
			remove: function(scope, group) {
				if(group.isChild){
					console.log(scope.$parent.$parent.group)
					var parentGroup = scope.$parent.$parent.group; //group.parentGroup;
					var i = parentGroup.groups.indexOf(group);
					parentGroup.groups.splice(i,1);
				}else{
					var groups = $scope.groups;
					var i = groups.indexOf(group);
					groups.splice(i,1);
				}
			},
			addContact: function(parentGroup,contact){
				var formated = {
					fullName: contact.fullName,
					objectId: contact.objectId
				}
				parentGroup.contacts.push(formated)
			},
			removeContact: function(parentGroup, contact){
				var i = parentGroup.contacts.indexOf(contact);
				if(confirm('Are you sure you want to remove '+contact.fullName+' from '+parentGroup.title))
					parentGroup.contacts.splice(i,1);
			},
		},
		dnd:{
			drag:function(obj,event){
				obj.isAssigned = true;
			},
			drop:function(group,contact){
				tools.group.addContact(group,contact);
			}
		}
	}
	
	
	if(!$rootScope.groups)
		tools.group.init();
	
	$scope.tools = tools;
	it.ContactCtrl=$scope;
});