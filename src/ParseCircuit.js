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

FDNA.highlightAndSyntaxCheckSimpleSource = function (source)
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

FDNA.highlightAndSyntaxCheckSPICESource = function (source)
{    
    return {};
}

FDNA.ParseSimpleFormatCircuitFromString = function (source)
{
    // FIXME: can we have values use (p,n,u,m,K,M,G,T)

    var components =        /^\s*([LRC])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s*$/i,
        sources =           /^\s*([IV])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        simulationinfo =    /^\s*F\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        probelocations =    /^\s*P\s+([\d]+)\s*$/i,
        endcommand =        /^\s*E\s*$/i, 
        comment =           /^\s*#(.*)$/,
        errors = new Array();
        lines = source.split("\n"),
        count = lines.length,
        circuit = {
            simulationinfo: {steps:0, startFrequency: 0, endFrequency: 0},
            components: new Array(), 
            currentsources: new Array(),
            probes: new Array()
        },
        i = 0;

    for (; i < count; i++)
    {
        if (lines[i] == "" || lines[i].match(/^\s*$/))
        {
            
        }
        else if (lines[i].match(components))
        {
            switch (RegExp.$1)
            {
                case 'R': case 'r':
                    circuit.components.push(new FDNA.Devices.Resistor(RegExp.$2, RegExp.$3, RegExp.$4));
                    break;
                case 'C': case 'c':
                    circuit.components.push(new FDNA.Devices.Capacitor(RegExp.$2, RegExp.$3, RegExp.$4))
                    break;
                case 'L': case 'l':
                    circuit.components.push(new FDNA.Devices.Inductor(RegExp.$2, RegExp.$3, RegExp.$4))
                    break;
            }
        }
        else if (lines[i].match(sources))
        {
            switch (RegExp.$1)
            {
                case 'I': case 'i':
                    circuit.currentsources.push(new FDNA.Devices.CurrentSource(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
                    break;
                case 'V': case 'v':
                    circuit.components.push(new FDNA.Devices.VoltageSource(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
                    break;   
            }
        }
        else if (lines[i].match(simulationinfo))
        {
            circuit.simulationinfo.steps = parseInt(RegExp.$1);
            circuit.simulationinfo.startFrequency = parseFloat(RegExp.$2);
            circuit.simulationinfo.endFrequency = parseFloat(RegExp.$3);
        }
        else if (lines[i].match(probelocations))
        {
            circuit.probes.push(new FDNA.Devices.Probe(RegExp.$1));
        }
        else if (lines[i].match(endcommand))
        {
            // stop parsing
            break;
        }
        else if (lines[i].match(comment))
        {
            // ignore
        }
        else
        {
            errors.push({line: i});
        }
    }

    return {errors: errors, circuit: circuit};
}

FDNA.ParseSPICEFormatCircuitFromString = function (circuitString)
{
    alert('SPICE support is not complete')
    return {};
}
