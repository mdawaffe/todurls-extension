var TodURLsExtension = {
	appID : 'drugs-escapes-418',
	appKey: 'ae0a7fef0cbe48418d7cbfa184164785',
	token : null,
	simperium: null,
	bucket: null,
	urls: {},
	buffer: [],
	authWindowID: null,

	init: function() {
		chrome.storage.sync.get( 'token', function( data ) {
			if ( !data.token ) {
				return;
			}

			TodURLsExtension.startSimperium( data.token );
		} );
	},

	startSimperium: function( token ) {
		var tab = 0;

		chrome.cookies.get( {
			url : 'http://todurls.com/',
			name: 'token'
		}, function( cookie ) {
			if ( cookie && cookie.value === token ) {
				return;
			}

			chrome.cookies.set( {
				url : 'http://todurls.com/',
				name: 'token',
				value: token,
			} );
		} );

		this.token = token;
		this.simperium = new Simperium( this.appID, { token: this.token } );
		this.bucket = this.simperium.bucket( 'todurls' );
		this.bucket.on( 'notify', function( id, data ) { 
			TodURLsExtension.notify( id, data );
		} );
		this.bucket.on( 'ready', function() {
			while ( tab = TodURLsExtension.buffer.shift() ) {
				TodURLsExtension.add( tab );
			}
		} );

		this.bucket.start();
	},

	openAuth: function() {
		chrome.windows.create( {
			url: 'options.html',
			focused: true,
			type: 'detached_panel',
			height: 800,
		}, function( window ) {
			TodURLsExtension.authWindowID = window.id;
		} );
	},

	auth: function( request,  sender, sendResponse ) {
		var xhr = new XMLHttpRequest;

		xhr.onload = function() {
			var response;

			if ( 200 !== this.status ) {
				sendResponse( {
					type   : 'error',
					status : this.status,
					message: this.responseText
				} );
				return;
			}

			try {
				response = JSON.parse( this.responseText );
			} catch ( error ) {
				sendResponse( {
					type   : 'error',
					status : this.status,
					message: 'Could not parse response'
				} );
				return;
			}

			chrome.storage.sync.set( { token: response.access_token } );
			TodURLsExtension.startSimperium( response.access_token );

			sendResponse( {
				type   : 'success',
				status : this.status,
				message: 'Logged in'
			} );

			if ( TodURLsExtension.authWindowID ) {
				chrome.windows.remove( TodURLsExtension.authWindowID, function() {
					TodURLsExtension.authWindowID = null;
				} );
			}
		};

		xhr.onerror = function() {
			sendResponse( {
				type   : 'error',
				status : this.status,
				message: 'XHR Error'
			} );
		};

		if ( 'create' === request.auth_action ) {
			xhr.open( 'POST', 'https://auth.simperium.com/1/' + this.appID + '/create/' );
		} else {
			xhr.open( 'POST', 'https://auth.simperium.com/1/' + this.appID + '/authorize/' );
		}

		xhr.setRequestHeader( 'Content-Type', 'application/json' );
		xhr.setRequestHeader( 'X-Simperium-API-Key', this.appKey );
		xhr.send( JSON.stringify( { username: request.email, password: request.password } ) );
	},

	notify: function( id, data ) {
		if ( ! data || ! data.url ) {
			delete( this.urls[id] );
			return;
		}

		this.urls[id] = data.url;
	},

	ready: function() {
		chrome.tabs.query( {
			active: true,
			currentWindow: true,
		}, function( tabs ) {
			if ( ! tabs.length ) {
				return;
			}

			TodURLsExtension.add( tabs[0] );
		} );
	},

	add: function( tab ) {
		var data = {
			url: tab.url,
			title: tab.title,
		}, i;

		if ( ! this.token ) {
			this.buffer.push( tab );
			this.openAuth();
			return;
		}

		chrome.tabs.update( tab.id, { selected: true } );

		for ( i in this.urls ) {
			if ( ! this.urls.hasOwnProperty( i ) ) {
				continue;
			}

			if ( this.urls[i] && this.urls[i] == data.url ) {
				return;
			}
		} 

		chrome.tabs.captureVisibleTab( tab.windowId, { quality: 0 }, function( dataURI ) {
			data.image = dataURI;
			TodURLsExtension.checkIfDone( data );
		} );

		chrome.tabs.executeScript( tab.id, {
			file: 'description.js'
		}, function( result ) {
			if ( ! result.length ) {
				data.description = '';
				return;
			}

			data.description = result[0];
			if ( data.description.length > 200 ) {
				data.description = data.description.substr( 0, 199 ) + "\u2026";
			}
			TodURLsExtension.checkIfDone( data );
		} );
	},

	checkIfDone: function( data ) {
		var id;

		if ( ! data.hasOwnProperty( 'image' ) || ! data.hasOwnProperty( 'description' ) ) {
			return;
		}

		id = TodURLsExtension.bucket.update( null, data );
		this.urls[id] = data.url;
	},
};

document.addEventListener( 'DOMContentLoaded', function() {
	TodURLsExtension.init()
} );

chrome.browserAction.onClicked.addListener( function( tab ) {
	TodURLsExtension.add( tab )
} );

chrome.extension.onMessage.addListener( function( request, sender, sendResponse ) {
	if ( 'auth' !== request.message ) {
		return;
	}

	TodURLsExtension.auth( request, sender, sendResponse );

	return true;
} );
