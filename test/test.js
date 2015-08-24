require('../src/DateX.js');

var date = new Date( );
var formatted = date.format('D, Y-m-d H:i:s');
console.log(formatted);
console.log(Date.fromString( formatted, 'D, Y-m-d H:i:s' ).format('D, Y-m-d H:i:s'));