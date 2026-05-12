# Bfxr2 CLI Documentation

Command-line interface for generating sound effects using Bfxr2.

## Quick Start

```bash
# Install dependencies
npm install

# Generate a sound
node cli.js --template pickup_coin --output coin.wav
```

## Usage

```bash
node cli.js [options]
```

## Options

| Option | Type | Description |
|--------|------|-------------|
| `--params <json>` | JSON string | Full parameter object |
| `--params-file <path>` | File path | Path to JSON params file |
| `--template <name>` | String | Template name (see Templates section) |
| `--randomize` | Flag | Generate random sound |
| `--mutate <json>` | JSON string | Base params to mutate from |
| `--output <path>` | File path | Output file path (default: output.wav) |
| `--format <fmt>` | String | Output format: wav, mp3 (auto-detected from extension) |
| `--sample-rate <n>` | Number | Sample rate (default: 44100) |
| `--bit-depth <n>` | Number | Bit depth: 8, 16 (default: 16, WAV only) |
| `--bitrate <n>` | Number | MP3 bitrate in kbps (default: 128) |
| `--seed <n>` | Number | Random seed for reproducibility |
| `--count <n>` | Number | Number of sounds to generate |
| `--verbose` | Flag | Print debug info |
| `--help` | Flag | Show help |

## Templates

### Bfxr Templates

| Template | Description |
|----------|-------------|
| `pickup_coin` | Blips and bleeps for collecting items |
| `laser_shoot` | Pew pew laser sounds |
| `explosion` | Boom and explosion sounds |
| `powerup` | Power-up collection sounds |
| `hit_hurt` | Hit and hurt sounds |
| `jump` | Jump sounds |
| `blip_select` | UI blip and selection sounds |

## Examples

### Generate from Template

```bash
# Generate a pickup coin sound
node cli.js --template pickup_coin --output coin.wav

# Generate an explosion sound
node cli.js --template explosion --output explosion.mp3

# Generate with higher MP3 bitrate
node cli.js --template laser_shoot --bitrate 192 --output laser.mp3
```

### Generate with Specific Parameters

```bash
# Using params file (recommended)
node cli.js --params-file params.json --output sound.wav

# params.json example:
{
  "waveType": 0,
  "frequency_start": 0.5,
  "decayTime": 0.3,
  "sustainTime": 0.2
}
```

### Generate Random Sounds

```bash
# Generate a single random sound
node cli.js --randomize --output random.wav

# Generate 5 random sounds
node cli.js --randomize --count 5 --output sounds_
# Creates: sounds_1.wav, sounds_2.wav, sounds_3.wav, sounds_4.wav, sounds_5.wav

# Generate with seed for reproducibility
node cli.js --randomize --seed 12345 --output repro.wav
```

### Mutate Existing Parameters

```bash
# Mutate from base parameters
node cli.js --mutate '{"waveType": 0, "frequency_start": 0.3}' --output mutated.wav
```

## Parameters Reference

### All Available Parameters

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `waveType` | 0-11 | 0 | Waveform type (0=Square, 1=Saw, 2=Sin, 3=White, 4=Triangle, 5=Rasp, 6=Tan, 7=Whistle, 8=Breaker, 9=Bitnoise, 10=FMSyn, 11=Voice) |
| `masterVolume` | 0-1 | 0.5 | Overall volume |
| `attackTime` | 0-1 | 0 | Volume envelope attack length |
| `sustainTime` | 0-1 | 0.3 | Volume envelope sustain length |
| `sustainPunch` | 0-1 | 0 | Sustain envelope punch |
| `decayTime` | 0.03-1 | 0.4 | Volume envelope decay length |
| `compressionAmount` | 0-1 | 0 | Dynamic compression |
| `frequency_start` | 0-1 | 0.3 | Base frequency |
| `frequency_slide` | -0.5 to 0.5 | 0 | Frequency slide |
| `frequency_acceleration` | -1 to 1 | 0 | Frequency acceleration (delta slide) |
| `min_frequency_relative_to_starting_frequency` | 0-0.99 | 0 | Frequency cutoff |
| `vibratoDepth` | 0-1 | 0 | Vibrato depth |
| `vibratoSpeed` | 0-1 | 0 | Vibrato speed |
| `pitch_jump_repeat_speed` | 0-1 | 0 | Pitch jump repeat speed |
| `pitch_jump_amount` | -1 to 1 | 0 | First pitch jump amount |
| `pitch_jump_onset_percent` | 0-1 | 0 | First pitch jump onset |
| `pitch_jump_2_amount` | -1 to 1 | 0 | Second pitch jump amount |
| `pitch_jump_onset2_percent` | 0-1 | 0 | Second pitch jump onset |
| `overtones` | 0-1 | 0 | Harmonic overtones |
| `overtoneFalloff` | 0-1 | 0 | Overtone decay rate |
| `squareDuty` | 0-0.99 | 0 | Square wave duty (waveType 0 only) |
| `dutySweep` | -1 to 1 | 0 | Duty sweep (waveType 0 only) |
| `repeatSpeed` | 0-1 | 0 | Note repeat speed |
| `flangerOffset` | -1 to 1 | 0 | Flanger offset |
| `flangerSweep` | -1 to 1 | 0 | Flanger sweep |
| `lpFilterCutoff` | 0.01-1 | 1 | Low-pass filter cutoff |
| `lpFilterCutoffSweep` | -1 to 1 | 0 | Low-pass filter sweep |
| `lpFilterResonance` | 0-1 | 0 | Low-pass filter resonance |
| `hpFilterCutoff` | 0-1 | 0 | High-pass filter cutoff |
| `hpFilterCutoffSweep` | -1 to 1 | 0 | High-pass filter sweep |
| `bitCrush` | 0-1 | 0 | Bit crush amount |
| `bitCrushSweep` | -1 to 1 | 0 | Bit crush sweep |

## File Structure

```
bfxr2/
├── cli.js                    # Main CLI entry point
├── js/
│   ├── cli/
│   │   ├── audio_encoders.js # WAV and MP3 encoders
│   │   └── param_utils.js    # Parameter validation
│   └── audio/
│       └── headless_engine.js # Node.js audio engine
└── CLI.md                    # This documentation
```

## Troubleshooting

### "Unknown template" error
Make sure you're using a valid template name from the Templates section above.

### MP3 encoding fails
Ensure `@breezystack/lamejs` is installed: `npm install`

### No sound output
Check that parameters are within valid ranges. Use `--verbose` to see parameter validation warnings.
