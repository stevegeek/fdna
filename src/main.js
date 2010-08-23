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

// Optimisations:
// note http://jsperf.com/adding-items-array/6  shows a[i] = blah; to be faster than a.push(blah) in webkit


// http://www.iteral.com/jscrush/
var components =        /^\s*([LRC])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s*$/i,
    sources =           /^\s*([IV])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
    simulationinfo =    /^\s*F\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
    probelocations =    /^\s*P\s+([\d]+)\s*$/i,
    endcommand =        /^\s*E\s*$/i,
    comment =           /^\s*#(.*)$/;

// Dont rename return {c : {p}, r }

// Short names
pF = parseFloat;
pI = parseInt;

// Complex Number Methods
function ZMake(Re, Im)
{
    return {Re:Re, Im:Im};
}

function ZMakeCopy(z)
{
    return {Re:z.Re,Im:z.Im};
}

function ZModulus(z)
{
    return Math.sqrt((z.Re*z.Re) + (z.Im*z.Im));
}

function ZArg(z)
{
    return (z.Re !== 0.0) ? Math.atan(z.Im/z.Re) : 0.0;
}

function ZArgInDegrees(z)
{
    return ZArg(z) * (360/(2*Math.PI));
}

function ZDivide(z, divisor)
{
    var a = z.Re;
    var b = z.Im;
    // (a + jb)/(c + jd) = (a + jb)(c - jd) / (c + jd)(c - jd)
    // ( ac + jbc - jad + bd) / (cc + dd)
    // ( ac + bd )/ (cc + dd) + ( jbc -jad) / (cc + dd)
    var c = ( (a * divisor.Re)          + (b * divisor.Im) ) /
              ( (divisor.Re * divisor.Re)  + (divisor.Im * divisor.Im) );
    var d = ( ((b * divisor.Re)         - (a * divisor.Im)) /
              ( (divisor.Re * divisor.Re)  + (divisor.Im * divisor.Im)) );
    return ZMake(c, d);
}

function ZMultiply(z, factor)
{
    // (a + jb) (c + jd) = ac + jad + jbc - bd
    var a = z.Re;
    var b = z.Im;
    var c = (a * factor.Re) - (b * factor.Im);
    var d = (a * factor.Im) + (b * factor.Re);
    return ZMake(c, d);
}

function ZAdd(z, term)
{
    return ZMake( z.Re + term.Re, z.Im + term.Im);
}

function ZSubtract(z, term)
{
    return ZMake( z.Re - term.Re, z.Im - term.Im);
}

// Component Helper Methods
function CurrentSourceMake(pin1, pin2, magnitude, phase)
{
    // current flows opposite to convention of voltage +/-
    return {type:'I',
            magnitude:pF(magnitude),
            phase:pF(phase),
            pins: new Array(pI(pin1), pI(pin2)),
            admittance: ZMake(-1.0 * magnitude * Math.cos(phase), -1.0 * magnitude * Math.sin(phase))
            //impedance: ZMake(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
            };
}

function CurrentSourceAdmittanceAtOmega(isrc, omega)
{
    return isrc.admittance;
}

function VoltageSourceMake(pin1, pin2, magnitude, phase)
{
    return {type:'V',
            magnitude:pF(magnitude),
            phase:pF(phase),
            pins: new Array(pI(pin1), pI(pin2)),
            admittance: ZMake(magnitude * Math.cos(phase), magnitude * Math.sin(phase))
            };
}

function VoltageSourceAdmittanceAtOmega(vsrc, omega)
{
    return vsrc.admittance;
}

function ProbeMake(pin)
{
    return {pin: pin};
}

function ResistorMake(pin1, pin2, value)
{
    return {type: 'R',
            value: pF(value),
            pins: new Array(pI(pin1), pI(pin2)),
            // Zr = R
            //impedance : ZMake(value, 0.0),
            admittance : ZMake(1.0 / pF(value), 0.0)
        };
}

function ResistorAdmittanceAtOmega(res, omega)
{
    return res.admittance;
}

function CapacitorMake(pin1, pin2, value)
{
    return {type: 'C',
            value: pF(value),
            pins: new Array(pI(pin1), pI(pin2)),
            // Zc = 1/jwC
            //impedance : this.ZMake(0.0, 1.0 / value),
            admittance : ZMake(0.0, pF(value))
        };
}

