# marble

Marble is a xml/html template engine based on "mayo".  Marble uses an indentation aware syntax similar to that
of jade and haml, and employs coffee-script as the scripting language.  As coffee-script itself is indentation aware, you can
use Marble to write dense and clean template code.  And in reality you may use marble to generate any type of text output with ease.

## Installation

    npm install marble

## Tutorial

The javascript code to run marble:

    // sychronous run
    marble.runSync("p #{content}", {content: 'paragraph'});

    // asynchronous run
    marble.run("...template content...", {content: 'pa'}, function(err, content) {
    });

    // asychronous run from url
    marble.runUrl("../path/file", {content: 'pa'}, function(err, content) {
    });

To run in nodejs, simply require("marble").  To run in browser, ensure all proper sources are included:

    <script src=".../underscore.js" type="text/javascript"></script>
    <script src=".../under_score.js" type="text/javascript"></script>
    <script src=".../mayo.js" type="text/javascript"></script>
    <script src=".../marble.js" type="text/javascript"></script>
    // global object "marble" is now set

Lets start with a simple template example:

    html
      head
        script
      body

    ===== renders to

    <html>
      <head>
        <script></script>
      </head>
      <body></body>
    </html>

A line that contains plain text is by default rendered into html tag.  Increasing indentation creates descendants,
decreasing indentation automatically closes tags.

Attributes are enclosed in () immediately following the tag.  The syntax for specifying attributes is exactly same
as in xml/html, except that attributes must all be on the same line.  In addition, if value does not contain any
whitespace then you may omit quotes around value, they are auto enclosed in double quote by marble.

    script(src="../test.js")
    ===== renders to
    <script src="../test.js"></script>

    script(src=../test.js)
    ===== renders to
    <script src="../test.js"></script>


For writing html, "id" and "class" attribute can be specified via # and . shortcut.

    div#id.light.hide
    ==== renders to ====
    <div id="id" class="light hide"></div>

In addition, div can be omitted, it's assumed to be the default tag when # or . is encountered.

    #id.light.hide
    ===== renders to
    <div id="id" class="light hide"></div>

The tag's text content follows the whitespaces (if any) after the attribute:

    div.light look at me
    ===== renders to
    <div class="light">look at me</div>

If text content is too large to fit on a single line, use the raw text marker "|":

    div.light |
      I am a really long paragraph
      ... blah blah ...
      ... still going...

The raw text that follows | must also obey the indenting rule:

    div.light |
      I am a really long paragraph
    second line

    * "second line" is no longer part of raw text because it's on the same indentation level as "div", marble will
    close the div tag, and begin a <second> tag.

Sometimes you want to place several tags on the same line, use '>' continuation in such case:

    div >a >span text
    ===== renders to
    <div><a><span>text</span><a></div>

Descendants of such line belong to the first tag:

    div >a >span text
      p
    ===== renders to
    <div><a><span>text</span></a>
      <p></p>
    </div>

Comment is supported with // at the beginning of the line.  Block comment is supported via placing // on a line by
itself, which also follows the indentation rule, meaning all descendants of current line are removed from output.

    //div#content
    span
    p
    ===== renders to
    <span></span>
    <p></p>

    //div#content
      p
    ===== renders to
      <p></p>

    //
      span
      p
    a
    ===== renders to
    <a></a>

Sometimes, you may still want to include html or text content inside the template for various reasons.  You can do so
with raw text marker and correct indentation level.  The marker essentially turns off the auto tag converter shown
above for current line's descendants.

    div#content |
      <div id="awesome_looking_widget>
        ... really long and messy html code
      </div>

You can adjust the indentation of the raw text content in the output by specifying a number after it, for example:

    div |+1
      xx
    ===== renders to (add one space to indentation)
       xx

    div |-1
      xx
    ===== renders to (remove one space from indentation)
     xx

    div |0
      xx
       yyy
    ===== renders to (set indentation to zero space)
    xx
    yyy

With '|' you can easily generate any text documents with marble: simply place | after any code fragment or on a line by
itself.

A block of coffee-script code can be embedded in between "--" and "--:

    --
      _  = require("underscore")
      ar = [1,2,3]
    --

As with everything in marble, -- must also follow the indentation rule:

    html
    --x = 1
     body
    ==== renders to (probably not what you wanted) ====
    <html></html>
     <body></body>

    ==== What you probably intended is =====
    html
     --x = 1
     body
    ==== or ====
    --x = 1
    html
     body

There is no limitation to what type of code you can place in marble, everything goes.  When run in node, you
can use "require" just like you could in any node javascript code.

To comment out code, try:

    html
      --# x = 1;
      body
    * this is using coffee-script's commenting.

or

    html
      //
        --x = 1
      body
    * this uses marble's comment, the benefit is that you can comment entire block of code easily

