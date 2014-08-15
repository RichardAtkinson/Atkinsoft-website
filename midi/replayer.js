function Replayer(midiFile, synth) {
	var trackStates = [];
	var beatsPerMinute = 120;
	var ticksPerBeat = midiFile.header.ticksPerBeat;
	var channelCount = 16;
	
	for (var i = 0; i < midiFile.tracks.length; i++) {
		trackStates[i] = {
			'nextEventIndex': 0,
			'ticksToNextEvent': (
				midiFile.tracks[i].length ?
					midiFile.tracks[i][0].deltaTime :
					null
			)
		};
	}
	
	function Channel() {
		
		var generatorsByNote = {};
		var currentProgram = PianoProgram;
		
		function noteOn(note, velocity) {
			if (generatorsByNote[note] && !generatorsByNote[note].released) {
				/* playing same note before releasing the last one. BOO */
				generatorsByNote[note].noteOff(); /* TODO: check whether we ought to be passing a velocity in */
			}
			generator = currentProgram.createNote(note, velocity);
			// synth.addGenerator(generator); - no longer using the synth engine
			generatorsByNote[note] = generator;
		}
		function noteOff(note, velocity) {
			if (generatorsByNote[note] && !generatorsByNote[note].released) {
				generatorsByNote[note].noteOff(velocity);
			}
		}
		function setProgram(programNumber) {
			currentProgram = PROGRAMS[programNumber] || PianoProgram;
		}
		
		return {
			'noteOn': noteOn,
			'noteOff': noteOff,
			'setProgram': setProgram
		}
	}
	
	var channels = [];
	for (var i = 0; i < channelCount; i++) {
		channels[i] = Channel();
	}
	
	var nextEventInfo;
	var millisecondsToNextEvent = 0;
	
	function getNextEvent() {
		var ticksToNextEvent = null; // we don't know the number of ticks to the next event yet
		var nextEventTrack = null; // we don't know the track of the next event yet
		var nextEventIndex = null; // we don't know the index into the track of the next event yet
		
		for (var i = 0; i < trackStates.length; i++) { // number of tracks, need to iterate across all tracks to find the earliest next event
			if (
				trackStates[i].ticksToNextEvent != null // if we're not on the last event
				&& (ticksToNextEvent == null || trackStates[i].ticksToNextEvent < ticksToNextEvent) // haven't found a next event yet or this track's next event is earlier than the current earliest next event
			) {
				ticksToNextEvent = trackStates[i].ticksToNextEvent;
				nextEventTrack = i;
				nextEventIndex = trackStates[i].nextEventIndex;
			}
		}
		if (nextEventTrack != null) { // then we found a track with an event, and it's the earliest next event
			/* consume event from that track */
			var nextEvent = midiFile.tracks[nextEventTrack][nextEventIndex];
			if (midiFile.tracks[nextEventTrack][nextEventIndex + 1]) { // if there is an event after this one
				trackStates[nextEventTrack].ticksToNextEvent += midiFile.tracks[nextEventTrack][nextEventIndex + 1].deltaTime;
			} else {
				trackStates[nextEventTrack].ticksToNextEvent = null; // if this is the last event, mark the number to ticks to the next one as null
			}
			trackStates[nextEventTrack].nextEventIndex += 1; // advance the index
			/* advance timings on all tracks by ticksToNextEvent */
			for (var i = 0; i < trackStates.length; i++) {
				if (trackStates[i].ticksToNextEvent != null) {
					trackStates[i].ticksToNextEvent -= ticksToNextEvent
				}
			}
			nextEventInfo = {
				'ticksToEvent': ticksToNextEvent,
				'event': nextEvent,
				'track': nextEventTrack
			}
			var beatsToNextEvent = ticksToNextEvent / ticksPerBeat;
			var secondsToNextEvent = beatsToNextEvent / (beatsPerMinute / 60);
			millisecondsToNextEvent += secondsToNextEvent * 1000;
		} else {
			nextEventInfo = null;
			millisecondsToNextEvent = null;
			self.finished = true;
		}
	}
	
	getNextEvent();
	
	function generate(samples) {
		var data = new Array(samples*2);
		var samplesRemaining = samples;
		var dataOffset = 0;
		
		while (true) {
			if (samplesToNextEvent != null && samplesToNextEvent <= samplesRemaining) {
				/* generate samplesToNextEvent samples, process event and repeat */
				var samplesToGenerate = Math.ceil(samplesToNextEvent);
				if (samplesToGenerate > 0) {
					synth.generateIntoBuffer(samplesToGenerate, data, dataOffset);
					dataOffset += samplesToGenerate * 2;
					samplesRemaining -= samplesToGenerate;
					samplesToNextEvent -= samplesToGenerate;
				}
				
				handleEvent();
				getNextEvent();
			} else {
				/* generate samples to end of buffer */
				if (samplesRemaining > 0) {
					synth.generateIntoBuffer(samplesRemaining, data, dataOffset);
					samplesToNextEvent -= samplesRemaining;
				}
				break;
			}
		}
		return data;
	}
	
	function handleEvent() {
		var event = nextEventInfo.event;
		switch (event.type) {
			case 'meta':
				switch (event.subtype) {
					case 'setTempo':
						beatsPerMinute = 60000000 / event.microsecondsPerBeat
						console.log("set tempo " + beatsPerMinute + " beats per minute");
				}
				break;
			case 'channel':
				switch (event.subtype) { // this is possibly where my synthesizer will access the synthesizer voices
					case 'noteOn':
						// channels[event.channel].noteOn(event.noteNumber, event.velocity);
						console.log("channel " + event.channel + " note " + event.noteNumber + " on with velocity " + event.velocity);
						break;
					case 'noteOff':
						// channels[event.channel].noteOff(event.noteNumber, event.velocity);
						console.log("channel " + event.channel + " note " + event.noteNumber + " off with velocity " + event.velocity);
						break;
					case 'programChange':
						console.log('program change to ' + event.programNumber);
						// channels[event.channel].setProgram(event.programNumber);
						break;
				}
				break;
		}
	}
	
	function replay(audio) {
		console.log('replay');
		audio.write(generate(44100));
		setTimeout(function() {replay(audio)}, 10);
	}
	
	var self = {
		'replay': replay,
		'generate': generate, // pass the generate function in the replayer which is returned
		'finished': false
	}
	return self;
}
