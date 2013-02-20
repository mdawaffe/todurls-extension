var authorize = document.querySelector( '#form-authorize' ),
    create    = document.querySelector( '#form-create' ),
    submit, receive;

submit = function( event ) {
	var form = event.target;

	event.preventDefault();

	chrome.extension.sendMessage( {
		message : 'auth',
		email   : form.email.value,
		password: form.password.value,
		action  : form.auth_action.value
	}, receive );

	return false;
};

receive = function( response ) {
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
};

authorize.addEventListener( 'submit', submit );
create.addEventListener( 'submit', submit );
