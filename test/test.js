var DateX = require('../src/DateX'), 
    echo = console.log, today, later, d, f, diff, udiff, unit='days', dapprox;

echo('DateX.VERSION = ' + DateX.VERSION);

today = new DateX( );
later = new DateX(today.getFullYear(),today.getMonth()+1,today.getDate()+1, today.getHours(), today.getMinutes(), today.getSeconds()+10);

d = new DateX( ); f = d.format('D, Y-m-d H:i:s');
echo(f);
echo(DateX.fromString( f, 'D, Y-m-d H:i:s' ).format('D, Y-m-d H:i:s'));

d = new DateX( ); f = d.strformat('%m/%d/%Y %H:%M:%S');
echo(f);
echo(DateX.fromString( f, '%m/%d/%Y %H:%M:%S', null, true ).strformat('%m/%d/%Y %H:%M:%S'));

echo(later.format('D, Y-m-d H:i:s')+' MINUS '+today.format('D, Y-m-d H:i:s'));
echo(diff=later.diff(today));
echo('Difference (in '+unit+') ~ ' + Math.round(udiff=later.udiff(today, unit)));
dapprox = later.diffApproximate( today, 3 );
echo('Approximately: ' + dapprox);
echo(DateX.add(today, diff).format('D, Y-m-d H:i:s'));
echo(DateX.uadd(today, udiff, unit).format('D, Y-m-d H:i:s'));
