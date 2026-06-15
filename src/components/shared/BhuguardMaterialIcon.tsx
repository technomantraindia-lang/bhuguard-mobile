import Svg, { Path } from 'react-native-svg';

export type BhuguardIconName =
  | 'eco'
  | 'menu'
  | 'agriculture'
  | 'pending_actions'
  | 'fact_check'
  | 'trending_up'
  | 'arrow_forward'
  | 'add_circle'
  | 'photo_camera'
  | 'landscape'
  | 'support_agent'
  | 'science'
  | 'share_location'
  | 'chevron_right'
  | 'dashboard'
  | 'event_note'
  | 'map'
  | 'person'
  | 'sync'
  | 'person_add'
  | 'qr_code_scanner'
  | 'cloud_off'
  | 'location_on'
  | 'schedule'
  | 'hourglass_empty'
  | 'assignment_turned_in'
  | 'group'
  | 'account_circle'
  | 'home'
  | 'notifications'
  | 'verified'
  | 'assignment'
  | 'analytics'
  | 'upload'
  | 'payments'
  | 'co2'
  | 'potted_plant'
  | 'badge'
  | 'search';

interface BhuguardMaterialIconProps {
  name: BhuguardIconName;
  size?: number;
  color?: string;
  filled?: boolean;
}

export function BhuguardMaterialIcon({
  name,
  size = 24,
  color = '#004A20',
  filled = false,
}: BhuguardMaterialIconProps) {
  const path = iconPath(name, filled);

  if (!path) {
    return null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d={path.d}
        fill={path.fill ? color : 'none'}
        stroke={path.fill ? 'none' : color}
        strokeWidth={path.fill ? 0 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function iconPath(name: BhuguardIconName, filled: boolean): { d: string; fill?: boolean } | null {
  switch (name) {
    case 'eco':
      return {
        d: 'M6.05 8.05a7 7 0 0112.9 0A7 7 0 0012 20a7 7 0 01-5.95-11.95zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V8h2v4z',
        fill: true,
      };
    case 'menu':
      return {
        d: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
        fill: true,
      };
    case 'agriculture':
      return {
        d: 'M19.5 12c0 .83-.67 1.5-1.5 1.5H15v6l-3-3-3 3v-6H5.5C4.67 14 4 13.33 4 12.5S4.67 11 5.5 11H9V5l3-3 3 3v6h3.5c.83 0 1.5.67 1.5 1.5zm-7-7.9c.71.71 1.17 1.7 1.17 2.83V11H11V6.93c0-1.13.46-2.12 1.17-2.83L12 3.5l-.5.6z',
        fill: true,
      };
    case 'pending_actions':
      return {
        d: 'M17 12c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm1.65 7.35L16 18.21l1.35-1.35 1.65 1.65 3.35-3.35 1.35 1.35-4.7 4.69zM4 6h16v2H4V6zm0 5h10v2H4v-2zm0 5h7v2H4v-2z',
        fill: true,
      };
    case 'fact_check':
      return {
        d: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17zM20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
        fill: true,
      };
    case 'trending_up':
      return {
        d: 'M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z',
        fill: true,
      };
    case 'arrow_forward':
      return {
        d: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z',
        fill: true,
      };
    case 'add_circle':
      return {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z',
        fill: true,
      };
    case 'photo_camera':
      return {
        d: 'M12 12m-3.2 0a3.2 3.2 0 103.2 3.2 3.2 3.2 0 00-3.2-3.2M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
        fill: true,
      };
    case 'landscape':
      return {
        d: 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6z',
        fill: true,
      };
    case 'support_agent':
      return {
        d: 'M21 12.22C21 6.73 16.74 3 12 3c-4.69 0-9 3.65-9 9.28-.6.34-1 .98-1 1.72v2c0 1.1.9 2 2 2h1v-6.1c0-3.87 3.13-7 7-7s7 3.13 7 7V19h-8v2h8c1.1 0 2-.9 2-2v-1.22c.59-.31 1-.92 1-1.64v-2.14c0-.69-.41-1.31-1-1.62zM7 18H4v-2h3v2zm14 0h-3v-2h3v2zM12 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
        fill: true,
      };
    case 'science':
      return {
        d: 'M19.8 18.4L14 10.67V6.5l1.35-1.69c.26-.33.03-.81-.39-.81H9.04c-.42 0-.65.48-.39.81L10 6.5v4.17L4.2 18.4c-.49.66-.02 1.6.8 1.6h14c.82 0 1.29-.94.8-1.6z',
        fill: true,
      };
    case 'share_location':
      return {
        d: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fill: true,
      };
    case 'chevron_right':
      return {
        d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6-6-6z',
        fill: true,
      };
    case 'dashboard':
      return {
        d: filled
          ? 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z'
          : 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
        fill: true,
      };
    case 'event_note':
      return {
        d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z',
        fill: true,
      };
    case 'person':
      return {
        d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
        fill: true,
      };
    case 'map':
      return {
        d: filled
          ? 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z'
          : 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.16V6.46zm14 11.08l-3 1.01V6.86l3-1.01v11.69z',
        fill: filled,
      };
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
    case 'home':
      return {
        d: filled
          ? 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z'
          : 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
        fill: filled,
      };
    case 'notifications':
      return {
        d: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z',
        fill: true,
      };
    case 'verified':
      return {
        d: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 15l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
        fill: true,
      };
    case 'assignment':
      return {
        d: 'M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
        fill: true,
      };
    case 'analytics':
      return {
        d: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z',
        fill: true,
      };
    case 'upload':
      return {
        d: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
        fill: true,
      };
    case 'payments':
      return {
        d: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
        fill: true,
      };
    case 'co2':
      return {
        d: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z',
        fill: true,
      };
    case 'potted_plant':
      return {
        d: 'M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22L14 6zm-1.99 8.83c.59.59 1.54.59 2.12 0 .59-.59.59-1.54 0-2.12-.59-.59-1.54-.59-2.12 0-.59.58-.59 1.53 0 2.12z',
        fill: true,
      };
    case 'badge':
      return {
        d: 'M14 2H6c-1.1 0-2 .9-2 2v16l8-3 8 3V4c0-1.1-.9-2-2-2zm0 12.5l-6-2.25V4h6v10.5z',
        fill: true,
      };
    case 'search':
      return {
        d: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        fill: true,
      };
    default:
      return null;
  }
}
