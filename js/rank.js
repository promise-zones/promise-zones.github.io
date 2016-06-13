var candidates = {
	areasUrl: 'https://raw.githubusercontent.com/promise-zones/promise-zones/master/areas.json',
	data: [],

	tpl: null,

	init: function () {
		// Populate the template used for each ranked item
		this.tpl = $('#empty').html();
		var self = this;
		$.getJSON(
			this.areasUrl,
			function (data) {
				self.data = data;
				self.rank();
			}
		);
	},

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
		var visLink = '', buildLink = '';
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
			var entry = $('<li>' + this.tpl + '</li>');
			entry.find('.area-name').text(d.area_name);
			entry.find('.ue-rate').text(this.percentFormat(d.ue_rate));
			entry.find('.pv-rate').text(this.percentFormat(d.pv_rate));
			entry.find('.pop').text(this.numberFormat(d.pop));
			if (d.fips_id) {
				if (!visLink) {
					// set it first time in loop
					visLink = entry.find('.vis-link').attr('href');
					buildLink = entry.find('.build-link').attr('href');
				}
				entry.find('.vis-link').prop('href', visLink + d.fips_id);
				entry.find('.build-link').prop('href', buildLink + 'c[]=' + d.fips_id);
			} else {
				// Cannot link if do not have fips_id so hide links
				entry.find('.links').hide();
			}
			// show or hide the pz text
			entry.find('.pz')[d.pz ? 'show' : 'hide']();

			$('#candidates ol').append(entry);
			soFar++;
		}
	},

	percentFormat: function (amount) {
		return (Math.round(amount * 1000) / 10) + '%';
	},

	numberFormat: function (amount) {
		amount = '' + amount;
		return amount.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
	},

	toggleSettings: function () {
		$('#settings, #settingsToggle').toggle();
	}
};

$(function () {
	candidates.init();
});
