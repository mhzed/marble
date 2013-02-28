var url = require("url"),
    path = require("path"),  
    fs = require("fs"),
    marble = require('../lib/marble'),
    assert = require('assert'),
    _ = require("under_score");



module.exports["closetag"] = function(test) {
    marble.run("div", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div></div>", "correct tag");
        test.done();
    })
};
module.exports["attr"] = function(test) {
    marble.run("div(name='x' s='y')", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div name='x' s='y'></div>", "correct attributes");
    })
    marble.run("div(name=x s=y)", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div name="x" s="y"></div>', "correct attributes");
    })
    marble.run("div(name=x\"x s=y')", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div name="x&quot;x" s="y\'"></div>', "correct attributes");
    })
    marble.run("div(s)", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div s></div>', "correct attributes");
    })
    marble.run("a(href=.././path)", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<a href=".././path"></a>', "correct attributes");
    })
    marble.run("div(name=x'x s)", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div name="x\'x" s></div>', "correct attributes");
    })
    marble.run("div(name=x'x s t='x')", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div name="x\'x" s t=\'x\'></div>', "correct attributes");
    })
    marble.run("div(name=x=1 s=<y>)", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), '<div name="x=1" s="<y>"></div>', "correct attributes");
        test.done();
    })
};
module.exports["attr class"] = function(test) {
    marble.run("div.class", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div class=\"class\"></div>", "class attribute");
    })
    marble.run("div.c1.c2", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div class=\"c1 c2\"></div>", "Multiple class attribute");
    })
    marble.run(".c1.c2", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div class=\"c1 c2\"></div>", "Multiple implicit class attribute");
        test.done();
    })
};
module.exports["attr id"] = function(test) {
    marble.run("div#id", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div id=\"id\"></div>", "id attribute");
    })
    marble.run("#id", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div id=\"id\"></div>", "id attribute");
    })
    marble.run("#id.c1.c2", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div id=\"id\" class=\"c1 c2\"></div>", "id mixed with class");
        test.done();
    })
};

module.exports["many tags on one line "] = function(test) {
    marble.run("div#id >a.l >span#c token", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div id=\"id\"><a class=\"l\"><span id=\"c\">token</span></a></div>", "id attribute");
        test.done();
    })
    test.equal(marble.html("#id >a >span token"), "<div id=\"id\"><a><span>token</span></a></div>\n", "one line html");
};

module.exports["embed in tag attr id"] = function(test) {
    marble.run("--x='x';\n#{x}", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<x></x>", "embed tag");
    })
    marble.run("--x='x';\n#{x}y", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<xy></xy>", "embed tag");
    })
    marble.run("--x='x';\ny#{x}y", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<yxy></yxy>", "embed tag");
    })
    marble.run("--x='x';\ny#{x}", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<yx></yx>", "embed tag");
    })
    marble.run("--x='x';\ny#{x}.#{x}", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<yx class=\"x\"></yx>", "embed tag attr");
    })
    marble.run("--x='x';\ny#{x}.a#{x}a", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<yx class=\"axa\"></yx>", "embed tag attr");
    })
    marble.run("--x='x';\ny#{x}#a#{x}a", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<yx id=\"axa\"></yx>", "embed tag id");
		test.done();
    })
};
module.exports["code in text"] = function(test) {
    marble.run("|\n  --x='x';do=>\n    #{x}", {}, function(err, content) {
        test.ifError(err);
        test.equal(content, "    x\n", "code in text");
		test.done();
    })

};

