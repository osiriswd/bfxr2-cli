#!/usr/bin/env node

/**
 * Bfxr2 CLI - Command line interface for Bfxr2 sound effect generator
 * 
 * Usage:
 *   node cli.js [options]
 * 
 * Options:
 *   --params <json>           JSON string of parameters
 *   --params-file <path>      Path to JSON params file
 *   --template <name>         Template name (pickup_coin, laser_shoot, etc.)
 *   --randomize               Generate random sound
 *   --mutate <json>           Base params to mutate from
 *   --output <path>           Output file path (default: output.wav)
 *   --format <fmt>            Output format: wav, mp3, base64
 *   --sample-rate <n>         Sample rate (default: 44100)
 *   --bit-depth <n>           Bit depth: 8, 16 (default: 16, WAV only)
 *   --bitrate <n>             MP3 bitrate in kbps (default: 128)
 *   --seed <n>                Random seed for reproducibility
 *   --count <n>               Number of sounds to generate
 *   --synth <name>            Synth type: Bfxr, Footsteppr (default: Bfxr)
 *   --verbose                 Print debug info
 *   --help                    Show help
 */

const fs = require('fs');
const path = require('path');

// Load headless engine (this sets up all polyfills and loads Bfxr files)
const engine = require('./js/audio/headless_engine');
const { getEncoder, inferFormat, getExtension } = require('./js/cli/audio_encoders');
const { validateParams, normalizeParams, getDefaultParams, TEMPLATES } = require('./js/cli/param_utils');

// ============================================================
// ARGUMENT PARSING
// ============================================================

function parseArgs(argv) {
    const args = {
        params: null,
        paramsFile: null,
        template: null,
        randomize: false,
        mutate: null,
        output: 'output.wav',
        format: null,
        sampleRate: 44100,
        bitDepth: 16,
        bitrate: 128,
        seed: null,
        count: 1,
        synth: 'Bfxr',
        verbose: false,
        help: false
    };

    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        switch (arg) {
            case '--params':
                // Collect all remaining arguments as the JSON string (handles spaces in JSON)
                args.params = argv.slice(i + 1).join(' ');
                i = argv.length;
                break;
            case '--params-file':
                args.paramsFile = argv[++i];
                break;
            case '--template':
                args.template = argv[++i];
                break;
            case '--randomize':
                args.randomize = true;
                break;
            case '--mutate':
                // Collect all remaining arguments as the JSON string (handles spaces in JSON)
                args.mutate = argv.slice(i + 1).join(' ');
                i = argv.length;
                break;
            case '--output':
                args.output = argv[++i];
                break;
            case '--format':
                args.format = argv[++i];
                break;
            case '--sample-rate':
                args.sampleRate = parseInt(argv[++i], 10);
                break;
            case '--bit-depth':
                args.bitDepth = parseInt(argv[++i], 10);
                break;
            case '--bitrate':
                args.bitrate = parseInt(argv[++i], 10);
                break;
            case '--seed':
                args.seed = parseInt(argv[++i], 10);
                break;
            case '--count':
                args.count = parseInt(argv[++i], 10);
                break;
            case '--synth':
                args.synth = argv[++i];
                break;
            case '--verbose':
                args.verbose = true;
                break;
            case '--help':
                args.help = true;
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
        }
        i++;
    }

    return args;
}

// ============================================================
// HELP
// ============================================================

