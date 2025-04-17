/**
 * i've never picked a protected flower - Interactive Installation
 * Input controllers for MIDI and keyboard interaction
 */

// Global state reference (will be set by main.js)
let appState = null;

// Parameter mappings for inputs
const parameterMappings = {
  // MIDI Control Change mappings (CC number -> parameter)
  midi: {
    1: { param: 'animationSpeed', min: 0, max: 2 }, // Modulation wheel
    7: { param: 'jitterAmount', min: 0, max: 1 }, // Volume slider
    16: { param: 'refreshInterval', min: 1000, max: 30000 }, // General Purpose 1
    17: { param: 'asciiDensity', min: 0.1, max: 1 }, // General Purpose 2
    18: { param: 'fontSize', min: 8, max: 24 }, // General Purpose 3
    19: { param: 'canvasCount', min: 1, max: 5, integer: true }, // General Purpose 4
    20: { param: 'patternType', options: ['wallpaper', 'glass', 'flower'] }, // Select pattern type
    21: { param: 'wallpaperGroup', options: window.groupNameString } // Select wallpaper group
  },
  
  // Keyboard mappings (key -> action)
  keyboard: {
    ' ': { action: 'generateNewPoem' },
    'ArrowUp': { action: 'increaseParam', param: 'animationSpeed', step: 0.1, min: 0, max: 2 },
    'ArrowDown': { action: 'decreaseParam', param: 'animationSpeed', step: 0.1, min: 0, max: 2 },
    'ArrowLeft': { action: 'prevOption', param: 'patternType', options: ['wallpaper', 'glass', 'flower'] },
    'ArrowRight': { action: 'nextOption', param: 'patternType', options: ['wallpaper', 'glass', 'flower'] },
    'w': { action: 'prevOption', param: 'wallpaperGroup', options: window.groupNameString },
    's': { action: 'nextOption', param: 'wallpaperGroup', options: window.groupNameString },
    'a': { action: 'decreaseParam', param: 'refreshInterval', step: 1000, min: 1000, max: 30000 },
    'd': { action: 'increaseParam', param: 'refreshInterval', step: 1000, min: 1000, max: 30000 },
    'q': { action: 'decreaseParam', param: 'canvasCount', step: 1, min: 1, max: 5, integer: true },
    'e': { action: 'increaseParam', param: 'canvasCount', step: 1, min: 1, max: 5, integer: true },
    'z': { action: 'decreaseParam', param: 'fontSize', step: 1, min: 8, max: 24, integer: true },
    'c': { action: 'increaseParam', param: 'fontSize', step: 1, min: 8, max: 24, integer: true },
    'r': { action: 'randomizeParams' },
    't': { action: 'toggleAutoTransition' },
    'f': { action: 'toggleFullscreen' }
  }
};

// Keep track of the last parameter change for UI updates
let lastChangedParam = {
  name: null,
  value: null,
  timestamp: 0
};

// Initialize controllers with the application state
function initialize(state, updateCallback) {
  appState = state;
  initializeMIDI(updateCallback);
  initializeKeyboard(updateCallback);
  
  console.log("Input controllers initialized");
  return {
    midiAvailable: navigator.requestMIDIAccess !== undefined,
    getLastChangedParam: () => lastChangedParam,
    getMappings: () => parameterMappings
  };
}

// MIDI Controller handling
function initializeMIDI(updateCallback) {
  if (!navigator.requestMIDIAccess) {
    console.log("WebMIDI is not supported in this browser.");
    return;
  }
  
  navigator.requestMIDIAccess()
    .then(access => {
      const inputs = access.inputs.values();
      
      // Display connected MIDI devices
      let deviceCount = 0;
      for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        console.log(`MIDI device connected: ${input.value.name}`);
        input.value.onmidimessage = message => handleMIDIMessage(message, updateCallback);
        deviceCount++;
      }
      
      console.log(`${deviceCount} MIDI devices connected`);
      
      // Listen for MIDI device connections/disconnections
      access.onstatechange = event => {
        console.log(`MIDI device ${event.port.name} ${event.port.state}`);
        if (event.port.state === 'connected' && event.port.type === 'input') {
          event.port.onmidimessage = message => handleMIDIMessage(message, updateCallback);
        }
      };
    })
    .catch(error => {
      console.error("Failed to access MIDI devices:", error);
    });
}

