/**
*
*   DateX
*   eXtended and localised Date parsing, diffing, formatting and validation for Node/JS, Python, PHP
*   @version: 0.2.0
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

var HAS = 'hasOwnProperty', floor = Math.floor, ceil = Math.ceil, round = Math.round, abs = Math.abs,
    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    Date = ('undefined' !== typeof global) && ('[object global]' === Object.prototype.toString.call(global)) ? global.Date : (window ? window.Date : this.Date),
    date_locale_default = {
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ],
    units: {
    singular: {
    'milliseconds':'millisecond',
    'seconds':'second',
    'minutes':'minute',
    'hours':'hour',
    'days':'day',
    'weeks':'week',
    'months':'month',
    'years':'year'
    },
    plural: {
    'milliseconds':'milliseconds',
    'seconds':'seconds',
    'minutes':'minutes',
    'hours':'hours',
    'days':'days',
    'weeks':'weeks',
    'months':'months',
    'years':'years'
    }
    }
    },
    
    d_DH = 24, d_Hm = 60, d_ms = 60, d_smi = 1000, d_YM = 12, d_MD = 30, d_MD1 = 30.417, d_YD = 365, d_YD1 = 365.25,
    d_mmi = d_ms*d_smi,
    d_Hmi = d_Hm*d_mmi,
    d_Dmi = d_DH*d_Hmi,
    d_Mmi = d_MD1*d_Dmi,
    d_Ymi = d_YD1*d_Dmi,
    Dur = [
    ['milliseconds', 1],
    ['seconds',      d_smi],
    ['minutes',      d_mmi],
    ['hours',        d_Hmi],
    ['days',         d_Dmi],
    ['months',       d_MD*d_Dmi],
    ['years',        d_YD*d_Dmi]
    ],
    Dunit = {
    years: d_Ymi,
    months: d_Mmi,
    weeks: 604800000,
    days: d_Dmi,
    hours: d_Hmi,
    minutes: d_mmi,
    seconds: d_smi,
    milliseconds: 1,
    Y: d_Ymi,
    M: d_Mmi,
    W: 604800000,
    D: d_Dmi,
    H: d_Hmi,
    m: d_mmi,
    s: d_smi,
    i: 1
    },
    
    // (php) date formats
    // http://php.net/manual/en/function.date.php
    date_patterns = {
    // Day --
    // Day of month w/leading 0; 01..31
     d: function( locale, dto ) {
         if ( !dto[HAS]('d') )
         {
            dto.d = '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01)';
         }
        return dto.d;
     }
    // Shorthand day name; Mon...Sun
    ,D: function( locale, dto ) {
         if ( !dto[HAS]('D') )
         {
            dto.D = '(' + get_alternate_pattern( locale.day_short.slice() ) + ')';
         }
         return dto.D;
    }
    // Full day name; Monday...Sunday
    ,l: function( locale, dto ) {
         if ( !dto[HAS]('l') )
         {
            dto.l = '(' + get_alternate_pattern( locale.day.slice() ) + ')';
         }
         return dto.l;
    }
    // Day of month; 1..31
    ,j: function( locale, dto ) {
         if ( !dto[HAS]('j') )
         {
            dto.j = '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.j;
    }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( locale, dto ) {
         if ( !dto[HAS]('N') )
         {
            dto.N = '([1-7])';
         }
         return dto.N;
    }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: function( locale, dto ) {
         if ( !dto[HAS]('S') )
         {
            // Ordinal suffix for day of month; st, nd, rd, th
            var lord = locale.ordinal.ord, lords = [], i;
            for (i in lord) if ( lord[HAS](i) ) lords.push( lord[i] );
            lords.push( locale.ordinal.nth );
            dto.S = '(' + get_alternate_pattern( lords ) + ')';
         }
         return dto.S;
    }
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( locale, dto ) {
         if ( !dto[HAS]('w') )
         {
            dto.w = '([0-6])';
         }
         return dto.w;
    }
    // Day of year; 0..365
    ,z: function( locale, dto ) {
         if ( !dto[HAS]('z') )
         {
            dto.z = '([1-3]?[0-9]{1,2})';
         }
         return dto.z;
    }

    // Week --
    // ISO-8601 week number
    ,W: function( locale, dto ) {
         if ( !dto[HAS]('W') )
         {
            dto.W = '([0-5]?[0-9])';
         }
         return dto.W;
    }

    // Month --
    // Full month name; January...December
    ,F: function( locale, dto ) {
         if ( !dto[HAS]('F') )
         {
            dto.F = '(' + get_alternate_pattern( locale.month.slice() ) + ')';
         }
         return dto.F;
    }
    // Shorthand month name; Jan...Dec
    ,M: function( locale, dto ) {
         if ( !dto[HAS]('M') )
         {
            dto.M = '(' + get_alternate_pattern( locale.month_short.slice() ) + ')';
         }
         return dto.M;
    }
    // Month w/leading 0; 01...12
    ,m: function( locale, dto ) {
         if ( !dto[HAS]('m') )
         {
            dto.m = '(12|11|10|09|08|07|06|05|04|03|02|01)';
         }
         return dto.m;
    }
    // Month; 1...12
    ,n: function( locale, dto ) {
         if ( !dto[HAS]('n') )
         {
            dto.n = '(12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.n;
    }
    // Days in month; 28...31
    ,t: function( locale, dto ) {
         if ( !dto[HAS]('t') )
         {
            dto.t = '(31|30|29|28)';
         }
         return dto.t;
    }
    
    // Year --
    // Is leap year?; 0 or 1
    ,L: function( locale, dto ) {
         if ( !dto[HAS]('L') )
         {
            dto.L = '([01])';
         }
         return dto.L;
    }
    // ISO-8601 year
    ,o: function( locale, dto ) {
         if ( !dto[HAS]('o') )
         {
            dto.o = '(\\d{2,4})';
         }
         return dto.o;
    }
    // Full year; e.g. 1980...2010
    ,Y: function( locale, dto ) {
         if ( !dto[HAS]('Y') )
         {
            dto.Y = '([12][0-9]{3})';
         }
         return dto.Y;
    }
    // Last two digits of year; 00...99
    ,y: function( locale, dto ) {
         if ( !dto[HAS]('y') )
         {
            dto.y = '([0-9]{2})';
         }
         return dto.y;
    }

    // Time --
    // am or pm
    ,a: function( locale, dto ) {
         if ( !dto[HAS]('a') )
         {
            dto.a = '(' + get_alternate_pattern( [
                locale.meridian.am /*|| date_locale_default.meridian.am*/,
                locale.meridian.pm /*|| date_locale_default.meridian.pm*/
            ] ) + ')';
         }
         return dto.a;
    }
    // AM or PM
    ,A: function( locale, dto ) {
         if ( !dto[HAS]('A') )
         {
            dto.A = '(' + get_alternate_pattern( [
                locale.meridian.AM /*|| date_locale_default.meridian.AM*/,
                locale.meridian.PM /*|| date_locale_default.meridian.PM*/
            ] ) + ')';
         }
         return dto.A;
    }
    // Swatch Internet time; 000..999
    ,B: function( locale, dto ) {
         if ( !dto[HAS]('B') )
         {
            dto.B = '([0-9]{3})';
         }
         return dto.B;
    }
    // 12-Hours; 1..12
    ,g: function( locale, dto ) {
         if ( !dto[HAS]('g') )
         {
            dto.g = '(12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.g;
    }
    // 24-Hours; 0..23
    ,G: function( locale, dto ) {
         if ( !dto[HAS]('G') )
         {
            dto.G = '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)';
         }
         return dto.G;
    }
    // 12-Hours w/leading 0; 01..12
    ,h: function( locale, dto ) {
         if ( !dto[HAS]('h') )
         {
            dto.h = '(12|11|10|09|08|07|06|05|04|03|02|01)';
         }
         return dto.h;
    }
    // 24-Hours w/leading 0; 00..23
    ,H: function( locale, dto ) {
         if ( !dto[HAS]('H') )
         {
            dto.H = '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01|00)';
         }
         return dto.H;
    }
    // Minutes w/leading 0; 00..59
    ,i: function( locale, dto ) {
         if ( !dto[HAS]('i') )
         {
            dto.i = '([0-5][0-9])';
         }
         return dto.i
    }
    // Seconds w/leading 0; 00..59
    ,s: function( locale, dto ) {
         if ( !dto[HAS]('s') )
         {
            dto.s = '([0-5][0-9])';
         }
         return dto.s;
    }
    // Microseconds; 000000-999000
    ,u: function( locale, dto ) {
         if ( !dto[HAS]('u') )
         {
            dto.u = '([0-9]{6})';
         }
         return dto.u;
    }

    // Timezone --
    // DST observed?; 0 or 1
    ,I: function( locale, dto ) {
         if ( !dto[HAS]('I') )
         {
            dto.I = '([01])';
         }
         return dto.I;
    }
    // Difference to GMT in hour format; e.g. +0200
    ,O: function( locale, dto ) {
         if ( !dto[HAS]('O') )
         {
            dto.O = '([+-][0-9]{4})';
         }
         return dto.O;
    }
    // Difference to GMT w/colon; e.g. +02:00
    ,P: function( locale, dto ) {
         if ( !dto[HAS]('P') )
         {
            dto.P = '([+-][0-9]{2}:[0-9]{2})';
         }
         return dto.P;
    }
    // Timezone offset in seconds (-43200...50400)
    ,Z: function( locale, dto ) {
         if ( !dto[HAS]('Z') )
         {
            dto.Z = '(-?[0-9]{5})';
         }
         return dto.Z;
    }
    // Timezone identifier; e.g. Atlantic/Azores, ...
    ,e: function( locale, dto ) {
         if ( !dto[HAS]('e') )
         {
            dto.e = '(' + get_alternate_pattern( locale.timezone /*|| date_locale_default.timezone*/ ) + ')';
         }
         return dto.e;
    }
    // Timezone abbreviation; e.g. EST, MDT, ...
    ,T: function( locale, dto ) {
         if ( !dto[HAS]('T') )
         {
            dto.T = '(' + get_alternate_pattern( locale.timezone_short /*|| date_locale_default.timezone_short*/ ) + ')';
         }
         return dto.T;
    }

    // Full Date/Time --
    // Seconds since UNIX epoch
    ,U: function( locale, dto ) {
         if ( !dto[HAS]('U') )
         {
            dto.U = '([0-9]{1,8})';
         }
         return dto.U;
    }
    // ISO-8601 date. Y-m-d\\TH:i:sP
    ,c: function( locale, dto ) {
         if ( !dto[HAS]('c') )
         {
            dto.c = date_patterns.Y(locale, dto)+'-'+date_patterns.m(locale, dto)+'-'+date_patterns.d(locale, dto)+'\\\\'+date_patterns.T(locale, dto)+date_patterns.H(locale, dto)+':'+date_patterns.i(locale, dto)+':'+date_patterns.s(locale, dto)+date_patterns.P(locale, dto);
         }
         return dto.c;
    }
    // RFC 2822 D, d M Y H:i:s O
    ,r: function( locale, dto ) {
         if ( !dto[HAS]('r') )
         {
            dto.r = date_patterns.D(locale, dto)+',\\s'+date_patterns.d(locale, dto)+'\\s'+date_patterns.M(locale, dto)+'\\s'+date_patterns.Y(locale, dto)+'\\s'+date_patterns.H(locale, dto)+':'+date_patterns.i(locale, dto)+':'+date_patterns.s(locale, dto)+'\\s'+date_patterns.O(locale, dto);
         }
         return dto.r;
    }
    },
    
    // (php) date formats
    // http://php.net/manual/en/function.date.php
    date_parsers = {
    // Day --
    // Day of month w/leading 0; 01..31
     d: function( d, locale, dto ) {
         d = parseInt('0' === d.charAt(0) ? d.slice(1) : d, 10);
         if ( d < 1 || d > 31 ) return false;
         if ( dto[HAS]('day') && d !== dto.day ) return false;
         dto.day = d;
     }
    // Shorthand day name; Mon...Sun
    ,D: function( D, locale, dto ) {
         D = locale.day_short.indexOf( D );
         if ( D < 0 ) return false;
         if ( dto[HAS]('day_week') && D !== dto.day_week ) return false;
         dto.day_week = D;
     }
    // Day of month; 1..31
    ,j: function( j, locale, dto ) {
         j = parseInt(j, 10);
         if ( j < 1 || j > 31 ) return false;
         if ( dto[HAS]('day') && j !== dto.day ) return false;
         dto.day = j;
     }
    // Full day name; Monday...Sunday
    ,l: function( l, locale, dto ) {
         l = locale.day.indexOf( l );
         if ( l < 0 ) return false;
         if ( dto[HAS]('day_week') && l !== dto.day_week ) return false;
         dto.day_week = l;
     }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( N, locale, dto ) {
         N = parseInt(N, 10);
         if ( N < 1 || N > 7 ) return false;
         if ( 7 === N ) N = 0;
         if ( dto[HAS]('day_week') && N !== dto.day_week ) return false;
         dto.day_week = N;
     }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: null
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( w, locale, dto ) {
         w = parseInt(w, 10);
         if ( w < 0 || w > 6 ) return false;
         if ( dto[HAS]('day_week') && w !== dto.day_week ) return false;
         dto.day_week = w;
     }
    // Day of year; 0..365(6)
    ,z: function( z, locale, dto ) {
         z = parseInt(z, 10);
         if ( z < 0 || z > 366 ) return false;
         if ( dto[HAS]('day_year') && z !== dto.day_year ) return false;
         dto.day_year = z;
     }

    // Week --
    // ISO-8601 week number
    ,W: function( W, locale, dto ) {
         W = parseInt(W, 10);
         if ( W < 1 || W > 53 ) return false;
         if ( dto[HAS]('week_year') && W !== dto.week_year ) return false;
         dto.week_year = W;
     }

    // Month --
    // Full month name; January...December
    ,F: function( F, locale, dto ) {
         F = locale.month.indexOf( F );
         if ( F < 0 ) return false;
         if ( dto[HAS]('month') && F+1 !== dto.month ) return false;
         dto.month = F+1;
     }
    // Month w/leading 0; 01...12
    ,m: function( m, locale, dto ) {
         m = parseInt('0' === m.charAt(0) ? m.slice(1) : m, 10);
         if ( m < 1 || m > 12 ) return false;
         if ( dto[HAS]('month') && m !== dto.month ) return false;
         dto.month = m;
     }
    // Shorthand month name; Jan...Dec
    ,M: function( M, locale, dto ) {
         M = locale.month_short.indexOf( M );
         if ( M < 0 ) return false;
         if ( dto[HAS]('month') && M+1 !== dto.month ) return false;
         dto.month = M+1;
     }
    // Month; 1...12
    ,n: function( n, locale, dto ) {
         n = parseInt(n, 10);
         if ( n < 1 || n > 12 ) return false;
         if ( dto[HAS]('month') && n !== dto.month ) return false;
         dto.month = n;
     }
    // Days in month; 28...31
    ,t: function( t, locale, dto ) {
         t = parseInt(t, 10);
         if ( t < 28 || t > 31 ) return false;
         if ( dto[HAS]('days_month') && t !== dto.days_month ) return false;
         dto.days_month = t;
     }
    
    // Year --
    // Is leap year?; 0 or 1
    ,L: function( L, locale, dto ) {
         if ( '0' === L ) dto.leap = 0;
         else if ( '1' === L ) dto.leap = 1;
         else return false;
     }
    // ISO-8601 year
    ,o: null
    // Full year; e.g. 1980...2010
    ,Y: function( Y, locale, dto ) {
         Y = parseInt(Y, 10);
         if ( Y < 1000 || Y > 3000 ) return false;
         if ( dto[HAS]('year') && Y !== dto.year ) return false;
         dto.year = Y;
     }
    // Last two digits of year; 00...99
    ,y: function( y, locale, dto ) {
         if ( 2 === y.length )
         {
            // http://php.net/manual/en/function.strtotime.php
            if ( '00' <= y && '69' >= y ) y = '20' + y;
            else if ( '70' <= y && '99' >= y ) y = '19' + y;
         }
         y = parseInt(y , 10);
         if ( y < 1000 || y > 3000 ) return false;
         if ( dto[HAS]('year') && y !== dto.year ) return false;
         dto.year = y;
     }

    // Time --
    // am or pm
    ,a: function( a, locale, dto ) {
        if ( locale.meridian.am === a ) a = 'am';
        else if ( locale.meridian.pm === a ) a = 'pm';
        else return false;
        if ( dto[HAS]('meridian') && a !== dto.meridian ) return false;
        dto.meridian = a;
     }
    // AM or PM
    ,A: function( A, locale, dto ) {
        if ( locale.meridian.AM === A ) A = 'am';
        else if ( locale.meridian.PM === A ) A = 'pm';
        else return false;
        if ( dto[HAS]('meridian') && A !== dto.meridian ) return false;
        dto.meridian = A;
     }
    // Swatch Internet time; 000..999
    ,B: null
    // 12-Hours; 1..12
    ,g: function( g, locale, dto ) {
        g = parseInt(g, 10);
        if ( g < 1 || g > 12 ) return false;
        if ( dto[HAS]('hour_12') && g !== dto.hour_12 ) return false;
        dto.hour_12 = g;
     }
    // 24-Hours; 0..23
    ,G: function( G, locale, dto ) {
        G = parseInt(G, 10);
        if ( G < 0 || G > 23 ) return false;
        if ( dto[HAS]('hour') && G !== dto.hour ) return false;
        dto.hour = G;
     }
    // 12-Hours w/leading 0; 01..12
    ,h: function( h, locale, dto ) {
        h = parseInt('0' === h.charAt(0) ? h.slice(1) : h, 10);
        if ( h < 1 || h > 12 ) return false;
        if ( dto[HAS]('hour_12') && h !== dto.hour_12 ) return false;
        dto.hour_12 = h;
     }
    // 24-Hours w/leading 0; 00..23
    ,H: function( H, locale, dto ) {
        H = parseInt('0' === H.charAt(0) ? H.slice(1) : H, 10);
        if ( H < 0 || H > 23 ) return false;
        if ( dto[HAS]('hour') && H !== dto.hour ) return false;
        dto.hour = H;
     }
    // Minutes w/leading 0; 00..59
    ,i: function( i, locale, dto ) {
        i = parseInt('0' === i.charAt(0) ? i.slice(1) : i, 10);
        if ( i < 0 || i > 59 ) return false;
        if ( dto[HAS]('minute') && i !== dto.minute ) return false;
        dto.minute = i;
     }
    // Seconds w/leading 0; 00..59
    ,s: function( s, locale, dto ) {
        s = parseInt('0' === s.charAt(0) ? s.slice(1) : s, 10);
        if ( s < 0 || s > 59 ) return false;
        if ( dto[HAS]('second') && s !== dto.second ) return false;
        dto.second = s;
     }
    // Microseconds; 000000-999000
    ,u: function( u, locale, dto ) {
        var p = 0;
        while (u.length > 1 && '0'===u.charAt(p)) p++;
        u = parseInt(u.slice(p), 10);
        u = ~~(u/1000);
        if ( u < 0 || u > 999 ) return false;
        if ( dto[HAS]('ms') && u !== dto.ms ) return false;
        dto.ms = u;
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
    ,U: function( U, locale, dto ) {
        U = parseInt(U, 10);
        if ( U < 0 ) return false;
        U *= 1000;
        if ( dto[HAS]('time') && U !== dto.time ) return false;
        dto.time = U;
     }
    // ISO-8601 date. Y-m-d\\TH:i:sP
    ,c: null // added below
    // RFC 2822 D, d M Y H:i:s O
    ,r: null // added below
    },
    
    date_formatters = { 
    // 24-Hours; 0..23
    G: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('G') ) 
        {
            dto.G = jsdate.getHours( );
        }
        return dto.G;
    }
    // Day of month; 1..31
    ,j: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('j') ) 
        {
            dto.j = jsdate.getDate( );
            dto.jmod10 = dto.j%10;
        }
        return dto.j;
    }
    // Month; 1...12
    ,n: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('n') ) 
        {
            dto.n = jsdate.getMonth( )+1;
        }
        return dto.n;
    }
    // Full year; e.g. 1980...2010
    ,Y: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('Y') ) 
        {
            dto.Y = jsdate.getFullYear( );
        }
        return dto.Y;
    }
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('w') ) 
        {
            dto.w = jsdate.getDay( );
        }
        return dto.w;
    }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('N') ) 
        {
            dto.N = date_formatters.w(jsdate, locale, dto)||7;
        }
        return dto.N;
    }
    // Day of month w/leading 0; 01..31
    ,d: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('d') ) 
        {
            dto.d = pad(date_formatters.j(jsdate, locale, dto), 2, '0');
        }
        return dto.d;
    }
    // Shorthand day name; Mon...Sun
    ,D: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('D') ) 
        {
            dto.D = locale.day_short[ date_formatters.w(jsdate, locale, dto) ];
        }
        return dto.D;
    }
    // Full day name; Monday...Sunday
    ,l: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('l') ) 
        {
            dto.l = locale.day[ date_formatters.w(jsdate, locale, dto) ];
        }
        return dto.l;
    }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('S') ) 
        {
            var j = date_formatters.j(jsdate, locale, dto), jmod10 = dto.jmod10;
            dto.S = locale.ordinal.ord[ j ] ? locale.ordinal.ord[ j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
        }
        return dto.S;
    }
    // Day of year; 0..365
    ,z: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('z') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.n(jsdate, locale, dto)
            ,j = date_formatters.j(jsdate, locale, dto);
            dto.z = round((new Date(Y, m-1, j) - new Date(Y, 0, 1)) / 864e5);
        }
        return dto.z;
    }
    // ISO-8601 week number
    ,W: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('W') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.n(jsdate, locale, dto)
            ,N = date_formatters.N(jsdate, locale, dto)
            ,j = date_formatters.j(jsdate, locale, dto);
            dto.W = pad(1 + round((new Date(Y, m-1, j - N + 3) - new Date(Y, 0, 4)) / 864e5 / 7), 2, '0');
        }
        return dto.W;
    }
    // Full month name; January...December
    ,F: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('F') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto);
            dto.F = locale.month[ m-1 ];
        }
        return dto.F;
    }
    // Month w/leading 0; 01...12
    ,m: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('m') ) 
        {
            var n = date_formatters.n(jsdate, locale, dto);
            dto.m = pad(n, 2, '0');
        }
        return dto.m;
    }
    // Shorthand month name; Jan...Dec
    ,M: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('M') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto);
            dto.M = locale.month_short[ m-1 ];
        }
        return dto.M;
    }
    // Days in month; 28...31
    ,t: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('t') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto), Y = date_formatters.Y(jsdate, locale, dto);
            dto.t = (new Date(Y, m, 0)).getDate( );
        }
        return dto.t;
    }
    // Is leap year?; 0 or 1
    ,L: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('L') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.L = (Y % 4 === 0) & (Y % 100 !== 0) | (Y % 400 === 0);
        }
        return dto.L;
    }
    // ISO-8601 year
    ,o: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('o') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto), m = date_formatters.n(jsdate, locale, dto),
                W = date_formatters.W(jsdate, locale, dto);
            dto.o = Y + (12 === m && W < 9 ? 1 : (1 === m && W > 9 ? -1 : 0));
        }
        return dto.o;
    }
    // Last two digits of year; 00...99
    ,y: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('y') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.y = Y.toString( ).slice(-2);
        }
        return dto.y;
    }
    // am or pm
    ,a: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('a') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.a = G > 11 ? locale.meridian.pm : locale.meridian.am;
        }
        return dto.a;
    }
    // AM or PM
    ,A: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('A') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.A = G > 11 ? locale.meridian.PM : locale.meridian.AM;
        }
        return dto.A;
    }
    // Swatch Internet time; 000..999
    ,B: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('B') ) 
        {
            dto.B = pad(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
        }
        return dto.B;
    }
    // 12-Hours; 1..12
    ,g: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('g') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.g = (G % 12) || 12;
        }
        return dto.g;
    }
    // 12-Hours w/leading 0; 01..12
    ,h: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('h') ) 
        {
            var g = date_formatters.g(jsdate, locale, dto);
            dto.h = pad(g, 2, '0');
        }
        return dto.h;
    }
    // 24-Hours w/leading 0; 00..23
    ,H: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('H') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.H = pad(G, 2, '0');
        }
        return dto.H;
    }
    // Minutes w/leading 0; 00..59
    ,i: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('i') ) 
        {
            dto.i = pad(jsdate.getMinutes( ), 2, '0');
        }
        return dto.i;
    }
    // Seconds w/leading 0; 00..59
    ,s: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('s') ) 
        {
            dto.s = pad(jsdate.getSeconds( ), 2, '0');
        }
        return dto.s;
    }
    // Microseconds; 000000-999000
    ,u: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('u') ) 
        {
            dto.u = pad(jsdate.getMilliseconds( ) * 1000, 6, '0');
        }
        return dto.u;
    }
    // Timezone identifier; e.g. Atlantic/Azores, ...
    // The following works, but requires inclusion of the very large
    // timezone_abbreviations_list() function.
    /*              return that.date_default_timezone_get();
    */
    ,e: function( jsdate, locale, dto ) {
        return '';
    }
    // DST observed?; 0 or 1
    ,I: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('I') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.I = ((new Date(Y, 0) - Date.UTC(Y, 0)) !== (new Date(Y, 6) - Date.UTC(Y, 6))) ? 1 : 0;
        }
        return dto.I;
    }
    // Difference to GMT in hour format; e.g. +0200
    ,O: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('O') ) 
        {
            var tzo = jsdate.getTimezoneOffset( ), atzo = abs(tzo);
            dto.O = (tzo > 0 ? "-" : "+") + pad(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
        }
        return dto.O;
    }
    // Difference to GMT w/colon; e.g. +02:00
    ,P: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('P') ) 
        {
            var O = date_formatters.O(jsdate, locale, dto);
            dto.P = O.substr(0, 3) + ":" + O.substr(3, 2);
        }
        return dto.P;
    }
    // Timezone abbreviation; e.g. EST, MDT, ...
    ,T: function( jsdate, locale, dto ) {
        return 'UTC';
    }
    // Timezone offset in seconds (-43200...50400)
    ,Z: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('Z') ) 
        {
            dto.Z = -jsdate.getTimezoneOffset( ) * 60;
        }
        return dto.Z;
    }
    // Seconds since UNIX epoch
    ,U: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('U') ) 
        {
            dto.U = jsdate / 1000 | 0;
        }
        return dto.U;
    }
    // ISO-8601 date. 'Y-m-d\\TH:i:sP'
    ,c: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('c') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.m(jsdate, locale, dto)
            ,d = date_formatters.d(jsdate, locale, dto)
            ,T = date_formatters.T(jsdate, locale, dto)
            ,H = date_formatters.H(jsdate, locale, dto)
            ,u = date_formatters.i(jsdate, locale, dto)
            ,s = date_formatters.s(jsdate, locale, dto)
            ,P = date_formatters.P(jsdate, locale, dto);
            dto.c = [ Y,'-',m,'-',d,'\\',T,H,':',i,':',s,P ].join('');
        }
        return dto.c;
    }
    // RFC 2822 'D, d M Y H:i:s O'
    ,r: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('r') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,M = date_formatters.M(jsdate, locale, dto)
            ,D = date_formatters.D(jsdate, locale, dto)
            ,d = date_formatters.d(jsdate, locale, dto)
            ,H = date_formatters.H(jsdate, locale, dto)
            ,u = date_formatters.i(jsdate, locale, dto)
            ,s = date_formatters.s(jsdate, locale, dto)
            ,O = date_formatters.O(jsdate, locale, dto);
            dto.r = [ D,', ',d,' ',M,' ',Y,' ',H,':',i,':',s,' ',O ].join('');
        }
        return dto.r;
    }
    },
    
    c_format_re = new RegExp('%('+[
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
    
    php_format_re = /([a-zA-Z%\n\t])/g,
    
    // http://pubs.opengroup.org/onlinepubs/007908799/xsh/strftime.html
    // http://php.net/manual/en/function.date.php
    c_to_php_map = {
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

    php_to_c_map = {
     '%' : '%%'
    ,'D' : '%a'
    ,'l' : '%A'
    ,'M' : '%h'
    ,'F' : '%B'
    ,'c' : '%c'
    ,'d' : '%d'
    ,'j' : '%e'
    ,'H' : '%H'
    ,'h' : '%I'
    ,'z' : '%j'
    ,'m' : '%m'
    ,'i' : '%M'
    ,"\n" : '%n'
    ,'a' : '%p'
    ,'r' : '%r'
    ,'s' : '%S'
    ,"\t" : '%t'
    ,'N' : '%u'
    ,'w' : '%w'
    ,'W' : '%W'
    ,'y' : '%y'
    ,'Y' : '%Y'
    ,'T' : '%Z'
    }
;

date_parsers.c = [
     date_parsers.Y
    ,date_parsers.m
    ,date_parsers.d
    ,null
    ,date_parsers.H
    ,date_parsers.i
    ,date_parsers.s
    ,null
];
date_parsers.r = [
     date_parsers.D
    ,date_parsers.d
    ,date_parsers.M
    ,date_parsers.Y
    ,date_parsers.H
    ,date_parsers.i
    ,date_parsers.s
    ,null
];

function esc_re( s )
{ 
    return s.replace(ESCAPED_RE, "\\$&"); 
}

function by_length_desc( a, b )
{
    return b.length - a.length;
}

function get_alternate_pattern( alts )
{
    return alts.sort( by_length_desc ).map( esc_re ).join( '|' );
}

function pad( s, len, ch )
{
    var sp = s.toString( ), n = len-sp.length;
    return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
}

function get_date_pattern( format, locale )
{
    locale = locale || date_locale_default;
    var re = '', f, i, l, group = 0, dto={};
    for (i=0,l=format.length; i<l; i++)
    {
        f = format.charAt( i );
        re += date_patterns[HAS](f) ? date_patterns[f]( locale, dto ) : esc_re( f );
    }
    return new RegExp('^'+re+'$','');
}

function get_date_parser( format, locale )
{
    locale = locale || date_locale_default;
    var date_pattern = get_date_pattern( format, locale ), 
        f, i, l, j, group = 0, capture = {};
    for (i=0,l=format.length; i<l; i++)
    {
        f = format.charAt( i );
        if ( date_parsers[HAS](f) )
        {
            if ( date_parsers[f] )
            {
                if ( date_parsers[f].push )
                {
                    for (j=0; j<date_parsers[f].length; j++)
                    {
                        if ( null === date_parsers[f][j] )
                        {
                            // just skip a group
                            ++group;
                        }
                        else
                        {
                            capture[++group] = date_parsers[f][j];
                        }
                    }
                }
                else
                {
                    capture[++group] = date_parsers[f];
                }
            }
            else
            {
                // just skip a group
                ++group;
            }
        }
    }
    return function( date_string ) {
        var i, r, m = date_string.match( date_pattern ), dto;
        if ( !m ) return false;
        dto = {};
        for (i=1; i<m.length; i++)
        {
            if ( capture[HAS](i) )
            {
                r = capture[i]( m[i], locale, dto );
                if ( false === r ) return false;
            }
        }
        return check_and_create_date( dto );
    };
}

function get_formatted_date( d, format, locale )
{
    var formatted_datetime, f, i, l, jsdate, dto;
    
    if ( d.substr ) return d; // already string format, return it
    
    // undefined
    if ( null == d ) jsdate = new Date( );
    // JS Date
    else if ( d instanceof Date ) jsdate = new Date( d );
    // UNIX timestamp (auto-convert to int)
    else if ( "number" === typeof d ) jsdate =  new Date(d * 1000);
    
    locale = locale || date_locale_default;
    formatted_datetime = '';
    dto = {};
    for (i=0,l=format.length; i<l; i++)
    {
        f = format.charAt( i );
        formatted_datetime += date_formatters[HAS](f) ? date_formatters[f]( jsdate, locale, dto ) : f;
    }
    return formatted_datetime;
}

function check_and_create_date( dto, defaults )
{
    var year, month, day, 
        hour, minute, second, ms,
        leap=0, days_in_month=[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        date=null, time=null, now=new Date( );
    
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
    days_in_month[1]+=leap;
    if ( 1 > month || month > 12 ) return false;
    if ( 1 > day || day > days_in_month[month-1] ) return false;
    
    date = new Date(year, month-1, day, hour, minute, second, ms);
    
    if ( dto[HAS]('day_week') && dto.day_week !== date.getDay() ) return false;
    if ( dto[HAS]('day_year') && dto.day_year !== round((new Date(year, month-1, day) - new Date(year, 0, 1)) / 864e5) ) return false;
    if ( dto[HAS]('days_month') && dto.days_month !== days_in_month[month-1] ) return false;
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
}

function cformat_to_phpformat( format )
{
    return format.replace(c_format_re, function(m, g1){
        return c_to_php_map[HAS](g1) ? c_to_php_map[g1] : m;
    });
}

function phpformat_to_cformat( format )
{
    return format.replace(php_format_re, function(m, g1){
        return php_to_c_map[HAS](g1) ? php_to_c_map[g1] : m;
    });
}

/*function date_diff( d2, d1 )
{
    var t1 = d1.getTime(), 
        t2 = d2.getTime(),
        d, r, m, Y1, Y2, n = Dur.length, i, tmp,
        leapdays = 0,
        diff = {
            sign: 1,
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        };
    
    if ( t1 > t2 )
    {
        diff.sign = -1;
        tmp = d1; d1 = d2; d2 = tmp; 
        tmp = t1; t1 = t2; t2 = tmp; 
    }
    
    d = t2-t1; Y2 = d2.getFullYear(); Y1 = d1.getFullYear();
    leapdays =
              floor(Y2/4) - floor(Y1/4)            // how many Caesarian leap years
            - (floor(Y2/100) - floor(Y1/100))      // Centuries
            + floor(Y2/400) - floor(Y1/400)
    ;
    for (i=n-1; i>=0; i--)
    {
        m = Dur[i][1];
        r = floor(d/m);
        if ( i+3 === n /*days* / ) r += leapdays;
        d -= r*m;
        diff[Dur[i][0]] = r;
    }
    return diff;
}*/

function date_diff_exact( d2, d1 )
{
    var tmp,
        diff = {
            sign: 1,
            years: 0,
            months: 0,
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        };
    
    if ( d1.getTime() > d2.getTime() )
    {
        diff.sign = -1;
        tmp = d1; d1 = d2; d2 = tmp; 
    }
    
    diff.years = d2.getFullYear()-d1.getFullYear();
    diff.months = d2.getMonth()-d1.getMonth();
    diff.days = d2.getDate()-d1.getDate();
    diff.hours = d2.getHours()-d1.getHours();
    diff.minutes = d2.getMinutes()-d1.getMinutes();
    diff.seconds = d2.getSeconds()-d1.getSeconds();
    diff.milliseconds = d2.getMilliseconds()-d1.getMilliseconds();
    return diff;
}
/*function date_udiff_approx( d2, d1, n )
{
    var d = d2.getTime() - d1.getTime(), 
        unit = 'seconds', sign = 1, u, r, l;
    n = n || 1;
    if ( d < 0 ) { sign = -1; }
    d = ceil(abs(d)/d_smi);
    u = [[d, unit]]; l = 1;
    if ( d >= d_ms )
    {
        r = round(d/d_ms); unit = 'minutes';
        if ( n > 1 && d-d_ms*r >= 1 )
        {
            u[l-1][0] = round(d-d_ms*r);
            u.push([r, unit]);
            l++;
        }
        else
        {
            u[l-1] = [r, unit];
        }
        d = r;
    }
    if ( d >= d_Hm )
    {
        r = round(d/d_Hm); unit = 'hours';
        if ( n > 1 && d-d_Hm*r >= 1 )
        {
            u[l-1][0] = round(d-d_Hm*r);
            u.push([r, unit]);
            l++;
        }
        else
        {
            u[l-1] = [r, unit];
        }
        d = r;
    }
    if ( d >= d_DH )
    {
        r = round(d/d_DH); unit = 'days';
        if ( n > 1 && d-d_DH*r >= 1 )
        {
            u[l-1][0] = round(d-d_DH*r);
            u.push([r, unit]);
            l++;
        }
        else
        {
            u[l-1] = [r, unit];
        }
        d = r;
    }
    if ( d >= d_MD1 )
    {
        r = round(d/d_MD1); unit = 'months';
        if ( n > 1 && d-d_MD1*r >= 1 )
        {
            u[l-1][0] = round(d-d_MD1*r);
            u.push([r, unit]);
            l++;
        }
        else
        {
            u[l-1] = [r, unit];
        }
        d = r;
    }
    if ( d >= d_YM )
    {
        r = round(d/d_YM); unit = 'years';
        if ( n > 1 && d-d_YM*r >= 1 )
        {
            u[l-1][0] = round(d-d_YM*r);
            u.push([r, unit]);
            l++;
        }
        else
        {
            u[l-1] = [r, unit];
        }
        d = r;
    }
    u = u.reverse( );
    if ( l > n ) u = u.slice(0, n);
    return {rel: u, sign: sign};
}*/
function date_diff_approx( d2, d1, n )
{
    var tmp, sign = 1, u = [], unit, d, r;
    n = n || 1;
    if ( d2.getTime() < d1.getTime() )
    {
        sign = -1;
        tmp = d1; d1 = d2; d2 = tmp;
    }
    
    r = 0;
    d = d2.getFullYear()-d1.getFullYear();
    if ( d > 0 ) u.push([d, 'years']);
    
    d = d2.getMonth()-d1.getMonth();
    if ( d > 0 ) u.push([d, 'months']);
    else if ( d < 0 ) r = d*d_MD1;
    
    d = d2.getDate()-d1.getDate() + r;
    if ( d > 0 ) { u.push([round(d), 'days']); r = 0; }
    else if ( d < 0 ) r = d*d_DH;
    
    d = d2.getHours()-d1.getHours() + r;
    if ( d > 0 ) { u.push([round(d), 'hours']); r = 0; }
    else if ( d < 0 ) r = d*d_Hm;
    
    d = d2.getMinutes()-d1.getMinutes() + r;
    if ( d > 0 ) { u.push([round(d), 'minutes']); r = 0; }
    else if ( d < 0 ) r = d*d_ms;
    
    d = d2.getSeconds()-d1.getSeconds() + r;
    if ( d > 0 ) { u.push([round(d), 'seconds']); r = 0; }
    
    if ( !u.length ) u.push[[0, 'seconds']];
    if ( u.length > n ) u = u.slice(0, n);
    return {rel: u, sign: sign};
}

/*function date_add( d, diff, overwrite )
{
    var d2 = true === overwrite ? d : new DateX(d),
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        ndays, i, md2 = 28, t = 0, r, leap,
        //t0 = Date.UTC(1970, 0, 1, 0, 0, 0, 0),
        t0 = d.getTimezoneOffset( ),
        sgn = diff[HAS]('sign')&&(diff.sign < 0) ? -1 : 1, 
        Y = d.getFullYear(),
        M = d.getMonth(),
        D = d.getDate(),
        H = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        mi = d.getMilliseconds()
    ;
    
    if ( diff[HAS]('milliseconds') )
    {
        mi += sgn * diff.milliseconds;
        if ( mi < 0 )
        {
            r = ceil((-mi)/d_smi);
            s -= r;
            mi += r*d_smi;
        }
        if ( mi >= d_smi )
        {
            r = ceil(mi/d_smi);
            s += r;
            mi -= r*d_smi;
        }
        //t += mi;
    }
    
    if ( diff[HAS]('seconds') )
    {
        s += sgn * diff.seconds;
        if ( s < 0 )
        {
            r = ceil((-s)/d_ms);
            m -= r;
            s += r*d_ms;
        }
        if ( s >= d_ms )
        {
            r = floor(s/d_ms);
            m += r;
            s -= r*d_ms;
        }
        //t += s*d_smi;
    }
    
    if ( diff[HAS]('minutes') )
    {
        m += sgn * diff.minutes;
        if ( m < 0 )
        {
            r = ceil((-m)/d_Hm);
            H -= r;
            m += r*d_Hm;
        }
        if ( m >= d_Hm )
        {
            r = floor(m/d_Hm);
            H += r;
            m -= r*d_Hm;
        }
        //t += m*d_mmi;
    }
    
    if ( diff[HAS]('hours') )
    {
        H += sgn * diff.hours;
        if ( H < 0 )
        {
            r = ceil((-H)/d_DH);
            D -= r;
            H += r*d_DH;
        }
        if ( H >= d_DH )
        {
            r = floor(H/d_DH);
            D += r;
            H -= r*d_DH;
        }
        //t += H*d_Hmi;
    }
    
    if ( diff[HAS]('years') )
    {
        Y += sgn * diff.years;
    }
    if ( diff[HAS]('months') )
    {
        M += sgn * diff.months;
        if ( M < 0 )
        {
            r = ceil((-M)/d_YM);
            Y -= r;
            M += r*d_YM;
        }
        if ( M >= d_YM )
        {
            r = floor(M/d_YM);
            Y += r;
            M -= r*d_YM;
        }
    }
    
    if ( Y <= 0 ) Y = 1;
    leap = (Y%4 === 0) & (Y%100 !== 0) | (Y%400 === 0);
    days_in_month[1] = md2+leap;
    
    if ( diff[HAS]('days') )
    {
        D += sgn * diff.days;
    }
    while ( D <= 0 || D > days_in_month[M] )
    {
        if ( D <= 0 ) D += days_in_month[--M];
        else D -= days_in_month[M++];
    }
    
    /*ndays = 0;
    for (i=0; i<M; i++) ndays += days_in_month[i];
    ndays += D+(Y-1)*d_YM*d_MD;
    d2.setTime(t+round(ndays*d_Dmi)-t0);* /
    d2.setTime(Date.UTC(Y, M, D, H, m, s, mi)+t0*d_mmi);
    //console.log([Y, M+1, D, H, m, s]);
    return d2;
}*/
function date_add_exact( d, diff, overwrite )
{
    var d2 = true === overwrite ? d : new DateX(d),
        days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
        ndays, i, md2 = 28, r, leap,
        t0 = d.getTimezoneOffset( ),
        sgn = diff[HAS]('sign')&&(diff.sign < 0) ? -1 : 1, 
        Y = d.getFullYear(),
        M = d.getMonth(),
        D = d.getDate(),
        H = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        mi = d.getMilliseconds()
    ;
    
    if ( diff[HAS]('years') )
    {
        Y += sgn * diff.years;
    }
    if ( diff[HAS]('months') )
    {
        M += sgn * diff.months;
        if ( M < 0 )
        {
            r = ceil((-M)/d_YM);
            Y -= r;
            M += r*d_YM;
        }
        if ( M >= d_YM )
        {
            r = floor(M/d_YM);
            Y += r;
            M -= r*d_YM;
        }
    }
    
    if ( Y <= 0 ) Y = 1;
    leap = (Y%4 === 0) & (Y%100 !== 0) | (Y%400 === 0);
    days_in_month[1] = md2+leap;
    
    // adjust day to be same on the new month, eg the last day, the first day and so on..
    // this is what exact means in this context
    if ( D > days_in_month[M] ) D = days_in_month[M];
    
    // now add any new diff days
    if ( diff[HAS]('days') )
    {
        D += sgn * diff.days;
    }
    
    if ( diff[HAS]('milliseconds') )
    {
        mi += sgn * diff.milliseconds;
        if ( mi < 0 )
        {
            r = ceil((-mi)/d_smi);
            s -= r;
            mi += r*d_smi;
        }
        if ( mi >= d_smi )
        {
            r = ceil(mi/d_smi);
            s += r;
            mi -= r*d_smi;
        }
    }
    
    if ( diff[HAS]('seconds') )
    {
        s += sgn * diff.seconds;
        if ( s < 0 )
        {
            r = ceil((-s)/d_ms);
            m -= r;
            s += r*d_ms;
        }
        if ( s >= d_ms )
        {
            r = floor(s/d_ms);
            m += r;
            s -= r*d_ms;
        }
    }
    
    if ( diff[HAS]('minutes') )
    {
        m += sgn * diff.minutes;
        if ( m < 0 )
        {
            r = ceil((-m)/d_Hm);
            H -= r;
            m += r*d_Hm;
        }
        if ( m >= d_Hm )
        {
            r = floor(m/d_Hm);
            H += r;
            m -= r*d_Hm;
        }
    }
    
    if ( diff[HAS]('hours') )
    {
        H += sgn * diff.hours;
        if ( H < 0 )
        {
            r = ceil((-H)/d_DH);
            D -= r;
            H += r*d_DH;
        }
        if ( H >= d_DH )
        {
            r = floor(H/d_DH);
            D += r;
            H -= r*d_DH;
        }
    }
    
    while ( D <= 0 || D > days_in_month[M] )
    {
        if ( D <= 0 ) D += days_in_month[--M];
        else D -= days_in_month[M++];
    }
    
    d2.setDateObject(new Date(Y, M, D, H, m, s, mi));
    return d2;
}

// http://www.htmlgoodies.com/html5/javascript/calculating-the-difference-between-two-dates-in-javascript.html 
function date_udiff( d2, d1, unit )
{
    if ( !unit ) unit = 'days';
    unit = unit.toLowerCase( );
    var diff = d2.getTime() - d1.getTime(), r = abs(diff)/Dunit[unit];
    return diff < 0 ? -r : r;
}
function date_uadd( d, udiff, unit, overwrite )
{
    if ( !unit ) unit = 'days';
    unit = unit.toLowerCase( );
    var d2 = true === overwrite ? d : new DateX(d), t = d.getTime( ) + udiff*Dunit[unit];
    d2.setTime(t < 0 ? 0 : t);
    return d2;
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
// wrapper around Date built-in object
function DateX( year, month, day, hour, minutes, seconds, milliseconds )
{
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
    self.$locale = DateX.defaultLocale;
    self.$format = DateX.defaultFormat;
}

DateX.VERSION = "0.2.0";

// DateX global defaults for localisation and formatting
DateX.defaultLocale = date_locale_default;
DateX.defaultFormat = "Y-m-d H:i:s";
DateX.defaultDateFormat = "Y-m-d";
DateX.defaultTimeFormat = "H:i:s";
DateX.setDefaultLocale = function( locale ) {
    if ( locale )
    {
        DateX.defaultLocale = locale;
        DateX.defaultParser = DateX.getParser( DateX.defaultFormat, DateX.defaultLocale );
    }
};
DateX.setDefaultFormat = function( fullfmt, datefmt, timefmt ) {
    if ( fullfmt )
    {
        DateX.defaultFormat = fullfmt;
        DateX.defaultParser = DateX.getParser( DateX.defaultFormat, DateX.defaultLocale );
    }
    if ( datefmt )
    {
        DateX.defaultDateFormat = datefmt;
    }
    if ( timefmt )
    {
        DateX.defaultTimeFormat = timefmt;
    }
};
// general and flexible formatted string date parsing methods
DateX.getParser = function( format, locale, strformat ) { 
    if ( format && true === strformat ) format = cformat_to_phpformat(format);
    return get_date_parser( format || DateX.defaultFormat, locale || DateX.defaultLocale );
};

DateX.defaultParser = DateX.getParser( DateX.defaultFormat, DateX.defaultLocale );

DateX.parse = DateX.fromString = function( date_string, format, locale, strformat ) { 
    var date_parse, date;
    if ( (format && (DateX.defaultFormat !== format)) || (locale && (DateX.defaultLocale !== locale)) )
        date_parse = DateX.getParser( format, locale, strformat );
    else
        date_parse = DateX.defaultParser;
    date = date_parse( date_string );
    return false !== date ? new DateX( date ) : false;
};

// Returns the numeric value corresponding to the current time - the number of milliseconds elapsed since 1 January 1970 00:00:00 UTC
DateX.now = Date.now || function( ) { 
    return new Date( ).getTime( ); 
};

// Accepts the same parameters as the longest form of the constructor (i.e. 2 to 7) and returns the number of milliseconds since 1 January, 1970, 00:00:00 UTC
DateX.UTC = Date.UTC;

// various date diffing methods
//DateX.diff = date_diff;
DateX.udiff = date_udiff;
DateX.xdiff = DateX.diffExact = date_diff_exact;
DateX.adiff = DateX.diffApproximate = function( d2, d1, n, locale ) {
    var diff = date_diff_approx(d2, d1, n), l = diff.rel.length, 
        i, LU = (locale||DateX.defaultLocale).units, S = 'singular', P = 'plural';
    for (i=0; i<l; i++) diff.rel[i][1] = LU[1===diff.rel[i][0]?S:P][diff.rel[i][1]];
    return diff;
};

// various date patching/adding date diffs methods
//DateX.add = date_add;
DateX.uadd = date_uadd;
DateX.xadd = DateX.addExact = date_add_exact;


DateX.prototype = {
     constructor: DateX
    
    ,$date: null
    ,$locale: null
    ,$format: null
    
    ,dispose: function( ) {
        var self = this;
        self.$date = null;
        self.$locale = null;
        self.$format = null;
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
    ,getFormat: function( ) {
        return this.$format;
    }
    ,setFormat: function( format ) {
        var self = this;
        self.$format = format;
        return self;
    }
    
    ,format: function( format, locale ) {
        return get_formatted_date( this.$date, format || this.$format, locale || this.$locale ); 
    }
    ,strformat: function( format, locale ) {
        return get_formatted_date( this.$date, cformat_to_phpformat( format || this.$format ), locale || this.$locale ); 
    }
    
    /*,diff: function( d ) {
        return DateX.diff(this, d);
    }*/
    ,udiff: function( d, unit ) {
        return DateX.udiff(this, d, unit);
    }
    ,xdiff: function( d ) {
        return DateX.xdiff(this, d);
    }
    ,adiff: function( d, n, locale ) {
        var diff = DateX.adiff(this, d, n, locale||this.$locale), 
            l = diff.rel.length, i, fmt;
        if ( l > 1 )
        {
            fmt = diff.rel[0][0] + ' ' + diff.rel[0][1];
            for (i=1; i<l-1; i++) fmt += ', ' + diff.rel[i][0] + ' ' + diff.rel[i][1];
            fmt += ' and ' + diff.rel[l-1][0] + ' ' + diff.rel[l-1][1];
        }
        else
        {
            fmt = diff.rel[0][0] + ' ' + diff.rel[0][1];
        }
        fmt += diff.sign < 0 ? ' ago' : ' later';
        return fmt;
    }
    /*,add: function( diff ) {
        return DateX.add(this, diff, true);
    }*/
    ,uadd: function( udiff, unit ) {
        return DateX.uadd(this, udiff, unit, true);
    }
    ,xadd: function( diff ) {
        return DateX.xadd(this, diff, true);
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
        if ( arguments.length ) return this.format( format||DateX.defaultDateFormat, locale||this.$locale );
        return this.$date.toDateString( );
    }
    ,toTimeString: function( format, locale ) {
        if ( arguments.length ) return this.format( format||DateX.defaultTimeFormat, locale||this.$locale );
        return this.$date.toTimeString( );
    }
    ,toLocaleDateString: function( format ) {
        if ( arguments.length ) return this.format( format||DateX.defaultDateFormat, this.$locale  );
        return this.$date.toLocaleDateString( );
    }
    ,toLocaleTimeString: function( format ) {
        if ( arguments.length ) return this.format( format||DateX.defaultTimeFormat, this.$locale );
        return this.$date.toLocaleTimeString( );
    }
    ,toLocaleString: function( format ) {
        if ( arguments.length ) return this.format( format||this.$format, this.$locale );
        return this.$date.toLocaleString( );
    }
    ,toUTCString: function( ) {
        return this.$date.toUTCString( );
    }
    ,toString: function( format, locale ) {
        if ( arguments.length ) return this.format( format||this.$format, locale||this.$locale );
        return this.$date.toString( );
    }
};

// export it
return DateX;
});