function CapacitorAdmittanceAtOmega(cap, omega)
{
    var a = ZMakeCopy(cap.admittance);
    a.Im *= omega;
    return a;
}

function InductorMake(pin1, pin2, value)
{
    return {type: 'L',
            value: pF(value),
            pins: new Array(pI(pin1), pI(pin2)),
            // Zl = jwL
            //impedance : ZMake(0.0, value),
            admittance : ZMake(0.0, - 1.0 / pF(value))
        };
}

function InductorAdmittanceAtOmega(ind, omega)
{
    var a = ZMakeCopy(ind.admittance);
    a.Im *= 1.0/omega;
    return a;
}

// http://mysite.verizon.net/res148h4j/javascript/script_gauss_elimination5.html
// convert matrix [A] to upper diagonal form
function eliminate (A)
{
    var i, j, k,
        N = A.length;
    for (i = 0; i < N; i++)
    {
        // find row with maximum in column i
        var max_row = i;
        for (j = i; j < N; j++)
        {
            if (ZModulus(A[j][i]) > ZModulus(A[max_row][i]))
                max_row = j;
        }
        // swap max row with row i of [A:y]
        for (k = i; k < N + 1; k++)
        {
            var tmp       = ZMakeCopy(A[i][k]);
            A[i][k]       = A[max_row][k];
            A[max_row][k] = tmp;
        }

        // eliminate lower diagonal elements of [A]
        for (j = i + 1; j < N; j++)
        {
            for (k = N; k > i; k--)
            {
                if (A[i][i].Re == 0.0 && A[i][i].Im == 0.0)
                    return false;
                else
                {
                    if (!A[j][i])
                        A[j][i] = ZMake(0.0,0.0);
                    if (!A[i][k])
                        A[i][k] = ZMake(0.0,0.0);
                    if (!A[j][k])
                        A[j][k] = ZMake(0.0,0.0);

                    A[j][k] = ZSubtract(A[j][k], ZMultiply(A[i][k], ZDivide(A[j][i], A[i][i])));
                }
            }
        }
    }

    return true;
}

// compute the values of vector x starting from the bottom
function substitute(A)
{
    var j, k,
        N = A.length;
    X = new Array(A.length);
    for (j = 0; j < A.length; j++)
        X[j] = ZMake(0.0,0.0);

    for (j = N - 1; j >= 0; j--)
    {
        var sum = ZMake(0.0,0.0);
        for (k = j + 1; k < N; k++)
        {
            A[j][k] = ZMultiply(A[j][k], X[k]);
            sum = ZAdd(sum, A[j][k]);
        }

        X[j] = ZDivide(ZSubtract(A[j][N], sum), A[j][j]);
    }
    return X;
}

function GaussianElimination(matrix)
{
    if (eliminate (matrix))
        X = substitute(matrix);
    else
        throw "Singular matrix in Gaussian Elimination! Your node numbers must be sequential without gaps.";
    return X;
}

function ParseSimpleFormatCircuitFromString (source)
{
    // FIXME: can we have values use (p,n,u,m,K,M,G,T)
    var er = [],
        lines = source.split("\n"),
        count = lines.length,
        c = {
            simulationinfo: {steps:0, startFrequency: 0, endFrequency: 0},
            components: [],
            p: []
        },
        i = 0;

    for (; i < count; i++)
    {
        if (lines[i] == "" || lines[i].match(/^\s*$/))
        {

        }
        else if (lines[i].match(components))
        {
            var r = RegExp,
                component;
            switch (r.$1)
            {
                case 'R': case 'r':
                    component = ResistorMake(r.$2, r.$3, r.$4);
                    break;
                case 'C': case 'c':
                    component = CapacitorMake(r.$2, r.$3, r.$4);
                    break;
                case 'L': case 'l':
                    component = InductorMake(r.$2, r.$3, r.$4);
                    break;
            }
            c.components.push(component);
        }
        else if (lines[i].match(sources))
        {
            var r = RegExp;
            switch (r.$1)
            {
                case 'I': case 'i':
                    //c.currentsources.push(CurrentSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
                    c.components.push(CurrentSourceMake(r.$2, r.$3, r.$4, r.$5));
                    break;
                case 'V': case 'v':
                    c.components.push(VoltageSourceMake(r.$2, r.$3, r.$4, r.$5));
                    break;
            }
        }
        else if (lines[i].match(simulationinfo))
        {
            var r = RegExp;
            c.simulationinfo.steps = pI(r.$1);
            c.simulationinfo.startFrequency = pF(r.$2);
            c.simulationinfo.endFrequency = pF(r.$3);
        }
        else if (lines[i].match(probelocations))
        {
            c.p.push(ProbeMake(RegExp.$1));
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
            er.push({line: i});
        }
    }

    return {e: er, c: c};
}

