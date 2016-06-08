var opts = {
		margin : { top: 10, right: 10, bottom: 50, left: 70, lefttext: 5 }
	},
	chartHeight = 500 - opts.margin.top - opts.margin.bottom,
	chartWidth = 960 - opts.margin.left - opts.margin.right,
	bottomEdge = opts.margin.top + chartHeight,
	rightEdge = opts.margin.left + chartWidth,
	usePythagoras = true;

function draw(data) {
	d3.selection.prototype.moveToFront = function() {
		return this.each(function(){
			this.parentNode.appendChild(this);
		});
	};

	var xRange = d3.scale.linear()
		.range([opts.margin.left, rightEdge])
		.domain([0, d3.max(data, function(d) {
			return 1.1 * d.ue_rate;
		})]);

	var yRange = d3.scale.linear()
		.range([bottomEdge, opts.margin.top])
		.domain([0, d3.max(data, function(d) {
			return 1.1 * d.pv_rate;
		})]);

	var zoom = d3.behavior.zoom()
		.x(xRange)
		.y(yRange)
		.scaleExtent([0, 10])
		.on("zoom", zoomed);

	var vis = d3.select('#graph')
		.call(zoom);

	var xAxis = d3.svg.axis().scale(xRange).tickFormat(d3.format("%"));

	var yAxis = d3.svg.axis().scale(yRange).tickFormat(d3.format("%")).orient("left");

	// Define the div for the tooltip
	var div = d3.select("body").append("div")
		.attr("class", "tooltip")
		.style("opacity", 0);

	var	circles = vis.append("svg:g").attr('class', 'scatter')
		.selectAll("circle")
		.data(data)
		.enter()
		.insert("circle")
		.attr("cx", function(d) { return xRange (d.ue_rate); })
		.attr("cy", function(d) { return yRange (d.pv_rate); })
		.attr("r", function(d) { if (d.pz) { return 6; } else { return 4; } })
		.classed('pz', function(d) { return d.pz; })
		.classed('not-pz', function(d) { return !d.pz; })
		.style("fill", function(d) {
			if (d.pz) {
				return "red";
			} else {
				return "blue";
			}
		})
		.on("mouseover", function(d) {
			div.transition()
				.duration(200)
				.style("opacity", .9);
			div	.html(d.area_name + "<br/>Unemployment: "  + d3.format(".1%")(d.ue_rate) + " Poverty: " + d3.format(".1%")(d.pv_rate))
				.style("left", (d3.event.pageX) + "px")
				.style("top", (d3.event.pageY - 28) + "px")
				.style("background", function() { if (d.pz) { return "pink"; } else { return "lightsteelblue"; } });
		})
		.on("mouseout", function(d) {
			div.transition()
				.duration(500)
				.style("opacity", 0);
		});

	// color is based on isPromiseZone
	circles.selectAll('.pz').moveToFront();

	// Background for border axis
	vis.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('width', opts.margin.left)
		.attr('height', 10000)
		.attr('fill', 'white')
		.attr('class', 'border-margin');

	vis.append('rect')
		.attr('x', 0)
		.attr('y', bottomEdge)
		.attr('width', rightEdge + 100)
		.attr('height', 100)
		.attr('fill', 'white')
		.attr('class', 'border-margin');

	// Axis numbers
	vis.append("svg:g")
		.attr('class', 'xaxis')
		.call(xAxis)
		.attr("transform", "translate(0, " + bottomEdge + ")")
		.call(zoom);

	vis.append("svg:g")
		.attr('class', 'yaxis')
		.call(yAxis)
		.attr("transform", "translate(" + opts.margin.left + ", 0)")
		.call(zoom);

	// Axis labels
	vis.append("text")
		.attr("y", bottomEdge + (opts.margin.bottom / 2))
		.attr("x", opts.margin.left + (chartWidth / 2))
		.attr("dy", "1em")
		.attr('class', 'x-axis-label')
		.text("Unemployment Rate");

	vis.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", opts.margin.lefttext )
		.attr("x", 0 - ((bottomEdge - opts.margin.top) / 2))
		.attr("dy", "1em")
		.attr('class', 'y-axis-label')
		.text("Poverty Rate");

	d3.select("#togglebutton").on("click", function () {
		$('body').toggleClass('pz-hidden');
	});

	candidates.data = data;
	candidates.rank();

	function zoomed() {
		vis.select(".xaxis").call(xAxis);
		vis.select(".yaxis").call(yAxis);
		vis.select(".scatter")
			.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	}
}
var candidates = {
	data: [],
	rank: function() {
		var xWeight = $('#xWeight').val();
		var yWeight = $('#yWeight').val();
		var count = Math.min($('#count').val(), this.data.length);

		// Lets make the range of x and y "roughly" the same
		for (var i = 0; i < this.data.length; i++) {
			var x = this.data[i].ue_rate * 100 * xWeight;
			var y = this.data[i].pv_rate * 100 * yWeight;
			if (usePythagoras) {
				// a^2 + b^2 = h^2
				this.data[i].delta = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
			} else {
				// just add them
				this.data[i].delta = x + y;
			}
		}
		this.data.sort(function (a, b) {
			return b.delta - a.delta;
		});
		$('#candidates ol').empty();
		// now list out the top 50 or so
		for (var i = 0; i < count; i++) {
			var d = this.data[i];
			// @todo: figure out way to link up to chart - maybe trigger tooltip or something
			// OR Give this it's own tab or something
			//
			// @todo: Maybe figure out way to color these on the chart dynamically (so when weights change, it
			// updates)
			var liClass = d.pz ? 'pz' : 'not-pz';
			$('#candidates ol').append($('<li class="' + liClass + '">'+ d.area_name + '<br>Unemployment: ' + d3.format(".1%")(d.ue_rate) +
				' Poverty: ' + d3.format(".1%")(d.pv_rate) + '</li>'));
		}
	},
};
d3.json('https://raw.githubusercontent.com/promise-zones/promise-zones/master/areas.json', draw);
