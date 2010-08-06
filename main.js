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
    context.fillText("I", x+24, y+2.5);
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
    DrawHResistor(context, 10,20);
    DrawVResistor(context, 75,20);
    DrawHCapacitor(context, 130,20);
    DrawVCapacitor(context, 190,20);
    DrawHInductor(context, 250,20);
    DrawVInductor(context, 310  ,20);
    
    DrawHVoltageSource(context, 10,80);
    DrawVVoltageSource(context, 75,80);
    DrawHCurrentSource(context, 130,80);
    DrawVCurrentSource(context, 190,80);
    //DrawHProbe(context, 250,80);
    DrawVProbe(context, 310  ,80);
    
    
    
}

function checkSyntax()
{
    // FIXME: CHECK FORMAT TYPE
    var result = HighlightAndSyntaxCheckSimpleSource(document.circuiteditor.circuit.value),
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
    
    return result.errors.length;
}

function analyseCircuit()
{
    if (checkSyntax() == 0)
    {
        switch (document.circuiteditor.format.options[document.circuiteditor.format.selectedIndex].value)
        {
            case 'simple':
                $('status').innerHTML = "Parsing...";
                var worker = new Worker('src/ParseSimpleFormat.js');
                worker.postMessage(document.circuiteditor.circuit.value);
                worker.addEventListener('message', function (event) 
                {
                    var result = event.data;
                    //console.log(result);
                    
                    $('status').innerHTML = "Analysing...";
                    var analysisworker = new Worker('src/AnalyseCircuit.js');
                    analysisworker.postMessage(result.circuit);
                    analysisworker.addEventListener('message', function (event) 
                    {
                        var analysed = event.data;
                        $('status').innerHTML = "Graphing...";
                        //console.log(analysed);
                        
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
                                sol[j].push(FDNA.ZModulus(analysed[i].solution[j])); 
                            }
                            if ((i % offsetxaxislabels)==0)
                                xaxis[i] = "" + analysed[i].frequency;
                        }
                        for (var i =0; i < sol.length; i++)
                            g.data('node '+ (i+1) , sol[i]);

                        g.labels = xaxis;
                        g.x_axis_label = 'Frequency (Hz)';

                        // Render the graph
                        g.draw();
                        $('status').innerHTML = "Done.";
                    });
                    
                });
                break;
            case 'spice':
                //result = FDNA.ParseSPICEFormatCircuitFromString(document.circuiteditor.circuit.value);
                break;
        }
        
        return true;
    }
    else
        return false;
}

function loadExample()
{
    switch (document.circuiteditor.examplecircuit.options[document.circuiteditor.examplecircuit.selectedIndex].value)
    {
        case 'example1':
            document.circuiteditor.circuit.value = "# A simple RLC circuit\nL 1 2 5.00E-03\nR 2 3 500\nC 3 0 4.70E-09\nI 1 0 1.0 0.0\nF 50 30E+03 40E+03\nP 2\nE\n";
            document.circuiteditor.format.options[0].selected = true;
            break;
        case 'example2':
            document.circuiteditor.circuit.value = "# More complex example. Takes some time.\nR 0 1 50\nL 1 2 9.552e-6\nL 2 3 7.28e-6\nL 3 4 4.892e-6\nL 1 5 6.368e-6\nL 3 6 12.94e-6\nL 4 7 6.368e-6\nC 0 5 636.5e-12\nC 0 2 2122e-12\nC 0 6 465.8e-12\nC 0 7 636.5e-12\nR 0 4 50\nI 1 0 1.0 0.0\nF 500 10e3 4e6\nP 4\nE";
            document.circuiteditor.format.options[0].selected = true;
            break;
        case 'example3':
            document.circuiteditor.circuit.value = "R 1 2 10000\nR 2 3 100\nC 1 2 1e-7\nC 3 0 1e-6\nI 1 0 0.01 0.0\nF 500 10 2e3\nP 2\nE";
            document.circuiteditor.format.options[0].selected = true;
            break;
        case 'testspice':
            document.circuiteditor.circuit.value = "La 1 2 5.00E-03\nRb 2 3 500\nCc 3 0 4.70E-09\nIx 1 0 AC 1.0 0.0\n.AC LIN 50 30E+03 40E+03\n.PROBE 2\n.END\n";
            document.circuiteditor.format.options[1].selected = true;
            break;
    }
}

window.onload = function () 
{
    loadExample();
    checkSyntax();
    drawCircuit();
}


