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


function drawCircuitEditor()
{
    var i =0,
        j = 0,
        w = 10,
        h = 5,
        cw = 50,
        ch = 50,
        elements = [];
        
    for (; i < w; i++)
    {
        for (; j < h; j++)
        {
            var c = new Element('canvas', { 'width':cw, 'height':ch, 'class': 'gridel', id: ('grid'+i+''+j) }),
                context = c.getContext("2d");
        }
    }
    
}

function checkSyntax()
{
    // FIXME: CHECK FORMAT TYPE
    var result = HighlightAndSyntaxCheckSimpleSource(document.cEd.cir.value),
        errorInfo = "";
    
    if (result.errors.length)
    {
        var lines = "";
        for (var i = 0; i < result.errors.length; i++)
            lines = result.errors[i].line + ",";
        errorInfo = "<p>Errors on lines: "+lines+"</p>";
    }
    else
        errorInfo = "<p>No Errors</p>";
        
    document.getElementById('sourceCode').innerHTML = errorInfo + result.source;
    
    return (!result.errors.length) ? true : false;
}

//http://forums.devarticles.com/javascript-development-22/javascript-to-round-to-2-decimal-places-36190.html
function roundNumber(num, dec) {
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
        context.beginPath();
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
                /*
                analysed = analysed.result;
            
                // Make a graph object with canvas id and width
                var g = new Bluff.Line('graphcanvas', 800);
                g.tooltips = true;
                g.dot_radius = '1';
                g.legend_font_size = g.marker_font_size = '10';
                g.title_font_size = '15';

                // Set theme and options
                g.theme_greyscale();
                g.title = 'Steady State Voltage vs. Frequency';

                var sol = new Array(analysed[0].solution.length);
                var xaxis = {};
                var offsetxaxislabels = analysed.length / 10;
                for (var i =0; i < analysed.length; i++)
                {
                    for (var j =0; j < analysed[i].solution.length; j++)
                    {
                        if (!sol[j])
                            sol[j] = [];
                        var z = analysed[i].solution[j];
                        sol[j].push(Math.sqrt((z.Re*z.Re) + (z.Im*z.Im))); 
                        //sol[j].push((z.Re !== 0.0) ? Math.atan(z.Im/z.Re) : 0.0); 
                    }
                    if ((i % offsetxaxislabels)==0)
                        xaxis[i] = "" + roundNumber(analysed[i].frequency,3);
                }
                for (var i =0; i < sol.length; i++)
                    g.data('node '+ (i+1) , sol[i]);

                g.labels = xaxis;
                g.x_axis_label = 'Frequency (Hz)';

                // Render the graph
                g.draw();
                */
            }
        });
        
        return true;
    }
    else
        return false;
}

function lEx(ex) //loadExample
{
    var d = document.cEd.cir;
    switch (ex)
    {
        case 0:
            d.value = "# A simple RLC circuit\nL 1 2 5.00E-03\nR 2 3 500\nC 3 0 4.70E-09\nI 1 0 1.0 0.0\nF 50 30E+03 40E+03\nP 2\nE\n";
            //document.cEd.format.options[0].selected = true;
            break;
        case 1:
            d.value = "# More complex example. Takes some time.\nR 0 1 50\nL 1 2 9.552e-6\nL 2 3 7.28e-6\nL 3 4 4.892e-6\nL 1 5 6.368e-6\nL 3 6 12.94e-6\nL 4 7 6.368e-6\nC 0 5 636.5e-12\nC 0 2 2122e-12\nC 0 6 465.8e-12\nC 0 7 636.5e-12\nR 0 4 50\nI 1 0 1.0 0.0\nF 500 10e3 4e6\nP 4\nE";
            //document.cEd.format.options[0].selected = true;
            break;
        case 2:
            //document.circuiteditor.circuit.value = "R 1 2 1\nL 2 3 1\nC 3 0 1\nV 1 0 1 0.0\nF 50 0.0001 1.1\nP 2\nE";
            
            d.value = "# A DC example\nI 1 0 5.0 0.0\nR 0 1 10\nI 2 1 2.0 0.0\nR 1 2 20\nR 2 0 30\nF 10 1 10\nP 2\nE";
            //document.cEd.format.options[0].selected = true;
            break;
        //case 'testspice':
        //    document.cEd.circuit.value = "La 1 2 5.00E-03\nRb 2 3 500\nCc 3 0 4.70E-09\nIx 1 0 AC 1.0 0.0\n.AC LIN 50 30E+03 40E+03\n.PROBE 2\n.END\n";
            //document.cEd.format.options[1].selected = true;
        //    break;
    }
}

window.onload = function () 
{
    lEx(0);
    checkSyntax();
    drawCircuit();
    
    drawCircuitEditor();
    
    setInterval('checkSyntax()', 200);  // FIXME: implement a simple check if changed
}




