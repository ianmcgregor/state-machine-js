'use strict';

var StateMachine = require('../src/main.js');

describe('state machine', function() {

	var stateMachine = new StateMachine(),
		stateChangedTo = '',
		stateData,
    changeAction,
		individualEnterNotification = false,
		individualChangeNotification = false,
		individualExitNotification = false,
    individualEnterAction = null,
    individualChangeAction = null,
    individualExitAction = null;

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
			onEnter: function(data, action) {
				individualEnterNotification = true;
				individualEnterAction = action;
			},
			onChange: function(data, action) {
				individualChangeNotification = true;
        individualChangeAction = action;
			},
			onExit: function(data, action) {
				individualExitNotification = true;
        individualExitAction = action;
			}
		},
		{
			name: State.OPENED,
			transitions: [
				{ action: Action.CLOSE, target: State.CLOSED }
			],
      onEnter: function(data, action) {
        individualEnterNotification = true;
        individualEnterAction = action;
      },
      onChange: function(data, action) {
        individualChangeNotification = true;
        individualChangeAction = action;
      },
      onExit: function(data, action) {
        individualExitNotification = true;
        individualExitAction = action;
      }
		},
		{
			name: State.LOCKED,
			transitions: [
				{ action: Action.UNLOCK, target: State.CLOSED }
			],
      onEnter: function(data, action) {
        individualEnterNotification = true;
        individualEnterAction = action;
      },
      onChange: function(data, action) {
        individualChangeNotification = true;
        individualChangeAction = action;
      },
      onExit: function(data, action) {
        individualExitNotification = true;
        individualExitAction = action;
      }
		}
	];

  it('should have a chainable create() method when passing multiple state config', function() {
    var returnValue = stateMachine.create(config);
    expect(returnValue instanceof StateMachine).to.be.true;
  });

  it('should have a chainable start() method', function() {
    stateMachine.onChange.add(function(state, data, action) {
      stateChangedTo = state.name;
      stateData = data;
      changeAction = action;
    });
    var returnValue = stateMachine.start();
    expect(returnValue instanceof StateMachine).to.be.true;
  });

	it('should have 3 states', function() {
		expect(stateMachine.getTotal()).to.eql(3);
	});

  it('should have a chainable create() method when passing singular state config', function() {
    var returnValue = stateMachine.create({ name: 'FOO', transitions: [] });
    expect(returnValue instanceof StateMachine).to.be.true;
  });

	it('should have 4 states', function() {
		expect(stateMachine.getTotal()).to.eql(4);
	});

	it('should return initial state', function() {
		expect(stateMachine.currentState.name).to.eql(State.CLOSED);
	});

	it('should have received general onChange signal for initial state', function() {
		expect(stateChangedTo, 'state is correct').to.eql(State.CLOSED);

    // Action should be undefined, as we're in the init state
		expect(changeAction, 'action is undefined').to.be.undefined;
	});

	it('should have changed state to LOCKED and action() should be chainable', function() {
		var returnValue = stateMachine.action(Action.LOCK);
    expect(returnValue instanceof StateMachine).to.be.true;
		expect(stateMachine.currentState.name).to.eql(State.LOCKED);
	});

  it('should have received general onChange signal for subsequent state', function() {
    expect(stateChangedTo, 'state is correct').to.eql(State.LOCKED);

    // Action should be undefined, as we're in the init state
    expect(changeAction, 'action is undefined').to.eql( Action.LOCK );
  });

	it('should have got individual state notifications', function() {
		expect(individualEnterNotification, 'individual enter notification').to.be.true;
		expect(individualChangeNotification, 'individual change notification').to.be.true;
		expect(individualExitNotification, 'individual exit notification').to.be.true;
	});

  it('should have action passed to individual state callbacks', function() {
    expect(individualEnterAction, 'individual enter action').to.eql( Action.LOCK );
    expect(individualChangeAction, 'individual change action').to.eql( Action.LOCK );
    expect(individualExitAction, 'individual exit action').to.eql( Action.LOCK );
  });

	it('should have changed state to CLOSED with data and action', function() {
		stateMachine.action(Action.UNLOCK, { info: 'Hello' });
		expect(stateMachine.currentState.name, 'state name is correct').to.eql(State.CLOSED);
		expect(stateData.info, 'data is correct').to.eql('Hello');
		expect(changeAction, 'action is correct').to.eql(Action.UNLOCK);
	});

	it('should have changed state to OPENED', function() {
		stateMachine.action(Action.OPEN);
		expect(stateMachine.currentState.name).to.eql(State.OPENED);
	});

  it('should return a removed state', function() {
    var removedState = stateMachine.removeState(State.LOCKED);
    expect(removedState instanceof StateMachine.State).to.be.true;
    expect( removedState.name ).to.eql( State.LOCKED );
  });

  it('should have decreased the total number of states after removal', function() {
    expect(stateMachine.getTotal()).to.eql(3);
  });

  describe( 'guards', function()
  {
    var allowEnter,
        allowExit;

    it( 'should allow us to re-create the LOCKED state (as previously removed), but with guard methods', function()
    {
      stateMachine.create(
        {
          name: State.LOCKED,
          transitions: [
            { action: Action.UNLOCK, target: State.CLOSED }
          ],
          onEnter:     function()
          {
            if( !allowEnter ) {
              stateMachine.cancel();
            }
          },
          onExit:      function()
          {
            if( !allowExit ) {
              stateMachine.cancel();
            }
          }
        }
      );

      expect( stateMachine.getTotal() ).to.eql( 4 );
    } );

    it( 'should start guards testing in the OPENED state and transition to CLOSED', function()
    {
      expect( stateMachine.currentState.name ).to.eql( State.OPENED );
      stateMachine.action( Action.CLOSE );
      expect( stateMachine.currentState.name ).to.eql( State.CLOSED );
    } );

    it( 'should allow transition cancellation within an onEnter', function()
    {
      allowEnter = false;
      stateMachine.action( Action.LOCK );
      expect( stateMachine.currentState.name ).to.eql( State.CLOSED );
    } );

    it( 'should bypass transition cancellation within an onEnter', function()
    {
      allowEnter = true;
      stateMachine.action( Action.LOCK );
      expect( stateMachine.currentState.name ).to.eql( State.LOCKED );
    } );

    it( 'should allow transition cancellation within an onExit', function()
    {
      allowExit = false;
      stateMachine.action( Action.UNLOCK );
      expect( stateMachine.currentState.name ).to.eql( State.LOCKED );
    } );

    it( 'should bypass transition cancellation within an onExit', function()
    {
      allowExit = true;
      stateMachine.action( Action.UNLOCK );
      expect( stateMachine.currentState.name ).to.eql( State.CLOSED );
    } );

    it('should receive global onEnter and onExit signals', function() {
      var stateExited, actionExited;
      stateMachine.onExit.addOnce(function(state, data, action) {
        stateExited = state.name;
        actionExited = action;
      });

      var stateEntered, actionEntered;
      stateMachine.onEnter.addOnce(function(state, data, action) {
        stateEntered = state.name;
        actionEntered = action;
      });
      var prevState = State.CLOSED;
      var newState = State.LOCKED;
      stateMachine.action(Action.LOCK);

      expect(stateExited, 'received stateExited').to.eql(prevState);
      expect(actionExited, 'received actionExited').to.eql(Action.LOCK);
      expect(stateEntered, 'received stateEntered').to.eql(newState);
      expect(actionEntered, 'received actionEntered').to.eql(Action.LOCK);
    });

  } );



});