function showHelp() {
    console.log(`
Bfxr2 CLI - Sound Effect Generator

Usage:
  node cli.js [options]

Options:
  --params <json>           JSON string of parameters
  --params-file <path>      Path to JSON params file
  --template <name>         Template name
                            Bfxr: pickup_coin, laser_shoot, explosion, powerup,
                                    hit_hurt, jump, blip_select, randomize, mutate
  --randomize               Generate random sound
  --mutate <json>           Base params to mutate from
  --output <path>           Output file path (default: output.wav)
  --format <fmt>            Output format: wav, mp3 (auto-detected from extension)
  --sample-rate <n>         Sample rate (default: 44100)
  --bit-depth <n>           Bit depth: 8, 16 (default: 16, WAV only)
  --bitrate <n>             MP3 bitrate in kbps (default: 128)
  --seed <n>                Random seed for reproducibility
  --count <n>               Number of sounds to generate
  --synth <name>            Synth type: Bfxr, Footsteppr (default: Bfxr)
  --verbose                 Print debug info
  --help                    Show this help

Examples:
  # Generate a random pickup coin sound
  node cli.js --template pickup_coin --output coin.wav

  # Generate with specific parameters
  node cli.js --params '{"waveType": 0, "frequency_start": 0.5}' --output laser.mp3

  # Generate from params file
  node cli.js --params-file params.json --output explosion.wav

  # Generate 5 random sounds
  node cli.js --randomize --count 5 --output sound_

  # Generate with seed for reproducibility
  node cli.js --template explosion --seed 12345 --output boom.wav

  # Output as base64
  node cli.js --template pickup_coin --format base64
`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (args.help) {
        showHelp();
        process.exit(0);
    }

    // Determine format
    let format = args.format || inferFormat(args.output);

    // Encoder options
    const encoderOptions = {
        sampleRate: args.sampleRate,
        bitDepth: args.bitDepth,
        bitrate: args.bitrate
    };

    // Get params from various sources
    let params = null;
    let generationMode = null;

    if (args.params) {
        try {
            params = JSON.parse(args.params);
            generationMode = 'params';
        } catch (e) {
            console.error(`Invalid JSON in --params: ${e.message}`);
            process.exit(1);
        }
    } else if (args.paramsFile) {
        try {
            const paramsContent = fs.readFileSync(args.paramsFile, 'utf8');
            params = JSON.parse(paramsContent);
            generationMode = 'params';
        } catch (e) {
            console.error(`Error reading --params-file: ${e.message}`);
            process.exit(1);
        }
    } else if (args.template) {
        generationMode = 'template';
    } else if (args.randomize) {
        generationMode = 'randomize';
    } else if (args.mutate) {
        try {
            params = JSON.parse(args.mutate);
            generationMode = 'mutate';
        } catch (e) {
            console.error(`Invalid JSON in --mutate: ${e.message}`);
            process.exit(1);
        }
    } else {
        console.error('No generation mode specified. Use --template, --randomize, --params, --params-file, or --mutate.');
        console.error('Use --help for usage information.');
        process.exit(1);
    }

    // Validate params if provided
    if (params && generationMode === 'params') {
        const validation = validateParams(params);
        if (!validation.valid) {
            if (args.verbose) {
                console.log('Parameter validation warnings:');
                validation.errors.forEach(err => console.log(`  - ${err}`));
            }
            // Normalize anyway
            params = normalizeParams(params);
        }
    }

    if (args.verbose) {
        console.log(`Generation mode: ${generationMode}`);
        console.log(`Format: ${format}`);
        console.log(`Output: ${args.output}`);
        console.log(`Count: ${args.count}`);
        if (args.seed !== null) {
            console.log(`Seed: ${args.seed}`);
        }
    }

    // Generate sounds
    const buffers = [];

    for (let i = 0; i < args.count; i++) {
        let buffer;

        // Set seed for each sound if specified
        if (args.seed !== null) {
            engine.setSeed(args.seed + i); // Offset seed for multiple sounds
        }

        try {
            switch (generationMode) {
                case 'params':
                    buffer = engine.generateAudio(params);
                    break;
                case 'template':
                    buffer = engine.generateFromTemplate(args.template, args.seed);
                    break;
                case 'randomize':
                    buffer = engine.generateRandom(args.seed);
                    break;
                case 'mutate':
                    buffer = engine.mutateParams(params, args.seed);
                    break;
                default:
                    throw new Error('Unknown generation mode');
            }
        } catch (e) {
            console.error(`Error generating sound: ${e.message}`);
            if (args.verbose) {
                console.error(e.stack);
            }
            process.exit(1);
        }

        buffers.push(buffer);
    }

    // Encode and output
    const encoder = getEncoder(format, encoderOptions);

    // Write files
    if (args.count === 1) {
            const outputBuffer = await encoder.encode(buffers[0]);
            fs.writeFileSync(args.output, outputBuffer);
            console.log(`Written: ${args.output} (${buffers[0].length} samples)`);
        } else {
            // Multiple files - use numbered naming
            const ext = path.extname(args.output) || getExtension(format);
            const baseName = args.output.replace(ext, '');

            for (let i = 0; i < buffers.length; i++) {
                const fileName = `${baseName}_${i + 1}${ext}`;
                const outputBuffer = await encoder.encode(buffers[i]);
                fs.writeFileSync(fileName, outputBuffer);
                console.log(`Written: ${fileName} (${buffers[i].length} samples)`);
            }
        }

    if (args.verbose) {
        console.log('Done!');
    }
}

// Run
main();
