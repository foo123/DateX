var DateX = require('../src/DateX');

var date = new DateX( );
var formatted = date.format('D, Y-m-d H:i:s');
console.log(formatted);
console.log(DateX.fromString( formatted, 'D, Y-m-d H:i:s' ).format('D, Y-m-d H:i:s'));

var date = new DateX( );
var formatted = date.strformat('%m/%d/%Y %H:%M:%S');
console.log(formatted);
console.log(DateX.fromString( formatted, '%m/%d/%Y %H:%M:%S', null, true ).strformat('%m/%d/%Y %H:%M:%S'));