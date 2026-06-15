import Svg, { Path } from 'react-native-svg';

export type OfficerIconName =
  | 'sync'
  | 'person_add'
  | 'qr_code_scanner'
  | 'map'
  | 'cloud_off'
  | 'location_on'
  | 'schedule'
  | 'hourglass_empty'
  | 'assignment_turned_in'
  | 'group'
  | 'account_circle';

interface OfficerMaterialIconProps {
  name: OfficerIconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function OfficerMaterialIcon({
  name,
  size = 24,
  color = '#004A20',
  filled = false,
}: OfficerMaterialIconProps) {
  const path = iconPath(name, filled);

  if (!path) {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d={path.d} fill={path.fill ? color : 'none'} stroke={path.fill ? 'none' : color} strokeWidth={path.fill ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function iconPath(name: OfficerIconName, filled: boolean): { d: string; fill?: boolean } | null {
  switch (name) {
    case 'sync':
      return {
        d: 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.96 7.96 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.96 7.96 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
        fill: true,
      };
    case 'person_add':
      return {
        d: 'M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        fill: true,
      };
    case 'qr_code_scanner':
      return {
        d: 'M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M19 5h-6v6h6V5zm-6 8h1.5v1.5H13V13zm1.5 1.5H16V16h-1.5v-1.5zM16 13h1.5v1.5H16V13zm-3 3h1.5v1.5H13V16zm1.5 1.5H16V19h-1.5v-1.5zM16 16h1.5v1.5H16V16zm1.5-1.5H19V16h-1.5v-1.5zm0 3H19V19h-1.5v-1.5zM22 7h-2V4h-3V2h5v5zm0 15v-5h-2v3h-3v2h5zM2 22h5v-2H4v-3H2v5zM2 2v5h2V4h3V2H2z',
        fill: true,
      };
    case 'map':
      return {
        d: filled
          ? 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z'
          : 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.16V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z',
        fill: filled,
      };
    case 'cloud_off':
      return {
        d: 'M19.35 10.04A7.49 7.49 0 0012 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 000 14c0 3.31 2.69 6 6 6h11c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM2 14c0-2.76 2.24-5 5-5 .71 0 1.38.15 2 .42l-1.17 1.17A3.001 3.001 0 006 14H2zm13.5 0c0 .83-.67 1.5-1.5 1.5h-2.17l3-3c.28.46.67.84 1.17 1.05V14z',
        fill: true,
      };
    case 'location_on':
      return {
        d: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fill: true,
      };
    case 'schedule':
      return {
        d: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z',
        fill: true,
      };
    case 'hourglass_empty':
      return {
        d: 'M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-6h-.01L18 15.99 14 12l4-4-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-7l-4-4V4h8v3.5l-4 4z',
        fill: true,
      };
    case 'assignment_turned_in':
      return {
        d: filled
          ? 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'
          : 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
        fill: filled,
      };
    case 'group':
      return {
        d: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
        fill: true,
      };
    case 'account_circle':
      return {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
        fill: true,
      };
    default:
      return null;
  }
}
