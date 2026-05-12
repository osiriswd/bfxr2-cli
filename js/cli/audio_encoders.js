/**
 * Audio encoders for Bfxr2 CLI
 * Supports WAV and MP3 output formats
 */

// WAV Encoder based on riffwave.js logic
class WavEncoder {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 44100;
        this.bitDepth = options.bitDepth || 16;
        this.numChannels = options.numChannels || 1;
    }

    /**
     * Encode Float32Array audio data to WAV Buffer
     * @param {Float32Array} audioData - Audio samples in [-1, 1] range
     * @returns {Buffer} WAV file buffer
     */
    encode(audioData) {
        const numSamples = audioData.length;
        const bytesPerSample = this.bitDepth / 8;
        const blockAlign = this.numChannels * bytesPerSample;
        const byteRate = this.sampleRate * blockAlign;
        const dataSize = numSamples * bytesPerSample;
        const chunkSize = 36 + dataSize;

        // Create buffer for WAV file
        const buffer = Buffer.alloc(44 + dataSize);
        let offset = 0;

        // Write header
        offset = this.writeString(buffer, offset, 'RIFF');
        offset = this.writeUInt32(buffer, offset, chunkSize);
        offset = this.writeString(buffer, offset, 'WAVE');
        offset = this.writeString(buffer, offset, 'fmt ');
        offset = this.writeUInt32(buffer, offset, 16); // Subchunk1Size (PCM)
        offset = this.writeUInt16(buffer, offset, 1); // AudioFormat (PCM)
        offset = this.writeUInt16(buffer, offset, this.numChannels);
        offset = this.writeUInt32(buffer, offset, this.sampleRate);
        offset = this.writeUInt32(buffer, offset, byteRate);
        offset = this.writeUInt16(buffer, offset, blockAlign);
        offset = this.writeUInt16(buffer, offset, this.bitDepth);
        offset = this.writeString(buffer, offset, 'data');
        offset = this.writeUInt32(buffer, offset, dataSize);

        // Write audio data
        if (this.bitDepth === 16) {
            for (let i = 0; i < numSamples; i++) {
                const sample = Math.max(-1, Math.min(audioData[i], 1));
                const intSample = Math.floor(sample * 32767);
                offset = this.writeInt16(buffer, offset, intSample);
            }
        } else if (this.bitDepth === 8) {
            for (let i = 0; i < numSamples; i++) {
                const sample = Math.max(-1, Math.min(audioData[i], 1));
                const intSample = Math.floor((sample + 1) * 127.5);
                buffer[offset++] = intSample;
            }
        }

        return buffer;
    }

    /**
     * Encode to base64 data URI
     * @param {Float32Array} audioData
     * @returns {string} Data URI
     */
    encodeToDataUri(audioData) {
        const wavBuffer = this.encode(audioData);
        const base64 = wavBuffer.toString('base64');
        return `data:audio/wav;base64,${base64}`;
    }

    writeString(buffer, offset, str) {
        for (let i = 0; i < str.length; i++) {
            buffer[offset++] = str.charCodeAt(i);
        }
        return offset;
    }

    writeUInt32(buffer, offset, value) {
        buffer[offset++] = value & 0xFF;
        buffer[offset++] = (value >> 8) & 0xFF;
        buffer[offset++] = (value >> 16) & 0xFF;
        buffer[offset++] = (value >> 24) & 0xFF;
        return offset;
    }

    writeUInt16(buffer, offset, value) {
        buffer[offset++] = value & 0xFF;
        buffer[offset++] = (value >> 8) & 0xFF;
        return offset;
    }

    writeInt16(buffer, offset, value) {
        buffer[offset++] = value & 0xFF;
        buffer[offset++] = (value >> 8) & 0xFF;
        return offset;
    }
}

// MP3 Encoder using lamejs
class Mp3Encoder {
    constructor(options = {}) {
        this.sampleRate = options.sampleRate || 44100;
        this.bitrate = options.bitrate || 128;
        this.numChannels = options.numChannels || 1;
    }

    /**
     * Encode Float32Array audio data to MP3 Buffer
     * @param {Float32Array} audioData - Audio samples in [-1, 1] range
     * @returns {Buffer} MP3 file buffer
     */
    async encode(audioData) {
        // Dynamic import for ESM package
        const lamejs = await import('@breezystack/lamejs');
        const Mp3Encoder = lamejs.Mp3Encoder;
        
        const channels = this.numChannels;
        const sampleRate = this.sampleRate;
        const kbps = this.bitrate;
        
        const encoder = new Mp3Encoder(channels, sampleRate, kbps);
        
        // Convert Float32Array to Int16Array for lamejs
        const numSamples = audioData.length;
        const int16Data = new Int16Array(numSamples);
        
        for (let i = 0; i < numSamples; i++) {
            const sample = Math.max(-1, Math.min(audioData[i], 1));
            int16Data[i] = sample < 0 ? sample * 32768 : sample * 32767;
        }

        // Encode in chunks
        const mp3Data = [];
        const chunkSize = 1152; // lamejs recommended chunk size
        
        for (let i = 0; i < numSamples; i += chunkSize) {
            const chunk = int16Data.subarray(i, Math.min(i + chunkSize, numSamples));
            const mp3buf = encoder.encodeBuffer(chunk);
            if (mp3buf.length > 0) {
                mp3Data.push(Buffer.from(mp3buf));
            }
        }

        // Flush encoder
        const mp3end = encoder.flush();
        if (mp3end.length > 0) {
            mp3Data.push(Buffer.from(mp3end));
        }

        return Buffer.concat(mp3Data);
    }

    /**
     * Encode to base64 data URI
     * @param {Float32Array} audioData
     * @returns {Promise<string>} Data URI
     */
    async encodeToDataUri(audioData) {
        const mp3Buffer = await this.encode(audioData);
        const base64 = mp3Buffer.toString('base64');
        return `data:audio/mp3;base64,${base64}`;
    }
}

// Factory function to get appropriate encoder
function getEncoder(format, options = {}) {
    switch (format.toLowerCase()) {
        case 'wav':
            return new WavEncoder(options);
        case 'mp3':
            return new Mp3Encoder(options);
        default:
            throw new Error(`Unsupported format: ${format}. Use 'wav' or 'mp3'.`);
    }
}

// Get file extension for format
function getExtension(format) {
    switch (format.toLowerCase()) {
        case 'wav': return '.wav';
        case 'mp3': return '.mp3';
        default: return '.wav';
    }
}

// Infer format from filename
function inferFormat(filename) {
    if (filename.toLowerCase().endsWith('.mp3')) {
        return 'mp3';
    }
    return 'wav';
}

module.exports = {
    WavEncoder,
    Mp3Encoder,
    getEncoder,
    getExtension,
    inferFormat
};
