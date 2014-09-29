'use strict';

var StateMachine = require('../src/main.js');

describe('state machine', function() {

	var stateMachine = new StateMachine(),
		stateChangedTo = '',
		stateData,
		gotEnterNotification = false,
		gotChangeNotification = false,
		gotExitNotification = false;

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
				gotEnterNotification = true;
			},
			onChange: function() {
				gotChangeNotification = true;
			},
			onExit: function() {
				gotExitNotification = true;
			}
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

  it('should have a chainable create() method when passing multiple state config', function() {
    var returnValue = stateMachine.create(config);
    expect(returnValue instanceof StateMachine).to.be.true;
  });

  it('should have a chainable start() method', function() {
    stateMachine.onChange.add(function(state, data) {
      stateChangedTo = state.name;
      stateData = data;
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

	it('should have received general onChange signal', function() {
		expect(stateChangedTo).to.eql(State.CLOSED);
	});

	it('should have changed state to LOCKED and action() should be chainable', function() {
		var returnValue = stateMachine.action(Action.LOCK);
    expect(returnValue instanceof StateMachine).to.be.true;
		expect(stateMachine.currentState.name).to.eql(State.LOCKED);
	});

	it('should have got individual state notifications', function() {
		expect(gotEnterNotification).to.be.true;
		expect(gotChangeNotification).to.be.true;
		expect(gotExitNotification).to.be.true;
	});

	it('should have changed state to CLOSED with data', function() {
		stateMachine.action(Action.UNLOCK, { info: 'Hello' });
		expect(stateMachine.currentState.name).to.eql(State.CLOSED);
		expect(stateData.info).to.eql('Hello');
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
          name:        State.LOCKED,
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

  } );



});
