// Creates an object from URL encoded data
function createObjFromURI() {
	var uri = decodeURI(location.hash.substr(1));
	var chunks = uri.split('&');
	var params = {};

	for (var i=0; i < chunks.length; i++) {
		var chunk = chunks[i].split('=');
		if (chunk[0].search("\\[\\]") !== -1) {
			var param_name = chunk[0].split('[]')[0];
			if (typeof params[param_name] === 'undefined') {
				params[param_name] = [chunk[1]];
			} else {
				params[param_name].push(chunk[1]);
			}
		} else {
			params[chunk[0]] = chunk[1];
		}
	}
	return params;
}
