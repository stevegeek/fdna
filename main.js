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

window.onload = function () 
{
    loadExample();
    checkSyntax();
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

function checkSyntax()
{
    // FIXME: CHECK FORMAT TYPE
    var result = FDNA.HighlightAndSyntaxCheckSimpleSource(document.circuiteditor.circuit.value),
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
                    console.log(result);
                    
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
                        g.dot_radius = '3';
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

