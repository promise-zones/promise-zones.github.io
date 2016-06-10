var candidates = {
	data: [],
	rank: function() {
		var xWeight = $('#xWeight').val();
		var yWeight = $('#yWeight').val();
		var count = $('#count').val();
		var showPz = $('#showPromise').is(':checked');

		// Lets make the range of x and y "roughly" the same
		for (var i = 0; i < this.data.length; i++) {
			var x = this.data[i].ue_rate * 100 * xWeight;
			var y = this.data[i].pv_rate * 100 * yWeight;
			// a^2 + b^2 = h^2
			this.data[i].delta = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
		}
		this.data.sort(function (a, b) {
			return b.delta - a.delta;
		});
		$('#candidates ol').empty();
		var soFar = 0;
		// now list out the top 50 or so
		for (var i = 0; soFar < count; i++) {
			if (i > this.data.length) {
				break;
			}
			var d = this.data[i];
			if (d.pz && !showPz) {
				continue;
			}
			// @todo: figure out way to link up to chart - maybe trigger tooltip or something
			// OR Give this it's own tab or something
			//
			// @todo: Maybe figure out way to color these on the chart dynamically (so when weights change, it
			// updates)
			var liClass = d.pz ? 'pz' : 'not-pz';
			$('#candidates ol').append($(
				'<li class="' + liClass + '">'+
					d.area_name +
					'<br>Unemployment: ' + candidates.percentFormat(d.ue_rate) +
					' Poverty: ' + candidates.percentFormat(d.pv_rate) +
				'</li>'
			));
			soFar++;
		}
	},

	percentFormat: function (amount) {
		return (Math.round(amount * 1000) / 10) + '%';
	},

	toggleSettings: function () {
		$('#settings, #settingsToggle').toggle();
	}
};

$(function () {
	$.getJSON(
		'https://raw.githubusercontent.com/promise-zones/promise-zones/master/areas.json',
		function (data) {
			candidates.data = data;
			candidates.rank();
		}
	);
});
