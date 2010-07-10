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
                    matrix[equ][node] = new FDNA.ComplexNumber(0.0, 0.0);
                if (!linearEquations[equ][node])
                {
                    //linearEquations[equ][node] = new FDNA.ComplexNumber(0.0, 0.0);
                    continue;
                }

                if (equ == node)
                {
                    //matrix[equ][node].add()
                    for (component = 0; component < linearEquations[equ][node].length; component++)
                    {
                        matrix[equ][node].add(linearEquations[equ][node][component].getAdmittanceAtOmega(omega));
                    }
                }
                else
                {                    
                    for (component = 0; component < linearEquations[equ][node].length; component++)
                    {   
                        // according to my old uni code ... 
                        if (linearEquations[equ][node][component].type == 'V')
                            continue;

                        matrix[equ][node].subtract(linearEquations[equ][node][component].getAdmittanceAtOmega(omega));
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
