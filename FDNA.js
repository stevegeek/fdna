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

// http://my.opera.com/GreyWyvern/blog/show.dml/1725165
Object.prototype.clone = function() {
  var newObj = (this instanceof Array) ? [] : {};
  for (i in this) {
    if (i == 'clone') continue;
    if (this[i] && typeof this[i] == "object") {
      newObj[i] = this[i].clone();
    } else newObj[i] = this[i]
  } return newObj;
};

FDNA = {Devices:new Array()};

FDNA.ComplexNumber = Class.extend(
{
    init: function (Re, Im) 
    {
        this.Re = Re;
        this.Im = Im;
    },
    getModulus: function ()
    {
        return Math.sqrt((this.Re*this.Re) + (this.Im*this.Im));
    },
    getArg: function ()
    {
        return (this.Re !== 0.0) ? Math.atan(this.Im/this.Re) : 0.0;
    },
    getArgInDegrees: function ()
    {
        return this.getArg() * (360/(2*Math.PI));
    },
    divideBy: function (divisor)
    {
        var a = this.Re;
        var b = this.Im;
        // (a + jb)/(c + jd) = (a + jb)(c - jd) / (c + jd)(c - jd)
        // ( ac + jbc - jad + bd) / (cc + dd)
        // ( ac + bd )/ (cc + dd) + ( jbc -jad) / (cc + dd)
        this.Re = ( (a * divisor.Re)          + (b * divisor.Im) ) / 
                  ( (divisor.Re * divisor.Re)  + (divisor.Im * divisor.Im) );
        this.Im = ( ((b * divisor.Re)         - (a * divisor.Im)) /
                  ( (divisor.Re * divisor.Re)  + (divisor.Im * divisor.Im)) );   
    },
    multiplyBy: function (factor)
    {
        // (a + jb) (c + jd) = ac + jad + jbc - bd
        var a = this.Re;
        var b = this.Im;
        this.Re = (a * factor.Re) - (b * factor.Im);
        this.Im = (a * factor.Im) + (b * factor.Re);
    },
    add: function (term)
    {
        this.Re += term.Re;
        this.Im += term.Im;        
    },
    subtract: function (term)
    {
        this.Re -= term.Re;
        this.Im -= term.Im;
    }
});

// http://engineersphere.com/basic-electrical-concepts/frequency-response-for-mosfetbjt.html
//http://ieeexplore.ieee.org/iel5/43/20141/00931011.pdf?arnumber=931011

FDNA.Devices.Source = Class.extend(
{
    init: function (magnitude, phase, tolerance, state)
    {
        this.state = state;
        this.tolerance = tolerance;
        
        // FIXME: do tolerance on value
        this.magnitude = parseFloat(magnitude);
        this.phase = parseFloat(phase);
    }
});

FDNA.Devices.CurrentSource = FDNA.Devices.Source.extend(
{
    init : function (pin1, pin2, magnitude, phase, tolerance, state)
    {
        this.type = 'I';
        this._super(magnitude, phase, tolerance, state);
        this.pins = new Array(parseInt(pin1), parseInt(pin2));
        //this.impedance = new FDNA.ComplexNumber(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
        // current flows opposite to convention of voltage +/-
        this.admittance = new FDNA.ComplexNumber(-1.0 * magnitude * Math.cos(phase), -1.0 * magnitude * Math.sin(phase));
    },

    getAdmittanceAtOmega: function (omega)
    {
        return this.admittance;
    }
});

FDNA.Devices.VoltageSource = FDNA.Devices.Source.extend(
{
    init : function (pin1, pin2, magnitude, phase, tolerance, state)
    {
        this.type = 'V';
        this._super(magnitude, phase, tolerance, state);
        this.pins = new Array(parseInt(pin1), parseInt(pin2));
        this.admittance = new FDNA.ComplexNumber(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
    },

    getAdmittanceAtOmega: function (omega)
    {
        return this.admittance;
    }
});

FDNA.Devices.Probe = Class.extend(
{
    init: function (pin)
    {
        this.pin = pin;
    }
});

FDNA.Devices.Passive = Class.extend(
{
    init: function (value, tolerance, state)
    {
        this.state = state;
        this.tolerance = parseFloat(tolerance);
        
        // FIXME: do tolerance on value
        this.value = parseFloat(value);
    }
});

FDNA.Devices.Resistor = FDNA.Devices.Passive.extend(
{
    init : function (pin1, pin2, value, tolerance, state)
    {
        this.type = 'R';
        this._super(value, tolerance, state);
        this.pins = new Array(parseInt(pin1), parseInt(pin2));
        // Zr = R
        this.impedance = new FDNA.ComplexNumber(this.value, 0.0);
        this.admittance = new FDNA.ComplexNumber(1.0 / this.value, 0.0);
    },
    
    getAdmittanceAtOmega: function (omega)
    {
        return this.admittance;
    }
});

FDNA.Devices.Capacitor = FDNA.Devices.Passive.extend(
{
    init : function (pin1, pin2, value, tolerance, state)
    {
        this.type = 'C';
        this._super(value, tolerance, state);
        this.pins = new Array(parseInt(pin1), parseInt(pin2));
        // Zc = 1/jwC
        this.impedance = new FDNA.ComplexNumber(0.0, 1.0 / this.value);
        this.admittance = new FDNA.ComplexNumber(0.0, this.value);
    },
    
    getAdmittanceAtOmega: function (omega)
    {
        var a = this.admittance.clone();
        a.Im *= omega;
        return a;
    }
});

FDNA.Devices.Inductor = FDNA.Devices.Passive.extend(
{
    init : function (pin1, pin2, value, tolerance, state)
    {
        this.type = 'L';
        this._super(value, tolerance, state);
        this.pins = new Array(parseInt(pin1), parseInt(pin2));
        // Zl = jwL
        this.impedance = new FDNA.ComplexNumber(0.0, this.value);
        this.admittance = new FDNA.ComplexNumber(0.0, - 1.0 / this.value);
    },

    getAdmittanceAtOmega: function (omega)
    {
        var a = this.admittance.clone();
        a.Im *= 1.0/omega;
        return a;
    }
});

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
            if (A[j][i].getModulus() > A[max_row][i].getModulus())
                max_row = j;
        }
        // swap max row with row i of [A:y]
        for (k = i; k < N + 1; k++)
        {
            var tmp       = A[i][k].clone();
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
                        A[j][i] = new FDNA.ComplexNumber(0.0,0.0);
                    if (!A[i][k])
                        A[i][k] = new FDNA.ComplexNumber(0.0,0.0);
                    if (!A[j][k])
                        A[j][k] = new FDNA.ComplexNumber(0.0,0.0);
                    var tmp1 = A[j][i].clone(),
                        tmp2 = A[i][k].clone(),
                        tmp3 = A[j][k].clone();
                    tmp1.divideBy(A[i][i]);
                    tmp2.multiplyBy(tmp1);
                    tmp3.subtract(tmp2);
                    A[j][k] = tmp3;
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
        X[j] = new FDNA.ComplexNumber(0.0,0.0);

    for (j = N - 1; j >= 0; j--)
    {
        var sum = new FDNA.ComplexNumber(0.0,0.0);
        for (k = j + 1; k < N; k++)
        {
            A[j][k].multiplyBy(X[k]);
            sum.add(A[j][k]);
        }
        var tmp = A[j][N];
        tmp.subtract(sum);
        tmp.divideBy(A[j][j])
        X[j] = tmp;
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