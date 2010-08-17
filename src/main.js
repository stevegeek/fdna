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
        highlightedSource = '<p>',
        errors = new Array(),
        lines = source.split("\n"),
        count = lines.length,
        i = 0;

    for (; i < count; i++)
    {
        highlightedSource += '<span class="linenum">'+i+'.</span>';
        if (lines[i] == "" || lines[i].match(/^\s*$/))
            highlightedSource += '<br>';
        else if (lines[i].match(components))
            highlightedSource += '<span class="keyword">'+RegExp.$1+'</span> <span class="node">'+RegExp.$2+'</span> <span class="node">'+RegExp.$3+'</span> <span class="value">'+RegExp.$4+'</span><br>';
        else if (lines[i].match(sources))
            highlightedSource += '<span class="keyword">'+RegExp.$1+'</span> <span class="node">'+RegExp.$2+'</span> <span class="node">'+RegExp.$3+'</span> <span class="value">'+RegExp.$4+'</span> <span class="value">'+RegExp.$5+'</span><br>';
        else if (lines[i].match(simulationinfo))
            highlightedSource += '<span class="keyword">F</span> <span class="value">'+RegExp.$1+'</span> <span class="value">'+RegExp.$2+'</span> <span class="value">'+RegExp.$3+'</span><br>';
        else if (lines[i].match(probelocations))
            highlightedSource += '<span class="keyword">P</span> <span class="node">'+RegExp.$1+'</span><br>';
        else if (lines[i].match(endcommand))
            highlightedSource += '<span class="keyword">E</span><br>';
        else if (lines[i].match(comment))
            highlightedSource += '<span class="comment">&#35; '+RegExp.$1+'</span><br>';
        else
        {
            errors.push({line: i})
            highlightedSource += '<span class="syntaxerror">'+lines[i]+'</span><br>';
        }
    }

    return {errors: errors, source: highlightedSource + '</p>'};
}

