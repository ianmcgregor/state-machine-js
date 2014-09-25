# state-machine-js

[![NPM version](https://badge.fury.io/js/state-machine-js.svg)](http://badge.fury.io/js/state-machine-js) [![Bower version](https://badge.fury.io/bo/state-machine-js.svg)](http://badge.fury.io/bo/state-machine-js) [![Build Status](https://secure.travis-ci.org/ianmcgregor/state-machine-js.png)](https://travis-ci.org/ianmcgregor/state-machine-js)

Finite State Machine

A simple utility that allows you to define states and actions to transition between them.

### Installation

* npm: ```npm install state-machine-js --save-dev```
* bower: ```bower install state-machine-js --save-dev```

### Usage

```javascript
var stateMachine = new StateMachine();

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
        ]
    },
    {
        name: State.OPENED,
        transitions: [
            { action: Action.CLOSE, target: State.CLOSED }
        ]
    },
    {
        name: State.LOCKED,
        transitions: [
            { action: Action.UNLOCK, target: State.CLOSED }
        ]
    }
];

// create multiple states with a config array
stateMachine.create(config);

// add listener for state change
stateMachine.onChange.add(function(state, data) {
    console.log('State has changed to:', state);
    console.log('Got data:', data);
});

// start
stateMachine.start(); // state changed to 'CLOSED' because that state has 'initial' flag

// update
stateMachine.action(Action.LOCK); // state changed to 'LOCKED'
stateMachine.action(Action.CLOSE); // state didn't change - no valid transition for 'CLOSE' from 'LOCKED'
stateMachine.action(Action.UNLOCK, { foo: 'bar' }); // state changed to 'CLOSED', date sent through

// debug view with info and buttons to change state
var debugView = new StateMachine.DebugView(stateMachine);
document.body.appendChild(debugView);

```

States also can be created individually:

```javascript
// create a single state
stateMachine.create({
    name: State.LOCKED,
    transitions: [
        { action: Action.UNLOCK, target: State.CLOSED }
    ]
});

// create multiple states by chaining
stateMachine.create({
    name: State.LOCKED,
    transitions: [
        { action: Action.UNLOCK, target: State.CLOSED }
    ]
}).create({
    name: State.CLOSED,
    transitions: [
        { action: Action.LOCK, target: State.LOCKED }
    ]
});
```

You can add callbacks to individual states:

```javascript
// via config object
stateMachine.create({
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
});

// or by retrieving individual states
stateMachine.create({
    name: 'LOCKED',
    transitions: [
        { action: 'UNLOCK', target: 'CLOSED' }
    ]
});

var state = stateMachine.getState('LOCKED');
state.onChange.add(function() {
    // do something
});
```

### API

>`StateMachine()` returns StateMachine instance  
`start()` returns StateMachine  
`action(action, data)` returns StateMachine  
`cancel()` returns StateMachine  
`addState(state, isInitial)` returns the added State  
`removeState(stateName)` returns the removed State  
`getState(stateName)` returns State  
`onChange` returns Signal  
`currentState` returns State  
`previousState` returns State  
`states` returns array  
`initial` returns State  
`history` returns array  
`create(config)` returns StateMachine  
`getTotal()` returns number  


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