module.exports["comment "] = function(test) {
    marble.run("//div#id", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "", "commented same line");
    })
    marble.run("//div#id\n  x", {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<x></x>", "comment line");
    })
    marble.run(
        "//\n" +
        "  div#idx\n" +
        "#id",
        {}, function(err, content) {
        test.ifError(err);
        test.equal(_.trim(content), "<div id=\"id\"></div>", "commented descendant");
        test.done();
    })
};
module.exports["raw text"] = function(test) {
    marble.run(
        "|\n" +
        "  xyz\n" +
        "div"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  xyz\n<div></div>\n", "block raw text");
            test.done();
        });
};
module.exports["xcape"] = function(test) {
    marble.run(
        "|\n" +
        "  #{xcape('<')}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  &lt;\n", "test xcape");
            test.done();
        });
};
module.exports["if/elseif/else"] = function(test) {
    marble.run(
        "--if true\n" +
        "  div"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  <div></div>\n", "single if ");
        });
    marble.run(
        "--if false\n" +
        "  div #{1} misc\n" +
        "--else|\n"+
        "  div#{2*2}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  div4\n", "if else");
        });
    marble.run(
        "--if false\n" +
        "  div #{1} misc\n" +
        "--else if true\n" +
        "  p\n" +
        "--else|\n"+
        "  div#{2*2}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  <p></p>\n", "if else if else");
            test.done();
        });
};
module.exports["siwtch/case/default"] = function(test) {
    marble.run(
        "--x = 1;\n" +
        "--switch x\n" +
        "  --when 1|\n" +
        "    is one\n"+
        "  --else|\n" +
        "    is default"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "    is one\n", "switch cased");
        });
    marble.run(
        "--x = 2;\n" +
        "--switch x\n" +
        "  --when 1|\n" +
        "    is one\n" +
        "  --else|\n" +
        "    is default"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "    is default\n", "switch default");
        });
    marble.run(
        "--x = 2;\n" +
        "--switch x\n" +
        "  --when 1|\n" +
        "    is one\n"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "", "switch none");
            test.done();
        });
};
module.exports["for"] = function(test) {
    marble.run(
        "--ar = [4,5,6]\n" +
        "--for x,i in ar|\n" +
        "  #{ar[i]}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  4\n  5\n  6\n", "for");
            test.done();
        });
};

module.exports["each"] = function(test) {
    marble.run(
        "--ar = [4,5,6]\n" +
        "--for x,i in ar|\n" +
        "  #{x}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  4\n  5\n  6\n", "each");
            test.done();
        });
};
module.exports["filter"] = function(test) {
    marble.run(
        "--@filter ((s)->s.replace(/\\d+/g, '(digits)')), => |\n" +
        "  #{1}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  (digits)\n", "filter");
            test.done();
        });
};
module.exports["async"] = function(test) {
    marble.run(
        "--asyncFunc = (x,cb)->setTimeout( (->cb(null, x)), 1)\n" +
        "--@async null, asyncFunc, 10,(err, x)=>|\n" +
        "  #{x}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  10\n", "async global func");
        });
    marble.run(
        "--o = {asyncFunc: (x,cb)->setTimeout( (->cb(null, x)), 1)}\n" +
        "--this.async o, o.asyncFunc, 10,(err, x)=>|\n" +
        "  #{x}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "  10\n", "async member func");
        });
    marble.run(
        "--asyncFunc = (x,cb)->setTimeout( (->cb(null, x)), 1)\n" +
        "--this.async asyncFunc, 10,(err, x)=>\n" +
        "  |\n" +
        "    #{x}\n" +
        "  --@async null, asyncFunc, 22,(err, x)=>|\n" +
        "    #{x}"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(/^[\s\S]*    10[\s\S]*$/.test(content), true, "first async contains 10");
            test.equal(/^[\s\S]*    22[\s\S]*$/.test(content), true, "nested async contains 22");
            test.done();
        });
};

module.exports["render file"] = function(test) {
    marble.runUrl(
        "./data/menu.html"
        , {activeMenu:'Tool'}, function(err, content) {
            test.ifError(err);
            //console.log(content);
            test.equal(/^[\s\S]*<li class="active">Tool[\s\S]*$/.test(content), true, "contains active Tool");
            test.equal(/^[\s\S]*<!-- test[\s\S]*$/.test(content), true, "contains raw xml tag");
            test.done();
        });
};

