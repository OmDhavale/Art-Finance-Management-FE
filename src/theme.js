// Design tokens — Art Finance Management (Visily Design System)
export const Colors = {
    // Core palette — warm orange brand
    primary: '#F97316',          // Vibrant orange (primary brand)
    primaryLight: '#FDBA74',     // Soft orange / tint
    primaryMuted: 'rgba(249,115,22,0.12)', // Orange translucent
    primaryDark: '#EA6A00',      // Deeper orange for active/pressed states

    // Background system
    bg: '#F1F5F9',               // Cool off-white page background
    surface: '#FFFFFF',          // Pure white surfaces
    card: '#FFFFFF',             // Card background
    cardBorder: '#F1F5F9',       // Even more subtle card border

    // Text
    textPrimary: '#0F172A',      // Near-black
    textSecondary: '#475569',    // Medium grey
    textMuted: '#94A3B8',        // Light grey hint text

    // Semantic
    success: '#16A34A',
    successBg: 'rgba(22,163,74,0.10)',
    warning: '#D97706',
    warningBg: 'rgba(217,119,6,0.12)',
    orange: '#EA580C',
    orangeBg: 'rgba(234,88,12,0.10)',
    danger: '#DC2626',
    dangerBg: 'rgba(220,38,38,0.10)',

    // Inputs
    inputBg: '#FFFFFF',
    inputBorder: '#CBD5E1',
    inputFocus: '#F97316',

    // Misc
    separator: '#E2E8F0',
    white: '#FFFFFF',

    // Aliases for backward compat
    accent: '#F97316',
    accentLight: '#FDBA74',
    accentMuted: 'rgba(249,115,22,0.12)',
};

export const Spacing = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const Radius = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const Font = {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34,
};

export const Shadow = {
    sm: {
        shadowColor: 'rgba(15, 23, 42, 0.08)', shadowOpacity: 1, shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 }, elevation: 3,
    },
    md: {
        shadowColor: 'rgba(15, 23, 42, 0.12)', shadowOpacity: 1, shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 }, elevation: 6,
    },
};

export const gradeConfig = {
    excellent: { color: '#15803D', bg: '#DCFCE7', label: 'Fully Paid' },
    green: { color: Colors.success, bg: Colors.successBg, label: 'Fully Paid' },
    yellow: { color: Colors.warning, bg: Colors.warningBg, label: 'Almost Done' },
    orange: { color: Colors.orange, bg: Colors.orangeBg, label: 'Partial' },
    red: { color: Colors.danger, bg: Colors.dangerBg, label: 'Due' },
};

/** Compute grade config live from remainingAmount — bypasses stale DB grade. */
export const getGradeConfig = (remainingAmount) => {
    if (remainingAmount < 0) return gradeConfig.excellent;
    if (remainingAmount === 0) return gradeConfig.green;
    if (remainingAmount < 10000) return gradeConfig.yellow;
    if (remainingAmount < 50000) return gradeConfig.orange;
    return gradeConfig.red;
};

/**
 * Overall mandal-level grade config (O / A / B / C / D).
 */
export const overallGradeConfig = {
    O: { label: 'O', fullLabel: 'Outstanding', color: '#15803D', bg: '#DCFCE7', borderColor: '#4ADE80' },
    A: { label: 'A', fullLabel: 'Excellent', color: '#16A34A', bg: '#D1FAE5', borderColor: '#6EE7B7' },
    B: { label: 'B', fullLabel: 'Good', color: '#B45309', bg: '#FEF9C3', borderColor: '#FDE047' },
    C: { label: 'C', fullLabel: 'Average', color: '#EA580C', bg: '#FFEDD5', borderColor: '#FB923C' },
    D: { label: 'D', fullLabel: 'Poor', color: '#DC2626', bg: '#FEE2E2', borderColor: '#F87171' },
};

/** Returns the overallGradeConfig entry for a given grade letter, or null if ungraded. */
export const getOverallGradeConfig = (grade) => overallGradeConfig[grade] || null;
