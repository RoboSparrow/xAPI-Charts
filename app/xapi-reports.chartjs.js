/**
 * Chart.js global config
 * @see http://www.chartjs.org/docs/
 */
Chart.defaults.global.responsive = true;

/**
 * ADL config
 */
var saved = {
    lrs: 0
};
var conf = {
    "endpoint": 'https://lrs.adlnet.gov/xAPI/',
};
ADL.XAPIWrapper.changeConfig(conf);

/*
 * ADL.XAPIWrapper.getStatements + callabck
 */
var statements = []; //holds downloaded statements
var count = 0; //coundts download iterations, for skipping long  `more` cycles

var callback = function(data) {
    var result = JSON.parse(data.response);
    statements = statements.concat(result.statements);
    if (result.more) {

        /**
         * Download data
         */

        $('#Logger').html('Getting Statements.. ' + count + '(' + statements.length + ' downloaded)');
        ADL.XAPIWrapper.getStatements(search, result.more, callback);

    } else {

        /**
         * Process data after download has been finished
         */

        $('#Logger').append('<br><span style="color:green;">Finished!</span>');

        /**
         * Filter statements[] by verb.id
         */
        var data = []; //init epoch data set
        //filter verb ids into a temporary array
        for (var i = 0; i < statements.length; i++) {
            var key = statements[i].verb.id;
            if (typeof data[key] === 'undefined') {
                data[key] = [];
            }
            data[key].push(i); // save statements[] position, so we can reference to this statement later on
        }

        /**
         * Bar chart
         */

        // Build bar chart data matrix
        var barData = {
            labels: [],
            datasets: [{
                label: "My Second dataset",
                fillColor: "rgba(151,187,205,0.5)",
                strokeColor: "rgba(151,187,205,0.8)",
                highlightFill: "rgba(151,187,205,0.75)",
                highlightStroke: "rgba(151,187,205,1)",
                data: []
            }]
        };
        for (var verb in data) {
            barData.datasets[0].data.push(data[verb].length);
            barData.labels.push(/[^\/]+$/.exec(verb)[0]);
        }

        // Render chart
        var ctxBar = document.getElementById('BarChart').getContext('2d');
        var MyBarChart = new Chart(ctxBar).Bar(barData);
        
        /**
         * Radar chart
         */
        
        // Render chart
        var radarData = barData;
        var ctxRadar = document.getElementById('RadarChart').getContext('2d');
        var MyRadarChart = new Chart(ctxRadar).Radar(barData);
        
   
        /**
         * Pie chart
         */

        // Build pie chart data matrix
        var pieData = [];

        for (var verb in data) {
            pieData.push({
                value: data[verb].length,
                color:'#'+(Math.random()*0xFFFFFF<<0).toString(16),
                highlight: "#FF5A5E",
                label: /[^\/]+$/.exec(verb)[0],
            });
        }

        // Render Pie chart
        var legendTemplate = "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>; padding:0 10px;\">&nbsp;</span><%if(segments[i].label){%> <%=segments[i].label%><%}%></li><%}%></ul>";
        var ctxPie = document.getElementById('PieChart').getContext('2d');
        var MyPieChart = new Chart(ctxPie).Pie(pieData, {legendTemplate: legendTemplate});
        // Render Legend
        document.getElementById('PieChartlegend').innerHTML = MyPieChart.generateLegend();
                                                         
        // Render Doughnut
        var ctxDoughnut = document.getElementById('DoughnutChart').getContext('2d');
        var MyDoughnutChart = new Chart(ctxDoughnut).Doughnut(pieData);
        
        /**
         *
         */
        var table = [];
        table.push('<table id="example" class="display" cellspacing="0" width="100%">');
        table.push('<thead>');
        table.push('<tr>');
        table.push('<th>id</th>');
        table.push('<th>actor.mbox</th>');
        table.push('<th>actor.name</th>');
        table.push('<th>verb</th>');
        table.push('<th>authority</th>');
        table.push('<th>stored</th>');
        table.push('</tr>');
        table.push('</thead>');
        table.push('<tbody>');
        for (var i = 0; i < statements.length; i++) {
            table.push('<tr>');
            table.push('<td>' + statements[i].id + '</td>');
            table.push('<td>' + ((typeof statements[i].actor.mbox !== 'undefined') ? statements[i].actor.mbox.replace(/mailto:/g, '') : '') + '</td>');
            table.push('<td>' + (statements[i].actor.name || '') + '</td>');
            table.push('<td>' + (/[^\/]+$/.exec(statements[i].verb.id)[0]) + '</td>');
            if (typeof statements[i].authority !== 'undefined') {
                var authority = 'yes, but cannot identify';
                authority = (statements[i].authority.name !== 'undefined') ? statements[i].authority.name : authority;
                authority = (statements[i].authority.mbox !== 'undefined') ? statements[i].authority.mbox.replace(/mailto:/g, '') : authority;
            } else {
                var authority = '';
            }
            table.push('<td>' + authority + '</td>');
            table.push('<td>' + statements[i].stored + '</td>');
            table.push('</tr>');
        }
        table.push('</tbody>');
        table.push('</table>');
        table = table.join("\n");
        $('#DataTable').html(table);
        $('#DataTable table').dataTable({
            paging: false,
            scrollY: 800
        });

    }
    count++;
}; //callback()



// Limit search to statements written in the past 30 days
var search = ADL.XAPIWrapper.searchParams(); //search params
var since = new Date(Date.now());
since = new Date(since.getFullYear(), since.getMonth(), since.getDate() - 30); // past 30 days
search['since'] = since.toISOString();

// start search when DOM tree is loaded
$(document).ready(function() {
    $('#Logger').html('Getting Statements..'); //start logger
    ADL.XAPIWrapper.getStatements(search, null, callback);
});