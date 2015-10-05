var DateX = require('../src/DateX'), echo = console.log, today, date, dormatted;

echo('DateX.VERSION = ' + DateX.VERSION);

today = new DateX( );
date = new DateX( );
formatted = date.format('D, Y-m-d H:i:s');
echo(formatted);
echo(DateX.fromString( formatted, 'D, Y-m-d H:i:s' ).format('D, Y-m-d H:i:s'));

date = new DateX( );
formatted = date.strformat('%m/%d/%Y %H:%M:%S');
echo(formatted);
echo(DateX.fromString( formatted, '%m/%d/%Y %H:%M:%S', null, true ).strformat('%m/%d/%Y %H:%M:%S'));

var nextMonth = new DateX(today.getFullYear(),today.getMonth()+1,today.getDate()+1), diff, udiff;
echo(nextMonth.format('D, Y-m-d H:i:s')+' - '+today.format('D, Y-m-d H:i:s'));
echo(diff=nextMonth.diff(today));
echo((udiff=nextMonth.udiff(today, 'days')) + ' days');
echo(DateX.add(today, diff).format('D, Y-m-d H:i:s'));
echo(DateX.uadd(today, udiff, 'days').format('D, Y-m-d H:i:s'));
