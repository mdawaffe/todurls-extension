var create    = document.querySelector( '#form-create'    ),
    authorize = document.querySelector( '#form-authorize' ),

    createButton    = document.querySelector( '#button-create'    ),
    authorizeButton = document.querySelector( '#button-authorize' ),
    logoutButton    = document.querySelector( '#button-logout'    );

function submit( event ) {
	var form = event.target;

	event.preventDefault();

	chrome.extension.sendMessage( {
		message      : 'auth',
		email        : form.email.value,
		password     : form.password.value,
		auth_action  : form.auth_action.value
	}, receive );

	return false;
}

function logout( event ) {
	event.preventDefault();

	chrome.extension.sendMessage( {
		message      : 'auth',
		auth_action  : 'logout'
	}, receive );
}

function receive( response ) {
	switch ( response.type ) {
	case 'error' :
		document.querySelector( '#success' ).innerHTML = '';
		document.querySelector( '#error' ).innerText = response.status + ': ' + response.message;
		break;
	case 'success' :
		document.querySelector( '#error' ).innerHTML = '';
		document.querySelector( '#success' ).innerText = response.message;
		break;
	}

	showLogoutButton();
}

function clickButton( event ) {
	var button = event.target;

	event.preventDefault();

	if ( 'button-create' === button.id ) {
		create.style.display    = 'block';
		authorize.style.display = 'none';
	} else {
		authorize.style.display = 'block';
		create.style.display    = 'none';
	}
}

function showLogoutButton() {
	chrome.storage.sync.get( 'token', function( data ) {
		if ( data.token ) {
			logoutButton.style.display = 'inline';
		} else {
			logoutButton.style.display = 'none';
		}
	} );
}

showLogoutButton();

create.addEventListener(    'submit', submit );
authorize.addEventListener( 'submit', submit );

createButton.addEventListener(    'click', clickButton );
authorizeButton.addEventListener( 'click', clickButton );

logoutButton.addEventListener( 'click', logout );
