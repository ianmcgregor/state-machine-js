require.config({
	paths: {
		signals: '../js/vendors/js-signals/dist/signals',
		statemachine: '../js/utils/state-machine'
	},
	shim: {
	}
});

require(
	[
		'app/app'
	],

	function(App) {

		'use strict';

		new App();
	}
);
