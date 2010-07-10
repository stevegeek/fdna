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
    // Creates canvas 320 × 200
    /*var paper = new Raphael(document.getElementById('circuitdiagram'), 320, 200);

    // Creates circle at x = 50, y = 40, with radius 10
    var circle = paper.circle(50, 40, 10);
    // Sets the fill attribute of the circle to red (#f00)
    circle.attr("fill", "#f00");

    // Sets the stroke attribute of the circle to white
    circle.attr("stroke", "#fff");
    */
    loadExample();
    checkSyntax();
}

function analyseCircuit()
{
    if (checkSyntax() == 0)
    {
        switch (document.circuiteditor.format.options[document.circuiteditor.format.selectedIndex].value)
        {
            case 'simple':
                result = FDNA.ParseSimpleFormatCircuitFromString(document.circuiteditor.circuit.value);
                break;
            case 'spice':
                result = FDNA.ParseSPICEFormatCircuitFromString(document.circuiteditor.circuit.value);
                break;
        }

        var analysed = FDNA.Analyse(result.circuit);
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
                //console.log(i + '.' + j + ' - ' + analysed[i].solution[j].getModulus() + ' ' + analysed[i].solution[j].getArg())
                sol[j].push(analysed[i].solution[j].getModulus()); 
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
        
        return true;
    }
    else
        return false;
}

function checkSyntax()
{
    var result = FDNA.highlightAndSyntaxCheckSimpleSource(document.circuiteditor.circuit.value),
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

function loadExample()
{
    switch (document.circuiteditor.examplecircuit.options[document.circuiteditor.examplecircuit.selectedIndex].value)
    {
        case 'test':
            document.circuiteditor.circuit.value = "# A simple RLC circuit\nL 1 2 5.00E-03\nR 2 3 500\nC 3 0 4.70E-09\nI 1 0 1.0 0.0\nF 50 30E+03 40E+03\nP 2\nE\n";
            document.circuiteditor.format.options[0].selected = true;
            break;
        case 'testspice':
            document.circuiteditor.circuit.value = "La 1 2 5.00E-03\nRb 2 3 500\nCc 3 0 4.70E-09\nIx 1 0 AC 1.0 0.0\n.AC LIN 50 30E+03 40E+03\n.PROBE 2\n.END\n";
            document.circuiteditor.format.options[1].selected = true;
            break;
    }
}