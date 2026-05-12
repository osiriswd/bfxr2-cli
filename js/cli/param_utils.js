/**
 * Parameter utilities for Bfxr2 CLI
 * Validates, normalizes, and manages Bfxr parameters
 */

// Parameter definitions with min/max/default values
const PARAM_DEFS = {
    waveType: { min: 0, max: 11, default: 0, integer: true },
    masterVolume: { min: 0, max: 1, default: 0.5 },
    attackTime: { min: 0, max: 1, default: 0 },
    sustainTime: { min: 0, max: 1, default: 0.3 },
    sustainPunch: { min: 0, max: 1, default: 0 },
    decayTime: { min: 0.03, max: 1, default: 0.4 },
    compressionAmount: { min: 0, max: 1, default: 0 },
    frequency_start: { min: 0, max: 1, default: 0.3 },
    frequency_slide: { min: -0.5, max: 0.5, default: 0 },
    frequency_acceleration: { min: -1, max: 1, default: 0 },
    min_frequency_relative_to_starting_frequency: { min: 0, max: 0.99, default: 0 },
    vibratoDepth: { min: 0, max: 1, default: 0 },
    vibratoSpeed: { min: 0, max: 1, default: 0 },
    pitch_jump_repeat_speed: { min: 0, max: 1, default: 0 },
    pitch_jump_amount: { min: -1, max: 1, default: 0 },
    pitch_jump_onset_percent: { min: 0, max: 1, default: 0 },
    pitch_jump_2_amount: { min: -1, max: 1, default: 0 },
    pitch_jump_onset2_percent: { min: 0, max: 1, default: 0 },
    overtones: { min: 0, max: 1, default: 0 },
    overtoneFalloff: { min: 0, max: 1, default: 0 },
    squareDuty: { min: 0, max: 0.99, default: 0 },
    dutySweep: { min: -1, max: 1, default: 0 },
    repeatSpeed: { min: 0, max: 1, default: 0 },
    flangerOffset: { min: -1, max: 1, default: 0 },
    flangerSweep: { min: -1, max: 1, default: 0 },
    lpFilterCutoff: { min: 0.01, max: 1, default: 1 },
    lpFilterCutoffSweep: { min: -1, max: 1, default: 0 },
    lpFilterResonance: { min: 0, max: 1, default: 0 },
    hpFilterCutoff: { min: 0, max: 1, default: 0 },
    hpFilterCutoffSweep: { min: -1, max: 1, default: 0 },
    bitCrush: { min: 0, max: 1, default: 0 },
    bitCrushSweep: { min: -1, max: 1, default: 0 }
};

// Template names mapped to Bfxr method names
const TEMPLATES = {
    'pickup_coin': 'generate_pickup_coin',
    'laser_shoot': 'generate_laser_shoot',
    'explosion': 'generate_explosion',
    'powerup': 'generate_powerup',
    'hit_hurt': 'generate_hit_hurt',
    'jump': 'generate_jump',
    'blip_select': 'generate_blip_select',
    'randomize': 'randomize_params',
    'mutate': 'mutate_params'
};

/**
 * Get default parameters
 * @returns {Object} Default parameter values
 */
function getDefaultParams() {
    const defaults = {};
    for (const [key, def] of Object.entries(PARAM_DEFS)) {
        defaults[key] = def.default;
    }
    return defaults;
}

/**
 * Validate parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateParams(params) {
    const errors = [];
    
    for (const [key, value] of Object.entries(params)) {
        if (!(key in PARAM_DEFS)) {
            errors.push(`Unknown parameter: ${key}`);
            continue;
        }
        
        const def = PARAM_DEFS[key];
        
        if (typeof value !== 'number') {
            errors.push(`Parameter ${key} must be a number, got ${typeof value}`);
            continue;
        }
        
        if (value < def.min || value > def.max) {
            errors.push(`Parameter ${key} out of range [${def.min}, ${def.max}], got ${value}`);
        }
        
        if (def.integer && !Number.isInteger(value)) {
            errors.push(`Parameter ${key} must be an integer, got ${value}`);
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Normalize parameters (clamp to valid range, fill missing with defaults)
 * @param {Object} params - Parameters to normalize
 * @returns {Object} Normalized parameters
 */
function normalizeParams(params) {
    const normalized = getDefaultParams();
    
    for (const [key, value] of Object.entries(params)) {
        if (!(key in PARAM_DEFS)) {
            continue;
        }
        
        const def = PARAM_DEFS[key];
        let normalizedValue = Math.max(def.min, Math.min(value, def.max));
        
        if (def.integer) {
            normalizedValue = Math.round(normalizedValue);
        }
        
        normalized[key] = normalizedValue;
    }
    
    return normalized;
}

/**
 * Check if template name is valid
 * @param {string} templateName - Template name to check
 * @returns {boolean}
 */
function isValidTemplate(templateName) {
    return templateName in TEMPLATES;
}

/**
 * Get param info for a specific parameter
 * @param {string} paramName - Parameter name
 * @returns {Object|null} Param definition or null
 */
function getParamInfo(paramName) {
    return PARAM_DEFS[paramName] || null;
}

/**
 * Get all parameter names
 * @returns {string[]}
 */
function getParamNames() {
    return Object.keys(PARAM_DEFS);
}

module.exports = {
    PARAM_DEFS,
    TEMPLATES,
    getDefaultParams,
    validateParams,
    normalizeParams,
    isValidTemplate,
    getParamInfo,
    getParamNames
};
