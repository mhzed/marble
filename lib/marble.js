// Marble, a haml like async template engine in coffee-script
// (c) Zed Zhou,  https://github/mhzed/marble
// Marble is freely distributable under the MIT license.

(function () {

function makeMarble(_, mayo) {

// private constructor
function Marble(absUrl) {
    this.parent.constructor.call(this, absUrl);
    this.isCoffee = true;   // by default uses coffee-script
};
_(Marble).inherites(mayo);

Marble.config = {
    commentMarker           : "//",         // marks section (including descendants) as comment
    rawBlockTrailMarker     : "|"           // when at end of line, mark descendants are raw text
};

// change configuration, construct relevant regex based on config
Marble.resetConfig = function (config) {
    _(Marble.config).extend(config);
    var toks = mayo.config.exprClosure.split('?');
    var b = _.escapeRegExp(toks[0]), e = _.escapeRegExp(toks[1]);
    var strTagRegex = _("^([\\.#]?)(\\w*%s[^%s]*%s\\w*|\\w+)(.*)$").format(b,e,e);  // word or .word or .#{x}
    Marble.config.tagRegex = new RegExp(strTagRegex);

    Marble.config.trailMarkerRegExp = new RegExp(_("^(.*)%s([\\d-+]*)\\s*$").format(_.escapeRegExp(Marble.config.rawBlockTrailMarker)));
}
Marble.resetConfig({}); // prepare regex

// You can install a custom parser for scanned line if you wish
// cb(line), if line matches the pattern you want to handle, then return object:
// {
//      start : function() { return line; },    // return the line to render when this element begins
//      terminate : function {}                 // return the line to render when this element is closed
// }
// see test case for examples.
Marble.installLineParser = function(cb) {
	// insert  before the last hook (the html tag parser)
    var ilast = Marble.lineParsers.length-1;
    Marble.lineParsers[Marble.lineParsers.length] = Marble.lineParsers[ilast];
    Marble.lineParsers[ilast] = cb;

};

Marble.parseComment = function(line) {
    var self = this;
    if (line.indexOf(Marble.config.commentMarker)==0) {
        if (_(line.slice(Marble.config.commentMarker.length)).trim() == "")
            return { start   : function() { return ""; },
                     comment : true };    // mark descendants as comment
        else
            return { start:function() { return ""; }};
    }
}
// enclose in " for unquoted values
function parseAttr(str) {
    var attrStr="", remainder = str.slice(1), key, val, equal, chQuote, m, iEndQuote;
    while (true) {
        m = /^\s*(\w+)\s*(=?)\s*(.*)$/.exec(remainder);
        if (m) {
            key = m[1]; attrStr+=key;
            equal = m[2];
            remainder = m[3];
            if (!equal) { attrStr+=' ' ; continue; }

            attrStr += "=";
            chQuote = remainder[0];
            if (chQuote == "'" || chQuote == '"') {
                iEndQuote = remainder.indexOf(chQuote, 1);
                if (iEndQuote==-1) break;   // no end quote
                attrStr += remainder.slice(0, iEndQuote+1);
                attrStr += " ";
                remainder = remainder.slice(iEndQuote+1);
            } else {
                m = /^([^\)\s]*)(.*)$/.exec(remainder);
                val = m[1];
                attrStr += '"';
                attrStr += val.replace(/"/g, '&quot;'); // just escape double quot inside of double quot
                attrStr += '" ';
                remainder = m[2];
            }
        } else break;
    }
    if (/^\s*\)/.test(remainder)) {
        return [attrStr.replace(/\s+$/, ''),    // remove trailing whitespace
                remainder.replace(/^\s*\)/, '') // remove training )
                ];
    } else {    // no end ) found, all parse error falls to here, treat as no attributes
        return ['', str];
    }

}

// try to xml style tag...
Marble.parseTag = function( line) {
    var self = this;    // _elemFactory binds this to the instance when calling this method
	if (!Marble.config.tagRegex.test(line)) return;
    var elem = {};
    elem.start = function() {
        var m,
            ret = "",
            tag, id, classes, attrStr, text
        ;
        this.tags = [];
        tag = 'div';    // default tag name
        while (true) {
            id = undefined;
            classes = [];
            attrStr = "";
            text = "";
            while (m=Marble.config.tagRegex.exec(line)) {
                if (m[1]) { // . or # found
                    if (m[1] == '.')
                        classes.push(m[2]);
                    else    // #
                        id = m[2];
                } else {
                    tag = m[2];
                }
                line = m[3];
            }
            if (line[0] == '(') {    // additional attributes found
                var parseRet = parseAttr(line);
                attrStr = parseRet[0];
                line = parseRet[1];
            }
            text = _.trim(line);   // tag text content
            this.tags.push(tag);
            // construct output
            ret += "<"; ret += tag;
            if (id) { ret += " id=\""; ret += id; ret += "\"";}
            if (classes.length) { ret += " class=\""; ret += _(classes).join(" "); ret += "\"";}
            if (attrStr) { ret += " "; ret += attrStr; }
            ret += ">";

            if (text.length && text[0] == '>') {  // more tags to follow, continue parsing
                line = text.slice(1);
            } else break;
        }
        if (text) ret += text;
        // close all trailing tags, except for first one
        _(this.tags.slice(1).reverse()).each(function(tag) { ret += "</"+tag+">";});
        return ret;
    };
    elem.terminate = function() {
        // when terminating empty tag, place it on same line
        var tag = this.tags[0];
        var m = /^[\s\S]*?([^\n]*)$/.exec(_(self.lines).last());
        if (m && m[1]) {
            if (m[1].indexOf(this.indent+"<"+tag)==0) {
                // don't use /> to terminate, html doesn't like it
//                if (/[^\/]>$/.test(m[1]) && this.tag!='script' && this.tag!='div')
//                    self.lines[self.lines.length-1] = self.lines[self.lines.length-1].replace(/>$/, "/>");
                self.lines[self.lines.length-1] += ("</" + tag + ">");
                return undefined;
            }
        }
        return "</" + tag + ">";
    };
    return elem;
}

// support code lock begin/temerminated by '--' only
Marble.parseBlockCode = function(line) {
    var self = this;
    line = _.trim(line);
    if (line === mayo.config.lineMarker || line.indexOf(mayo.config.lineMarker + Marble.config.rawBlockTrailMarker) == 0) {
        self.__codeBlockFlipper = !self.__codeBlockFlipper;
        var elem = {
            start : function() {
                return line;
            },
            // no terminate needed
            inRawText : self.__codeBlockFlipper
        }
        return elem;
    }
}
Marble.lineParsers = [
    Marble.parseComment,
    Marble.parseBlockCode,
    Marble.parseTag       // the html tag parser, always last
];

Marble.prototype._elemFactory = function(line, inRawTextBlock) {
    var self = this;
    var elem, i, hook;
    if (line.length==0)     // possible if | is on a line by itself
        return {};          // not rendered, but remembered in stack
    // skip parseTag when in raw text block
    var n = Marble.lineParsers.length - (inRawTextBlock?1:0);

    for (var i = 0; i< n; i++) {
        var hook = Marble.lineParsers[i];
        if (elem=hook.call(self, line)) {
            return elem;
        }
    };

	return {
		start : function() {    // no handler found, render line as is
			return line;
		}
	};
}

// install the mayo parser hook
Marble.prototype._parseHook = function(strContent) {
    var self = this;
    var stack = self.stack = [];
    var lines = strContent.split(/\r?\n/);
    self.lines = [];    // stores converted lines

    // pre-scan directives:
    // if @mayo is found, then treats file as mayo instead of marble, simply return strContent
    for (var i in lines) {
        l = _(lines[i]).trim();
		if (l.indexOf(mayo.config.lineMarker) == 0) {
			if (/@\s*\(\s*mayo\s*\)/.test(l)) {
                self.isCoffee = false;  // let mayo decide if isCoffee via directive
                return strContent;
            }
		} else break;
    };

    // tab is treated as one space
    function makeIndent(indent) {
        return indent.replace(/\t/g, ' ');
    }
    function lastIndent(stack) {
        var last = _(stack).last();
        return last ? last.indent : "";
    }
    function isLastComment(stack) {
        var last = _(stack).last();
        return last && last.comment;
    }
    function closeStack(stack, indentLength) {
        for (var i = stack.length-1; i>=0; i--) {
            if (stack[i].indent.length >= indentLength)
                closeElem(stack[i]);
            else break;
        }
        stack.splice(i+1,stack.length-i-1); // remove closed stacks
    }
    function closeElem(elem) {
        if (elem.terminate) {
            var endStr = elem.terminate();
            if (endStr)
                self.lines.push(elem.indent + endStr);
        }
    }

    var indentRegexp = /^(\s*)(.*)$/;
    _(lines).each(function(line, i) {
        var m = indentRegexp.exec(line);
        var indent = makeIndent(m[1]);
        var content = _(m[2]).trim();
        if (content.length==0) {
        } else {
            var prevIndent = lastIndent(stack);
            if (prevIndent.length >= indent.length)        // close out stacks
                closeStack(stack, indent.length);
            if (isLastComment(stack)) { // block indent
                self.lines.push("");    // preserve line position
            } else {
                function checkRawTextMarker(content) {
                    m = Marble.config.trailMarkerRegExp.exec(content);
                    if (m) {
                        content = m[1];
                        var nIndent = m[2];
                        var indentHandler;
                        if (nIndent.length>0) {
                            indentHandler = function(indent) {
                                switch (nIndent[0]) {
                                    case '+':
                                        indent += _(' ').multiply(parseInt(nIndent.slice(1)));
                                        break;
                                    case '-':
                                        indent = indent.slice(0, indent.length-parseInt(nIndent.slice(1)));
                                        break;
                                    default:
                                        indent = _(' ').multiply(parseInt(nIndent));
                                        break;
                                }
                                return indent;
                            }
                        }
                        return [content, indentHandler];
                    }
                }
                var rawCheck = checkRawTextMarker(content), indentHandler;
                if (rawCheck) {
                    content = rawCheck[0];
                    indentHandler = rawCheck[1];
                }

                var elem = self._elemFactory(content, stack.length>0&&_(stack).last().inRawText);
                elem.indent = (function(stack, indent) {    // calculate indent by considering indent-adjuster
                    var last = _(stack).last();
                    if (last && last.indentHandlers) {
                        _(last.indentHandlers).each(function(handler) {
                            indent = handler(indent);
                        });
                    }
                    return indent;
                })(stack, indent);

                function pushElem(stack, elem) {    // handle the raw text & indent adjuster attributes
                    var last = _(stack).last();
                    if (last && last.inRawText) elem.inRawText = true;     // propagate inRawText attribute
                    else if (!('inRawText' in elem)) elem.inRawText = (rawCheck!==undefined);
                    if (indentHandler)
                        elem.indentHandlers = [indentHandler];
                    if (last && last.indentHandlers) {
                        if (elem.indentHandlers)
                            _(elem.indentHandlers).append(last.indentHandlers);
                        else
                            elem.indentHandlers = last.indentHandlers;
                    }
                    stack.push(elem);
                }
                pushElem(stack, elem);

                var startStr;
                if (elem.start && (startStr=(elem.start()))) {
                    self.lines.push(elem.indent + startStr);
                }

            }
        }
    });

    closeStack(stack, 0);
    var retContent = self.lines.join("\n");
    return retContent;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// overrides to hook into mayo
// used by embed/extend call to load other templates, override to use Marble.load
Marble.prototype._loadOther = function(relpath, cb) {
    if (_.isAbsPath(relpath))
        Marble.load(relpath, cb);
    else
        Marble.load(_.pathjoin(_.dirname(this.url), relpath), cb);
}

// the public api, override to create a marble template
Marble.run = function(strContent, params, cb) {
    var m = new Marble();
    try {
        m._asFunc(m._parse(strContent));
        return m.runtime(params).render(params, cb);
    } catch (e) {
        cb(e);
        return;
    }
}

// in runSync, coffee-script is not used, javascript instead
Marble.runSync = function(strContent, params) {
    var m = new Marble();
    m._asFunc(m._parse(strContent, true));
    return m.runtime().renderSync(params);
}

// html is for quick render of html on client side, it uses javascript instead,
Marble.html = function(strContent, params) {
    var m = new Marble();
    m.isCoffee = false;     // in sync version, no coffee-script support
    m._asFunc(m._parse(strContent, true));
    return m.runtime().renderSync(params);
}

// public api override
Marble.runUrl = function(url, params, cb) {
    Marble.load(url, function(err, mayo) {
        if (!err)
            mayo.runtime(params).render(params, cb);
        else
            cb(err, null);
    })
}

// essentially just calls mayo.load by providing a factory cb that creates a marble template object
Marble.load = function(url, cb)  {
    return mayo.load(url, cb, function(absUrl) {
        return new Marble(absUrl);
    });
}

Marble.__permanent = true;
return Marble;
};  // end makeMarble

var root = this;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = makeMarble(require("under_score"), require("mayo"));
}
else if (typeof define === 'function' && define.amd) {
    // in browser via require.js (AMD)
    define(['under_score', 'mayo'], function(_, mayo) {
        return makeMarble(_, mayo);
    });
}
else {
    root.marble = makeMarble(root._, root.mayo);
}

}).call(this);