function Analyse (parseResult)
{

    if (parseResult.e.length != 0)
    {
        return {error:"Circuit failed to parse!"};
    }

    var result = [],
        circuit = parseResult.c,
        count = circuit.components.length,
        maxNode = 0,
        i = 0;

    // get max nodes
    for (; i < count; i++)
    {
        var pin1 = circuit.components[i].pins[0],
            pin2 = circuit.components[i].pins[1];
        if (pin1 == pin2)
            return {error:"Components cannot have their pins connected to the same node"};
        if (pin1 > maxNode)
            maxNode = pin1;
        if (pin2 > maxNode)
            maxNode = pin2;
    }

    // create matrix
    var linearEquations = [];
    for (var node = 0; node < maxNode; node++)
    {
        linearEquations[node] = [];
        for (var unknown = 0; unknown < maxNode+1; unknown++)
        {
            linearEquations[node][unknown] = {input:[], output:[]};
        }

        // For all components
        for (var componentindex = 0; componentindex < count; componentindex++)
        {
            // We subtract 1 as the 0 node is assumed to be the reference node and does not have equs built for it
            var component = circuit.components[componentindex],
                pin1 = component.pins[0] - 1,
                pin2 = component.pins[1] - 1;

            if (pin1 != node && pin2 != node) // if component connected to this node
                continue;


            // TODO: optimise this to remove duplication
            if (pin1 == node)
            {
                if (component.type == 'I')
                {
                    // TODO Check wether this orientation is correct otherwise we will get inverted results
                    linearEquations[pin1][maxNode].input.push(component);
                }
                else
                {
                    linearEquations[pin1][pin1].input.push(component);
                    if (pin2 >= 0)
                        linearEquations[pin1][pin2].output.push(component);
                }
            }
            else if (pin2 == node)
            {
                if (component.type == 'I')
                {
                    linearEquations[pin2][maxNode].output.push(component);
                }
                else
                {
                    linearEquations[pin2][pin2].input.push(component);
                    if (pin1 >= 0)
                        linearEquations[pin2][pin1].output.push(component);
                }
            }
        }
    }
    // Solve
    var frequency = circuit.simulationinfo.startFrequency,
        fstep =  (circuit.simulationinfo.endFrequency - circuit.simulationinfo.startFrequency) / circuit.simulationinfo.steps,
        step = 0,
        matrix = new Array(linearEquations.length);

    for (; step < circuit.simulationinfo.steps; step++)
    {
        var omega = 2 * Math.PI * frequency,
            equ = 0,
            node = 0,
            component = 0,
            val;

        for (; equ < linearEquations.length; equ++)
        {
            matrix[equ] = new Array(linearEquations[equ].length);
            for (node = 0; node < linearEquations[equ].length; node++)
            {
                if (!matrix[equ][node])
                    matrix[equ][node] = ZMake(0.0, 0.0);

                for (var i = 0; i < linearEquations[equ][node].input.length; i++)
                {
                    var component = linearEquations[equ][node].input[i];
                    switch (component.type)
                    {
                        //case 'V':
                        //    matrix[equ][node] = ZAdd(matrix[equ][node], VoltageSourceAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                        //    break;
                        case 'I':
                            val = CurrentSourceAdmittanceAtOmega(component, omega);
                            break;
                        case 'R':
                            val = ResistorAdmittanceAtOmega(component, omega);
                            break;
                        case 'L':
                            val = InductorAdmittanceAtOmega(component, omega);
                            break;
                        case 'C':
                            val = CapacitorAdmittanceAtOmega(component, omega);
                            break;
                    }
                    matrix[equ][node] = ZAdd(matrix[equ][node], val);
                }
                for (var o = 0; o < linearEquations[equ][node].output.length; o++)
                {
                    var component = linearEquations[equ][node].output[o];
                    switch (component.type)
                    {
                        //case 'V':
                            // according to uni code
                        //    break;
                        case 'I':
                            val = CurrentSourceAdmittanceAtOmega(component, omega);
                            break;
                        case 'R':
                            val = ResistorAdmittanceAtOmega(component, omega);
                            break;
                        case 'L':
                            val = InductorAdmittanceAtOmega(component, omega);
                            break;
                        case 'C':
                            val = CapacitorAdmittanceAtOmega(component, omega);
                            break;
                    }
                    matrix[equ][node] = ZSubtract(matrix[equ][node], val);
                }
            }
        }

        //return matrix;
        // solve matrix
        result[step] = {s: GaussianElimination(matrix),f: frequency, o: omega};
        frequency += fstep;
    }

    return {r:result, c:circuit};
};
/*
self.addEventListener('message', function (event)
{
    this.postMessage(Analyse(ParseSimpleFormatCircuitFromString(event.data)));
}, false);
*//*
onmessage = function(event)
{
    postMessage(JSON.stringify(Analyse(ParseSimpleFormatCircuitFromString(event.data))));
}
*/

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