module.exports["extend test"] = function(test) {
    marble.runUrl(
        "./data/menu_ex.html"
        , {}, function(err, content) {
            test.ifError(err);
            //console.log(content);
            test.equal(/^[\s\S]*<li class="active">Help[\s\S]*$/.test(content), true, "contains active Help");
            test.equal(/^[\s\S]*<!-- test[\s\S]*$/.test(content), true, "contains raw xml tag");
            test.equal(/^[\s\S]*garbage[\s\S]*$/.test(content), false, "does not contain content outside of block");
            test.done();
        });
};

module.exports["embed test"] = function(test) {
    marble.runUrl(
        "./data/main.html"
        , {}, function(err, content) {
            test.ifError(err);
            // embedded content still exists
            test.equal(/^[\s\S]*<li class="active">Help[\s\S]*$/.test(content), true, "contains active Help");
            test.equal(/^[\s\S]*<!-- test[\s\S]*$/.test(content), true, "contains raw xml tag");
            test.equal(/^[\s\S]*garbage[\s\S]*$/.test(content), false, "does not contain content outside of block");
            test.done();
        });
};


module.exports["extend embed test"] = function(test) {
    marble.runUrl(
        "./data/main_ex.html"
        , {}, function(err, content) {
            test.ifError(err);

            test.equal(/^[\s\S]*<li class="active">Help[\s\S]*$/.test(content), true, "contains active Help");
            test.equal(/^[\s\S]*<!-- test[\s\S]*$/.test(content), true, "contains raw xml tag");
            test.equal(/^[\s\S]*garbage[\s\S]*$/.test(content), false, "does not contain content outside of block");

            test.equal(/^[\s\S]*<x>content[\s\S]*$/.test(content), true, "does contain overriden block");
            test.equal(/^[\s\S]*<c>content[\s\S]*$/.test(content), true, "overriden block contains super");

            test.equal(/^[\s\S]*?\s{2}<ul class="menu">/.test(content), true, "embed correct indent");
            test.equal(/^[\s\S]*?\s{6}<li>File<\/li>/.test(content), true, "embed correct sub indent");

            test.done();
        });
};

module.exports["test custom line parser"] = function(test) {
    marble.installLineParser(function(line) {
        if (line == 'xdiv') return {
            start    : function() { return "**"+line+"**"},
            terminate: function() { return ".."+line+".."}
        };
    })
    marble.run(
        "xdiv\n" +
        "  c"
        , {}, function(err, content) {
            test.ifError(err,err);
            //console.log(content);

            test.equal(content, "**xdiv**\n  <c></c>\n..xdiv..\n", "custom line parser");
            test.done();
        });
};

module.exports["indentAdjust"] = function(test) {
    marble.run(
        "|0\n" +
        "  xyz"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "xyz\n", "set indent 0");
        });
    marble.run(
        "|+1\n" +
        "  xyz"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "   xyz\n", "add indent 1");
        });
    marble.run(
        "|-10\n" +
        "  xyz"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, "xyz\n", "sub indent too much");
        });
    marble.run(
        "|-1\n" +
        "  xyz"
        , {}, function(err, content) {
            test.ifError(err);
            test.equal(content, " xyz\n", "sub indent 1");
            test.done();
        });
};

module.exports["runsync"] = function(test) {
    test.equal(marble.runSync("a >b #{x}" , {x:1}), '<a><b>1</b></a>\n', "run sync test");
    test.equal(marble.runSync("a >b #{x}\n  c" , {x:1}), '<a><b>1</b>\n  <c></c>\n</a>\n', "run sync test");

    test.equal(marble.html("div >a >span text #{x>0?'positive':''}", {x:1}),
        "<div><a><span>text positive</span></a></div>\n", "run html test");
    test.done();
}