// Handle incoming MIDI messages
function handleMIDIMessage(message, updateCallback) {
  const [command, note, velocity] = message.data;
  
  // Handle Note On messages (144-159)
  if (command >= 144 && command <= 159 && velocity > 0) {
    handleNoteOn(note, velocity, updateCallback);
  } 
  // Handle Note Off messages (128-143) or Note On with velocity 0
  else if ((command >= 128 && command <= 143) || (command >= 144 && command <= 159 && velocity === 0)) {
    handleNoteOff(note, updateCallback);
  } 
  // Handle Control Change messages (176-191)
  else if (command >= 176 && command <= 191) {
    handleControlChange(note, velocity, updateCallback);
  }
}

// Process Note On messages
function handleNoteOn(note, velocity, updateCallback) {
  // Map notes to trigger new poems with different seed words
  // Use note numbers to select from the seed wordset
  const seedWords = window.PoemGenerator.getSeedWords();
  const seedWordIndex = note % seedWords.length;
  const seedWord = seedWords[seedWordIndex];
  
  console.log(`Note On: ${note}, Velocity: ${velocity}, Seed Word: ${seedWord}`);
  
  // Trigger a new poem with the selected seed word
  appState.seedWord = seedWord;
  updateCallback({ action: 'generateNewPoem', seedWord });
  
  // Update the last changed parameter
  updateLastChangedParam('seedWord', seedWord);
}

// Process Note Off messages
function handleNoteOff(note, updateCallback) {
  // Implement if needed
}

// Process Control Change messages
function handleControlChange(control, value, updateCallback) {
  // Map control values to parameters using the mapping
  const mapping = parameterMappings.midi[control];
  if (!mapping) return;
  
  // Normalize MIDI value (0-127) to parameter range
  const normalizedValue = value / 127;
  let paramValue;
  
  if (mapping.options) {
    // For options, select based on value range
    const optionIndex = Math.floor(normalizedValue * mapping.options.length);
    paramValue = mapping.options[Math.min(optionIndex, mapping.options.length - 1)];
  } else {
    // For numeric values, map to min-max range
    paramValue = mapping.min + normalizedValue * (mapping.max - mapping.min);
    
    // Round to integer if needed
    if (mapping.integer) {
      paramValue = Math.round(paramValue);
    }
  }
  
  // Update the parameter in the app state
  appState[mapping.param] = paramValue;
  
  console.log(`MIDI CC: ${control}, Value: ${value}, Parameter: ${mapping.param}, New Value: ${paramValue}`);
  
  // Update the UI if needed
  updateCallback({ 
    action: 'parameterChanged', 
    parameter: mapping.param, 
    value: paramValue 
  });
  
  // Update the last changed parameter
  updateLastChangedParam(mapping.param, paramValue);
}

// Keyboard controller handling
function initializeKeyboard(updateCallback) {
  document.addEventListener('keydown', event => {
    // Ignore if user is typing in an input field
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }
    
    const mapping = parameterMappings.keyboard[event.key];
    if (!mapping) return;
    
    // Prevent default browser behavior for the key
    event.preventDefault();
    
    handleKeyboardAction(mapping, updateCallback);
  });
  
  console.log("Keyboard controller initialized");
}

// Process keyboard actions
function handleKeyboardAction(mapping, updateCallback) {
  switch (mapping.action) {
    case 'generateNewPoem':
      updateCallback({ action: 'generateNewPoem' });
      break;
      
    case 'increaseParam':
      increaseParameter(mapping, updateCallback);
      break;
      
    case 'decreaseParam':
      decreaseParameter(mapping, updateCallback);
      break;
      
    case 'nextOption':
      nextOption(mapping, updateCallback);
      break;
      
    case 'prevOption':
      prevOption(mapping, updateCallback);
      break;
      
    case 'randomizeParams':
      randomizeParameters(updateCallback);
      break;
      
    case 'toggleAutoTransition':
      appState.autoTransition = !appState.autoTransition;
      updateCallback({ action: 'toggleAutoTransition', value: appState.autoTransition });
      updateLastChangedParam('autoTransition', appState.autoTransition);
      break;
      
    case 'toggleFullscreen':
      toggleFullscreen(updateCallback);
      break;
  }
}

