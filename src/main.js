/*
    FDNA
    
    Frequency Domain Nodal Analysis in Javascript. Generate frequency responses to circuits in the browser.
    http://www.stephenierodiaconou.com/fdna
    
    The MIT License

    Copyright (c) 2010 Stephen Ierodiaconou (http://www.stephenierodiaconou.com)

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.
*/

// *****************************************************************************
// http://code.google.com/p/ie-web-worker/
/*
        Create a fake worker thread of IE and other browsers
        Remember: Only pass in primitives, and there is none of the native
                        security happening
*/
if(!Worker)
{
    var Worker = function ( scriptFile )
    {
        var self = this,
            __timer = null,
            __text = null,
            __fileContent = null,
            onmessage;

        self.onerror = null ;
        self.onmessage = null ;

        // child has run itself and called for it's parent to be notified
        var postMessage = function( text )
        {
                if ( "function" == typeof self.onmessage )
                {
                        return self.onmessage( { "data" : text } ) ;
                }
                return false ;
        } ;

        // Method that starts the threading
        self.postMessage = function( text )
        {
                __text = text ;
                __iterate() ;
                return true ;
        } ;

        var __iterate = function()
        {
                // Execute on a timer so we dont block (well as good as we can get in a single thread)
                __timer = setTimeout(__onIterate,1);
                return true ;
        } ;

        var __onIterate = function()
        {
                try
                {
                        if ( "function" == typeof onmessage )
                        {
                                onmessage({ "data" : __text });
                        }
                        return true ;
                }
                catch( ex )
                {
                        if ( "function" == typeof self.onerror )
                        {
                                return self.onerror( ex ) ;
                        }
                }
                return false ;
        } ;


        self.terminate = function ()
        {
                clearTimeout( __timer ) ;
                return true ;
        } ;


        // FIXME: REPLACE WITH PROTOTYPE
        
        /* HTTP Request*/
        /*
        var getHTTPObject = function () 
        {
                var xmlhttp;
                try 
                {
                        xmlhttp = new XMLHttpRequest();
                }
                catch (e) 
                {
                        try 
                        {
                                xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
                        }
                        catch (e) 
                        {
                                xmlhttp = false;
                        }
                }
                return xmlhttp;
        }

        var http = getHTTPObject()
        http.open("GET", scriptFile, false)
        http.send(null);

        if (http.readyState == 4) 
        {
                var strResponse = http.responseText;
                //var strResponse = http.responseXML;
                switch (http.status) 
                {
                        case 404: // Page-not-found error
                                alert('Error: Not Found. The requested function could not be found.');
                                break;
                        case 500: // Display results in a full window for server-side errors
                                alert(strResponse);
                                break;
                        default:
                                __fileContent = strResponse ;
                                // IE functions will become delagates of the instance of Worker
                                eval( __fileContent ) ;
                                
                                //at this point we now have:
                                //a delagate "onmessage(event)"
                                
                                break;
                }
        }
        */
        new Ajax.Request(scriptFile, {
            onSuccess: function(response) {
                __fileContent = response.responseText ;
                // IE functions will become delagates of the instance of Worker
                eval( response.responseText ) ;
            }
        });
        
        self.importScripts = function(src)
        {
                // hack time, this will import the script but not wait for it to load...
                var script = document.createElement("SCRIPT") ;
                script.src = src ;
                script.setAttribute( "type", "text/javascript" ) ;
                document.getElementsByTagName("HEAD")[0].appendChild(script)
                return true ;
        } ;

        return true ;
    } ;
}




// *****************************************************************************


/// FIXME: optims, make a global for document.cEd.cir, i, j 'var' everywhere

