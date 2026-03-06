// Design tokens — Art Finance Management (Light Theme)
export const Colors = {
    bg: '#F7F4F0',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    cardBorder: '#EDE9E3',
    accent: '#C9893A',
    accentLight: '#E8B060',
    accentMuted: 'rgba(201,137,58,0.10)',
    textPrimary: '#1A1410',
    textSecondary: '#6B6057',
    textMuted: '#A89E95',
    success: '#2E8A5E',
    successBg: 'rgba(46,138,94,0.10)',
    warning: '#B8861A',
    warningBg: 'rgba(184,134,26,0.12)',
    orange: '#C4611A',
    orangeBg: 'rgba(196,97,26,0.10)',
    danger: '#C43A3A',
    dangerBg: 'rgba(196,58,58,0.10)',
    inputBg: '#FFFFFF',
    inputBorder: '#DDD9D3',
    inputFocus: '#C9893A',
    separator: '#EDE9E3',
    white: '#FFFFFF',
};

export const Spacing = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const Radius = {
    sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const Font = {
    xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 26, xxxl: 34,
};

export const gradeConfig = {
    excellent: { color: '#1B5E20', bg: '#C8E6C9', label: 'Excellent' },
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
