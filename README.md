# state-machine-js

[![NPM version](https://badge.fury.io/js/state-machine-js.svg)](http://badge.fury.io/js/state-machine-js) [![Bower version](https://badge.fury.io/bo/state-machine-js.svg)](http://badge.fury.io/bo/state-machine-js) [![Build Status](https://secure.travis-ci.org/ianmcgregor/state-machine-js.png)](https://travis-ci.org/ianmcgregor/state-machine-js)

Finite State Machine

A simple utility that allows you to define states and actions to transition between them.

### Installation

* npm: ```npm install state-machine-js --save-dev```
* bower: ```bower install state-machine-js --save-dev```

### Usage

```
var config = [
	{
		initial: true,
		name: 'CLOSED',
		transitions: [
			{ action: 'OPEN', target: 'OPENED' },
			{ action: 'LOCK', target: 'LOCKED' }
		]
	},
	{
		name: 'OPENED',
		transitions: [
			{ action: 'CLOSE', target: 'CLOSED' }
		]
	},
	{
		name: 'LOCKED',
		transitions: [
			{ action: 'UNLOCK', target: 'CLOSED' }
		]
	}
];

var stateMachine = new StateMachine();

stateMachine.factory.addMultiple(config);

stateMachine.onChange.add(function(name, data) {
	console.log('App state has changed to:', name, 'optional data:', data);
});

stateMachine.start();

stateMachine.action('OPEN');
```

You can also add callbacks to individual states:

```
{
	name: 'LOCKED',
	transitions: [
		{ action: 'UNLOCK', target: 'CLOSED' }
	],
	onEnter: function() {
		// LOCKED state entering.
		// Possible to cancel transition in by calling stateMachine.cancel()
	},
	onChange: function() {
		// App state has changed to LOCKED
	},
	onExit: function() {
		// LOCKED state exiting.
		// Possible to cancel transition out by calling stateMachine.cancel()
	}
}
```

### Dev Setup

To install dependencies:

```
$ bower install
```

To run tests:

```
$ npm install -g karma-cli
$ npm install
$ karma start
```