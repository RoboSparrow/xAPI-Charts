utils = {};
utils.verb = function(verb){
    var r = '';
    try {
        r = /[^\/]+$/.exec(verb)[0];
    }catch (e) {
        r = 'undefined';
    }
    return r;
}