// Increase a numeric parameter
function increaseParameter(mapping, updateCallback) {
  const { param, step, min, max, integer } = mapping;
  let value = appState[param] + step;
  
  // Apply constraints
  value = Math.min(max, value);
  if (integer) value = Math.round(value);
  
  // Update state
  appState[param] = value;
  
  // Notify callback
  updateCallback({ 
    action: 'parameterChanged', 
    parameter: param, 
    value 
  });
  
  // Update the last changed parameter
  updateLastChangedParam(param, value);
  
  console.log(`Parameter ${param} increased to ${value}`);
}

// Decrease a numeric parameter
function decreaseParameter(mapping, updateCallback) {
  const { param, step, min, max, integer } = mapping;
  let value = appState[param] - step;
  
  // Apply constraints
  value = Math.max(min, value);
  if (integer) value = Math.round(value);
  
  // Update state
  appState[param] = value;
  
  // Notify callback
  updateCallback({ 
    action: 'parameterChanged', 
    parameter: param, 
    value 
  });
  
  // Update the last changed parameter
  updateLastChangedParam(param, value);
  
  console.log(`Parameter ${param} decreased to ${value}`);
}

// Select the next option from a list
function nextOption(mapping, updateCallback) {
  const { param, options } = mapping;
  const currentValue = appState[param];
  const currentIndex = options.indexOf(currentValue);
  const nextIndex = (currentIndex + 1) % options.length;
  const value = options[nextIndex];
  
  // Update state
  appState[param] = value;
  
  // Notify callback
  updateCallback({ 
    action: 'parameterChanged', 
    parameter: param, 
    value 
  });
  
  // Update the last changed parameter
  updateLastChangedParam(param, value);
  
  console.log(`Parameter ${param} changed to ${value}`);
}

// Select the previous option from a list
function prevOption(mapping, updateCallback) {
  const { param, options } = mapping;
  const currentValue = appState[param];
  const currentIndex = options.indexOf(currentValue);
  const prevIndex = (currentIndex - 1 + options.length) % options.length;
  const value = options[prevIndex];
  
  // Update state
  appState[param] = value;
  
  // Notify callback
  updateCallback({ 
    action: 'parameterChanged', 
    parameter: param, 
    value 
  });
  
  // Update the last changed parameter
  updateLastChangedParam(param, value);
  
  console.log(`Parameter ${param} changed to ${value}`);
}

// Randomize all parameters
function randomizeParameters(updateCallback) {
  // Go through each MIDI mapping and randomize the parameter
  for (const controlNumber in parameterMappings.midi) {
    const mapping = parameterMappings.midi[controlNumber];
    
    if (mapping.options) {
      // For options, select a random option
      const randomIndex = Math.floor(Math.random() * mapping.options.length);
      appState[mapping.param] = mapping.options[randomIndex];
    } else {
      // For numeric values, generate a random value in the range
      let value = mapping.min + Math.random() * (mapping.max - mapping.min);
      if (mapping.integer) value = Math.round(value);
      appState[mapping.param] = value;
    }
  }
  
  // Notify about the randomization
  updateCallback({ action: 'randomizeParameters' });
  
  console.log("All parameters randomized");
}

// Toggle fullscreen mode
function toggleFullscreen(updateCallback) {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable full-screen mode: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
  
  updateCallback({ action: 'toggleFullscreen' });
}

// Update the record of the last changed parameter
function updateLastChangedParam(name, value) {
  lastChangedParam = {
    name,
    value,
    timestamp: Date.now()
  };
}

// Export the input controller functions
window.InputControllers = {
  initialize
};
