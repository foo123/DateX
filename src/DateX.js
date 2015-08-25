/**
*
*   DateX
*   eXtended Date parsing / formatting / validation for Node/JS, Python, PHP
*   @version: 0.1
*
*   https://github.com/foo123/DateX
*
**/
!function( root, name, factory ) {
"use strict";

// export the module, umd-style (no other dependencies)
var isCommonJS = ("object" === typeof(module)) && module.exports, 
    isAMD = ("function" === typeof(define)) && define.amd, m;

// CommonJS, node, etc..
if ( isCommonJS ) 
    module.exports = (module.$deps = module.$deps || {})[ name ] = module.$deps[ name ] || (factory.call( root, {NODE:module} ) || 1);

// AMD, requireJS, etc..
else if ( isAMD && ("function" === typeof(require)) && ("function" === typeof(require.specified)) && require.specified(name) ) 
    define( name, ['require', 'exports', 'module'], function( require, exports, module ){ return factory.call( root, {AMD:module} ); } );

// browser, web worker, etc.. + AMD, other loaders
else if ( !(name in root) ) 
    (root[ name ] = (m=factory.call( root, {} ) || 1)) && isAMD && define( name, [], function( ){ return m; } );

}(  /* current root */          this, 
    /* module name */           "DateX",
    /* module factory */        function( exports, undef ) {
"use strict";

var HAS = 'hasOwnProperty',
    floor = Math.floor, round = Math.round, abs = Math.abs,
    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    esc_re = function( s ) { 
        return s.replace(ESCAPED_RE, "\\$&"); 
    },
    by_length_desc = function( a, b ) {
        return b.length - a.length;
    },
    get_alternate_pattern = function( alts ) {
        return alts.sort( by_length_desc ).map( esc_re ).join( '|' );
    },
    pad = function( s, len, ch ) {
        var sp = s.toString( ), n = len-sp.length;
        return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
    },
    default_date_locale = {
        meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
        ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
        timezone: [ 'UTC','EST','MDT' ],
        timezone_short: [ 'UTC','EST','MDT' ],
        day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
        day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
        month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
        month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
    },
    check_and_create_date = function( dto, defaults ) {
        var year, month, day, 
            hour, minute, second, ms,
            leap=0, date=null, time=null, now=new Date( );
        
        defaults = defaults || {};
        
        if ( dto[HAS]('time') ) 
        {
            time = new Date( dto.time );
            // only time given create full date from unix time
            if ( !dto[HAS]('year') && !dto[HAS]('month') && !dto[HAS]('day') ) 
                date = new Date( time );
        }
        
        if ( null === date )
        {
        if ( dto[HAS]('ms') ) ms = dto.ms;
        else if ( defaults[HAS]('ms') ) ms = defaults.ms;
        else ms = 0;
        if ( dto[HAS]('second') ) second = dto.second;
        else if ( defaults[HAS]('second') ) second = defaults.second;
        else second = 0;
        if ( dto[HAS]('minute') ) minute = dto.minute;
        else if ( defaults[HAS]('minute') ) minute = defaults.minute;
        else minute = 0;
        if ( dto[HAS]('hour') ) hour = dto.hour;
        else
        {
            if ( dto[HAS]('hour_12') )
                hour = 'pm' === dto.meridian ? 11+dto.hour_12 : dto.hour_12-1;
            else if ( defaults[HAS]('hour') ) hour = defaults.hour;
            else hour = 'pm' === dto.meridian ? 12 : 0;
        }
        
        if ( dto[HAS]('day') ) day = dto.day;
        else if ( defaults[HAS]('day') ) day = defaults.day;
        else day = now.getDate( );
        if ( dto[HAS]('month') ) month = dto.month;
        else if ( defaults[HAS]('month') ) month = defaults.month;
        else month = now.getMonth( )+1;
        if ( dto[HAS]('year') ) year = dto.year;
        else if ( defaults[HAS]('year') ) year = defaults.year;
        else year = now.getFullYear( );
        
        // http://php.net/manual/en/function.checkdate.php
        if ( 0 > ms || 999 < ms ) return false;
        if ( 0 > second || 59 < second ) return false;
        if ( 0 > minute || 59 < minute ) return false;
        if ( 0 > hour || 23 < hour ) return false;
        
        if ( 1 > year || year > 32767 ) return false;
        leap = (year%4 === 0) & (year%100 !== 0) | (year%400 === 0);
        if ( dto[HAS]('leap') && leap !== dto.leap ) return false;
        if ( 1 > month || month > 12 ) return false;
        if ( 1 > day || day > 31 ) return false;
        if ( 2 === month && day > 28+leap ) return false;
        
        date = new Date(year, month-1, day, hour, minute, second, ms);
        
        if ( dto[HAS]('day_week') && dto.day_week !== date.getDay() ) return false;
        if ( dto[HAS]('day_year') && dto.day_year !== round((new Date(year, month-1, day) - new Date(year, 0, 1)) / 864e5) ) return false;
        if ( dto[HAS]('days_month') && dto.days_month !== (new Date(year, month, 0)).getDate( ) ) return false;
        if ( dto[HAS]('meridian') && ((hour > 11 && 'am' === dto.meridian) || (hour <= 11 && 'pm' === dto.meridian)) ) return false;
        
        if ( null !== time )
        {
            if ( date.getFullYear() !== time.getFullYear() ) return false;
            if ( date.getMonth() !== time.getMonth() ) return false;
            if ( date.getDate() !== time.getDate() ) return false;
            if ( date.getHours() !== time.getHours() ) return false;
            if ( date.getHours() !== time.getHours() ) return false;
            if ( date.getMinutes() !== time.getMinutes() ) return false;
            if ( date.getSeconds() !== time.getSeconds() ) return false;
        }
        }
        
        return date;
    },
    get_date_pattern = function( format, locale ) {
        locale = locale || default_date_locale;
        
        // (php) date formats
        // http://php.net/manual/en/function.date.php
        var D = {
        // Day --
        // Day of month w/leading 0; 01..31
         d: '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01)'
        // Shorthand day name; Mon...Sun
        ,D: '(' + get_alternate_pattern( locale.day_short.slice() ) + ')'
        // Day of month; 1..31
        ,j: '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)'
        // Full day name; Monday...Sunday
        ,l: '(' + get_alternate_pattern( locale.day.slice() ) + ')'
        // ISO-8601 day of week; 1[Mon]..7[Sun]
        ,N: '([1-7])'
        // Ordinal suffix for day of month; st, nd, rd, th
        ,S: '' // added below
        // Day of week; 0[Sun]..6[Sat]
        ,w: '([0-6])'
        // Day of year; 0..365
        ,z: '([1-3]?[0-9]{1,2})'

        // Week --
        // ISO-8601 week number
        ,W: '([0-5]?[0-9])'

        // Month --
        // Full month name; January...December
        ,F: '(' + get_alternate_pattern( locale.month.slice() ) + ')'
        // Month w/leading 0; 01...12
        ,m: '(12|11|10|09|08|07|06|05|04|03|02|01)'
        // Shorthand month name; Jan...Dec
        ,M: '(' + get_alternate_pattern( locale.month_short.slice() ) + ')'
        // Month; 1...12
        ,n: '(12|11|10|9|8|7|6|5|4|3|2|1)'
        // Days in month; 28...31
        ,t: '(31|30|29|28)'
        
        // Year --
        // Is leap year?; 0 or 1
        ,L: '([01])'
        // ISO-8601 year
        ,o: '(\\d{2,4})'
        // Full year; e.g. 1980...2010
        ,Y: '([12][0-9]{3})'
        // Last two digits of year; 00...99
        ,y: '([0-9]{2})'

        // Time --
        // am or pm
        ,a: '(' + get_alternate_pattern( [
            locale.meridian.am /*|| default_date_locale.meridian.am*/,
            locale.meridian.pm /*|| default_date_locale.meridian.pm*/
        ] ) + ')'
        // AM or PM
        ,A: '(' + get_alternate_pattern( [
            locale.meridian.AM /*|| default_date_locale.meridian.AM*/,
            locale.meridian.PM /*|| default_date_locale.meridian.PM*/
        ] ) + ')'
        // Swatch Internet time; 000..999
        ,B: '([0-9]{3})'
        // 12-Hours; 1..12
        ,g: '(12|11|10|9|8|7|6|5|4|3|2|1)'
        // 24-Hours; 0..23
        ,G: '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)'
        // 12-Hours w/leading 0; 01..12
        ,h: '(12|11|10|09|08|07|06|05|04|03|02|01)'
        // 24-Hours w/leading 0; 00..23
        ,H: '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01|00)'
        // Minutes w/leading 0; 00..59
        ,i: '([0-5][0-9])'
        // Seconds w/leading 0; 00..59
        ,s: '([0-5][0-9])'
        // Microseconds; 000000-999000
        ,u: '([0-9]{6})'

        // Timezone --
        // Timezone identifier; e.g. Atlantic/Azores, ...
        ,e: '(' + get_alternate_pattern( locale.timezone /*|| default_date_locale.timezone*/ ) + ')'
        // DST observed?; 0 or 1
        ,I: '([01])'
        // Difference to GMT in hour format; e.g. +0200
        ,O: '([+-][0-9]{4})'
        // Difference to GMT w/colon; e.g. +02:00
        ,P: '([+-][0-9]{2}:[0-9]{2})'
        // Timezone abbreviation; e.g. EST, MDT, ...
        ,T: '(' + get_alternate_pattern( locale.timezone_short /*|| default_date_locale.timezone_short*/ ) + ')'
        // Timezone offset in seconds (-43200...50400)
        ,Z: '(-?[0-9]{5})'

        // Full Date/Time --
        // Seconds since UNIX epoch
        ,U: '([0-9]{1,8})'
        // ISO-8601 date. Y-m-d\\TH:i:sP
        ,c: '' // added below
        // RFC 2822 D, d M Y H:i:s O
        ,r: '' // added below
        };
        // Ordinal suffix for day of month; st, nd, rd, th
        var lord = locale.ordinal.ord, lords = [], i;
        for (i in lord) if ( lord[HAS](i) ) lords.push( lord[i] );
        lords.push( locale.ordinal.nth );
        D.S = '(' + get_alternate_pattern( lords ) + ')';
        // ISO-8601 date. Y-m-d\\TH:i:sP
        D.c = D.Y+'-'+D.m+'-'+D.d+'\\\\'+D.T+D.H+':'+D.i+':'+D.s+D.P;
        // RFC 2822 D, d M Y H:i:s O
        D.r = D.D+',\\s'+D.d+'\\s'+D.M+'\\s'+D.Y+'\\s'+D.H+':'+D.i+':'+D.s+'\\s'+D.O;
        
        var re = '', f, i, l, group = 0;
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            re += D[HAS](f) ? D[ f ] : esc_re( f );
        }
        return new RegExp('^'+re+'$','');
    },
    get_date_parser = function( format, locale ) {
        locale = locale || default_date_locale;
        
        // (php) date formats
        // http://php.net/manual/en/function.date.php
        var groups = {
        // Day --
        // Day of month w/leading 0; 01..31
         d: function( d, date ) {
             d = parseInt('0' === d.charAt(0) ? d.slice(1) : d, 10);
             if ( d < 1 || d > 31 ) return false;
             if ( date[HAS]('day') && d !== date.day ) return false;
             date.day = d;
         }
        // Shorthand day name; Mon...Sun
        ,D: function( D, date ) {
             D = locale.day_short.indexOf( D );
             if ( D < 0 ) return false;
             if ( date[HAS]('day_week') && D !== date.day_week ) return false;
             date.day_week = D;
         }
        // Day of month; 1..31
        ,j: function( j, date ) {
             j = parseInt(j, 10);
             if ( j < 1 || j > 31 ) return false;
             if ( date[HAS]('day') && j !== date.day ) return false;
             date.day = j;
         }
        // Full day name; Monday...Sunday
        ,l: function( l, date ) {
             l = locale.day.indexOf( l );
             if ( l < 0 ) return false;
             if ( date[HAS]('day_week') && l !== date.day_week ) return false;
             date.day_week = l;
         }
        // ISO-8601 day of week; 1[Mon]..7[Sun]
        ,N: function( N, date ) {
             N = parseInt(N, 10);
             if ( N < 1 || N > 7 ) return false;
             if ( 7 === N ) N = 0;
             if ( date[HAS]('day_week') && N !== date.day_week ) return false;
             date.day_week = N;
         }
        // Ordinal suffix for day of month; st, nd, rd, th
        ,S: null
        // Day of week; 0[Sun]..6[Sat]
        ,w: function( w, date ) {
             w = parseInt(w, 10);
             if ( w < 0 || w > 6 ) return false;
             if ( date[HAS]('day_week') && w !== date.day_week ) return false;
             date.day_week = w;
         }
        // Day of year; 0..365(6)
        ,z: function( z, date ) {
             z = parseInt(z, 10);
             if ( z < 0 || z > 366 ) return false;
             date.day_year = z;
         }

        // Week --
        // ISO-8601 week number
        ,W: function( W, date ) {
             W = parseInt(W, 10);
             if ( W < 1 || W > 53 ) return false;
             date.week_year = W;
         }

        // Month --
        // Full month name; January...December
        ,F: function( F, date ) {
             F = locale.month.indexOf( F );
             if ( F < 0 ) return false;
             if ( date[HAS]('month') && F+1 !== date.month ) return false;
             date.month = F+1;
         }
        // Month w/leading 0; 01...12
        ,m: function( m, date ) {
             m = parseInt('0' === m.charAt(0) ? m.slice(1) : m, 10);
             if ( m < 1 || m > 12 ) return false;
             if ( date[HAS]('month') && m !== date.month ) return false;
             date.month = m;
         }
        // Shorthand month name; Jan...Dec
        ,M: function( M, date ) {
             M = locale.month_short.indexOf( M );
             if ( M < 0 ) return false;
             if ( date[HAS]('month') && M+1 !== date.month ) return false;
             date.month = M+1;
         }
        // Month; 1...12
        ,n: function( n, date ) {
             n = parseInt(n, 10);
             if ( n < 1 || n > 12 ) return false;
             if ( date[HAS]('month') && n !== date.month ) return false;
             date.month = n;
         }
        // Days in month; 28...31
        ,t: function( t, date ) {
             t = parseInt(t, 10);
             if ( t < 28 || t > 31 ) return false;
             date.days_month = t;
         }
        
        // Year --
        // Is leap year?; 0 or 1
        ,L: function( L, date ) {
             if ( '0' === L ) date.leap = 0;
             else if ( '1' === L ) date.leap = 1;
             else return false;
         }
        // ISO-8601 year
        ,o: null
        // Full year; e.g. 1980...2010
        ,Y: function( Y, date ) {
             Y = parseInt(Y, 10);
             if ( Y < 1000 || Y > 3000 ) return false;
             if ( date[HAS]('year') && Y !== date.year ) return false;
             date.year = Y;
         }
        // Last two digits of year; 00...99
        ,y: function( y, date ) {
             if ( 2 === y.length )
             {
                // http://php.net/manual/en/function.strtotime.php
                if ( '00' <= y && '69' >= y ) y = '20' + y;
                else if ( '70' <= y && '99' >= y ) y = '19' + y;
             }
             y = parseInt(y , 10);
             if ( y < 1000 || y > 3000 ) return false;
             if ( date[HAS]('year') && y !== date.year ) return false;
             date.year = y;
         }

        // Time --
        // am or pm
        ,a: function( a, date ) {
            if ( locale.meridian.am === a ) a = 'am';
            else if ( locale.meridian.pm === a ) a = 'pm';
            else return false;
            if ( date[HAS]('meridian') && a !== date.meridian ) return false;
            date.meridian = a;
         }
        // AM or PM
        ,A: function( A, date ) {
            if ( locale.meridian.AM === A ) A = 'am';
            else if ( locale.meridian.PM === A ) A = 'pm';
            else return false;
            if ( date[HAS]('meridian') && A !== date.meridian ) return false;
            date.meridian = A;
         }
        // Swatch Internet time; 000..999
        ,B: null
        // 12-Hours; 1..12
        ,g: function( g, date ) {
            g = parseInt(g, 10);
            if ( g < 1 || g > 12 ) return false;
            if ( date[HAS]('hour_12') && g !== date.hour_12 ) return false;
            date.hour_12 = g;
         }
        // 24-Hours; 0..23
        ,G: function( G, date ) {
            G = parseInt(G, 10);
            if ( G < 0 || G > 23 ) return false;
            if ( date[HAS]('hour') && G !== date.hour ) return false;
            date.hour = G;
         }
        // 12-Hours w/leading 0; 01..12
        ,h: function( h, date ) {
            h = parseInt('0' === h.charAt(0) ? h.slice(1) : h, 10);
            if ( h < 1 || h > 12 ) return false;
            if ( date[HAS]('hour_12') && h !== date.hour_12 ) return false;
            date.hour_12 = h;
         }
        // 24-Hours w/leading 0; 00..23
        ,H: function( H, date ) {
            H = parseInt('0' === H.charAt(0) ? H.slice(1) : H, 10);
            if ( H < 0 || H > 23 ) return false;
            if ( date[HAS]('hour') && H !== date.hour ) return false;
            date.hour = H;
         }
        // Minutes w/leading 0; 00..59
        ,i: function( i, date ) {
            i = parseInt('0' === i.charAt(0) ? i.slice(1) : i, 10);
            if ( i < 0 || i > 59 ) return false;
            if ( date[HAS]('minute') && i !== date.minute ) return false;
            date.minute = i;
         }
        // Seconds w/leading 0; 00..59
        ,s: function( s, date ) {
            s = parseInt('0' === s.charAt(0) ? s.slice(1) : s, 10);
            if ( s < 0 || s > 59 ) return false;
            if ( date[HAS]('second') && s !== date.second ) return false;
            date.second = s;
         }
        // Microseconds; 000000-999000
        ,u: function( u, date ) {
            var p = 0;
            while (u.length > 1 && '0'===u.charAt(p)) p++;
            u = parseInt(u.slice(p), 10);
            u = ~~(u/1000);
            if ( u < 0 || u > 999 ) return false;
            if ( date[HAS]('ms') && u !== date.ms ) return false;
            date.ms = u;
         }

        // Timezone --
        // Timezone identifier; e.g. Atlantic/Azores, ...
        ,e: null
        // DST observed?; 0 or 1
        ,I: null
        // Difference to GMT in hour format; e.g. +0200
        ,O: null
        // Difference to GMT w/colon; e.g. +02:00
        ,P: null
        // Timezone abbreviation; e.g. EST, MDT, ...
        ,T: null
        // Timezone offset in seconds (-43200...50400)
        ,Z: null

        // Full Date/Time --
        // Seconds since UNIX epoch
        ,U: function( U, date ) {
            U = parseInt(U, 10);
            if ( U < 0 ) return false;
            U *= 1000;
            if ( date[HAS]('time') && U !== date.time ) return false;
            date.time = U;
         }
        // ISO-8601 date. Y-m-d\\TH:i:sP
        ,c: null // added below
        // RFC 2822 D, d M Y H:i:s O
        ,r: null // added below
        };
        
        var date_pattern = get_date_pattern( format, locale ), f, i, l, group = 0, capture = {};
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            if ( groups[HAS](f) )
            {
                ++group;
                if ( 'c' === f )
                {
                    capture[group] = groups.Y;
                    capture[++group] = groups.m;
                    capture[++group] = groups.d;
                    ++group;
                    capture[++group] = groups.H;
                    capture[++group] = groups.i;
                    capture[++group] = groups.s;
                    ++group;
                }
                else if ( 'r' === f )
                {
                    capture[group] = groups.D;
                    capture[++group] = groups.d;
                    capture[++group] = groups.M;
                    capture[++group] = groups.Y;
                    capture[++group] = groups.H;
                    capture[++group] = groups.i;
                    capture[++group] = groups.s;
                    ++group;
                }
                else if ( groups[f] )
                {
                    capture[group] = groups[f];
                }
            }
        }
        return function( date_string ) {
            var i, r, m = date_string.match( date_pattern ), dto = {};
            if ( !m ) return false;
            for (i=1; i<m.length; i++)
            {
                if ( capture[HAS](i) )
                {
                    r = capture[i]( m[i], dto );
                    if ( false === r ) return false;
                }
            }
            return check_and_create_date( dto );
        };
    },
    get_formatted_date = function( d, format, locale ) {
        var formatted_datetime, f, i, l, jsdate;
        
        if ( d.substr ) return d; // already string format, return it
        
        // undefined
        if ( null == d ) jsdate = new Date( );
        // JS Date
        else if ( d instanceof Date ) jsdate = new Date( d );
        // UNIX timestamp (auto-convert to int)
        else if ( "number" === typeof d ) jsdate =  new Date(d * 1000);
        
        locale = locale || default_date_locale;
        var D = { }, tzo = jsdate.getTimezoneOffset( ), atzo = abs(tzo), m = jsdate.getMonth( ), jmod10;
        // 24-Hours; 0..23
        D.G = jsdate.getHours( );
        // Day of month; 1..31
        D.j = jsdate.getDate( ); jmod10 = D.j%10;
        // Month; 1...12
        D.n = m + 1;
        // Full year; e.g. 1980...2010
        D.Y = jsdate.getFullYear( );
        // Day of week; 0[Sun]..6[Sat]
        D.w = jsdate.getDay( );
        // ISO-8601 day of week; 1[Mon]..7[Sun]
        D.N = D.w || 7;
        // Day of month w/leading 0; 01..31
        D.d = pad(D.j, 2, '0');
        // Shorthand day name; Mon...Sun
        D.D = locale.day_short[ D.w ];
        // Full day name; Monday...Sunday
        D.l = locale.day[ D.w ];
        // Ordinal suffix for day of month; st, nd, rd, th
        D.S = locale.ordinal.ord[ D.j ] ? locale.ordinal.ord[ D.j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
        // Day of year; 0..365
        D.z = round((new Date(D.Y, m, D.j) - new Date(D.Y, 0, 1)) / 864e5);
        // ISO-8601 week number
        D.W = pad(1 + round((new Date(D.Y, m, D.j - D.N + 3) - new Date(D.Y, 0, 4)) / 864e5 / 7), 2, '0');
        // Full month name; January...December
        D.F = locale.month[ m ];
        // Month w/leading 0; 01...12
        D.m = pad(D.n, 2, '0');
        // Shorthand month name; Jan...Dec
        D.M = locale.month_short[ m ];
        // Days in month; 28...31
        D.t = (new Date(D.Y, m+1, 0)).getDate( );
        // Is leap year?; 0 or 1
        D.L = (D.Y % 4 === 0) & (D.Y % 100 !== 0) | (D.Y % 400 === 0);
        // ISO-8601 year
        D.o = D.Y + (11 === m && D.W < 9 ? 1 : (0 === m && D.W > 9 ? -1 : 0));
        // Last two digits of year; 00...99
        D.y = D.Y.toString( ).slice(-2);
        // am or pm
        D.a = D.G > 11 ? locale.meridian.pm : locale.meridian.am;
        // AM or PM
        D.A = D.G > 11 ? locale.meridian.PM : locale.meridian.AM;
        // Swatch Internet time; 000..999
        D.B = pad(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
        // 12-Hours; 1..12
        D.g = (D.G % 12) || 12;
        // 12-Hours w/leading 0; 01..12
        D.h = pad(D.g, 2, '0');
        // 24-Hours w/leading 0; 00..23
        D.H = pad(D.G, 2, '0');
        // Minutes w/leading 0; 00..59
        D.i = pad(jsdate.getMinutes( ), 2, '0');
        // Seconds w/leading 0; 00..59
        D.s = pad(jsdate.getSeconds( ), 2, '0');
        // Microseconds; 000000-999000
        D.u = pad(jsdate.getMilliseconds( ) * 1000, 6, '0');
        // Timezone identifier; e.g. Atlantic/Azores, ...
        // The following works, but requires inclusion of the very large
        // timezone_abbreviations_list() function.
        /*              return that.date_default_timezone_get();
        */
        D.e = '';
        // DST observed?; 0 or 1
        D.I = ((new Date(D.Y, 0) - Date.UTC(D.Y, 0)) !== (new Date(D.Y, 6) - Date.UTC(D.Y, 6))) ? 1 : 0;
        // Difference to GMT in hour format; e.g. +0200
        D.O = (tzo > 0 ? "-" : "+") + pad(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
        // Difference to GMT w/colon; e.g. +02:00
        D.P = (D.O.substr(0, 3) + ":" + D.O.substr(3, 2));
        // Timezone abbreviation; e.g. EST, MDT, ...
        D.T = 'UTC';
        // Timezone offset in seconds (-43200...50400)
        D.Z = -tzo * 60;
        // Seconds since UNIX epoch
        D.U = jsdate / 1000 | 0;
        // ISO-8601 date. 'Y-m-d\\TH:i:sP'
        D.c = [ D.Y,'-',D.m,'-',D.d,'\\',D.T,D.H,':',D.i,':',D.s,D.P ].join('');
        // RFC 2822 'D, d M Y H:i:s O'
        D.r = [ D.D,', ',D.d,' ',D.M,' ',D.Y,' ',D.H,':',D.i,':',D.s,' ',D.O ].join('');
            
        formatted_datetime = '';
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            formatted_datetime += D[HAS](f) ? D[ f ] : f;
        }
        return formatted_datetime;
    },
    str_format_re = new RegExp('%('+[
     'Ec'
    ,'EC'
    ,'Ex'
    ,'EX'
    ,'Ey'
    ,'EY'
    ,'Od'
    ,'Oe'
    ,'OH'
    ,'OI'
    ,'Om'
    ,'OM'
    ,'OS'
    ,'Ou'
    ,'OU'
    ,'OV'
    ,'Ow'
    ,'OW'
    ,'Oy'
    ,'a'
    ,'A'
    ,'b'
    ,'B'
    ,'c'
    ,'C'
    ,'d'
    ,'D'
    ,'e'
    ,'h'
    ,'H'
    ,'I'
    ,'j'
    ,'m'
    ,'M'
    ,'n'
    ,'p'
    ,'r'
    ,'R'
    ,'S'
    ,'t'
    ,'T'
    ,'u'
    ,'U'
    ,'V'
    ,'w'
    ,'W'
    ,'x'
    ,'X'
    ,'y'
    ,'Y'
    ,'Z'
    ,'%'
    ].join('|')+')', 'g'),
    str_format_repl = {
        '%' : '%'
        //is replaced by the locale's abbreviated weekday name. 
        ,'a' : 'D'
        //is replaced by the locale's full weekday name. 
        ,'A' : 'l'
        //is replaced by the locale's abbreviated month name. 
        ,'b' : 'M'
        //is replaced by the locale's full month name. 
        ,'B' : 'F'
        //is replaced by the locale's appropriate date and time representation. 
        ,'c' : 'c'
        //is replaced by the century number (the year divided by 100 and truncated to an integer) as a decimal number [00-99]. 
        ,'C' : ''
        //is replaced by the day of the month as a decimal number [01,31]. 
        ,'d' : 'd'
        //same as %m/%d/%y. 
        ,'D' : 'm/d/y'
        //is replaced by the day of the month as a decimal number [1,31]; a single digit is preceded by a space. 
        ,'e' : 'j'
        //same as %b. 
        ,'h' : 'M'
        //is replaced by the hour (24-hour clock) as a decimal number [00,23]. 
        ,'H' : 'H'
        //is replaced by the hour (12-hour clock) as a decimal number [01,12]. 
        ,'I' : 'h'
        //is replaced by the day of the year as a decimal number [001,366]. 
        ,'j' : 'z'
        //is replaced by the month as a decimal number [01,12]. 
        ,'m' : 'm'
        //is replaced by the minute as a decimal number [00,59]. 
        ,'M' : 'i'
        //is replaced by a newline character. 
        ,'n' : "\n"
        //is replaced by the locale's equivalent of either a.m. or p.m. 
        ,'p' : 'a'
        //is replaced by the time in a.m. and p.m. notation; in the POSIX locale this is equivalent to %I:%M:%S %p. 
        ,'r' : 'r'
        //is replaced by the time in 24 hour notation (%H:%M). 
        ,'R' : 'H:i'
        //is replaced by the second as a decimal number [00,61]. 
        ,'S' : 's'
        //is replaced by a tab character. 
        ,'t' : "\t"
        //is replaced by the time (%H:%M:%S). 
        ,'T' : 'H:i:s'
        //is replaced by the weekday as a decimal number [1,7], with 1 representing Monday. 
        ,'u' : 'N'
        //is replaced by the week number of the year (Sunday as the first day of the week) as a decimal number [00,53]. 
        ,'U' : 'W'
        //is replaced by the week number of the year (Monday as the first day of the week) as a decimal number [01,53]. If the week containing 1 January has four or more days in the new year, then it is considered week 1. Otherwise, it is the last week of the previous year, and the next week is week 1. 
        ,'V' : 'W'
        //is replaced by the weekday as a decimal number [0,6], with 0 representing Sunday. 
        ,'w' : 'w'
        //is replaced by the week number of the year (Monday as the first day of the week) as a decimal number [00,53]. All days in a new year preceding the first Monday are considered to be in week 0. 
        ,'W' : 'W'
        //is replaced by the locale's appropriate date representation. 
        //,'x' : ''
        //is replaced by the locale's appropriate time representation. 
        //,'X' : ''
        //is replaced by the year without century as a decimal number [00,99]. 
        ,'y' : 'y'
        //is replaced by the year with century as a decimal number. 
        ,'Y' : 'Y'
        //is replaced by the timezone name or abbreviation, or by no bytes if no timezone information exists. 
        ,'Z' : 'T'
        
        //is replaced by the locale's alternative appropriate date and time representation. 
        //,'Ec' : ''
        //is replaced by the name of the base year (period) in the locale's alternative representation. 
        //,'EC' : ''
        //is replaced by the locale's alternative date representation. 
        //,'Ex' : ''
        //is replaced by the locale' alternative time representation. 
        //,'EX' : ''
        //is replaced by the offset from %EC (year only) in the locale's alternative representation. 
        ,'Ey' : 'y'
        //is replaced by the full alternative year representation. 
        ,'EY' : 'Y'
        //is replaced by the day of the month, using the locale's alternative numeric symbols, filled as needed with leading zeros if there is any alternative symbol for zero, otherwise with leading spaces. 
        ,'Od' : 'd'
        //is replaced by the day of month, using the locale's alternative numeric symbols, filled as needed with leading spaces. 
        ,'Oe' : 'j'
        //is replaced by the hour (24-hour clock) using the locale's alternative numeric symbols. 
        ,'OH' : 'H'
        //is replaced by the hour (12-hour clock) using the locale's alternative numeric symbols. 
        ,'OI' : 'h'
        //is replaced by the month using the locale's alternative numeric symbols. 
        ,'Om' : 'm'
        //is replaced by the minutes using the locale's alternative numeric symbols. 
        ,'OM' : 'i'
        //is replaced by the seconds using the locale's alternative numeric symbols. 
        ,'OS' : 's'
        //is replaced by the weekday as a number in the locale's alternative representation (Monday=1). 
        ,'Ou' : 'N'
        //is replaced by the week number of the year (Sunday as the first day of the week, rules corresponding to %U) using the locale's alternative numeric symbols. 
        ,'OU' : 'W'
        //is replaced by the week number of the year (Monday as the first day of the week, rules corresponding to %V) using the locale's alternative numeric symbols. 
        ,'OV' : 'W'
        //is replaced by the number of the weekday (Sunday=0) using the locale's alternative numeric symbols. 
        ,'Ow' : 'w'
        //is replaced by the week number of the year (Monday as the first day of the week) using the locale's alternative numeric symbols. 
        ,'OW' : 'W'
        //is replaced by the year (offset from %C) using the locale's alternative numeric symbols. 
        ,'Oy' : 'y'
    },
    cformat_to_phpformat = function( cformat ) {
        // http://pubs.opengroup.org/onlinepubs/007908799/xsh/strftime.html
        // http://php.net/manual/en/function.date.php
        return cformat.replace(str_format_re, function(m, g1){
            return str_format_repl[HAS](g1) ? str_format_repl[g1] : g1;
        });
    },
    DateX
;        

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// wrapper around Date built-in object
DateX = function DateX( year, month, day, hour, minutes, seconds, milliseconds ) {
    var self = this, argslen = arguments.length;
    if ( argslen )
    {
        if ( year instanceof DateX )
            self.$date = new Date( year.$date );
        else if ( 1 === argslen )
            self.$date = new Date( year );
        else
            self.$date = new Date( year, month, day||1, hour||0, minutes||0, seconds||0, milliseconds||0 );
    }
    else
    {
        self.$date = new Date( );
    }
    self.$locale = default_date_locale;
};
DateX.VERSION = "0.1";
DateX.now = Date.now || function( ) { 
    return new Date( ).getTime( ); 
};
DateX.UTC = Date.UTC;
DateX.fromString = DateX.parse = function( date_string, format, locale, strformat ) { 
    if ( format && true === strformat ) format = cformat_to_phpformat(format);
    var date_parse = get_date_parser( format || "Y-m-d H:i:s", locale || default_date_locale );
    var date = date_parse( date_string );
    return false !== date ? new DateX( date ) : false;
};
DateX.prototype = {
     constructor: DateX
    
    ,$date: null
    ,$locale: null
    
    ,dispose: function( ) {
        var self = this;
        self.$date = null;
        self.$locale = null;
        return self;
    }
    ,getDateObject: function( ) {
        return this.$date;
    }
    ,setDateObject: function( date ) {
        var self = this;
        self.$date = date;
        return self;
    }
    ,getLocale: function( ) {
        return this.$locale;
    }
    ,setLocale: function( locale ) {
        var self = this;
        self.$locale = locale;
        return self;
    }
    ,format: function( format, locale ) {
        return get_formatted_date( this.$date, format || "Y-m-d H:i:s", locale || this.$locale ); 
    }
    ,strformat: function( format, locale ) {
        return get_formatted_date( this.$date, cformat_to_phpformat( format ), locale || this.$locale ); 
    }
    
    ,getDate: function( ) {
        return this.$date.getDate( );
    }
    ,getDay: function( ) {
        return this.$date.getDay( );
    }
    ,getFullYear: function( ) {
        return this.$date.getFullYear( );
    }
    ,getHours: function( ) {
        return this.$date.getHours( );
    }
    ,getMilliseconds: function( ) {
        return this.$date.getMilliseconds( );
    }
    ,getMinutes: function( ) {
        return this.$date.getMinutes( );
    }
    ,getMonth: function( ) {
        return this.$date.getMonth( );
    }
    ,getSeconds: function( ) {
        return this.$date.getSeconds( );
    }
    ,getTime: function( ) {
        return this.$date.getTime( );
    }
    ,getTimezoneOffset: function( ) {
        return this.$date.getTimezoneOffset( );
    }
    ,getUTCDate: function( ) {
        return this.$date.getUTCDate( );
    }
    ,getUTCDay: function( ) {
        return this.$date.getUTCDay( );
    }
    ,getUTCFullYear: function( ) {
        return this.$date.getUTCFullYear( );
    }
    ,getUTCHours: function( ) {
        return this.$date.getUTCHours( );
    }
    ,getUTCMilliseconds: function( ) {
        return this.$date.getUTCMilliseconds( );
    }
    ,getUTCMinutes: function( ) {
        return this.$date.getUTCMinutes( );
    }
    ,getUTCMonth: function( ) {
        return this.$date.getUTCMonth( );
    }
    ,getUTCSeconds: function( ) {
        return this.$date.getUTCSeconds( );
    }
    ,getYear: function( ) {
        return this.$date.getYear( );
    }
    ,setDate: function( d ) {
        this.$date.setDate( d );
        return this;
    }
    ,setFullYear: function( d ) {
        this.$date.setFullYear( d );
        return this;
    }
    ,setHours: function( d ) {
        this.$date.setHours( d );
        return this;
    }
    ,setMilliseconds: function( d ) {
        this.$date.setMilliseconds( d );
        return this;
    }
    ,setMinutes: function( d ) {
        this.$date.setMinutes( d );
        return this;
    }
    ,setMonth: function( d ) {
        this.$date.setMonth( d );
        return this;
    }
    ,setSeconds: function( d ) {
        this.$date.setSeconds( d );
        return this;
    }
    ,setTime: function( d ) {
        this.$date.setTime( d );
        return this;
    }
    ,setUTCDate: function( d ) {
        this.$date.setUTCDate( d );
        return this;
    }
    ,setUTCFullYear: function( d ) {
        this.$date.setUTCFullYear( d );
        return this;
    }
    ,setUTCHours: function( d ) {
        this.$date.setUTCHours( d );
        return this;
    }
    ,setUTCMilliseconds: function( d ) {
        this.$date.setUTCMilliseconds( d );
        return this;
    }
    ,setUTCMinutes: function( d ) {
        this.$date.setUTCMinutes( d );
        return this;
    }
    ,setUTCMonth: function( d ) {
        this.$date.setUTCMonth( d );
        return this;
    }
    ,setUTCSeconds: function( d ) {
        this.$date.setUTCSeconds( d );
        return this;
    }
    ,setYear: function( d ) {
        this.$date.setYear( d );
        return this;
    }
    ,toISOString: function( ) {
        return this.$date.toISOString( );
    }
    ,toJSON: function( ) {
        return this.$date.toJSON( );
    }
    ,toGMTString: function( ) {
        return this.$date.toGMTString( );
    }
    ,toSource: function( ) {
        return this.$date.toSource( );
    }
    ,valueOf: function( ) {
        return this.$date.valueOf( );
    }
    ,toLocaleFormat: function( format ) {
        return this.format( format );
    }
    ,toDateString: function( format, locale ) {
        if ( arguments.length ) return this.format( format, locale );
        return this.$date.toDateString( );
    }
    ,toTimeString: function( format, locale ) {
        if ( arguments.length ) return this.format( format, locale );
        return this.$date.toTimeString( );
    }
    ,toLocaleDateString: function( format ) {
        if ( arguments.length ) return this.format( format );
        return this.$date.toLocaleDateString( );
    }
    ,toLocaleTimeString: function( format ) {
        if ( arguments.length ) return this.format( format );
        return this.$date.toLocaleTimeString( );
    }
    ,toLocaleString: function( format ) {
        if ( arguments.length ) return this.format( format );
        return this.$date.toLocaleString( );
    }
    ,toUTCString: function( ) {
        return this.$date.toUTCString( );
    }
    ,toString: function( format, locale ) {
        if ( arguments.length ) return this.format( format, locale );
        return this.$date.toString( );
    }
};

// export it
return DateX;
});