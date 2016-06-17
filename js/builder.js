function getCountiesFromURI() {
	console.log("Running getCountiesFromURI");
	var uriObj = createObjFromURI();
	var county_indices = [];
	if ('c' in uriObj) {
		for (var i = 0; i < uriObj.c.length; i++) {
			county_indices.push(uriObj.c[i]);
		}
	}
	console.log("Counties " + county_indices);
	return county_indices;
}

function getTranslateFromURI() {
	console.log("Running getTranslateFromURI");
	var uriObj = createObjFromURI();
	var translate = [0, 0];
	if ('t' in uriObj) {
		if (uriObj.t.length == 2) {
			translate = [+uriObj.t[0], +uriObj.t[1]]
		}
	}
	console.log("Translate " + translate);
	return translate;
}
function getScaleFromURI() {
	console.log("Running getScaleFromURI");
	var uriObj = createObjFromURI();
	var scale = 1;
	if ('s' in uriObj) {
		scale = +uriObj.s;
	}
	console.log("Scale " + scale);
	return scale;
}




window.onload = function() {
	console.log("Page loaded");
}
window.onhashchange = function() {
	console.log("Hash Changed");
};


var width = 700,
	height = 500 * (width/960);
	scale0 = (width - 1) / 2 / Math.PI;

var projection = d3.geo.albersUsa()
		.scale(width)
		.translate([width / 2, height / 2]),
	path = d3.geo.path()
		.projection(projection);


