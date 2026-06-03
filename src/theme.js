// Design tokens — Art Finance Management (Visily Design System)
const themeName = global.__SELECTED_THEME__ || 'light_orange';

const themes = {
    light_orange: {
        primary: '#F97316',          // Vibrant orange (primary brand)
        primaryLight: '#FDBA74',     // Soft orange / tint
        primaryMuted: 'rgba(249,115,22,0.12)', // Orange translucent
        primaryDark: '#EA6A00',      // Deeper orange for active/pressed states
        bg: '#F1F5F9',               // Cool off-white page background
        surface: '#FFFFFF',          // Pure white surfaces
        card: '#FFFFFF',             // Card background
        cardBorder: '#F1F5F9',       // Even more subtle card border
        textPrimary: '#0F172A',      // Near-black
        textSecondary: '#475569',    // Medium grey
        textMuted: '#94A3B8',        // Light grey hint text
        success: '#16A34A',
        successBg: 'rgba(22,163,74,0.10)',
        warning: '#D97706',
        warningBg: 'rgba(217,119,6,0.12)',
        orange: '#EA580C',
        orangeBg: 'rgba(234,88,12,0.10)',
        danger: '#DC2626',
        dangerBg: 'rgba(220,38,38,0.10)',
        inputBg: '#FFFFFF',
        inputBorder: '#CBD5E1',
        inputFocus: '#F97316',
        separator: '#E2E8F0',
        white: '#FFFFFF',
        accent: '#F97316',
        accentLight: '#FDBA74',
        accentMuted: 'rgba(249,115,22,0.12)',
    },
    light_teal: {
        primary: '#0D9488',          // Vibrant teal
        primaryLight: '#99F6E4',     // Soft teal / tint
        primaryMuted: 'rgba(13,148,136,0.12)', // Teal translucent
        primaryDark: '#0F766E',      // Deeper teal
        bg: '#F0FDF4',               // Light teal-tinted background
        surface: '#FFFFFF',
        card: '#FFFFFF',
        cardBorder: '#E6F4F1',
        textPrimary: '#0F172A',
        textSecondary: '#334155',
        textMuted: '#64748B',
        success: '#10B981',
        successBg: 'rgba(16,185,129,0.10)',
        warning: '#F59E0B',
        warningBg: 'rgba(245,158,11,0.12)',
        orange: '#F97316',
        orangeBg: 'rgba(249,115,22,0.10)',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.10)',
        inputBg: '#FFFFFF',
        inputBorder: '#CBD5E1',
        inputFocus: '#0D9488',
        separator: '#E2E8F0',
        white: '#FFFFFF',
        accent: '#0D9488',
        accentLight: '#99F6E4',
        accentMuted: 'rgba(13,148,136,0.12)',
    },
    dark_charcoal: {
        primary: '#F97316',          // Warm orange accent
        primaryLight: '#FED7AA',     // Orange tint
        primaryMuted: 'rgba(249,115,22,0.18)', // Translucent orange
        primaryDark: '#EA6A00',
        bg: '#0B0F19',               // Deep slate/charcoal background
        surface: '#1E293B',          // Slate container background
        card: '#1E293B',             // Card background
        cardBorder: '#334155',
        textPrimary: '#F8FAFC',      // Off-white text
        textSecondary: '#CBD5E1',    // Slate text
        textMuted: '#64748B',        // Muted grey-blue text
        success: '#10B981',
        successBg: 'rgba(16,185,129,0.15)',
        warning: '#F59E0B',
        warningBg: 'rgba(245,158,11,0.15)',
        orange: '#F97316',
        orangeBg: 'rgba(249,115,22,0.15)',
        danger: '#EF4444',
        dangerBg: 'rgba(239,68,68,0.15)',
        inputBg: '#0F172A',
        inputBorder: '#334155',
        inputFocus: '#F97316',
        separator: '#334155',
        white: '#1E293B',            // Set white to dark surface to avoid glare
        accent: '#F97316',
        accentLight: '#FED7AA',
        accentMuted: 'rgba(249,115,22,0.18)',
    }
};

export const Colors = themes[themeName] || themes.light_orange;

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
    O: { color: '#15803D', bg: '#DCFCE7', label: 'O Grade' },
    A: { color: Colors.success, bg: Colors.successBg, label: 'A Grade' },
    B: { color: Colors.warning, bg: Colors.warningBg, label: 'B Grade' },
    C: { color: Colors.orange, bg: Colors.orangeBg, label: 'C Grade' },
    D: { color: Colors.danger, bg: Colors.dangerBg, label: 'D Grade' },
};

/** Compute grade config live from remainingAmount — bypasses stale DB grade. */
export const getGradeConfig = (remainingAmount, finalPrice = 0) => {
    if (remainingAmount < 0) return gradeConfig.O;
    if (remainingAmount === 0) return gradeConfig.A;
    if (!finalPrice || finalPrice <= 0) return gradeConfig.D;

    const ratio = remainingAmount / finalPrice;
    if (ratio <= 0.4) return gradeConfig.B;
    if (ratio <= 0.8) return gradeConfig.C;
    return gradeConfig.D;
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
