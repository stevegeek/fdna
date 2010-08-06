
importScripts('FDNA.js');

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
                    circuit.components.push(FDNA.ResistorMake(RegExp.$2, RegExp.$3, RegExp.$4));
                    break;
                case 'C': case 'c':
                    circuit.components.push(FDNA.CapacitorMake(RegExp.$2, RegExp.$3, RegExp.$4))
                    break;
                case 'L': case 'l':
                    circuit.components.push(FDNA.InductorMake(RegExp.$2, RegExp.$3, RegExp.$4))
                    break;
            }
        }
        else if (lines[i].match(sources))
        {
            switch (RegExp.$1)
            {
                case 'I': case 'i':
                    circuit.currentsources.push(FDNA.CurrentSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
                    break;
                case 'V': case 'v':
                    circuit.components.push(FDNA.VoltageSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
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
            circuit.probes.push(FDNA.ProbeMake(RegExp.$1));
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


self.addEventListener('message', function (event) 
{
    this.postMessage(FDNA.ParseSimpleFormatCircuitFromString(event.data));
}, false);

