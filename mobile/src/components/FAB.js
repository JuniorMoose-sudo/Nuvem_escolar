import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FAB = ({ onPress, icon = 'plus', style, iconColor = theme.colors.white }) => {
  return (
    <TouchableOpacity
      style={[styles.fab, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Criar novo item"
    >
      <MaterialCommunityIcons name={icon} size={28} color={iconColor} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.m,
    bottom: theme.spacing.l,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
});

export default FAB;