function HighlightAndSyntaxCheckSimpleSource(source)
{    
    // FIXME: can we have values use (p,n,u,m,K,M,G,T)
    var components =        /^\s*([LRC])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s*$/i,
        sources =           /^\s*([VI])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        simulationinfo =    /^\s*F\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        probelocations =    /^\s*P\s+([\d]+)\s*$/i,
        endcommand =        /^\s*E\s*$/i, 
        comment =           /^\s*#(.*)$/,
        highlightedSource = 'Zid="sCs" X"big" style="top:-45px">J<p>',
        errors = new Array(),
        lines = source.split("\n"),
        count = lines.length,
        i = 0;

    for (; i < count; i++)
    {
        highlightedSource += 'ZX"ln">'+i+'.J';
        if (lines[i] == "" || lines[i].match(/^\s*$/))
            highlightedSource += 'B';
        else if (lines[i].match(components))
            highlightedSource += 'ZXK'+RegExp.$1+'JZXN'+RegExp.$2+'JZXN'+RegExp.$3+'JZXY'+RegExp.$4+'JB';
        else if (lines[i].match(sources))
            highlightedSource += 'ZXK'+RegExp.$1+'JZXN'+RegExp.$2+'JZXN'+RegExp.$3+'JZXY'+RegExp.$4+'JZXY'+RegExp.$5+'JB';
        else if (lines[i].match(simulationinfo))
            highlightedSource += 'ZXKFJZXY'+RegExp.$1+'JZXY'+RegExp.$2+'JZXY'+RegExp.$3+'JB';
        else if (lines[i].match(probelocations))
            highlightedSource += 'ZXKPJZXN'+RegExp.$1+'JB';
        else if (lines[i].match(endcommand))
            highlightedSource += 'ZXKEJB';
        else if (lines[i].match(comment))
            highlightedSource += 'ZX"cm">&#35; '+RegExp.$1+'JB';
        else
        {
            errors.push({line: i})
            highlightedSource += 'ZX"se">'+lines[i]+'J<br>';
        }
    }
    
    var search = 'XZJKNYB',
        replace = ['class=','<span ','</span>&nbsp;','"ky">', '"nd">', '"vl">', '<br>'];

    for (i=0; i < 7; i++)
        highlightedSource = highlightedSource.replace(RegExp(search.charAt(i),'g'), replace[i]);

    return {errors: errors, source: highlightedSource + '</p>'};
}

