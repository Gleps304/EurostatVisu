/**
 *
 * Sunburst visualisation
 *
 * @author julien Gaffuri
 *
 */
(function(d3) {
    //See http://bl.ocks.org/mbostock/4063423

    d3.sunburst = function(options){
        options = options || {};
        options.div = options.div || "sunburst";
        options.radius = options.radius || 150;
        options.strokeWidth = options.strokeWidth || 1.0;
        options.strokeColor = options.strokeColor || "gray";
        options.codeToColor = options.codeToColor || function(){ return "#d9d9d9"; };
        options.highlight = options.highlight || function(code){ d3.select("#arc"+code).attr("fill","darkgray"); };
        options.unhighlight = options.unhighlight || function(code){ d3.select("#arc"+code).attr("fill",out.options.codeToColor(code)); };
        options.duration = options.duration || 1500;

        var out = {options:options};

        var svg = d3.select("#"+options.div).append("svg")
            .attr("width", 2*options.radius).attr("height", 2*options.radius)
            .append("g").attr("transform", "translate(" + options.radius + "," + options.radius + ")");
        var partition = d3.layout.partition().sort(null).size([2 * Math.PI, options.radius * options.radius]);
        var arc = d3.svg.arc()
            .startAngle(function(d) { return d.x; })
            .endAngle(function(d) { return d.x + d.dx; })
            .innerRadius(function(d) { return Math.sqrt(d.y); })
            .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
        var labelAngle = function(d){
            var angle = 0;
            var v= d.value || 0;
            angle = (d.x + d.dx*0.5) * 180/Math.PI;
            if(v<2){ angle -= 90; if(angle<0) angle+=360; }
            if(angle>90 && angle<270) angle-=180;
            if(angle<0) angle+=360;
            return angle;
        };
        var labelTransform = function(d) {
            var angle = labelAngle(d);
            return "translate(" + arc.centroid(d) + ")"+ (angle==0?"":"rotate("+angle+")");
        };

        //functions used for shapes transition
        function arcStash(d) { d.x0 = d.x; d.dx0 = d.dx; }
        function arcTween(d) {
            var i = d3.interpolate({x: d.x0, dx: d.dx0}, d);
            return function(t) {
                var b = i(t);
                d.x0 = b.x;
                d.dx0 = b.dx;
                return arc(b);
            };
        }
        //TODO function used for label transition
        function labelStash(d) { d.c0 = arc.centroid(d); d.a0 = labelAngle(d); }
        function labelTween(d) {
            var i = d3.interpolate({c: d.c0, a: d.a0}, d);
            return function(t) {
                var b = i(t);
                d.c0 = b.c;
                d.a0 = b.a;
                return labelTransform(b);
            }
        }

        var shapes, labels;


        //build chart with values (optionnal)
        //codesHierarchy: code,children[]
        //values: code:value
        out.build = function(codesHierarchy,values){

            //draw shapes
            shapes = svg.datum(codesHierarchy).selectAll("path")
                .data(partition.value(function(d) { return values?values[d.code]:1; }).nodes)
                .enter().append("path")
                .attr("display", function(d) { return d.depth ? null : "none"; }) // hide inner ring
                .attr("d", arc)
                .attr("id", function(d) { return "arc"+d.code; })
                .attr("stroke-width", out.options.strokeWidth)
                .attr("stroke", out.options.strokeColor)
                .attr("fill", function(d) { return out.options.codeToColor(d.code); })
                .on("mouseover", function(d) { out.options.highlight(d.code); })
                .on("mouseout", function(d) { out.options.unhighlight(d.code); })
                .each(arcStash);

            //draw labels
            labels = svg.datum(codesHierarchy).selectAll("text")
                .data(partition.value(function(d) { return values?values[d.code]:1; }).nodes)
                .enter().append("text")
                .attr("transform", labelTransform)
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                //.style("fill", function(d) { return "#555"; })
                //.style("font-weight", function(d) { return "bold"; })
                //.style("font-size", function(d) { return "10"; })
                .html(function(d) {
                    if(!d.depth) return "";  // no inner ring label
                    return d.code;
                })
                .on("mouseover", function(d) { out.options.highlight(d.code); })
                .on("mouseout", function(d) { out.options.unhighlight(d.code); })
                .each(labelStash);
        };

        //set values, with transition
        //values: code:value
        out.set = function(values){
            shapes
                .data(partition.value(function(d) { return values?values[d.code]:1; }).nodes)
                .transition().duration(out.options.duration).attrTween("d", arcTween);
            labels
             .data(partition.value(function(d) { return values?values[d.code]:1; }).nodes)
             .transition().duration(out.options.duration).attrTween("transform", labelTween);
        };

        return out;
    }

}(d3));
