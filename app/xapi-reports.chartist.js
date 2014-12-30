/**
 * http://gionkunz.github.io/chartist-js
 * @see http://gionkunz.github.io/chartist-js/examples.html
 * @see http://www.smashingmagazine.com/2014/12/16/chartist-js-open-source-library-responsive-charts/
 */

/**
 * ADL config
 */
var saved = {lrs: 0};
var conf = {
    "endpoint": 'https://lrs.adlnet.gov/xAPI/',
};
ADL.XAPIWrapper.changeConfig(conf);

/*
 * ADL.XAPIWrapper.getStatements + callback
 */
var statements = [];//holds downloaded statements
var count = 0; //counts download iterations, for skipping long  `more` cycles

var callback = function(data) {
    var result = JSON.parse(data.response);
    statements = statements.concat(result.statements);
    if (result.more) {
        
        /**
         * Download data
         */
        
        $('#Logger').html('Getting Statements.. ' + count + '(' + statements.length + ' downloaded)');
        ADL.XAPIWrapper.getStatements(search, result.more, callback);
    
    }else{
        
        /**
         * Process data after download has been finished
         */
        
        $('#Logger').append('<br><span style="color:green;">Finished!</span>');
        
        /**
         * Filter statements[] by verb.id
         */
        var data = [];//init epoch data set
        //filter verb ids into a temporary array
        for(var i =0; i < statements.length; i++){
            var key = statements[i].verb.id;
            if(typeof data[key] === 'undefined'){
                data[key] = [];
            }
            data[key].push(i);// save statements[] position, so we can reference to this statement later on
        }
  
        /**
         * Bar chart
         */

        // Build bar chart data matrix
        var barData = {
            labels: [],
            series: [
                []
            ]
        };

        for(var verb in data){
             barData.series[0].push(data[verb].length); 
             barData.labels.push(utils.verb(verb));
        }
        
        // Render chart
        var options = {
            fullWidth: true,
            centerBars: false,

              axisX: {
                showGrid: false,
                    /*
                    // label callback
                    labelInterpolationFnc: function(value) {
                        return value.slice(1, 5);
                    }
                    */
                }

        };
        
        /**
         * Bar chart
         */
        var barChart = new Chartist.Bar('.bar-chart', barData, options);
        
        // Listen for draw events on the bar chart
        //  this example tries to rotate the labels, however they are cut off vertically
        /*
        barChart.on('created', function(data) {
            var labels = [];
            
            var container = barChart.container;
            labels = container.querySelectorAll('.ct-labels foreignObject');
            console.log(labels);
            // https://developer.mozilla.org/en/docs/Web/SVG/Attribute/transform
            for(var i = 0; i < labels.length; i++){
                labels[i].setAttribute('transform', 'rotate(45, ' + labels[i].getAttribute('x') + ', ' + labels[i].getAttribute('y') + ')');
            }
        });
        */
        
        /**
         * Pie chart
         */

        // Build pie chart data matrix
    
        var pieData = {
            labels: barData.labels,
            series: barData.series[0]
        };
        var options = {};
        
        var pieChart = new Chartist.Pie('.pie-chart', pieData);

        
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
        for(var i =0; i < statements.length; i++){
            table.push('<tr>');
            table.push('<td>' + statements[i].id + '</td>');
            table.push('<td>' + ((typeof statements[i].actor.mbox !== 'undefined') ? statements[i].actor.mbox.replace(/mailto:/g, '') : '') + '</td>');
            table.push('<td>' + (statements[i].actor.name || '') + '</td>');
            table.push('<td>' + (utils.verb(statements[i].verb.id)) + '</td>');
            if(typeof statements[i].authority !== 'undefined'){
                var authority = 'yes, but cannot identify';
                authority = (statements[i].authority.name !== 'undefined') ? statements[i].authority.name : authority;
                authority = (statements[i].authority.mbox !== 'undefined') ? statements[i].authority.mbox.replace(/mailto:/g, '') : authority;
            }else{
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
        $('#DataTable table').dataTable({paging:false,scrollY: 800});
      
    }
    
    count ++;
};//callback()



// Limit search to statements written in the past 30 days
var search = ADL.XAPIWrapper.searchParams();//search params
var since = new Date(Date.now());
since = new Date(since.getFullYear(),since.getMonth(),since.getDate()-5);// past 5 days
search['since'] = since.toISOString();

// start search when DOM tree is loaded
$(document).ready(function() {
    $('#Logger').html('Getting Statements..');//start logger
    ADL.XAPIWrapper.getStatements(search, null, callback);
});
