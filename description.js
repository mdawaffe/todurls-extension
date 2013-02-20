(function() {
	var element = document.querySelector( 'meta[property="og:description"]' );
	if ( element ) {
		return element.content;
	}

	element = document.querySelector( '.hentry, .post' );
	if ( ! element ) {
		return '';
	}

	element = element.querySelector( '.entry-content, .postcontent' );
	if ( ! element ) {
		return '';
	}

	return element.innerText;
})();
