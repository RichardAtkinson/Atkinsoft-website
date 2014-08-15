function synthesizerVoice (context) {

	var filterFrequency = 5120;
	var resonance = 1;
	var filterMode = 0;
	var filterArray = [0, 2, 1, 6, 7];
	var filterText = ["lowpass", "bandpass", "highpass", "notch", "allpass"];
	var gain = Math.pow(10, -0.5);
	
	var pitchReference = 440;
	var noteValue = 0;
	var gate = 0;
	var coarseTune = [0, 0, 0];
	var fineTune = [-15, 0, +9];
	var fineTuneCoefficient = 1000000 / 16777216;
	var waveform = [2, 2, 2];
	
	var oscArray = [0, 3, 2, 1];
	var oscText = ["sine", "square", "sawtooth", "triangle"];
	
	var pulseWidth = [0.25, 0.25, 0.25];
	
	// create three local periodicWaves, one for each oscillator

	var pulseLength = 4096;
	var pulseA = new Float32Array(pulseLength);
	var pulseB = new Float32Array(pulseLength);
	
	var pulseWavePeriodicWave = [];
	
	for (var i = 0; i < 3; i++) {
	
		for (var j = 0; j < pulseLength; j++) {
			pulseA[j] = (Math.sin(2 * Math.PI * j * pulseWidth[i]) / (j * Math.PI));
			pulseB[j] = ((1 - Math.cos(2 * Math.PI * j * pulseWidth[i])) / (j * Math.PI));
		}
		
		pulseWavePeriodicWave[i] = context.createPeriodicWave(pulseA, pulseB);
	}
	
	var oscEnable = [1, 1, 1];
	
	var attack = [0, 0, 0];
	var decay = [0, 0, 0];
	var sustain = [1, 1, 1];
	var release = [0, 0, 0];
	var smallAmplitude = 0.001;
	
	var oscillator = [context.createOscillator(), context.createOscillator(), context.createOscillator()];
	var gainNode = [context.createGain(), context.createGain(), context.createGain()];
	var filterNode = context.createBiquadFilter();
	var postFilterGain = context.createGain();
	
	function setFrequency(osc) {
		calculatedValue = pitchReference * Math.pow(2, (noteValue + coarseTune[osc]) / 12) + fineTune[osc] * fineTuneCoefficient;
		if (calculatedValue > 0 && calculatedValue <= 20480) {
			oscillator[osc].frequency.value = calculatedValue;
		}
	}
	
	this.setNoteValue = function (value) {
		noteValue = value;
		for (var i = 0; i < 3; i++) {
		setFrequency(i);
		}
		setFilterFrequency(); // 100% keyboard filter tracking
	}
	
	this.setCoarseTune = function (osc, value) {
		coarseTune[osc] = value;
		setFrequency(osc);
	}
	
	this.setFineTune = function (osc, value) {
		fineTune[osc] = value;
		setFrequency(osc);
	}
	
	function setWaveform(osc) {
		// needs to catch the case where waveform[osc] = 4, pulse wave
		if (waveform[osc] == 4) {
			oscillator[osc].setPeriodicWave(pulseWavePeriodicWave[osc]);
		} else {
			oscillator[osc].type = oscText[oscArray[waveform[osc]]];
		}
	}
	
	this.setWaveform = function (osc, value) {
		waveform[osc] = value;
		setWaveform(osc);
	}
	
	
	function setPulseWidth(osc, periodicWave) {

		if (waveform[osc] == 4) {
			oscillator[osc].setPeriodicWave(periodicWave);
		}
	
	}
	
	this.setPulseWidth = function(osc, periodicWave) {
		// store locally
		pulseWavePeriodicWave[osc] = periodicWave;

		setPulseWidth(osc, periodicWave);
	
	}
	
	function setAttack(osc) {
	// Nothing to do at the moment; instantaneous slider changes don't affect envelope generators
	}
	
	this.setAttack = function(osc, value) {
		attack[osc] = value;
		setAttack(osc);
	}
	
	function setDecay(osc) {
	// Nothing to do at the moment; instantaneous slider changes don't affect envelope generators
	}
	
	this.setDecay = function(osc, value) {
		decay[osc] = value;
		setDecay(osc);
	}
	
	function setSustain(osc) {
	
	// Nothing to do at the moment; instantaneous slider changes don't affect envelope generators
	}
	
	this.setSustain = function(osc, value) {
		sustain[osc] = value;
		if (sustain[osc] == 0) {
			sustain[osc] = smallAmplitude;
		}
		setSustain(osc);
	}
	
	function setRelease(osc) {
	// Nothing to do at the moment; instantaneous slider changes don't affect envelope generators
	}
	
	this.setRelease = function(osc, value) {
		release[osc] = value;
		setRelease(osc);
	}
	
	// this is the gain for the individual oscillators, to be controlled by envelope generators
	
	function setOscillatorGain(osc) {
		gainNode[osc].gain.value = 0;
	}
	
	this.toggleOscillatorEnable = function(osc) {
		oscEnable[osc] = 1 - oscEnable[osc];
		
		if (gate = 1) { // this voice currently turned on, must turn on or off envelope generator
			if (oscEnable[osc] == 1) { // oscillator just turned on
				turnOnEnvelopeGenerator(osc);
			} else { // oscillator just turned off
				turnOffEnvelopeGenerator(osc);
			}
		}
	}
	
	
	function setFilterFrequency() {
		// 100% keyboard filter tracking
		filterNode.frequency.value = filterFrequency * Math.pow(2, noteValue / 12);
	}
	
	this.setFilterFrequency = function (value) {
		filterFrequency = value;
		setFilterFrequency();
	}
	
	function setResonance() {
		filterNode.Q.value = resonance;
	}
	
	this.setResonance = function (value) {
		resonance = value;
		setResonance();
	}
	
	function setFilterType() {
		filterNode.type = filterText[filterMode];
	}
	
	this.setFilterType = function (value) {
		filterMode = value;
		setFilterType();
	}
	
	function setPostFilterGain() {
		postFilterGain.gain.value = gain;
	}
	
	this.setPostFilterGain = function (value) {
		gain = value;
		setPostFilterGain();
	}
	
	// set up oscillators with default values, connect oscillators to gains, gains to filter
	
	for (var i = 0; i < 3; i++) {
		setFrequency(i);
		setWaveform(i);
		setPulseWidth(i);
		setOscillatorGain(i);
		oscillator[i].connect(gainNode[i]);
		gainNode[i].connect(filterNode);
	}
	
	// set up filter and post filter gain
	
	setFilterFrequency();
	setResonance();
	setFilterType();
	setPostFilterGain();
	
	// connect filter to final gain, final gain to destination
	
	filterNode.connect(postFilterGain);
	postFilterGain.connect(context.destination);
	
	// functions for starting oscillators, turning voice on and off, envelope generators
	
	this.start = function() {
		for (i = 0; i < 3; i++) {
			oscillator[i].start(0);
			
		}
	}
	
	this.gateOn = function() {
		gate = 1;
		for (i = 0; i < 3; i++) {
			if (oscEnable[i] == 1) { // turn on envelope generators where oscillators are enabled
				turnOnEnvelopeGenerator(i);
			}
		}
	}
	
	this.gateOff = function() {
		gate = 0;
		for (i = 0; i < 3; i++) {
			if (oscEnable[i] == 1) { // turn off envelope generators where oscillators are enabled
				turnOffEnvelopeGenerator(i);
			}
		}
	}
	
	function turnOnEnvelopeGenerator(osc) {
	
		var now = context.currentTime;
		gainNode[osc].gain.cancelScheduledValues(now);
		var currentGain = gainNode[osc].gain.value;
		gainNode[osc].gain.setValueAtTime(currentGain, now);
		gainNode[osc].gain.linearRampToValueAtTime(1, now + (0.002 * Math.pow(2, attack[osc] * 12)));
		gainNode[osc].gain.exponentialRampToValueAtTime(sustain[osc], now + (0.002 * Math.pow(2, attack[osc] * 12)) + (0.006 * Math.pow(2, decay[osc] * 12)));
		
	}
	
	function turnOffEnvelopeGenerator(osc) {
	
		var now = context.currentTime;
		var currentGain = gainNode[osc].gain.value;
		gainNode[osc].gain.cancelScheduledValues(now);
		gainNode[osc].gain.setValueAtTime(currentGain, now);
		gainNode[osc].gain.exponentialRampToValueAtTime(smallAmplitude, now + (0.006 * Math.pow(2, release[osc] * 12)));

	}

}
