/* app.js */

define(
	[
		'statemachine'
	],
	function(StateMachine) {

		'use strict';

		function App() {

			var State = {
				CLOSED: 'CLOSED',
				OPENED: 'OPENED',
				LOCKED: 'LOCKED'
			};

			var Action = {
				CLOSE: 'CLOSE',
				OPEN: 'OPEN',
				LOCK: 'LOCK',
				UNLOCK: 'UNLOCK'
			};

			var config = [
				{
					initial: true,
					name: State.CLOSED,
					transitions: [
						{ action: Action.OPEN, target: State.OPENED },
						{ action: Action.LOCK, target: State.LOCKED }
					],
					onEnter: function() {
						console.log('State CLOSED enter');
					},
					onChange: function() {
						console.log('State CLOSED change');
					},
					onExit: function() {
						console.log('State CLOSED exit');
					}
				},
				{
					name: State.OPENED,
					transitions: [
						{ action: Action.CLOSE, target: State.CLOSED }
					],
					onEnter: function() {
						console.log('State OPENED enter');
					},
					onChange: function() {
						console.log('State OPENED change');
					},
					onExit: function() {
						console.log('State OPENED exit');
						/*if(confirm('Cancel')) {
							stateMachine.cancel();
						}*/
					}
				},
				{
					name: State.LOCKED,
					transitions: [
						{ action: Action.UNLOCK, target: State.CLOSED }
					],
					onEnter: function() {
						console.log('State LOCKED enter');
					},
					onChange: function() {
						console.log('State LOCKED change');
					},
					onExit: function() {
						console.log('State LOCKED exit');
					}
				}
			];

			var stateMachine = new StateMachine();

			stateMachine.factory.addMultiple(config);

			stateMachine.onChange.add(function(name, data) {
				console.log('Current state: ', stateMachine.currentState.name);
			});

			stateMachine.start();

			document.body.appendChild(new StateMachine.DebugView(stateMachine));
		}

		return App;
	}
);
