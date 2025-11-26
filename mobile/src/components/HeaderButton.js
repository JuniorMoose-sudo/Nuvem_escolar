import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme/theme';

const HeaderButton = ({ onPress, iconName, label, color = theme.colors.headerText }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      {iconName ? (
        <MaterialCommunityIcons name={iconName} size={24} color={color} />
      ) : (
        <Text style={[styles.label, { color }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.m,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    ...theme.typography.button,
    fontSize: 16,
  },
});

export default HeaderButton;
