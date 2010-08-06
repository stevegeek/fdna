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

importScripts('FDNA.js'); 

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
            if (FDNA.ZModulus(A[j][i]) > FDNA.ZModulus(A[max_row][i]))
                max_row = j;
        }
        // swap max row with row i of [A:y]
        for (k = i; k < N + 1; k++)
        {
            var tmp       = FDNA.ZMakeCopy(A[i][k]);
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
                        A[j][i] = FDNA.ZMake(0.0,0.0);
                    if (!A[i][k])
                        A[i][k] = FDNA.ZMake(0.0,0.0);
                    if (!A[j][k])
                        A[j][k] = FDNA.ZMake(0.0,0.0);

                    A[j][k] = FDNA.ZSubtract(A[j][k], FDNA.ZMultiply(A[i][k], FDNA.ZDivide(A[j][i], A[i][i])));
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
        X[j] = FDNA.ZMake(0.0,0.0);

    for (j = N - 1; j >= 0; j--)
    {
        var sum = FDNA.ZMake(0.0,0.0);
        for (k = j + 1; k < N; k++)
        {
            A[j][k] = FDNA.ZMultiply(A[j][k], X[k]);
            sum = FDNA.ZAdd(sum, A[j][k]);
        }

        X[j] = FDNA.ZDivide(FDNA.ZSubtract(A[j][N], sum), A[j][j]);
    }
    return X;
}

FDNA.GaussianElimination = function(matrix)
{
    if (eliminate (matrix))
        X = substitute(matrix);
    else
        alert("Singular matrix in Gaussian Elimination! This circuit cannot be solved.");
    return X;
}

FDNA.Analyse = function (circuit) 
{
    var result = [],
        linearEquations = [],
        count = circuit.components.length,
        maxNode = 0,
        i = 0;
        
    if (!count)
    {
        return {error:"No components found in circuit!"};
    }
    
    for (; i < count; i++)
    {
        // FIXME: pins assumed to be 2
        
        // We subtract 1 as the 0 node is assumed to be the reference node and does not have equs built for it
        var pin1 = circuit.components[i].pins[0] - 1,
            pin2 = circuit.components[i].pins[1] - 1;
            
        if (pin1 > maxNode)
            maxNode = pin1;
        if (pin2 > maxNode)
            maxNode = pin2;
                
        if (pin1 >= 0)
        {    
            if (!linearEquations[pin1])
                linearEquations[pin1] = new Array();
            if (pin1 != pin2)
            {
                if (!linearEquations[pin1][pin1])
                    linearEquations[pin1][pin1] = new Array();

                linearEquations[pin1][pin1].push(circuit.components[i]);

                if (pin2 >= 0)
                {
                    if (!linearEquations[pin1][pin2])
                        linearEquations[pin1][pin2] = new Array();

                    linearEquations[pin1][pin2].push(circuit.components[i]);
                }
            }
        }
        
        if (pin2 >= 0)
        {
            if (!linearEquations[pin2])
                linearEquations[pin2] = new Array();
            if (pin1 != pin2)
            {
                if (!linearEquations[pin2][pin2])
                    linearEquations[pin2][pin2] = new Array();
                
                linearEquations[pin2][pin2].push(circuit.components[i]);

                if (pin1 >= 0)
                {
                    if (!linearEquations[pin2][pin1])
                        linearEquations[pin2][pin1] = new Array();

                    linearEquations[pin2][pin1].push(circuit.components[i]);
                }
            }
        }
    }
    
    count = circuit.currentsources.length;
    var rhs = maxNode + 1;

    if (!count)
    {
        return {error:"No current sources found in circuit!"};
    }
    
    for (i = 0; i < count; i++)
    {
        var pin1 = circuit.currentsources[i].pins[0] - 1,
            pin2 = circuit.currentsources[i].pins[1] - 1;
            
        if (pin1 >= 0)
        {    
            if (!linearEquations[pin1])
                linearEquations[pin1] = new Array();
            
            if (!linearEquations[pin1][rhs])
                linearEquations[pin1][rhs] = new Array();

            linearEquations[pin1][rhs].push(circuit.currentsources[i]);

            if (pin2 >= 0)
            {
                if (!linearEquations[pin2][rhs])
                    linearEquations[pin2][rhs] = new Array();

                linearEquations[pin2][rhs].push(circuit.currentsources[i]);
            }
        }

        if (pin2 >= 0)
        {
            if (!linearEquations[pin2])
                linearEquations[pin2] = new Array();
            
            if (!linearEquations[pin2][rhs])
                linearEquations[pin2][rhs] = new Array();

            linearEquations[pin2][rhs].push(circuit.currentsources[i]);

            if (pin1 >= 0)
            {
                if (!linearEquations[pin1][rhs])
                    linearEquations[pin1][rhs] = new Array();

                linearEquations[pin1][rhs].push(circuit.currentsources[i]);
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
                    matrix[equ][node] = FDNA.ZMake(0.0, 0.0);
                if (!linearEquations[equ][node])
                {
                    continue;
                }

                if (equ == node)
                {
                    //matrix[equ][node].add()
                    for (component = 0; component < linearEquations[equ][node].length; component++)
                    {
                        switch (linearEquations[equ][node][component].type)
                        {
                            case 'V':
                                matrix[equ][node] = FDNA.ZAdd(matrix[equ][node], FDNA.VoltageSourceAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'I':
                                matrix[equ][node] = FDNA.ZAdd(matrix[equ][node], FDNA.CurrentSourceAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'R':
                                matrix[equ][node] = FDNA.ZAdd(matrix[equ][node], FDNA.ResistorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'L':
                                matrix[equ][node] = FDNA.ZAdd(matrix[equ][node], FDNA.InductorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'C':
                                matrix[equ][node] = FDNA.ZAdd(matrix[equ][node], FDNA.CapacitorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                        }
                    }
                }
                else
                {                    
                    for (component = 0; component < linearEquations[equ][node].length; component++)
                    {   
                        switch (linearEquations[equ][node][component].type)
                        {
                            case 'V':
                                // according to uni code
                                break;
                            case 'I':
                                matrix[equ][node] = FDNA.ZSubtract(matrix[equ][node], FDNA.CurrentSourceAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'R':
                                matrix[equ][node] = FDNA.ZSubtract(matrix[equ][node], FDNA.ResistorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'L':
                                matrix[equ][node] = FDNA.ZSubtract(matrix[equ][node], FDNA.InductorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                            case 'C':
                                matrix[equ][node] = FDNA.ZSubtract(matrix[equ][node], FDNA.CapacitorAdmittanceAtOmega(linearEquations[equ][node][component], omega));
                                break;
                        }
                    }
                }

            }
        }
        
        // solve matrix
        result[step] = {};
        result[step].solution = FDNA.GaussianElimination(matrix);
        result[step].frequency = frequency;
        result[step].omega = omega;
        frequency += fstep;
    }
    
    return result;
};

self.addEventListener('message', function (event) 
{
    this.postMessage(FDNA.Analyse(event.data));
}, false);