// FIXME: reg exp replacement to shrink coord array or offset everything by 20
function drawElement(canvas,type,rot,value)
{
    var cx = canvas.getContext("2d"),
        i = 0,
        index = {'r':0,'c':25,'l':45,'s':70,'p':85,'g':94,'h':114,'v':119,'k':124,'t':131,'x':141},
        a = 20, b = 25, c = 30, d = 50,
        coords = [
                    0,b,5,b,7.5,c,12.5,a,17.5,c,22.5,a,27.5,c,32.5,a,37.5,c,42.5,a,45,b,50,b,'e',
                    0,b,22.5,b,'m',22,15,22,35,'m',28,15,28,35,'m',28,b,50,b,'e',
                    0,b,5,b,'a',10,b,5,1,'a',a,b,5,1,'a',c,b,5,1,'a',40,b,5,1,50,b,'e',
                    0,b,15,b,'m',35,b,50,b,'a',b,b,10,2,'e',
                    0,b,c,a,c,c,0,b,'e',
                    0,b,c,b,'m',c,15,c,35,'m',35,20,35,30,'m',40,22,40,27,'e',
                    0,b,50,b,'e',
                    0,b,50,b,'e',//b,0,b,50,'e',
                    b,50,b,b,50,b,'e',
                    b,50,b,0,'m',b,b,50,b,'e',
                    b,50,b,0,'m',0,b,50,b,'e'
                 ],
        t = index[type.charAt(0)];
    //canvas.width = canvas.width;
    cx.beginPath();
    cx.moveTo(coords[t],coords[1+t]);
    while (coords[i+t] != 'e' && (typeof coords[i+t] != 'undefined')) 
    {
        if (coords[i+t] == 'm')
            cx.moveTo(coords[i+t+1]+.5,coords[i+2+t]+.5),i+=3;
        else if (coords[i+t] == 'a')
            cx.arc(coords[i+t+1]+.5,coords[i+2+t]+.5,coords[i+3+t],Math.PI*coords[i+4+t],0,false),i+=5;
        else
            cx.lineTo(coords[i+t]+.5,coords[i+1+t]+.5),i+=2;
    }
    cx.stroke();
    if(value > 0) cx.fillText(""+value, 10, 10);
    /*switch(rot)
    case 1: cx.rotate(1.57); break;
    case -1:*/
    // rot = 90, 270, 180 (flip)
}

/// FIXME: optims, make a global for document.cEd.cir, i, j 'var' everywhere

