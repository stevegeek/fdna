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
// http://engineersphere.com/basic-electrical-concepts/frequency-response-for-mosfetbjt.html
//http://ieeexplore.ieee.org/iel5/43/20141/00931011.pdf?arnumber=931011

FDNA = {
        HighlightAndSyntaxCheckSimpleSource : function (source)
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
        },

        HighlightAndSyntaxCheckSPICESource : function (source)
        {    
            return {};
        },
        
        // Complex Number Methods
        ZMake : function (Re, Im)
        {
            return {Re:Re, Im:Im};
        },
        
        ZMakeCopy : function (z)
        {
            return {Re:z.Re,Im:z.Im};
        },
        
        ZModulus : function (z)
        {
            return Math.sqrt((z.Re*z.Re) + (z.Im*z.Im));
        },
        
        ZArg : function (z)
        {
            return (z.Re !== 0.0) ? Math.atan(z.Im/z.Re) : 0.0;
        },
        
        ZArgInDegrees : function (z)
        {
            return this.ZArg(z) * (360/(2*Math.PI));
        },
        
        ZDivide : function (z, divisor)
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
            return this.ZMake(c, d);
        },
        
        ZMultiply : function (z, factor)
        {
            // (a + jb) (c + jd) = ac + jad + jbc - bd
            var a = z.Re;
            var b = z.Im;
            var c = (a * factor.Re) - (b * factor.Im);
            var d = (a * factor.Im) + (b * factor.Re);
            return this.ZMake(c, d);
        },
        
        ZAdd : function (z, term)
        {
            return this.ZMake( z.Re + term.Re, z.Im + term.Im);
        },
        
        ZSubtract : function (z, term)
        {
            return this.ZMake( z.Re - term.Re, z.Im - term.Im);
        },
        
        // Component Helper Methods
        CurrentSourceMake : function (pin1, pin2, magnitude, phase, tolerance, state)
        {
            // current flows opposite to convention of voltage +/-
            return {type:'I', 
                    state:state, 
                    tolerance:parseFloat(tolerance), 
                    magnitude:parseFloat(magnitude), 
                    phase:parseFloat(phase), 
                    pins: new Array(parseInt(pin1), parseInt(pin2)),
                    admittance: this.ZMake(-1.0 * magnitude * Math.cos(phase), -1.0 * magnitude * Math.sin(phase))
                    //impedance: this.ZMake(magnitude * Math.cos(phase), magnitude * Math.sin(phase));
                    };
        },

        CurrentSourceAdmittanceAtOmega : function (isrc, omega)
        {
            return isrc.admittance;
        },

        VoltageSourceMake : function (pin1, pin2, magnitude, phase, tolerance, state)
        {
            return {type:'V', 
                    state:state, 
                    tolerance:parseFloat(tolerance), 
                    magnitude:parseFloat(magnitude), 
                    phase:parseFloat(phase), 
                    pins: new Array(parseInt(pin1), parseInt(pin2)),
                    admittance: this.ZMake(magnitude * Math.cos(phase), magnitude * Math.sin(phase))
                    };
        },

        VoltageSourceAdmittanceAtOmega : function (vsrc, omega)
        {
            return vsrc.admittance;
        },
        
        ProbeMake : function (pin)
        {
            return {pin: pin};
        },

        ResistorMake : function (pin1, pin2, value, tolerance, state)
        {
            return {type: 'R',
                    state: state,
                    tolerance: parseFloat(tolerance),
                    value: parseFloat(value),
                    pins: new Array(parseInt(pin1), parseInt(pin2)),
                    // Zr = R
                    //impedance : this.ZMake(this.value, 0.0),
                    admittance : this.ZMake(1.0 / parseFloat(value), 0.0)
                };                
        },

        ResistorAdmittanceAtOmega : function (res, omega)
        {
            return res.admittance;
        },
                
        CapacitorMake : function (pin1, pin2, value, tolerance, state)
        {
            return {type: 'C',
                    state: state,
                    tolerance: parseFloat(tolerance),
                    value: parseFloat(value),
                    pins: new Array(parseInt(pin1), parseInt(pin2)),
                    // Zc = 1/jwC
                    //impedance : this.ZMake(0.0, 1.0 / this.value),
                    admittance : this.ZMake(0.0, parseFloat(value))
                };                
        },

        CapacitorAdmittanceAtOmega : function (cap, omega)
        {
            var a = this.ZMakeCopy(cap.admittance);
            a.Im *= omega;
            return a;
        },
        
        InductorMake : function (pin1, pin2, value, tolerance, state)
        {
            return {type: 'L',
                    state: state,
                    tolerance: parseFloat(tolerance),
                    value: parseFloat(value),
                    pins: new Array(parseInt(pin1), parseInt(pin2)),
                    // Zl = jwL
                    //impedance : this.ZMake(0.0, this.value),
                    admittance : this.ZMake(0.0, - 1.0 / parseFloat(value))
                };                
        },

        InductorAdmittanceAtOmega : function (ind, omega)
        {
            var a = this.ZMakeCopy(ind.admittance);
            a.Im *= 1.0/omega;
            return a;
        }
};

