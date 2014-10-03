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
stateMachine.onChange.add(function(state, data, action) {
    console.log('State has changed to:', state.name);
    console.log('Got data:', data);
    console.log('Got triggering action:', action);
});

// start
stateMachine.start(); // state changed to 'CLOSED' because that state has 'initial' flag

// state will change to 'LOCKED':
stateMachine.action(Action.LOCK);
// state won't change - no valid transition to 'CLOSE' from 'LOCKED':
stateMachine.action(Action.CLOSE);
// state will change to 'CLOSED', data payload sent through:
stateMachine.action(Action.UNLOCK, { foo: 'bar' });

// debug view with info and buttons to change state
var debugView = new StateMachine.DebugView(stateMachine);
document.body.appendChild(debugView);

```

States can be created individually:

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

You can add callbacks to receive notifications when the State Machine is entering or exiting a State and optionally cancel the transition:

```javascript
// add listener for state enter
stateMachine.onEnter.add(function(state, data, action) {
    console.log('State will change to:', state.name);
    // unless:
    if(someCondition) {
        stateMachine.cancel(); // will not enter this State
    }
});

// add listener for state exit
stateMachine.onExit.add(function(state, data, action) {
    console.log('State will change from:', state.name);
    // unless:
    if(someCondition) {
        stateMachine.cancel(); // will not exit this State
    }
});
```

You can also add optional callbacks to individual states:

```javascript
// by retrieving individual states
var state = stateMachine.getState('LOCKED');

state.onEnter.add(function(state, data, action) {
    // entering LOCKED State
    // Possible to cancel transition in by calling stateMachine.cancel()
});

state.onChange.add(function(state, data, action) {
    // in LOCKED State
});

state.onExit.add(function(state, data, action) {
    // exiting LOCKED State
    // Possible to cancel transition out by calling stateMachine.cancel()
});

// or via config object
stateMachine.create({
	name: 'LOCKED',
	transitions: [
		{ action: 'UNLOCK', target: 'CLOSED' }
	],
	onEnter: function(state, data, action) {
		// entering LOCKED state
		// Possible to cancel transition in by calling stateMachine.cancel()
	},
	onChange: function(state, data, action) {
		// in LOCKED state
	},
	onExit: function(state, data, action) {
		// exiting LOCKED state
		// Possible to cancel transition out by calling stateMachine.cancel()
	}
});
```

### API

Methods

>`create(config)` create new States  
`start() returns StateMachine` starts State Machine, transitioning to 'initial' State  
`action(action, data) returns StateMachine` initiates a State transition  
`cancel() returns StateMachine` cancels the current transition  
`getState(stateName) returns State` retrieve a State  
`removeState(stateName) returns State` remove a State  
`getTotal() returns number` total number of States defined  

Getters

>`currentState returns State`  
`previousState returns State`  
`states returns Object`  
`initial returns State` the initial State  
`history returns array` array of State names (strings)  

Callbacks

>`onChange.add(callback, context)` add callback when State has changed  
`onEnter.add(callback, context)` add callback when entering a State  
`onExit.add(callback, context)` add callback when exiting a State  

>`onChange.remove(callback, context)` remove callback  
`onEnter.remove(callback, context)` remove callback  
`onExit.remove(callback, context)` remove callback  

>`onChange.removeAll()` remove all callbacks  
`onEnter.removeAll()` remove all callbacks  
`onExit.removeAll()` remove all callbacks  


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