// t r b and l , if -2 then no connection there, if -1 connection exists but isnt assigned a node value, if other = node value for connection
cim = [ new Element('img', { e:'rh', src:'imgs/r1.png', t:-2,r:-1,b:-2,l:-1 }),
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

// FIXME: '' are not needed for prop names
griddiv = new Element('div', { 
        'class': 'gridel',
        'draggable':'true',
        'ondragstart':"drag(this, event)",
        'ondragenter':"return false",
        'ondragover':"return false", 
        'ondrop':"drop(this, event)"
    });

function drag(target, e) 
{
    e.dataTransfer.setData('text/plain', target.id);
}

fromToolbox = /^tb(\d+)/;

function drop(target, e) 
{
    var id = e.dataTransfer.getData('text/plain');
    console.log(target.id + " <- " + id)

    //if from tbx create a clone at target and add to components
    // if contains a child then stop operation
    // if an obj already on grid simply move it

    
    if (!target.firstChild)
    {
        if (id.match(fromToolbox))
        {
            console.log('add')
            var id = parseInt(RegExp.$1),
                child = cim[id].clone(),
                n = child.getAttribute('e'),
                v = 0;
            if (id < 8 )
                n += '_' + prompt("Value (R=[ohms], L=[henry], C=[farads], I=[mag,phase]=[amps,rad/s])", "").replace(',','_').replace(' ','')
            child.setAttribute('id', n);
            target.appendChild(child);
        }
        else
        {
            console.log('move')
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
    var i =0,
        j = 0,
        elements = [];
        
    // create toolbox    
    for (i = 0; i < cim.length; i++)
    {
        var a = griddiv.clone();
        a.setAttribute('id',"tb"+i);
        a.style.paddingRight = '2px';
        a.appendChild(cim[i].clone());
        $('tbx').appendChild(a);
    }

    for (; j < 10; j++)
    {
        for (i = 0; i < 10; i++)
        {
            var a = griddiv.clone();
            a.setAttribute('id',"g"+i+''+j);
            $('diagram').appendChild(a);
        }
        $('diagram').appendChild(new Element('br').addClassName('row'));
    }
}

function propagateWireNodes()
{
    var i = 0,
        j = 0,
        propagate = true,cnt = 0;
        
    while (propagate)
    {
        cnt++;
        console.log('loop ' + cnt)
        if(cnt > 10)
            break;
        propagate = false;
        for (j = 0; j < 10; j++)
        {
            for (i = 0; i < 10; i++)
            {
                var g = $("g"+i+''+j);
                    c = g.firstChild,
                    curnode = -1;
                
                if(!c || !c.getAttribute('e').match(/^[kvhtx]/)) continue;
                // t r b l
                console.log('found wire' + c.getAttribute('e'))
                
                var offsets = ['t','r','b','l', 'b','l','t','r', 0, 1, 0, -1, -1, 0, 1, 0],
                    prev = false;
                
                for (var k = 0; k < 4; k++)
                {
                    var n  = c.getAttribute(offsets[k]);
                    if (n == -2)
                        continue;
                    
                    if (n == -1)
                    {
                        console.log(offsets[k] + ' we are -1 so prop still')
                        curnode = $("g"+(i+offsets[k+8])+''+(j+offsets[k+12])).firstChild.getAttribute(offsets[k+4]);
                        console.log('neighbour node '+curnode)
                        //if (curnode > -1)
                        //    c.setAttribute(offsets[k], curnode);
                        if (prev)
                            propagate = true;
                            
                        if (curnode > -1)
                        {
                            console.log('assign all wire pins')
                            for (var m = 0; m < 4; m++)
                            {
                                if (c.getAttribute(offsets[m]) > -2)
                                {
                                    console.log('assign '+curnode+' to '+offsets[m])
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
          
    for (; j < 10; j++)
    {
        for (i = 0; i < 10; i++)
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
        $('status').innerHTML = "Your circuit does not contain a ground (reference node).";
        return;
    }
    
    propagateWireNodes();
    //return
    // check connections
    for (j = 0; j < 10; j++)
    {
        for (i = 0; i < 10; i++)
        {
            var g = $("g"+i+''+j);
                c = g.firstChild,
                curnode = -1;

            if(!c || !c.getAttribute('e').match(/^[rlcsp]/)) continue;
            // t r b l
            var offsets = ['t','r','b','l', 'b','l','t','r', 0, 1, 0, -1, -1, 0, 1, 0];
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
    for (j = 0; j < 10; j++)
    {
        for (i = 0; i < 10; i++)
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
    document.cEd.cir.value = src + "F " + $('ft').value + " " + $('fs').value + " " + $('fe').value +"\nE";
        
    aC(); // check syntax and analyse
}

function checkSyntax()
{
    // FIXME: CHECK FORMAT TYPE
    var result = HighlightAndSyntaxCheckSimpleSource(document.cEd.cir.value),
        errorInfo = "",
        errs = result.errors;
    
    if (errs.length)
    {
        var lines = "";
        for (var i = 0; i < errs.length; i++)
            lines = errs[i].line + ",";
        errorInfo = "<p>Errors on lines: "+lines+"</p>";
    }
    else
        errorInfo = "<p>No Errors</p>";
        
    $('sourceCode').innerHTML = errorInfo + result.source;
    
    return (!errs.length) ? true : false;
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
        i = 0;
            
    for (; i < graphs.length; i++)
        graphs[i].remove();

    for (i = 0; i < data.circuit.probes.length; i++)
    {
        var w = 500,
            h = 300,
            node = data.circuit.probes[i].pin - 1,
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
        
        var stepanalysis = data.result,
            points = [],
            datalen = stepanalysis.length,
            graphoffset = 65,  // this is the distance difference from the canvas w/h to scale the graph to
            //datalen = solution.length,
            datastep = (datalen > (w - graphoffset)) ? (datalen / (w - graphoffset)) : 1,
            axisstep = (datalen < (w - graphoffset)) ? ((w - graphoffset) / datalen) : 1, //(w - 60) / datalen,
            p = 0;
            
        // normalise y axis
        //sol[j].push(Math.sqrt((z.Re*z.Re) + (z.Im*z.Im))); 
        //sol[j].push((z.Re !== 0.0) ? Math.atan(z.Im/z.Re) : 0.0);

        console.log(datalen)
        console.log(datastep)
        console.log(axisstep)

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

function aC()
{
    if (checkSyntax())
    {
        $('status').innerHTML = "Analysing...";
        var analysisworker = new Worker('src/AnalyseCircuit.js');
        analysisworker.postMessage(document.cEd.cir.value);
        analysisworker.addEventListener('message', function (event) 
        {
            //console.log(event.data)
            var analysed = event.data;
            if (analysed.error !== undefined)
                $('status').innerHTML = "Error: " + analysed.error;
            else
            {
                $('status').innerHTML = "Graphing...";
                //console.log(analysed);
                drawGraphs(analysed);
                $('status').innerHTML = "Done.";
            }
        });
        
        return true;
    }
    else
        return false;
}

function lEx(ex)
{
    var d = document.cEd.cir;
    switch (ex)
    {
        case 0:
            d.value = "# A simple RLC circuit\nL 1 2 5.00E-03\nR 2 3 500\nC 3 0 4.70E-09\nI 1 0 1.0 0.0\nF 50 30E+03 40E+03\nP 2\nE\n";
            break;
        case 1:
            d.value = "# More complex example. Takes some time.\nR 0 1 50\nL 1 2 9.552e-6\nL 2 3 7.28e-6\nL 3 4 4.892e-6\nL 1 5 6.368e-6\nL 3 6 12.94e-6\nL 4 7 6.368e-6\nC 0 5 636.5e-12\nC 0 2 2122e-12\nC 0 6 465.8e-12\nC 0 7 636.5e-12\nR 0 4 50\nI 1 0 1.0 0.0\nF 500 10e3 4e6\nP 4\nE";
            break;
        case 2:
            d.value = "# A DC example\nI 1 0 5.0 0.0\nR 0 1 10\nI 2 1 2.0 0.0\nR 1 2 20\nR 2 0 30\nF 10 1 10\nP 2\nE";
            break;
    }
}

onload = function () 
{
    lEx(0);
    checkSyntax();
    //drawCircuit();
    
    drawCircuitEditor();
    
    setInterval('checkSyntax()', 200);  // FIXME: implement a simple check if changed
}


/*
function HighlightAndSyntaxCheckSPICESource(source)
{    
    return {};
}

// Each compoenent has a bounding box of 50x20 pix
function DrawHResistor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x+5,y);
    context.lineTo(x+7.5,y+5);
    context.lineTo(x+12.5,y-5);
    context.lineTo(x+17.5,y+5);
    context.lineTo(x+22.5,y-5);
    context.lineTo(x+27.5,y+5);
    context.lineTo(x+32.5,y-5);
    context.lineTo(x+37.5,y+5);
    context.lineTo(x+42.5,y-5);
    context.lineTo(x+45,y);
    context.lineTo(x+50,y);
    context.stroke();
}

function DrawVResistor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x,y+5);
    context.lineTo(x+5,y+7.5);
    context.lineTo(x-5,y+12.5);
    context.lineTo(x+5,y+17.5);
    context.lineTo(x-5,y+22.5);
    context.lineTo(x+5,y+27.5);
    context.lineTo(x-5,y+32.5);
    context.lineTo(x+5,y+37.5);
    context.lineTo(x-5,y+42.5);
    context.lineTo(x,y+45);
    context.lineTo(x,y+50);
    context.stroke();
}

function DrawHCapacitor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x+22.5,y);
    context.moveTo(x+22.5,y-10);
    context.lineTo(x+22.5,y+10);
    context.moveTo(x+27.5,y-10);
    context.lineTo(x+27.5,y+10);
    context.moveTo(x+27.5,y);
    context.lineTo(x+50,y);
    context.stroke();
}

function DrawVCapacitor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x,y+22.5);
    context.moveTo(x-10,y+22.5);
    context.lineTo(x+10,y+22.5);
    context.moveTo(x-10,y+27.5);
    context.lineTo(x+10,y+27.5);
    context.moveTo(x,y+27.5);
    context.lineTo(x,y+50);
    context.stroke();
}

function DrawHInductor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x+5,y);
    context.arc(x+10,y,5,Math.PI,0,false);
    context.arc(x+20,y,5,Math.PI,0,false);
    context.arc(x+30,y,5,Math.PI,0,false);
    context.arc(x+40,y,5,Math.PI,0,false);
    context.lineTo(x+50,y);
    context.stroke();
}

function DrawVInductor(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x,y+5);
    context.arc(x,y+10,5,3*Math.PI/2,Math.PI/2,false);
    context.arc(x,y+20,5,3*Math.PI/2,Math.PI/2,false);
    context.arc(x,y+30,5,3*Math.PI/2,Math.PI/2,false);
    context.arc(x,y+40,5,3*Math.PI/2,Math.PI/2,false);
    context.lineTo(x,y+50);
    context.stroke();
}

function DrawHVoltageSource(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x+15,y);
    context.moveTo(x+35,y);
    context.lineTo(x+50,y);
    context.stroke();
    context.beginPath();
    context.arc(x+25,y,10,0,Math.PI*2,false);  
    context.stroke();
    context.fillText("V", x+22.5, y+2.5);
}

function DrawVVoltageSource(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x,y+15);
    context.moveTo(x,y+35);
    context.lineTo(x,y+50);
    context.stroke();
    context.beginPath();
    context.arc(x,y+25,10,0,Math.PI*2,false);  
    context.stroke();
    context.fillText("V", x-2.5, y+27.5);
}

function DrawHCurrentSource(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x+15,y);
    context.moveTo(x+35,y);
    context.lineTo(x+50,y);
    context.stroke();
    context.beginPath();
    context.arc(x+25,y,10,0,Math.PI*2,false);  
    context.stroke();
    //context.fillText("I", x+24, y+2.5);
}

function DrawVCurrentSource(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x,y+15);
    context.moveTo(x,y+35);
    context.lineTo(x,y+50);
    context.stroke();
    context.beginPath();
    context.arc(x,y+25,10,0,Math.PI*2,false);  
    context.stroke();
    context.fillText("I", x-1.0, y+27.5);
}

//function DrawHProbe(context, x, y)
//{
//}

function DrawVProbe(context, x, y)
{
    context.beginPath();
    context.moveTo(x,y);
    context.lineTo(x-6.5,y+16);
    context.stroke();
    context.beginPath();
    context.arc(x-10,y+25,10,0,Math.PI*2,false);  
    context.fillStyle = "#e00";
    context.fill();
    context.stroke();
}

function drawCircuit()
{
    var canvas = $('diagramcanvas'), 
        context = canvas.getContext("2d");
    canvas.width = canvas.width;
    
    // draw grid
    for (var x = 0.5; x < canvas.width; x += 10) {
        context.moveTo(x, 0);
        context.lineTo(x, canvas.height);
    }
    for (var y = 0.5; y < canvas.height; y += 10) {
        context.moveTo(0, y);
        context.lineTo(canvas.width, y);
    }
    
    context.strokeStyle = "#eee";
    context.stroke();
    
    
    context.strokeStyle = "#000";
    DrawHResistor(context, 10,40);
    //DrawVResistor(context, 75,20);
    DrawHCapacitor(context, 130,40);
    //DrawVCapacitor(context, 190,20);
    DrawHInductor(context, 250,40);
    //DrawVInductor(context, 310  ,20);
    
    //DrawHVoltageSource(context, 10,100);
    //DrawVVoltageSource(context, 75,100);
    DrawHCurrentSource(context, 130,100);
    //DrawVCurrentSource(context, 190,100);
    //DrawHProbe(context, 250,80);
    DrawVProbe(context, 310  ,100);
    
    var ir = new Element('img', { 'src':'imgs/r1.png'});
    context.drawImage(ir, 0,0)
    var il = new Element('img', { 'src':'imgs/l1.png'});
    context.drawImage(il, 50,0)
    var ic = new Element('img', { 'src':'imgs/c1.png'});
    context.drawImage(ic, 100,0)
    var is = new Element('img', { 'src':'imgs/s1.png'});
    context.drawImage(is, 150,0)
    var ip = new Element('img', { 'src':'imgs/p1.png'});
    context.drawImage(ip, 200,0)
}
*/