d3.json("https://raw.githubusercontent.com/promise-zones/promise-zones/master/master_geo_with_properties_topo.json", function(error, topology) {
	if (error) throw error;
	//var color = d3.scale.category10();

	var neighbors = topojson.neighbors(
					topology.objects.master_geo_fixed_geo.geometries);
	var counties = topojson.feature(
						topology,
						topology.objects.master_geo_fixed_geo)
					.features;

	var urlParams = createObjFromURI();

	function interpretURL(paramsOBJ) {
		//placeholder
		return paramsOBJ;
	}
	interpretURL(urlParams);

	var countyLookup = {};
	for (var i = 0, len = counties.length; i < len; i++) {
		countyLookup[counties[i].properties.fips] = counties[i];
	}

	var colors = colorbrewer.YlGnBu[3]
		.map(function(rgb) { return d3.hsl(rgb); });

	var	colorValue = function(d) { return +d.properties.pv_rate; },
		loColor = d3.min(counties, function(d) { return d.properties.pv_rate; }),
		hiColor = d3.max(counties, function(d) { return d.properties.pv_rate; });
		meanColor = d3.mean(counties, function(d) { return d.properties.pv_rate; });

	var color = d3.scale.linear()
		.range(colors)
		.domain(loColor < 0
			? [loColor, 0, hiColor]
			: [loColor, meanColor, hiColor]);

	var zoom = d3.behavior.zoom()
		.translate(getTranslateFromURI())
		.scale(getScaleFromURI())
		.scaleExtent([0.5, 8])
		.on("zoom", zoomed);

	var svg = d3.select("#map")
		.attr('height', height)
		.attr('width', width);

	svg.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height", height)
		.call(zoom);

	var features = svg.append("g")
		.attr("id", "countymap");
	features.selectAll("path")
			.data(counties)
		.enter().append("path")
			.attr("d", path)
			.attr("class", "county")
			.attr("id", function(d) { return "FIPS" + d.properties.fips; })
			//.style("fill", function(d, i) { return color(d.color = d3.max(neighbors[i], function(n) { return counties[n].color; }) + 1 | 0); })
			.attr("fill", function(d) {
				if (d.properties.fips) {
					if (d.properties.fips.indexOf('pz') <= -1) {
						return color(colorValue(d));
					} else {
						return "#fff";
					}
				}
			})
			.on("click", click);

	function parameterURLAdd(param_val, param_code) {
		var string_to_add = param_code + "[]=" + param_val;
		if (location.hash.indexOf(string_to_add) <= -1 || param_code == "t") {
			location.hash = location.hash + (location.hash.length == 0 ? "" : "&") + string_to_add;
		}
	}
	function parameterURLRemove(param_val, param_code) {
		var string_to_remove = "&" + param_code + "[]=" + param_val;
		console.log("Removing " + string_to_remove);
		if (location.hash.indexOf(string_to_remove) > -1) {
			location.hash = location.hash.replace("/" + string_to_remove + "/g", "");
		} else if (location.hash.indexOf(string_to_remove.substring(1)) > -1) {
			location.hash = location.hash.replace("/" + string_to_remove.substring(1) + "/g", "");
		}
	}
	function removeURLParameterAndValue(param_val, param_code) {
		var uri = decodeURI(location.hash.substr(1));
   		var chunks = uri.split('&');
   		var chunk_index;
   		var new_chunks = [];
   		for (chunk_index in chunks) {
   			if (!(chunks[chunk_index][0] == param_code &&
   				chunks[chunk_index].split("=")[1] == param_val)) {
   				new_chunks.push(chunks[chunk_index]);
   			}
   		}
   		location.hash = new_chunks.join("&");
	}

	function removeURLParameterType(param_code) {
		var uri = decodeURI(location.hash.substr(1));
   		var chunks = uri.split('&');
   		var chunk_index;
   		var new_chunks = [];
   		for (chunk_index in chunks) {
   			if (chunks[chunk_index][0] != param_code) {
   				new_chunks.push(chunks[chunk_index]);
   			}
   		}
   		location.hash = new_chunks.join("&");
//		var objURI = createObjFromURI();
//		var list_index;
//		if (param_code in objURI) {
//			if ( typeof objURI[param_code] === 'undefined' ) {
//				for (list_index in objURI[param_code]) {
//					parameterURLRemove(objURI[param_code][list_index], param_code);
//				}
//			} else {
//				parameterURLRemove(objURI[param_code], param_code);
//			}
//		}
	}
	function resetURLTranslateAndScale( translate, scale ) {
		removeURLParameterType("t");
		removeURLParameterType("s");
		parameterURLAdd(translate[0], "t");
		parameterURLAdd(translate[1], "t");
		parameterURLAdd(scale, "s");
	}

	function click(d, i) {

		var allowClick = false;
		var	current_county = d3.select(this);

		var	atLeastOneSelected = d3.select("g#countymap")
				.classed("atleastoneselected");

		// If at least one county is already selected, limit the possible
		// selections to the neighboring counties
		if (atLeastOneSelected) {
			if (current_county.classed("neighbor-county")) {
				allowClick = true;
			} else if (current_county.classed("selected-county")) {
				allowClick = true;
			} else {
				allowClick = false;
			}
		} else {
			allowClick = true;
		}

		if (allowClick) {
			// If it's not selected, select it and handle the neighbors
			if (!current_county.classed("selected-county")) {
				console.log("It is not selected yet");
				current_county.classed("selected-county", true);
				parameterURLAdd(i, "c");
				classify_neighbors_on_select(this.id.slice(4));

			// If it is already selected, deselect it and then run logic to
			// handle neighbors
			} else {
				console.log("It is already selected, so deselect it");
				current_county.classed("selected-county", false);
				current_county.classed("ineligible-county", false);
				removeURLParameterAndValue(i, "c");
				classify_neighbors_on_deselect(i);
			}

			fill_pz_table();
		}
	}

	function classify_neighbors_on_select(fips_id) {

		var county_index = counties.indexOf(countyLookup[fips_id]);

		console.log("county index " + county_index);
		var neighboring_counties = neighbors[county_index];

		neighboring_counties.forEach (function(d) {
			d3.select("#FIPS" + counties[d].properties.fips + ".county")
				.classed("neighbor-county", true)
				.classed("ineligible-county", false);
		}, this);

	}

	function classify_neighbors_on_deselect(county_index) {
		console.log("county_index=" + county_index);

		var neighboring_county,
			neighboring_counties = neighbors[county_index],
			selected_neighbors = [],
			unselected_neighbors = [];

		neighboring_counties.forEach (function (d) {
			neighboring_county = d3.select("#FIPS" + counties[d].properties.fips + ".county");
			if (neighboring_county.classed("selected-county")) {
				selected_neighbors.push("FIPS" + counties[d].properties.fips);
			} else {
				unselected_neighbors.push("FIPS" + counties[d].properties.fips);
			}

		}, this);

		unselected_neighbors.forEach (function (d) {
			console.log("d=" + d);
			d3.select("#" + d)
				.classed("selected-county", false)
				.classed("neighbor-county", false)
				.classed("ineligible-county", true);
		}, this);

		selected_neighbors.forEach (function (d) {
			console.log("d=" + d.slice(4));
			classify_neighbors_on_select(d.slice(4));
		}, this);

	}

	function fill_pz_table() {
		var selected_counties = d3.selectAll(".selected-county").data();
			totals = {
					"count": 0,
					"pop": 0,
					"pv_rate" : 0,
					"ue_rate" : 0
					};

		selected_counties.forEach (function(d) {
			totals.pv_rate = ((+totals.pop * +totals.pv_rate) +
							(+d.properties.pop * +d.properties.pv_rate))/
							(+totals.pop + +d.properties.pop);
			totals.ue_rate = ((+totals.pop * +totals.ue_rate) +
							(+d.properties.pop * +d.properties.ue_rate))/
							(+totals.pop + +d.properties.pop);
			totals.pop += +d.properties.pop;
			totals.count += 1;

		});

		//var table = d3.select('#pz-detail-table')
		//	.data(selected_counties)
		//	.enter()
		//	.append('tr')
		//	.append('td')
		//	.text(function(d) {return d.properties.area_name;});
		//debugger;
		tabulate(selected_counties, ['area_name', 'pop', 'pv_rate', 'ue_rate']);

		d3.select("#totalcounties").text(totals.count);
		d3.select("#totalpop").text(d3.format(",")(totals.pop));
		d3.select("#totalpvr").text(d3.format(".1%")(totals.pv_rate));
		d3.select("#totaluer").text(d3.format(".1%")(totals.ue_rate));

		d3.select("g#countymap").classed("atleastoneselected", totals.count > 0);

		var all_counties = d3.selectAll("path.county:not(.selected-county):not(.neighbor-county)");
		all_counties.classed("ineligible-county", totals.count > 0);
		if (totals.count == 0) {
			d3.selectAll(".county")
				.classed("neighbor-county", false);
			$("#neediest-neighbor").attr("disabled", "disabled");
		} else {
			$("#neediest-neighbor").removeAttr("disabled");
		}
	}

	function zoomed() {
		features.attr("transform", "translate(" + zoom.translate() + ")scale(" + zoom.scale() + ")");
		features.select(".county").style("stroke-width", .5 / zoom.scale() + "px");
		console.log(zoom.translate(), zoom.scale());
		resetURLTranslateAndScale(zoom.translate(), zoom.scale());
	}

	function interpolateZoom (translate, scale) {

		var self = this;

		return d3.transition().duration(350).tween("zoom", function () {
			var iTranslate = d3.interpolate(zoom.translate(), translate),
				iScale = d3.interpolate(zoom.scale(), scale);
			return function (t) {
				zoom
					.scale(iScale(t))
					.translate(iTranslate(t));
				zoomed();
				};
			});
	}

	function zoomClick() {
		console.log("Zoom button Clicked");
		var clicked = d3.event.target,
			direction = 1,
			factor = 0.2,
			target_zoom = 1,
			center = [width / 2, height / 2],
			extent = zoom.scaleExtent(),
			translate = zoom.translate(),
			translate0 = [],
			l = [],
			view = {x: translate[0], y: translate[1], k: zoom.scale()};

		d3.event.preventDefault();
		direction = (this.id === 'zoom_in') ? 1 : -1;
		target_zoom = zoom.scale() * (1 + factor * direction);

		if (target_zoom < extent[0] || target_zoom > extent[1]) { return false; }

		translate0 = [(center[0] - view.x) / view.k, (center[1] - view.y) / view.k];
		view.k = target_zoom;
		l = [translate0[0] * view.k + view.x, translate0[1] * view.k + view.y];

		view.x += center[0] - l[0];
		view.y += center[1] - l[1];

		interpolateZoom([view.x, view.y], view.k);
	}

	function panClick() {
		console.log("Pan button clicked");
		var clicked = d3.event.target,
			extent = zoom.scaleExtent(),
			translate = zoom.translate();
			translate0 = [],
			factor = 0.2,
			view = {x: translate[0], y: translate[1], k: zoom.scale()};

		d3.event.preventDefault();
		switch (this.id) {
			case "pan_left":
				tran_dir = [-1, 0];
				break;
			case "pan_up":
				tran_dir = [0, -1];
				break;
			case "pan_down":
				tran_dir = [0, 1];
				break;
			case "pan_right":
				tran_dir = [1, 0];
				break;
			default:
				tran_dir = [0, 0];
		}
		translate0 = 	[	(factor * tran_dir[0] * width) / view.k,
							(factor * tran_dir[1] * height) / view.k	]
		view.x += translate0[0];
		view.y += translate0[1];

		interpolateZoom([view.x, view.y], view.k);
	}

	function resetMap() {
		d3.selectAll('.county').classed('selected-county', false);
		removeURLParameterType("c");
		fill_pz_table();
	}

	jQuery.fn.d3Click = function () {
		this.each(function (i, e) {
			var evt = new MouseEvent("click");
			e.dispatchEvent(evt);
		});
	};

	function selectNeediestNeighbor() {
		var neighbor_counties = d3.selectAll("path.county.neighbor-county:not(.selected-county)").data();
		var max_pv_rate = d3.max(neighbor_counties, function (d) { return d.properties.pv_rate; });
		var county_to_select = neighbor_counties.filter(function (d) { return d.properties.pv_rate == max_pv_rate; })[0];
		//debugger;
		//d3.select('#FIPS' + county_to_select.properties.fips + '.county')
		//	.on('click')();
		//debugger;
		$('#FIPS' + county_to_select.properties.fips + '.county').d3Click();
	}


	d3.selectAll('.zoom').on('click', zoomClick);
	d3.selectAll('.pan').on('click', panClick);
	d3.selectAll('#neediest-neighbor').on('click', selectNeediestNeighbor);
	d3.selectAll('#reset').on('click', resetMap);

	// The table generation function
	function tabulate(data, columns) {
		//debugger;
		d3.select("table#pz-detail-table").remove();
		//d3.select('body');
		//debugger;
		var table = d3.select("#pz-detail").append("table")
				.attr("id", "pz-detail-table"),
			thead = table.append("thead"),
			tbody = table.append("tbody");

		var headers = { 	'area_name' : 'County',
							'pop' : 'Population',
							'ue_rate' : 'Unemp. Rate',
							'pv_rate' : 'Poverty Rate'
						}

		// append the header row
		thead.append("tr")
			.selectAll("th")
			.data(columns)
			.enter()
			.append("th")
				.text(function(column) { return headers[column]; });

		var formatting = { 	'area_name' : '',
							'pop' : ',',
							'ue_rate' : '.1%',
							'pv_rate' : '.1%'
						}


		// create a row for each object in the data
		//debugger;
		var rows = tbody.selectAll("tr")
			.data(data)
			.enter()
			.append("tr");

		// create a cell in each row for each column
		var cells = rows.selectAll("td")
			.data(function(row) {
				return columns.map(function(column) {
					var val;
					if (typeof row.properties[column] === 'string') {
						val = row.properties[column];
					} else {
						val = d3.format(formatting[column])(row.properties[column]);
					}
					return {column: column, value: val};
				});
			})
			.enter()
			.append("td")
				.html(function(d) { return d.value; });

		return table;
	}

	function selectCountiesFromURI() {
		var county_indices = getCountiesFromURI();
		var i;
		var fips_code;
		for (i in county_indices) {
			// If indices is > 10000 then it isn't an indice, it's an actual fips code
			if (county_indices[i].length > 4) {
				// Is a FIPS code
				fips_code = '0500000US' + county_indices[i];
			} else {
				// Is an index
				fips_code = counties[+county_indices[i]].properties.fips
			}

			$("#FIPS" + fips_code + ".county").d3Click();
			console.log("i = " + i + " fips " + fips_code);
		}
	}

	zoomed();
	selectCountiesFromURI();

});
