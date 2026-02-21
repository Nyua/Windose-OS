export type TimeSlot = 'NOON' | 'DUSK' | 'NIGHT';

export type WindowAppType =
  | 'webcam'
  | 'jine'
  | 'stream'
  | 'tweeter'
  | 'hangout'
  | 'goout'
  | 'internet'
  | 'medication'
  | 'medication_depaz'
  | 'medication_dyslem'
  | 'medication_embian'
  | 'medication_magic_smoke'
  | 'sleep'
  | 'trash'
  | 'controlpanel'
  | 'credits'
  | 'secret'
  | 'task';

export interface WindowState {
  id: string;
  appType: WindowAppType;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isFocused: boolean;
  isOpen: boolean;
  isFullscreen: boolean;
  lastNormal?: { x: number; y: number; width: number; height: number };
}

export interface IconHoverPayload {
  id: string;
  hovering: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type SettingValue = string | number | boolean;

export interface SettingField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean';
  min?: number;
  max?: number;
  step?: number;
}

export interface SettingsSchema {
  [key: string]: SettingValue;
}