// t r b and l , if -2 then no connection there, if -1 connection exists but isnt assigned a node value, if other = node value for connection
/*
var cim = [ new Element('img', { e:'rh', src:'imgs/r1.png', t:-2,r:-1,b:-2,l:-1 }),
        new Element('img', { e:'lh', src:'imgs/l1.png', t:-2,r:-1,b:-2,l:-1 }),
        new Element('img', { e:'ch', src:'imgs/c1.png', t:-2,r:-1,b:-2,l:-1 }),
        new Element('img', { e:'sh', src:'imgs/s1.png', t:-2,r:-1,b:-2,l:-1 }),
        
        new Element('img', { e:'rv', src:'imgs/r1.png', 'class':'rot', t:-1,r:-2,b:-1,l:-2}),
        new Element('img', { e:'lv', src:'imgs/l1.png', 'class':'rot', t:-1,r:-2,b:-1,l:-2}),
        new Element('img', { e:'cv', src:'imgs/c1.png', 'class':'rot', t:-1,r:-2,b:-1,l:-2}),
        new Element('img', { e:'sv', src:'imgs/s1.png', 'class':'rot', t:-1,r:-2,b:-1,l:-2}),
        
        new Element('img', { e:'pt', src:'imgs/p1.png', t:-1,r:-2,b:-2,l:-2 }),
        new Element('img', { e:'gt', src:'imgs/g1.png', t:0,r:-2,b:-2,l:-2 }), // grnd is node 0
        new Element('img', { e:'h', src:'imgs/h1.png', t:-2,r:-1,b:-2,l:-1 }),
        new Element('img', { e:'kbr', src:'imgs/k1.png', t:-2,r:-1,b:-1,l:-2 }),
        new Element('img', { e:'ktl', src:'imgs/k1.png', 'class':'f', t:-1,r:-2,b:-2,l:-1 }),
        new Element('img', { e:'tr', src:'imgs/t1.png', t:-1,r:-1,b:-1,l:-2}),
        new Element('img', { e:'tl', src:'imgs/t1.png', 'class':'f', t:-1,r:-2,b:-1,l:-1}),
        
        new Element('img', { e:'pl', src:'imgs/p1.png', 'class':'rot', t:-2,r:-2,b:-2,l:-1}),
        new Element('img', { e:'gl', src:'imgs/g1.png', 'class':'rot', t:-2,r:-2,b:-2,l:0}),
        new Element('img', { e:'v', src:'imgs/h1.png', 'class':'rot', t:-1,r:-2,b:-1,l:-2}),
        new Element('img', { e:'ktr', src:'imgs/k1.png', 'class':'rot', t:-1,r:-1,b:-2,l:-2}),
        new Element('img', { e:'kbl', src:'imgs/k1.png', 'class':'frot', t:-2,r:-2,b:-1,l:-1}),
        new Element('img', { e:'tt', src:'imgs/t1.png', 'class':'rot', t:-1,r:-1,b:-2,l:-1}),
        new Element('img', { e:'tb', src:'imgs/t1.png', 'class':'frot', t:-2,r:-1,b:-1,l:-1}),
        new Element('img', { e:'x', src:'imgs/x1.png', 'class':'rot', t:-1,r:-1,b:-1,l:-1})
        ];
*/
var imgCode = 'var cim = [ArhBrCDAlhBlCDAchBcCDAshBsCDAhBhCDAplBpC-2,r:-2,b:-2,l:-1F,AglBgC-2,r:-2,b:-2,l:0F,ArvBrCZAlvBlCZAcvBcCZAsvBsC-1,r:-2,b:-1,l:-2F,AptBpC-1,r:-2,b:-2,l:-2}),AgtBgC0,r:-2,b:-2,l:-2}),AvBhCZAkbrBkC-2,r:-1,b:-1,l:-2}),AktlBkC-1,r:-2,b:-2,l:-1GAktrBkC-1,r:-1,b:-2,l:-2F,AkblBkC-2,r:-2,b:-1,l:-1HAtrBtC-1,r:-1,b:-1,l:-2}),AtlBtC-1,r:-2,b:-1,l:-1GAttBtC-1,r:-1,b:-2,l:-1F,AtbBtC-2,r:-1,b:-1,l:-1HAxBxC-1,r:-1,b:-1,l:-1F];',
    imgSearch = 'ABCDZFGH',
    imgReplace = ["new Element('img', { e:'","', src:'imgs/","1.png', t:","-2,r:-1,b:-2,l:-1 }),","-1,r:-2,b:-1,l:-2, 'class':'rot'}),", ", 'class':'rot'})",", 'class':'f'}),", ", 'class':'frot'}),"];
    
    for (i=0; i < imgSearch.length; i++)
        imgCode = imgCode.replace(RegExp(imgSearch.charAt(i),'g'), imgReplace[i]);
        
eval(imgCode);

// FIXME: '' are not needed for prop names
var griddiv = new Element('div', { 
        'class': 'gl',
        'draggable':'true',
        'ondragstart':"drag(this, event)",
        'ondragenter':"return false",
        'ondragover':"return false", 
        'ondrop':"drop(this, event)"
    });

var gridSize = 8;

function drag(target, e) 
{
    e.dataTransfer.setData('text/plain', target.id);
}

fromToolbox = /^tb(\d+)/;

function drop(target, e) 
{
    var id = e.dataTransfer.getData('text/plain');
    //console.log(target.id + " <- " + id)

    //if from tbx create a clone at target and add to components
    // if contains a child then stop operation
    // if an obj already on grid simply move it

    
    if (!target.firstChild)
    {
        if (id.match(fromToolbox))
        {
            //console.log('add')
            var id = parseInt(RegExp.$1),
                child = cim[id].clone(),
                n = child.getAttribute('e'),
                v = 0;
            if (id < 4 || (id > 6 && id < 11) )
                n += '_' + prompt("Value (R=[ohms], L=[henry], C=[farads], I=[mag,phase]=[amps,rad/s])", "").replace(',','_').replace(' ','')
            child.setAttribute('id', n);
            target.appendChild(child);
        }
        else
        {
            //console.log('move')
            target.appendChild($(id).firstChild.remove());
        }
    } else if (target.id == 'del')
    {
        $(id).firstChild.remove();
    }
    
    e.preventDefault();
} 

