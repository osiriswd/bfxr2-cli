/**
 * Headless audio engine for Bfxr2 CLI
 * Provides Node.js compatible audio generation without browser dependencies
 * 
 * This file loads all required Bfxr modules and provides a simple interface
 * for generating audio from parameters or templates.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ============================================================
// POLYFILLS - Must be set up before loading Bfxr files
// ============================================================

// Math.clamp polyfill
if (typeof Math.clamp !== 'function') {
    Math.clamp = function(value, min, max) {
        return Math.max(min, Math.min(value, max));
    };
}

// lerp function
if (typeof lerp !== 'function') {
    global.lerp = function(a, b, t) {
        return a + t * (b - a);
    };
}

// Constants
const SAMPLE_RATE = 44100;
global.SAMPLE_RATE = SAMPLE_RATE;
global.CONVERSION_FACTOR = (2 * Math.PI) / SAMPLE_RATE;

// Mock AudioContext for Node.js
class MockAudioBuffer {
    constructor(numChannels, length, sampleRate) {
        this._numChannels = numChannels;
        this._length = length;
        this._sampleRate = sampleRate;
        this._channels = [];
        for (let i = 0; i < numChannels; i++) {
            this._channels.push(new Float32Array(length));
        }
    }

    get numberOfChannels() { return this._numChannels; }
    get length() { return this._length; }
    get sampleRate() { return this._sampleRate; }

    getChannelData(channel) {
        return this._channels[channel];
    }

    copyToChannel(source, channel) {
        this._channels[channel].set(source);
    }
}

class MockAudioContext {
    constructor() {
        this.state = 'running';
        this.destination = {};
    }

    createBuffer(numChannels, length, sampleRate) {
        return new MockAudioBuffer(numChannels, length, sampleRate);
    }

    createBufferSource() {
        return {
            buffer: null,
            connect: () => {},
            start: () => {},
            stop: () => {},
            onended: null
        };
    }

    currentTime = 0;
}

// Set up global AUDIO_CONTEXT
global.AUDIO_CONTEXT = new MockAudioContext();
global.ULBS = function() {}; // No-op for Node.js

// Seeded PRNG for reproducibility
class SeededRandom {
    constructor(seed) {
        this.seed = seed || Date.now();
    }

    // Mulberry32 PRNG
    next() {
        this.seed |= 0;
        this.seed = this.seed + 0x6D2B79F5 | 0;
        let t = Math.imul(this.seed ^ this.seed >>> 15, 1 | this.seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Global random instance
let randomInstance = null;

function setSeed(seed) {
    randomInstance = new SeededRandom(seed);
}

function getRandom() {
    if (randomInstance) {
        return randomInstance.next();
    }
    return Math.random();
}

// Store original Math.random
const originalMathRandom = Math.random;

function overrideMathRandom() {
    Math.random = getRandom;
}

function restoreMathRandom() {
    Math.random = originalMathRandom;
    randomInstance = null;
}

// ============================================================
// LOAD REQUIRED FILES
// ============================================================

const JS_FILES = [
    'js/globals.js',
    'js/audio/AKWF.js',
    'js/audio/audio_globals.js',
    'js/audio/puredata_modules.js',
    'js/audio/puredata_parser.js',
    'js/audio/puredata.js',
    'js/audio/riffwave.js',
    'js/audio/Bfxr_DSP.js',
    'js/audio/RealizedSound.js',
    'js/synths/templates.js',
    'js/synths/SynthBase.js',
    'js/synths/Bfxr.js',
    'js/synths/Footsteppr.js'
];

function loadRequiredFiles() {
    const baseDir = path.dirname(path.dirname(__dirname));
    
    for (const filePath of JS_FILES) {
        const fullPath = path.join(baseDir, filePath);
        if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            try {
                vm.runInThisContext(content);
            } catch (e) {
                console.error(`Error loading ${filePath}: ${e.message}`);
                throw e;
            }
        } else {
            console.warn(`Warning: File not found: ${fullPath}`);
        }
    }
}

// Load files immediately
loadRequiredFiles();

// Initialize PureData cosine tables
if (typeof generate_tables === 'function') {
    generate_tables();
}

// ============================================================
// AUDIO GENERATION FUNCTIONS
// ============================================================

/**
 * Generate audio from parameters
 * @param {Object} params - Bfxr parameters
 * @returns {Float32Array} Audio buffer
 */
function generateAudio(params) {
    if (typeof Bfxr === 'undefined') {
        throw new Error('Bfxr class not loaded. Check file paths.');
    }
    
    const bfxr = new Bfxr();
    bfxr.apply_params(params);
    bfxr.generate_sound();
    
    // Get buffer directly from sound
    return bfxr.sound.getBuffer();
}

/**
 * Generate audio from template name
 * @param {string} templateName - Template name (e.g., "pickup_coin")
 * @param {number} [seed] - Optional seed for reproducibility
 * @returns {Float32Array} Audio buffer
 */
function generateFromTemplate(templateName, seed) {
    if (seed !== undefined) {
        setSeed(seed);
        overrideMathRandom();
    }

    if (typeof Bfxr === 'undefined') {
        throw new Error('Bfxr class not loaded.');
    }

    const bfxr = new Bfxr();
    
    // Find and execute template method
    const methodName = 'generate_' + templateName;
    if (typeof bfxr[methodName] === 'function') {
        bfxr[methodName]();
    } else {
        throw new Error(`Unknown template: ${templateName}`);
    }

    // Generate audio
    bfxr.generate_sound();
    const buffer = bfxr.sound.getBuffer();

    if (seed !== undefined) {
        restoreMathRandom();
    }

    return buffer;
}

/**
 * Generate random sound
 * @param {number} [seed] - Optional seed for reproducibility
 * @returns {Float32Array} Audio buffer
 */
function generateRandom(seed) {
    if (seed !== undefined) {
        setSeed(seed);
        overrideMathRandom();
    }

    if (typeof Bfxr === 'undefined') {
        throw new Error('Bfxr class not loaded.');
    }

    const bfxr = new Bfxr();
    bfxr.randomize_params();
    bfxr.generate_sound();
    const buffer = bfxr.sound.getBuffer();

    if (seed !== undefined) {
        restoreMathRandom();
    }

    return buffer;
}

/**
 * Mutate existing parameters
 * @param {Object} baseParams - Base parameters to mutate
 * @param {number} [seed] - Optional seed for reproducibility
 * @returns {Float32Array} Audio buffer
 */
function mutateParams(baseParams, seed) {
    if (seed !== undefined) {
        setSeed(seed);
        overrideMathRandom();
    }

    if (typeof Bfxr === 'undefined') {
        throw new Error('Bfxr class not loaded.');
    }

    const bfxr = new Bfxr();
    bfxr.apply_params(baseParams);
    bfxr.mutate_params();
    bfxr.generate_sound();
    const buffer = bfxr.sound.getBuffer();

    if (seed !== undefined) {
        restoreMathRandom();
    }

    return buffer;
}

// Export for Node.js
module.exports = {
    generateAudio,
    generateFromTemplate,
    generateRandom,
    mutateParams,
    setSeed,
    SAMPLE_RATE,
    SeededRandom
};
