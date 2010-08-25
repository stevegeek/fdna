Frequency Domain Nodal Analysis for RLC circuits
------------------------------------------------
_Copyright Stephen Ierodiaconou, 2010_

Frequency Domain Nodal Analysis in Javascript. Generate the sinusoidal steady state of RLC circuits in the browser and find their resonance point.
[http://www.stephenierodiaconou.com/10k](http://www.stephenierodiaconou.com/10k)

Features include:

*   Circuit diagram editor
*   Circuit text description editor
*   Circuit text description syntax checking and highlighting
*   Frequency domain analysis of the RLC circuits
*   Graphing of results (Magnitude and Phase)

Components include:

*   Current sources
*   Resistor, Capacitors and Inductors
*   Probes
*   Reference (Ground) nodes

For a detailed discussion on RLC circuits see [Wikipedia/RLC](http://en.wikipedia.org/wiki/RLC_circuit).

Examples
--------
There are a couple of example text format circuits included to try before drawing your own circuit.

**Example 1**: This is quite a complex circuit composed of a number serial and parallel RLC components. There is a probe at node 4. Click `Start Analysis` and have a look at the graphs above. The resonance point of the circuit is obvious! Try also adding a probe at nodes 3 and 5 (add lines `P 3` and `P 5`) for example to see some other interesting views of the resonance point.

**Example 2**: This is a simpler serial RLC circuit. The resonance point is obvious if the probe is changed to node 1.

Usage of Circuit Editor
-----------------------
The circuit editor allows you to draw out a circuit diagram and then have the app automatically generate the text description of the circuit.

The circuit editor works on a drag and drop basis. The components above the editor grid can be dragged into the grid and dropped to place. If the component requires a value you will be prompted for its value. Once the component has been placed you can move it again by simply dragging and dropping.

The component images are standard and thus self explanatory (note that the sources are current sources only) and the triangles are probes.

A number of wire components are included to allow maximum flexibility when designing your circuit.

To remove a component from the grid simply drag to to the `Drag here to Drop` cell in the toolbox.

The simulation parameters for the diagram are set above the toolbox. The parameters are: the start frequency in Hz, the stop frequency in Hz and the number of steps between these frequencies to resolve.

When you are happy with your circuit simply click `Convert to Text Format` to generate the text description of the circuit. 

Usage of Circuit Text Editor
----------------------------
The text area allows editing of the current circuit description. As you edit the circuit the area below shows the highlighted source and any syntax errors in red.  Note that anything after an (end) `E`, command is ignored.

Description of Circuit Text Format
----------------------------------
The circuit format is as follows:

Components:

*   `I <node1> <node2> <mag> <phase>` : Sources: A current source provides a complex current flowing from `<node1>` to `<node2>` with a magnitude of `<mag>` and phase `<phase>`.
*   `R <node1> <node2> <value>` : Resistor with value `<value>` Ohms.
*   `C <node1> <node2> <value>` : Capacitors with value `<value>` Farad.
*   `L <node1> <node2> <value>` : Inductors with value `<value>` Henry.
*   `P <node>` : Probes: A probe allows you to visualise the state of a node in the circuit. Any probes in the circuit description will automatically be graphed after the analysis has complete. You can include any number of probes.
*   `F <steps> <start> <stop>` : Simulation Information: This command allows you to specify the frequency range and steps for the analysis. The analysis proceeds from `<start>` frequency in Hz to `<stop>` frequency in Hz over `<steps>` steps.
*   `E` : End Description: This command should appear at the end of the circuit description. Anything after it is ignored so can be used to further comments and notes. 

Source code
-----------
[Source code at GitHub](http://github.com/stevegeek/fdna)

Minified using Google Closure Compiler and http://jsutility.pjoneil.net/.

Uses canvas, your browser must support them!

----------------------------------------------------------------------------
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