function drawCircuitEditor()
{
    var i = 0,
        j = 0,
        elements = [];
        
    // create toolbox    
    for (i = 0; i < cim.length; i++)
    {
        var a = griddiv.clone();
        a.setAttribute('id',"tb"+i);
        a.appendChild(cim[i].clone());
        $('tbx').appendChild(a);
    }

    for (; j < gridSize; j++)
    {
        for (i = 0; i < gridSize; i++)
        {
            var a = griddiv.clone();
            a.setAttribute('id',"g"+i+''+j);
            $('diagram').appendChild(a);
        }
        $('diagram').appendChild(new Element('br').addClassName('row'));
    }
}

var offsets = ['t','r','b','l', 'b','l','t','r', 0, 1, 0, -1, -1, 0, 1, 0];

function propagateWireNodes()
{
    var i = 0,
        j = 0,
        propagate = true;//,cnt = 0;
        
    while (propagate)
    {
        //cnt++;
        //console.log('loop ' + cnt)
        //if(cnt > 10)
        //    break;
        propagate = false;
        for (j = 0; j < gridSize; j++)
        {
            for (i = 0; i < gridSize; i++)
            {
                var g = $("g"+i+''+j);
                    c = g.firstChild,
                    curnode = -1;
                
                if(!c || !c.getAttribute('e').match(/^[kvhtx]/)) continue;
                // t r b l
                //console.log('found wire' + c.getAttribute('e'))
            
                var prev = false;
                
                for (var k = 0; k < 4; k++)
                {
                    var n  = c.getAttribute(offsets[k]);
                    if (n == -2)
                        continue;
                    
                    if (n == -1)
                    {
                        //console.log(offsets[k] + ' we are -1 so prop still')
                        curnode = $("g"+(i+offsets[k+8])+''+(j+offsets[k+12])).firstChild.getAttribute(offsets[k+4]);
                        //console.log('neighbour node '+curnode)
                        //if (curnode > -1)
                        //    c.setAttribute(offsets[k], curnode);
                        if (prev)
                            propagate = true;
                            
                        if (curnode > -1)
                        {
                            //console.log('assign all wire pins')
                            for (var m = 0; m < 4; m++)
                            {
                                if (c.getAttribute(offsets[m]) > -2)
                                {
                                    //console.log('assign '+curnode+' to '+offsets[m])
                                    c.setAttribute(offsets[m], curnode);
                                }
                            }
                        }
                    }
                    else 
                        prev = true; // there is at least one pin connected
                    
                }                
            }
        }
    }
 
}

function cTx()
{
    var i = 0,
        j = 0,
        found = 0,
        nodenum = 1;
          
    for (; j < gridSize; j++)
    {
        for (i = 0; i < gridSize; i++)
        {
            var c = $("g"+i+''+j).firstChild;
            if (c && c.id.charAt(0) == 'g')
            {
                if (c.id.charAt(1) == 't')
                    c.setAttribute('t', 0);
                else
                    c.setAttribute('l', 0);
                found = 1;
            }
        }
    }
    if (!found)
    {
        sS("Your circuit does not contain a ground (reference node).");
        return;
    }
    
    propagateWireNodes();
    //return
    // check connections
    for (j = 0; j < gridSize; j++)
    {
        for (i = 0; i < gridSize; i++)
        {
            var g = $("g"+i+''+j);
                c = g.firstChild,
                curnode = -1;

            if(!c || !c.getAttribute('e').match(/^[rlcsp]/)) continue;
            
            for (var k = 0; k < 4; k++)
            {
                if (c && c.getAttribute(offsets[k]) > -2) 
                {
                    try {
                        curnode = $("g"+(i+offsets[k+8])+''+(j+offsets[k+12])).firstChild.getAttribute(offsets[k+4]);
                        if (curnode < 0)
                            curnode = nodenum++;  // assign new node number if there isnt one
                        
                        g.firstChild.setAttribute(offsets[k], curnode);
                        
                        propagateWireNodes();
                    }
                    catch (e)
                    {
                        alert('The component (if there is one) at grid cell ' +i +','+j + ' does not have a '+offsets[k+4]+' connection')
                        return
                    }
                }
            }
        }
    }
        
    // generate source
    var src = "";
    for (j = 0; j < gridSize; j++)
    {
        for (i = 0; i < gridSize; i++)
        {
            var g = $("g"+i+''+j),
                c = g.firstChild,
                value = "";
                
            if (c) { 
                c.id.match(/^[^_]+\_([^_]+)\_?(.)*/);
                value = RegExp.$1,
                value2= RegExp.$2;
            }
            
            if (c && c.id.match(/^([rlc])([vh])/))
            {
                
                var type = RegExp.$1,
                    pins;
                if (RegExp.$2 == 'v')
                    pins = c.getAttribute('t') + ' ' + c.getAttribute('b');
                else
                    pins = c.getAttribute('l') + ' ' + c.getAttribute('r');
            
                src += type.toUpperCase() + ' ' + pins + ' ' + value + "\n";
            
            }
            else if (c && c.id.match(/^s([vh])/))
            {
                if (RegExp.$1 == 'v')
                    pins = c.getAttribute('t') + ' ' + c.getAttribute('b');
                else
                    pins = c.getAttribute('l') + ' ' + c.getAttribute('r');
                
                src += 'I ' + pins + ' ' + value + ' ' + value2 + "\n";
            }
            else if (c && c.id.match(/^p([tl])/))
            {
                if (RegExp.$1 == 't')
                    pins = c.getAttribute('t');
                else
                    pins = c.getAttribute('l');
                
                src += 'P ' + pins + "\n";
            }
        }
    }
    
    
    // Add F and E
    $('cir').value = src + "F " + $('ft').value + " " + $('fs').value + " " + $('fe').value +"\nE";
      
    cS();
}

