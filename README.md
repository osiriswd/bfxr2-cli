# Bfxr2 CLI

Command-line sound effect generator for retro game audio. Generate WAV and MP3 sound effects programmatically using JSON parameters or preset templates.

## Quick Start

```bash
npm install

# Generate a pickup coin sound
node cli.js --template pickup_coin --output coin.wav

# Generate an explosion as MP3
node cli.js --template explosion --output explosion.mp3
```

## CLI Usage

```bash
node cli.js [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--template <name>` | Use a preset template (see below) |
| `--params <json>` | Pass parameters as JSON string |
| `--params-file <path>` | Load parameters from JSON file |
| `--randomize` | Generate a random sound |
| `--mutate <json>` | Mutate base parameters |
| `--output <path>` | Output file path (default: `output.wav`) |
| `--format <fmt>` | Output format: `wav` or `mp3` (auto-detected from extension) |
| `--bitrate <n>` | MP3 bitrate in kbps (default: 128) |
| `--seed <n>` | Random seed for reproducibility |
| `--count <n>` | Number of sounds to generate |
| `--verbose` | Print debug info |
| `--help` | Show help |

### Templates

| Template | Description |
|----------|-------------|
| `pickup_coin` | Blips and bleeps for collecting items |
| `laser_shoot` | Pew pew laser sounds |
| `explosion` | Boom and explosion sounds |
| `powerup` | Power-up collection sounds |
| `hit_hurt` | Hit and hurt sounds |
| `jump` | Jump sounds |
| `blip_select` | UI blip and selection sounds |

### Examples

```bash
# Generate from template
node cli.js --template pickup_coin --output coin.wav
node cli.js --template explosion --output explosion.mp3
node cli.js --template laser_shoot --bitrate 192 --output laser.mp3

# Generate with specific parameters
echo '{"waveType": 0, "frequency_start": 0.5, "decayTime": 0.3}' > params.json
node cli.js --params-file params.json --output sound.wav

# Generate random sounds
node cli.js --randomize --seed 12345 --output random.wav
node cli.js --randomize --count 5 --output batch_
# Creates: batch_1.wav, batch_2.wav, ...

# Mutate existing parameters
node cli.js --mutate '{"waveType": 0, "frequency_start": 0.3}' --output mutated.wav
```

### Parameters

All 32 Bfxr parameters are supported. Key parameters include:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| `waveType` | 0-11 | 0 | Waveform (0=Square, 1=Saw, 2=Sin, 3=White, 4=Triangle, 9=Bitnoise, etc.) |
| `frequency_start` | 0-1 | 0.3 | Base frequency |
| `frequency_slide` | -0.5 to 0.5 | 0 | Frequency slide |
| `decayTime` | 0.03-1 | 0.4 | Decay length |
| `attackTime` | 0-1 | 0 | Attack length |
| `sustainTime` | 0-1 | 0.3 | Sustain length |
| `overtones` | 0-1 | 0 | Harmonic overtones |
| `bitCrush` | 0-1 | 0 | Bit crush amount |
| `lpFilterCutoff` | 0.01-1 | 1 | Low-pass filter |
| `hpFilterCutoff` | 0-1 | 0 | High-pass filter |

See [`CLI.md`](CLI.md) for the complete parameter reference.

## Web Interface

This project also includes a browser-based sound effect editor at `index.html`. See [`DEVELOPMENT.md`](DEVELOPMENT.md) for details on running and building the web interface.

## About

Bfxr2 is a rewrite/refresh of the classic Bfxr sound effect generator, originally based on DrPetter's [Sfxr](http://drpetter.se/project_sfxr.html). This fork adds a command-line interface for batch generation and automation workflows, along with the original web-based interface featuring Obiwannabe's footstep generator (Footsteppr).

### Lineage

- **Sfxr** by DrPetter - the original
- **as3sfxr** by Tom Vian - Flash port
- **Bfxr** by increpare - JavaScript rewrite with new features
- **Bfxr2** - this project, adding CLI and Footsteppr

### License

MIT
