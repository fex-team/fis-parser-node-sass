/**
 * 接管sass的@import内嵌, 主要用来解决 编译缓存依赖问题。
 */
var map = (function() {
    return {
        reg: /\/\*embed:(.*?)\*\//ig,

        wrap: function( value ) {
            return '/*embed:' + value + '*/';
        }
    };
})();

var sass = require('fis-sass');
var stack = {};
var required;

function fixLineBreak( content ) {
    return content.replace(/\r\n|\r|\n/g, '\n');
}

function isEmpty(obj) {
    if (obj) {
        for (var key in obj) {
            return false;
        }
    }
    return true;
}

// 匹配scss内嵌代码：@import 'xxx';
// @import 'xxx', 'xxx';
function _process( content ) {
    var reg = /((?:\/\/.*?\n)|(?:\/\*[\s\S]*?\*\/))|(?:@import\s([\s\S]*?)(?:\n|$)(?!\s+[^{@]*\n))/ig;
    // var reg = /@import[\s\S]*?;/ig;
    var rUrl = /^url/i;
    var rEnd = /;$/;

    content = fixLineBreak( content );

    return content.replace( reg, function( all, comments, value ) {
        var files;

        value = value ? value.trim().replace( rEnd, '' ) : '';

        // If it's comments or If the @import has any media queries.
        if ( comments || /('|").*?\1\s+[^'"]+$/.exec(value) ) {
            return all;
        }

        files = value.split(/\s*,?\s+/m).map(function( value ) {
            var quote = '',
                match;

            value = value.trim();
            match = /^('|")(.*)\1$/.exec( value );

            if ( match ) {
                value = match[ 2 ];
                quote = match[ 1 ];
            }

            // If the file’s extension is .css.
            if ( /\.css$/i.exec( value ) ||

                // If the filename begins with http://.
                /^http/i.exec( value ) ||

                // If the filename is a url().
                /^url/i.exec( value ) ) {
                return '@import ' + quote + value + quote + ';';
            }

            return map.wrap( value );
        });

        return files.join('\n');
    });
}

// 查找文件。
function lookup( name, ext, paths ) {
    var files = [],
        filename = name,
        basename = filename,
        dirname = '',
        mapping,
        i, j, len, len2, path, info;

    files.push( filename );

    if ( /^(.*(?:\/|\\))([^\/\\]*?)$/.exec( filename ) ) {
        dirname = RegExp.$1;
        basename = RegExp.$2;
    }

    // 自动加后缀。
    if ( !/\.(scss|sass)$/.exec( basename ) ) {
        filename = dirname + basename + ext;
        files.push( filename );

        if ( !/^_/.exec( basename ) ) {
            filename = dirname + '_' + basename + ext;
            files.push( filename );
        }

        mapping = {
            '.sass': '.scss',
            '.scss': '.sass'
        };

        if ( mapping[ ext ] ) {
            filename = dirname + basename + mapping[ ext ];
            files.push( filename );

            if ( !/^_/.exec( basename ) ) {
                filename = dirname + '_' + basename + mapping[ ext ];
                files.push( filename );
            }
        }
    }

    len = files.length;
    len2 = paths.length;

    for ( i = 0; i < len; i++ ) {
        name = files[ i ];

        for ( j = 0; j < len2; j++ ) {
            info = fis.uri( name, paths[ j ] );

            if( info.file && info.file.isFile() ) {
                return info.file;
            }
        }
    }

    // console.log( paths, files );
}

function isSassSyntax( content, file ) {
    return file.ext === '.sass'/* && !~content.indexOf('{')*/;
}

function unique( arr ) {
    return arr.filter(function( item, index, arr ) {
        return arr.indexOf( item ) === index;
    });
}

var compile = module.exports = function( content, file, opts ) {

    if ( isSassSyntax( content, file ) ) {
        content = sass.sass2scss( content );
    }

    required = {};
    opts.data = before( content, file, unique( opts.includePaths ) );
    try {
        content = sass.renderSync( opts );
    } catch (ex) {
        fis.log.error(ex);
    }
    content = after( content, file, opts.includePaths );

    return content;
};

var before = compile.before = function( content, currentFile, paths) {

    // @todo use cache of this progress.
    var ext = currentFile.ext;

    paths = unique( paths );

    return _process( content ).replace( map.reg, function( all, value ) {

        var file = lookup( value, ext, paths ),
            content;

        if ( file ) {

            // 已经在堆里面了
            if ( stack[ file.realpath ] ) {
                fis.log.error( 'can\'t embed file ' + file.basename + '.' );
            }

            // 如果已经引入过了，就不再引入。
            // 类似与include_once.
            if ( required[ file.realpath ] ) {
                return '';
            }

            // 有可能当前文件并没有经过 fis 的compile，以至于没有 cahce 对象。
            if (currentFile.cache) {
                currentFile.cache.addDeps(file.realpath);
            }

            stack[ file.realpath ] = true;
            required[ file.realpath ] = true;

            content = file.getContent();
            if ( isSassSyntax( content, file ) ) {
                content = sass.sass2scss( content );
            }

            content = before( content, file, [ file.dirname ].concat( paths ) );
            content = fixPath(content, file);

            delete stack[ file.realpath ];

            return content;

        } else {
            fis.log.error( value + ' not found!' );
            return '';
        }
    });
};

var after = compile.after = function( content, file, paths ) {
    return content;
};

var fixPath = compile.fixPath = function(content, file) {
    // 处理，解决资源引用路径问题。
    content = fis.compile.extCss(content);

    return content.replace(fis.compile.lang.reg, function(all, type, value) {

        var info = fis.uri(value, file.dirname);

        if (info.file) {
            value = info.quote + info.file.subpath + info.query + info.quote;
        }

        if (type === 'embed' || type === 'jsEmbed') {
            value = fis.compile.lang[type].ld + value + fis.compile.lang[type].rd;
        }

        return value;
    });
}
