 // hide the form if the browser doesn't do SVG,
    // (then just let everything else fail)
    if (!document.createElementNS) {
        document.getElementsByTagName("form")[0].style.display = "none";
    }

    // field definitions from:
    // <http://www.census.gov/popest/data/national/totals/2011/files/NST-EST2011-alldata.pdf>
    var percent = (function() {
            var fmt = d3.format(".2f");
            return function(n) { return fmt(n) + "%"; };
        })(),
        fields = [
            {name: "(no scale)", id: "none"},
            {name: "Population Estimate", id: "popest", key: "POP%d"}],

        years = [2012,2013,2014,2015,2016,2017],

        fieldsById = d3.nest()
            .key(function(d) { return d.id; })
            .rollup(function(d) { return d[0]; })
            .map(fields),

        field = fields[0],
        year = years[0],
        colors = colorbrewer.RdYlBu[3]
            .reverse()
            .map(function(rgb) { return d3.hsl(rgb); });

    var body = d3.select("body"),
        stat = d3.select("#status");

    var fieldSelect = d3.select("#field")
        .on("change", function(e) {
            field = fields[this.selectedIndex];
            location.hash = "#" + [field.id, year].join("/");
        });

    //when you change field
    fieldSelect.selectAll("option")
        .data(fields)
        .enter()
        .append("option")
        .attr("value", function(d) { return d.id; })
        .text(function(d) { return d.name; });

    var yearSelect = d3.select("#year")
        .on("change", function(e) {
            year = years[this.selectedIndex];
            location.hash = "#" + [field.id, year].join("/");
        });

    yearSelect.selectAll("option")
        .data(years)
        .enter()
        .append("option")
        .attr("value", function(y) { return y; })
        .text(function(y) { return y; })

    var map = d3.select("#map"),
        zoom = d3.behavior.zoom()
            .translate([-38, 32])
            .scale(.94)
            .scaleExtent([0.5, 10.0])
            .on("zoom", updateZoom),
        layer = map.append("g")
            .attr("id", "layer"),
        states = layer.append("g")
            .attr("id", "states")
            .selectAll("path");

    // map.call(zoom);
    updateZoom();

    function updateZoom() {
        var scale = zoom.scale();
        layer.attr("transform",
            "translate(" + zoom.translate() + ") " +
            "scale(" + [scale, scale] + ")");
    }

var width = 960,
    height = 600,
    initialScale = 50,
    initialX = width/2,
    initialY = height/2,
    centered,
    labels;

var projection = d3.geo.mercator()
      .center([128, 36])
      .scale(4000)
      .translate([width/2, height/2]);
var topology,
    geometries,
    rawData,
    dataById = {},
    carto = d3.cartogram()                                                  //cartogram starts.
        .projection(projection)
        .properties(function(d) {
            return dataById[d.id];
        })
        .value(function(d) {
            return +d.properties[field];
        });

var svg = d3.select("svg");

var url = "data/korea.json"

var path = d3.geo.path()
    .projection(projection);

d3.json(url, function(error, kor) {
    topology = kor,
    geometries = topology.objects.states.geometries;
    d3.csv("data/korea.csv", function(data) {                                    //take csv file.
            rawData = data;
            dataById = d3.nest()
                .key(function(d) { return d.NAME; })
                .rollup(function(d) { return d[0]; })
                .map(data);
                //console.log("databyID : " , dataById);                                                //You can see how it looks like on the browser; it takes data from csv file by name and make a map;
            init();
        });

/*
  svg.append("g")
    .attr("class", "states")
    .selectAll("path")
    .data(topojson.feature(kor, kor.objects.states).features)
    .enter().append("path")
    .attr("d", path);

  svg.append("path")
      .attr("class", "state-borders")
      .attr("d", path(topojson.mesh(kor, kor.objects.states, function(a, b) { return a !== b; })));
      */
});
    //when hash changes
    window.onhashchange = function() {
        parseHash();
    };

    function init() {

        var features = carto.features(topology, geometries),
            path = d3.geo.path()
                .projection(projection);

        states = states.data(features)
            .enter()
            .append("path")
            .attr("class", "state")
            .attr("id", function(d) {
                console.log("d :",d);
                return d.properties.NAME;
            })
            .attr("fill", "#fafafa")
            .attr("d", path);

        states.append("title");

        parseHash();
    }

    function reset() {
        stat.text("");
        body.classed("updating", false);

        var features = carto.features(topology, geometries),
            path = d3.geo.path()
                .projection(projection);

        states.data(features)
            .transition()
            .duration(750)
            .ease("linear")
            .attr("fill", "#fafafa")
            .attr("d", path);

        states.select("title")
            .text(function(d) {
                return d.properties.NAME;
            });
    }

    function update() {
        var start = Date.now();
        body.classed("updating", true);

        var key = field.key.replace("%d", year),
            fmt = (typeof field.format === "function")
                ? field.format
                : d3.format(field.format || ","),
            value = function(d) {
                return +d.properties[key];
            },
            values = states.data()
                .map(value)
                .filter(function(n) {
                    return !isNaN(n);
                })
                .sort(d3.ascending),
            lo = values[0],
            hi = values[values.length - 1];

        var color = d3.scale.linear()
            .range(colors)
            .domain(lo < 0
                ? [lo, 0, hi]
                : [lo, d3.mean(values), hi]);

        // normalize the scale to positive numbers
        var scale = d3.scale.linear()
            .domain([lo, hi])
            .range([1, 1000]);

        // tell the cartogram to use the scaled values
        carto.value(function(d) {
            return scale(value(d));
        });

        // generate the new features, pre-projected
        var features = carto(topology, geometries).features;

        // update the data
        states.data(features)
            .select("title")
            .text(function(d) {
                return [d.properties.NAME, fmt(value(d))].join(": ");
            });

        states.transition()
            .duration(750)
            .ease("linear")
            .attr("fill", function(d) {
                return color(value(d));
            })
            .attr("d", carto.path);

        var delta = (Date.now() - start) / 1000;
        stat.text(["calculated in", delta.toFixed(1), "seconds"].join(" "));
        body.classed("updating", false);
    }

    var deferredUpdate = (function() {
        var timeout;
        return function() {
            var args = arguments;
            clearTimeout(timeout);
            stat.text("calculating...");
            return timeout = setTimeout(function() {
                update.apply(null, arguments);
            }, 10);
        };
    })();

    var hashish = d3.selectAll("a.hashish")
        .datum(function() {
            return this.href;
        });

    function parseHash() {
        var parts = location.hash.substr(1).split("/"),
            desiredFieldId = parts[0],
            desiredYear = +parts[1];

        field = fieldsById[desiredFieldId] || fields[0];
        year = (years.indexOf(desiredYear) > -1) ? desiredYear : years[0];

        fieldSelect.property("selectedIndex", fields.indexOf(field));
        
        if (field.id === "none") {

            yearSelect.attr("disabled", "disabled");
            reset();

        } else {

            if (field.years) {
                if (field.years.indexOf(year) === -1) {
                    year = field.years[0];
                }
                yearSelect.selectAll("option")
                    .attr("disabled", function(y) {
                        return (field.years.indexOf(y) === -1) ? "disabled" : null;
                    });
            } else {
                yearSelect.selectAll("option")
                    .attr("disabled", null);
            }

            yearSelect
                .property("selectedIndex", years.indexOf(year))
                .attr("disabled", null);

            deferredUpdate();
            location.replace("#" + [field.id, year].join("/"));

            hashish.attr("href", function(href) {
                return href + location.hash;
            });
        }
    }