(function(){
	var app = angular.module('atkinsoftSite', []);



	app.controller('TabController', function(){
	
		this.tab = 0;
		
		this.setTab = function(newTab){
		
			this.tab = newTab;
			
		}
		
		this.isCurrentTab = function(currentTab){
		
			return currentTab === this.tab;
			
		}
	
	});

	app.directive('indexContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'index-content.html'
		}
	});
	app.directive('segaContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'sega-content.html'
		}
	});
	app.directive('sinclairContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'sinclair-content.html'
		}
	});
	app.directive('timexContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'timex-content.html'
		}
	});
	app.directive('synclavierContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'synclavier-content.html'
		}
	});
	app.directive('stewartLeeContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'stewart-lee-content.html'
		}
	});
	app.directive('sidContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'sid-content.html'
		}
	});
	app.directive('fmContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'fm-content.html'
		}
	});
	app.directive('audioContent', function() {
		return {
			restrict: 'E',
			templateUrl: 'audio-content.html'
		}
	});
	app.directive('webAudioSynth', function() {
		return {
			restrict: 'E',
			templateUrl: 'web-audio-synth.html'
		}
	});
	
}) ();
