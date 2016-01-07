var DateX = require('../src/js/DateX'), 
    echo = console.log, today, later, before, d, f, diff, udiff, unit='days';

echo('DateX.VERSION = ' + DateX.VERSION);

DateX.setDefaultFormat('D, Y-m-d H:i:s');

today = new DateX( );
later = new DateX(today.getFullYear(),today.getMonth()+1,today.getDate()+1, today.getHours(), today.getMinutes()+30, today.getSeconds()+40);
before = new DateX(today.getFullYear(),today.getMonth()-1,today.getDate()-1, today.getHours(), today.getMinutes()-30, today.getSeconds()+40);

d = new DateX( ); f = d.format( );
echo(f);
echo(DateX.fromString( f ).format());

d = new DateX( ); f = d.strformat('%m/%d/%Y %H:%M:%S');
echo(f);
echo(DateX.fromString( f, '%m/%d/%Y %H:%M:%S', null, true ).strformat('%m/%d/%Y %H:%M:%S'));

echo('('+later.format()+') MINUS ('+today.format()+')');
echo(diff=later.xdiff(today));
echo('Difference (in '+unit+') ~ ' + Math.round(udiff=later.udiff(today, unit)));
echo('Approximately: ' + DateX.formatDiff(later.adiff( today, 3 )));
echo('Pretty: ' + before.prettydiff( ));
echo('Pretty: ' + later.prettydiff( ));
echo(DateX.uadd(today, udiff, unit).format());
echo(DateX.xadd(today, diff).format());
echo(DateX.xadd(today, {months:1,days:1,minutes:30,seconds:40}).format());
