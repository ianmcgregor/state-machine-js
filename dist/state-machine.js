!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.StateMachine=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var signals = require('signals');

/*
 * StateMachine
 */

function StateMachine() {
	this._states = {};
	this._initial = null;
	this._currentState = null;
	this._previousState = null;
	this._cancelled = null;
	this._hasChanged = false;
	this._actionQueue = [];
	this._history = [];
	this._onChange = new signals.Signal();
}

StateMachine.prototype = {
	start: function() {
		if ( !this._initial ) {
			throw 'State Machine cannot start. No states defined.';
		}
		this._transitionTo( this._initial, null );
    return this;
	},
	action: function(action, data) {
		// Check if current action transition is complete
		if(!this._hasChanged) {
			// Queue the new action and exit
			this._actionQueue.push({
				'action': action,
				'data': data
			});
			return this;
		}
		// Check if we're already in the correct state
		if (this._currentState && this._currentState.getTarget(action) === this._currentState.name) {
			return this;
		}
		var newStateTarget = this._currentState.getTarget( action );
		var newState = this._states[ newStateTarget ];
		// Only transition if there's a state associated with the action
		if( newState ) {
			this._transitionTo( newState, data );
		}
    return this;
	},
	_transitionTo: function( nextState, data ) {
		this._hasChanged = false;

		if ( nextState === null ) {
			return;
		}

		this._cancelled = false;

		// Exit current
		if ( this._currentState && this._currentState.onExit.getNumListeners() > 0 ) {
			this._currentState.onExit.dispatch(data);
		}

		// Has transition been been cancelled on Exit guard?
		if ( this._cancelled ) {
			this._cancelled = false;
			return;
		}

		// Enter next State
		if ( nextState.onEnter.getNumListeners() > 0 ) {
			nextState.onEnter.dispatch(data);
		}

		// Has transition been been cancelled on Enter guard?
		if ( this._cancelled ) {
			this._cancelled = false;
			return;
		}

		// Set previous state and save name in history array
		if(this._currentState) {
			this._previousState = this._currentState;
			this._history.push(this._previousState.name);
		}

		// Update current state now both guards have been passed
		this._currentState = nextState;

		// Dispatch specific Change notification for this State
		if ( nextState.onChange.getNumListeners() > 0 ) {
			nextState.onChange.dispatch(data);
		}

		// Dispatch general Change notification
		this._onChange.dispatch(this._currentState.name, data);

		// Set hasChanged flag to true
		this._hasChanged = true;

		// Process action queue
		this._processActionQueue();
	},
	_processActionQueue: function() {
		if(this._actionQueue.length > 0) {
			var stateEvent = this._actionQueue.shift();

			// If currentState has no state for that action go to the next one
			if(!this._currentState.getTarget(stateEvent.action)) {
				this._processActionQueue();
			}
			else {
				this.action(stateEvent.action, stateEvent.data);
			}
		}
	},
	cancel: function() {
		this._cancelled = true;
    return this;
	},
	addState: function( state, isInitial ) {
		if ( state === null || this._states[ state.name ]) {
			return null;
		}
		this._states[ state.name ] = state;
		if ( isInitial ) {
			this._initial = state;
		}
		return state;
	},
	removeState: function( stateName ) {
		var state = this._states[ stateName ];
		if ( state === null ) {
			return null;
		}
		delete this._states[ stateName ];
    return state;
	},
	getState: function(stateName) {
		return this._states[stateName];
	},
	create: function(config) {
		if(config instanceof Array) {
			config.forEach(function(item) {
				this.create(item);
			}, this);
			return this;
		}
		var state = new StateMachine.State(config.name);
		var transitions = config.transitions;
		if(transitions) {
			for (var i = 0; i < transitions.length; i++) {
				state.addTransition(transitions[i].action, transitions[i].target);
				if(typeof config.onChange === 'function') {
					state.onChange.add(config.onChange);
				}
				if(typeof config.onEnter === 'function') {
					state.onEnter.add(config.onEnter);
				}
				if(typeof config.onExit === 'function') {
					state.onExit.add(config.onExit);
				}
			}
		}
		var isInitial = this.getTotal() === 0 || config.initial;
    this.addState(state, isInitial)
		return this;
	},
	getTotal: function() {
		return Object.keys(this.states).length;
	}
};

Object.defineProperty(StateMachine.prototype, 'onChange', {
	get: function() {
		return this._onChange;
	}
});

Object.defineProperty(StateMachine.prototype, 'currentState', {
	get: function() {
		return this._currentState;
	}
});

Object.defineProperty(StateMachine.prototype, 'previousState', {
	get: function() {
		return this._previousState;
	}
});

Object.defineProperty(StateMachine.prototype, 'states', {
	get: function() {
		return this._states;
	}
});

Object.defineProperty(StateMachine.prototype, 'initial', {
	get: function() {
		return this._initial;
	}
});

Object.defineProperty(StateMachine.prototype, 'history', {
	get: function() {
		return this._history;
	}
});

Object.defineProperty(StateMachine.prototype, 'factory', {
	get: function() {
		return this._factory;
	}
});

/*
 * State
 */

StateMachine.State = function(name) {
	this._transitions = {};
	this._name = name;
	this._onChange = new signals.Signal();
	this._onEnter = new signals.Signal();
	this._onExit = new signals.Signal();
};

StateMachine.State.prototype = {
	addTransition: function(action, target) {
		if ( this.getTarget( action ) ) {
			return;
		}
		this._transitions[ action ] = target;
	},
	removeTransition: function(action) {
		this._transitions[ action ] = null;
	},
	getTarget: function(action)	{
		return this._transitions[ action ];
	}
};

Object.defineProperty(StateMachine.State.prototype, 'name', {
	get: function() {
		return this._name;
	}
});

Object.defineProperty(StateMachine.State.prototype, 'transitions', {
	get: function() {
		return this._transitions;
	}
});

Object.defineProperty(StateMachine.State.prototype, 'onChange', {
	get: function() {
		return this._onChange;
	}
});

Object.defineProperty(StateMachine.State.prototype, 'onEnter', {
	get: function() {
		return this._onEnter;
	}
});

Object.defineProperty(StateMachine.State.prototype, 'onExit', {
	get: function() {
		return this._onExit;
	}
});

/*
 * Debug View
 */

StateMachine.DebugView = function(fsm) {

	var container = document.createElement('div');

	function updateState(name) {
		var all = container.querySelectorAll('div');
		for (var i = 0; i < all.length; i++) {
			all[i].style.display = all[i].getAttribute('data-state') === name ? 'block' : 'none';
		}
	}

	function createButton(action) {
		var b = document.createElement('button');
		b.setAttribute('data-action', action);
		b.addEventListener('click', function() {
			var a = this.getAttribute('data-action');
			fsm.action(a);
		});
		b.innerHTML = action;
		return b;
	}

	for(var key in fsm.states) {
		var s = fsm.states[key];
		var d = document.createElement('div');
		d.setAttribute('data-state', s.name);
		d.style.display = 'none';

		var h = document.createElement('h3');
		h.innerHTML = 'State: ' + s.name;
		d.appendChild(h);

		var transitions = s.transitions;
		if(transitions) {
			for(var a in transitions) {
				if(transitions.hasOwnProperty(a)) {
					d.appendChild(createButton(a));
				}
			}
		}
		container.appendChild(d);
	}

	fsm.onChange.add(function(name) {
		updateState(name);
	});

	if(fsm.currentState) {
		updateState(fsm.currentState.name);
	}

	return container;
};

module.exports = StateMachine;

},{"signals":2}],2:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}]},{},[1])(1)
});