//http://forums.devarticles.com/javascript-development-22/javascript-to-round-to-2-decimal-places-36190.html
function roundNumber(num, dec) 
{
    var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
    return result;
}

function drawGraphs(data)
{
    // remove previous graphs
    var graphs = $('plots').select('canvas.graph'),
        probes = (typeof data.circuit.probes == 'string') ? (JSON.parse(data.circuit.probes)):(data.circuit.probes),
        stepanalysis = (typeof data.result == 'string') ? (JSON.parse(data.result)) : (data.result),
        i = 0;
            
    for (; i < graphs.length; i++)
        graphs[i].remove();

    for (i = 0; i < probes.length; i++)
    {
        var w = 500,
            h = 300,
            node = probes[i].pin - 1,
            c = new Element('canvas', { 'width':w, 'height':h, 'class': 'graph', id: ('maggraph'+node) }),
            context = c.getContext("2d");

        context.lineWidth = 2;
        context.lineCap = 'round';

        // Mag
        $('plots').appendChild(c);
        context.beginPath();
        context.fillText("Node " + (node+1), 10.5, 10.5);
        context.moveTo(30.5,30.5);
        context.lineTo(30.5,h-20.5);
        context.moveTo(20.5,h-30.5);
        context.lineTo(w-30.5,h-30.5);
        context.strokeStyle = "#000";
        context.stroke();
        
        var points = [],
            datalen = stepanalysis.length,
            graphoffset = 65,  // this is the distance difference from the canvas w/h to scale the graph to
            //datalen = solution.length,
            datastep = (datalen > (w - graphoffset)) ? (datalen / (w - graphoffset)) : 1,
            axisstep = (datalen < (w - graphoffset)) ? ((w - graphoffset) / datalen) : 1, //(w - 60) / datalen,
            p = 0;
            
        // normalise y axis
        //sol[j].push(Math.sqrt((z.Re*z.Re) + (z.Im*z.Im))); 
        //sol[j].push((z.Re !== 0.0) ? Math.atan(z.Im/z.Re) : 0.0);

        //console.log(datalen)
        //console.log(datastep)
        //console.log(axisstep)
        
        var maxval = -10000.0, minval = 10000.0;
        for (p = 0; p < datalen; p++)
        {
            var z = stepanalysis[p].solution[node];
            points[p] = Math.sqrt((z.Re*z.Re) + (z.Im*z.Im));
            if (points[p] > maxval)
                maxval = points[p];
            if (points[p] < minval)
                minval = points[p];
        }
        //console.log(points)
        //console.log(minval)
        //console.log(maxval)
        //return
        for (p = 0; p < datalen; p++)
        {
            points[p] = (points[p] - minval) / (maxval - minval);
            //points[p] /= maxval;
        }
        //console.log(points)
        // plot mag
        context.lineWidth = 1;
        context.beginPath();
        context.lineJoin = 'bevel';
        context.moveTo(30.5,h-30.5);
        var s = 0;
        for (p = 0; p < datalen / datastep; p+=datastep)
        {    
            //console.log(points[p])
            context.lineTo(30.5+(axisstep*s), (h-30.5) - (points[Math.round(p)]*(h-graphoffset)));   
            s++;
        }
        context.stroke();
    }
}

