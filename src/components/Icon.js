// Thin wrapper around @expo/vector-icons Feather (matches Lucide's icon set exactly)
import React from 'react';
import { Feather } from '@expo/vector-icons';

export default function Icon({ name, size = 20, color, style }) {
    return <Feather name={name} size={size} color={color} style={style} />;
}