function HighlightAndSyntaxCheckSimpleSource(source)
{
    // FIXME: can we have values use (p,n,u,m,K,M,G,T)
    /*var components =        /^\s*([LRC])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s*$/i,
        sources =           /^\s*([VI])\s+([\d]+)\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        simulationinfo =    /^\s*F\s+([\d]+)\s+([\d\.E\-+]+)\s+([\d\.E\-+]+)\s*$/i,
        probelocations =    /^\s*P\s+([\d]+)\s*$/i,
        endcommand =        /^\s*E\s*$/i, 
        comment =           /^\s*#(.*)$/,*/
    var    highlightedSource = 'Zid="sCs" X"big" style="top:-45px">J<p>',
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
            errors.push({line: i}), highlightedSource += 'ZX"se">'+lines[i]+'J<br>';
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
// h k t x
// FIXME: remove src and class
var imgCode = 'var cim = [ArhBCDAlhBCDAchBCDAshBCDAhBCDAplBC-2,r:-2,b:-2,l:-1F,AglBC-2,r:-2,b:-2,l:0F,ArvBCZAlvBCZAcvBCZAsvBC-1,r:-2,b:-1,l:-2F,AptBC-1,r:-2,b:-2,l:-2}),AgtBC0,r:-2,b:-2,l:-2}),AvBCZAkbrBC-2,r:-1,b:-1,l:-2}),AktlBC-1,r:-2,b:-2,l:-1GAktrBC-1,r:-1,b:-2,l:-2F,AkblBC-2,r:-2,b:-1,l:-1HAtrBC-1,r:-1,b:-1,l:-2}),AtlBC-1,r:-2,b:-1,l:-1GAttBC-1,r:-1,b:-2,l:-1F,AtbBC-2,r:-1,b:-1,l:-1HAxBC-1,r:-1,b:-1,l:-1F];',
    imgSearch = 'ABCDZFGH',
    imgReplace = ["new Element('canvas', { e:'","', width:50, height:50, "," t:","-2,r:-1,b:-2,l:-1 }),","-1,r:-2,b:-1,l:-2, 'class':'rot'}),", ", 'class':'rot'})",", 'class':'f'}),", ", 'class':'frot'}),"];

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
            var id = pI(RegExp.$1),
                child = cim[id].clone(),
                n = child.getAttribute('e'),
                value = -1;
            if (id < 4 || (id > 6 && id < 11) )
                value = prompt("Value (R=[ohms], L=[henry], C=[farads], I=[mag,phase]=[amps,rad/s])", ""), n += '_' + value.replace(',','_').replace(' ','')
            child.setAttribute('id', n);
            
            // FIXME: ROTATION NEEDED
            drawElement(child,child.getAttribute('e'),child.getAttribute('rot'),value);
            
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
        elements = [],
        c;
        
    // create toolbox    
    for (i = 0; i < cim.length; i++)
    {
        var a = griddiv.clone();
        a.setAttribute('id',"tb"+i);
        c = cim[i].clone();
        drawElement(c,c.getAttribute('e'),c.getAttribute('rot'),-1);
        a.appendChild(c);
        $('tbx').appendChild(a);
    }
    c = griddiv.clone();
    c.setAttribute('id','del');
    c.innerHTML = "Drag here to Delete";
    $('tbx').appendChild(c)

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
        probes = (typeof data.c.p == 'string') ? (JSON.parse(data.c.p)):(data.c.p),
        stepanalysis = (typeof data.r == 'string') ? (JSON.parse(data.r)) : (data.r),
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
            var z = stepanalysis[p].s[node];
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
        /*var analysisworker = new Worker('src/AnalyseCircuit.js');
        //var analysisworker = new Worker('src/ac.js');
        
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
        */
        var analysed = Analyse(ParseSimpleFormatCircuitFromString($('cir').value));
        
        if (analysed.error !== undefined)
            sS("Error: " + analysed.error);
        else
        {
            sS("Graphing...");
            //console.log(analysed);
            drawGraphs(analysed);
            sS('Done. Click <a href="#graphs">here</a> to see the graphs!');
        }
        return true;
    }
    else
        return false;
}

window['aC'] = aC;
window['cS'] = cS;
window['sS'] = sS;
window['lEx'] = lEx;
window['cTx'] = cTx;
window['drag'] = drag;
window['drop'] = drop;

onload = function () 
{
    var logo = 'KsJKrJKlJKcJ';
    $('lG').innerHTML = (logo.replace(/K/g,'<img src="imgs/')).replace(/J/g,'1.png">')

    lEx(0);
    cS();

    drawCircuitEditor();
    /*var c =new Element('canvas', {'width':50,'height':50});
    drawElement(c,'rh', 0)
    $('diagram').appendChild(c);*/

    setInterval('cS()', 200);
}
