/**
 * Load Google Chart libraries
 */
google.load("visualization", "1", {
    packages: ["corechart", "table"]
});

function pastelColors(pastel) {
    pastel = pastel || 127
    var r = (Math.round(Math.random() * pastel) + pastel).toString(16);
    var g = (Math.round(Math.random() * pastel) + pastel).toString(16);
    var b = (Math.round(Math.random() * pastel) + pastel).toString(16);
    return '#' + r + g + b;
}

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
 * ADL.XAPIWrapper.getStatements + callback
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

        document.getElementById('Logger').innerHTML = 'Getting Statements.. ' + count + '(' + statements.length + ' downloaded)';
        ADL.XAPIWrapper.getStatements(search, result.more, callback);

    } else {

        /**
         * Process data after download has been finished
         */

        document.getElementById('Logger').innerHTML += '<br><span style="color:green;">Finished!</span>';

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
         * Column chart
         */

        // Build column chart data matrix
        var columnData = [
            ['Verb', 'Entries', { role: 'style' }, {role: 'annotation'}]
        ];

        for (var verb in data) {
            columnData.push([
                utils.verb(verb),
                data[verb].length,
                'color:' + pastelColors() + ';opacity: 0.8;',
                utils.verb(verb)
            ]);
        }

        // Render chart
        var chart = new google.visualization.ColumnChart(document.getElementById('ColumnChart'));

        chart.draw(
            google.visualization.arrayToDataTable(columnData), {
                title: 'Statements',
                hAxis: {
                    title: 'Verbs',
                    titleTextStyle: {
                        color: 'red'
                    }
                },
                legend: {
                    position: "none"
                },
                height: 500
            }
        );

        /**
         * Bar chart
         */

        // Build bar chart data matrix
        var barData = [
            ['Verb', 'Entries', { role: 'style' }, {role: 'annotation'}]
        ];

        for (var verb in data) {
            barData.push([
                utils.verb(verb),
                data[verb].length,
                'color:' + pastelColors() + ';opacity: 0.8;',
                data[verb].length
            ]);
        }

        // Render chart
        var chart = new google.visualization.BarChart(document.getElementById('BarChart'));

        chart.draw(
            google.visualization.arrayToDataTable(barData), {
                title: 'Statements',
                hAxis: {
                    title: 'Verbs',
                    titleTextStyle: {
                        color: 'red'
                    }
                },
                height: barData.length * 35,
                legend: {
                    position: "none"
                }
            }
        );

        /**
         * Pie chart
         */

        // Build pie chart data matrix
        var pieData = [
            ['Verb', 'Entries']
        ];

        for (var verb in data) {
            pieData.push([
                utils.verb(verb),
                data[verb].length
            ]);
        }

        // Render chart
        var chart = new google.visualization.PieChart(document.getElementById('PieChart'));

        chart.draw(
            google.visualization.arrayToDataTable(barData), {
                title: 'Statements',
                is3D: true,
                legend: {
                    position: "none"
                },
                height: 500,
                //pieSliceText: 'label'
            }
        );

        /**
         * PDataTable
         */

        // Build pie chart data matrix
        var tableRowData = [];

        for (var i = 0; i < statements.length; i++) {
            tableRowData.push([
                statements[i].id,
                utils.verb(statements[i].verb.id),
                ((typeof statements[i].actor.mbox !== 'undefined') ? statements[i].actor.mbox.replace(/mailto:/g, '') : '')
            ]);
        }
        
        var tableData = new google.visualization.DataTable();
        tableData.addColumn('string', 'ID');
        tableData.addColumn('string', 'Verb');
        tableData.addColumn('string', 'Actor');
        tableData.addRows(tableRowData);
        
        // Render chart
        var chart = new google.visualization.Table(document.getElementById('DataTable'));

        chart.draw(
            tableData, {
                title: 'Statements',
                showRowNumber: true
            }
        );
        
        
    }
    count++;
}; //callback()



// Limit search to statements written in the past 30 days
var search = ADL.XAPIWrapper.searchParams(); //search params
var since = new Date(Date.now());
since = new Date(since.getFullYear(), since.getMonth(), since.getDate() - 30); // past 30 days
search['since'] = since.toISOString();

// start search when DOM tree is loaded
document.addEventListener("DOMContentLoaded", function(event) {
    document.getElementById('Logger').innerHTML = 'Getting Statements..'; //start logger
    ADL.XAPIWrapper.getStatements(search, null, callback);
});
