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
function CurrentSourceMake(pin1, pin2, magnitude, phase, tolerance, state)
{
    // current flows opposite to convention of voltage +/-
    return {type:'I', 
            state:state, 
            tolerance:pF(tolerance), 
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

function VoltageSourceMake(pin1, pin2, magnitude, phase, tolerance, state)
{
    return {type:'V', 
            state:state, 
            tolerance:pF(tolerance), 
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

function ResistorMake(pin1, pin2, value, tolerance, state)
{
    return {type: 'R',
            state: state,
            tolerance: pF(tolerance),
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
        
function CapacitorMake(pin1, pin2, value, tolerance, state)
{
    return {type: 'C',
            state: state,
            tolerance: pF(tolerance),
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

function InductorMake(pin1, pin2, value, tolerance, state)
{
    return {type: 'L',
            state: state,
            tolerance: pF(tolerance),
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
        alert("Singular matrix in Gaussian Elimination! This circuit cannot be solved.");
    return X;
}

function ParseSimpleFormatCircuitFromString (source)
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
            //currentsources: new Array(),
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
                    circuit.components.push(ResistorMake(RegExp.$2, RegExp.$3, RegExp.$4));
                    break;
                case 'C': case 'c':
                    circuit.components.push(CapacitorMake(RegExp.$2, RegExp.$3, RegExp.$4));
                    break;
                case 'L': case 'l':
                    circuit.components.push(InductorMake(RegExp.$2, RegExp.$3, RegExp.$4));
                    break;
            }
        }
        else if (lines[i].match(sources))
        {
            switch (RegExp.$1)
            {
                case 'I': case 'i':
                    //circuit.currentsources.push(CurrentSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5))
                    circuit.components.push(CurrentSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5));
                    break;
                case 'V': case 'v':
                    circuit.components.push(VoltageSourceMake(RegExp.$2, RegExp.$3, RegExp.$4, RegExp.$5));
                    break;   
            }
        }
        else if (lines[i].match(simulationinfo))
        {
            circuit.simulationinfo.steps = pI(RegExp.$1);
            circuit.simulationinfo.startFrequency = pF(RegExp.$2);
            circuit.simulationinfo.endFrequency = pF(RegExp.$3);
        }
        else if (lines[i].match(probelocations))
        {
            circuit.probes.push(ProbeMake(RegExp.$1));
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

function Analyse (parseResult) 
{
    if (parseResult.errors.length != 0)
    {
        return {error:"Circuit failed to parse!"};
    }

    var result = [],
        circuit = parseResult.circuit,
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
            linearEquations[node][unknown] = {in:[], out:[]};
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
                    linearEquations[pin1][maxNode].in.push(component);
                }
                else
                {
                    linearEquations[pin1][pin1].in.push(component);
                    if (pin2 >= 0)
                        linearEquations[pin1][pin2].out.push(component);
                }
            }
            else if (pin2 == node)
            {
                if (component.type == 'I')
                {
                    linearEquations[pin2][maxNode].out.push(component);
                }
                else
                {
                    linearEquations[pin2][pin2].in.push(component);
                    if (pin1 >= 0)
                        linearEquations[pin2][pin1].out.push(component);
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
            component = 0;
        
        for (; equ < linearEquations.length; equ++)
        {
            matrix[equ] = new Array(linearEquations[equ].length);
            for (node = 0; node < linearEquations[equ].length; node++)
            {
                if (!matrix[equ][node])
                    matrix[equ][node] = ZMake(0.0, 0.0);
                    
                for (var i = 0; i < linearEquations[equ][node].in.length; i++)
                {
                    var component = linearEquations[equ][node].in[i];
                    switch (component.type)
                    {
                        //case 'V':
                        //    matrix[equ][node] = ZAdd(matrix[equ][node], VoltageSourceAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                        //    break;
                        case 'I':
                            matrix[equ][node] = ZAdd(matrix[equ][node], CurrentSourceAdmittanceAtOmega(component, omega));
                            break;
                        case 'R':
                            matrix[equ][node] = ZAdd(matrix[equ][node], ResistorAdmittanceAtOmega(component, omega));
                            break;
                        case 'L':
                            matrix[equ][node] = ZAdd(matrix[equ][node], InductorAdmittanceAtOmega(component, omega));
                            break;
                        case 'C':
                            matrix[equ][node] = ZAdd(matrix[equ][node], CapacitorAdmittanceAtOmega(component, omega));
                            break;
                    }
                }
                for (var o = 0; o < linearEquations[equ][node].out.length; o++)
                {
                    var component = linearEquations[equ][node].out[o];
                    switch (component.type)
                    {
                        //case 'V':
                            // according to uni code
                        //    break;
                        case 'I':
                            matrix[equ][node] = ZSubtract(matrix[equ][node], CurrentSourceAdmittanceAtOmega(component, omega));
                            break;
                        case 'R':
                            matrix[equ][node] = ZSubtract(matrix[equ][node], ResistorAdmittanceAtOmega(component, omega));
                            break;
                        case 'L':
                            matrix[equ][node] = ZSubtract(matrix[equ][node], InductorAdmittanceAtOmega(component, omega));
                            break;
                        case 'C':
                            matrix[equ][node] = ZSubtract(matrix[equ][node], CapacitorAdmittanceAtOmega(component, omega));
                            break;
                    }
                }
            }
        }
        
        //return matrix;
        // solve matrix
        result[step] = {};
        result[step].solution = GaussianElimination(matrix);
        result[step].frequency = frequency;
        result[step].omega = omega;
        frequency += fstep;
    }
    
    return result;
};

self.addEventListener('message', function (event) 
{
    this.postMessage(Analyse(ParseSimpleFormatCircuitFromString(event.data)));
}, false);