You can embed variables in the output using the #{?} format, ? denotes any one line expression that doesn't
contain }, example:

    --x=1, s='a'
    div #{x>0?'positive':''},#{s}
    ==== renders to ====
    <div>positive,a</div>

Be default, the embedded value is not xml-escaped.  If you want to xml-escape the value, use the marker !:

    --divHtml = "..."
    div #{! divHtml}

Here are some examples on control flow and loop using coffee-script:

    --x = 1;
    --if x>0
      div positive
    ==== renders to ====
      <div>positive</div>

    --ar = [1,2,3]
    --for x in ar
      div #{x}
    ==== renders to ====
      <div>1</div>
      <div>2</div>
      <div>3</div>


Below is an example of achieving template inheritance/aggregation:

    === menu.html ===
    --
      var menu = ['File', 'Edit'];
      var activeMenuClasses = {};
      activeMenuClasses[param.activeMenu] = 'active';
    --
    ul
      --for item,i in menu
        li.#{activeMenuClasses[item]} #{i}. #{item}

    === page.html ====
    html
      head
      body
        --@embed "menu.html", param
        div.content
          --@block "content", =>
            h1 content
          div.footer|
            this is footer

    === file_page.html ===
    --@extend "page.html", {activeMenu: 'File'}, =>
      --@extendBlock "content", =>
        p file page content

    === file_page.html output ===
    <html>
      <head></head>
      <body>
        <ul>
          <li class="active">1. File</li>
          <li class="">2.Edit</li>
		</ul>
        <div class="content">
            <h1>content</h1>
            <p>file page content</p>
		</div>
        <div class="footer">
          this is footer
		</div>
      </body>
	</html>

First note the '@' character, in coffee-script, this is short-cut for "this.".

Lets describe what's happening in above example:

* "menu.html" renders the menu for all pages derived from "page.html".
* "page.html" renders the boiler plate html code that includes the menu, content div wrapper, and the footer div.
* "page.html" defines a block named "content" that's to be overridden in derived pages.
* "file_page.html" extends from "page.html" and overrides block "content" via "extendBlock" call: to perserve "content"
   block content defined in "page.html".
* Shared information can be passed in between templates via optional param object of "embed" and "extend" call.
* parameter "activeMenu" is set in "file_page.html", passed to "page.html" and then to "menu.html" to indicate that
  "File" menu should be active in "file_page.html".

This example pretty much sums up how inheritance/aggregation works in marble.  You can have block defined inside
embedded template, embed nested inside block, block nested inside of another block, or have embedded template inherit
from another template.  But "extend" can not be nested inside of block, and each template can only extend from exactly
one base template.

Javascript is asynchronous by nature, with marble it's easy to call an asynchronous function.  For example, lets say we
have an asynchronous api mysql.exec(sql, function(err, rows) {} ), and want to call it inside marble, just do:

    --@async mysql, mysql.exec, "select * form users where created > '20120101'", (err, rows)=>
      --if err
        tr
          td error occurred
      --else
        --for row,i in rows
          tr
            td #{row.name}
            td #{row.created}

Async call can be nested inside of another async call for as many level as you want, but this is not recommended because
nested async code is messy and it's a bad idea to embed application logic inside template.

Now lets look at "filter".  "filter" allows user to install a render hook for the enclosed descendants.  Say we have
a section of html code that we want to display as text in the page:

    pre
      --@filter xcape, =>
        div.sample

    === renders to ===
    <pre>
        &lt;div class=&quot;sample&quot;&#x2F;&gt;
    </pre>

If you want to install a custom line parse hook to marble, you may do so via "installLineParser".  Say for example you
want "doctype" to specify html document type:

    marble.installLineParser(function(line) {
        if (line == 'doctype') return {
            start: function {
                return "<!DOCTYPE html>";
            }
        };
    });

"installLineParser" takes a function as parameter, the function must return an object with two member functions: start
and terminate(optional).  "start" should return the output to render when line is encountered, "terminate" should return
the output to render when the indented section that this line started is terminated.  For example, say we want
to support xml commenting style of <!-- --> in marble, we install following hook:

    marble.installLineParser(function(line) {
        if (line == '!--') return {
            start: function() {
                return "<!--";
            },
            terminate : function() {
                return "-->";
            }
        };
    });

    === example content ===
    div
     !--
       p commented paragraph
    === renders to ===
    <div>
      <!--
        <p>commented paragraph</p>
      -->
    </div>

##Browser

marble.html(content, param) is a useful helper method for generating verbose html using marble syntax, it uses
javascript instead of coffee-script for embed language for browser compatibility.

Example:

    marble.html("div >a >span text #{x>0?'positive':''}", {x:1});
    // returns <div><a><span>text positive</span></a></div>