var src = null;
function cS()
{
    if (src == $('cir').value) 
        return true;
    src = $('cir').value;

    var result = HighlightAndSyntaxCheckSimpleSource(src),
        errorInfo = "",
        errs = result.errors;
    
    if (errs.length)
    {
        var lines = "";
        for (var i = 0; i < errs.length; i++)
            lines += errs[i].line + ",";
        errorInfo = "<p>Errors on lines: "+lines+"</p>";
    }
    else
        errorInfo = "<p>No Errors</p>";
        
    $('srC').innerHTML = errorInfo + result.source;
    
    var a = $('sCs');
    if (errs.length)
    {
        a.innerHTML = "✘";
        a.style.color = "red";
        return false;
    }
    a.innerHTML = "✔";
    a.style.color = "green";
    
    return true;
}

function aC()
{
    if (cS())
    {
        sS("Analysing...");
        var analysisworker = new Worker('src/AnalyseCircuit.js');
        
        //analysisworker.addEventListener('message', function (event) 
        analysisworker.onmessage = function (event)
        {
            //console.log(event.data)
            var analysed = JSON.parse(event.data);
            
            
            // FIXME: deprecate .error in replace of a throw in the worker
            if (analysed.error !== undefined)
                sS("Error: " + analysed.error);
            else
            {
                sS("Graphing...");
                //console.log(analysed);
                drawGraphs(analysed);
                sS('Done. Click <a href="#graphs">here</a> to see the graphs!');
            }
        };
        analysisworker.onerror = function (error)
        {
            sS("The web Worker reports an error: " + error.message);
        };

        // post a string
        analysisworker.postMessage($('cir').value);
        
        return true;
    }
    else
        return false;
}

function lEx(ex)
{
    var d = $('cir');
    switch (ex)
    {
        case 0:
            d.value = "# A simple RLC circuit\nL 1 2 5.00E-03\nR 2 3 500\nC 3 0 4.70E-09\nI 1 0 1.0 0.0\nF 50 30E+03 40E+03\nP 2\nE\n";
            break;
        case 1:
            d.value = "# More complex example.\nR 0 1 50\nL 1 2 9.552e-6\nL 2 3 7.28e-6\nL 3 4 4.892e-6\nL 1 5 6.368e-6\nL 3 6 12.94e-6\nL 4 7 6.368e-6\nC 0 5 636.5e-12\nC 0 2 2122e-12\nC 0 6 465.8e-12\nC 0 7 636.5e-12\nR 0 4 50\nI 1 0 1.0 0.0\nF 500 10e3 4e6\nP 4\nE";
            break;
        case 2:
            d.value = "# A DC example\nI 1 0 5.0 0.0\nR 0 1 10\nI 2 1 2.0 0.0\nR 1 2 20\nR 2 0 30\nF 10 1 10\nP 2\nE";
            break;
    }
}
var statusTimer;
function sS(message)
{
    $('sT').innerHTML = message;
    $('sT').style.visibility = 'visible';
    if (statusTimer) clearInterval(statusTimer);
    statusTimer = setInterval('$("sT").style.visibility = "hidden";', 3000);
}

onload = function () 
{
    var logo = 'KsJKrJKlJKcJ';
    $('lG').innerHTML = (logo.replace(/K/g,'<img src="imgs/')).replace(/J/g,'1.png">')

    lEx(0);
    cS();

    drawCircuitEditor();

    setInterval('cS()', 200);
}
