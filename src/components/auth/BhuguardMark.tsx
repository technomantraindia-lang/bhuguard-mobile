import { BhuguardLogo } from '../shared/BhuguardLogo';



interface BhuguardMarkProps {

  variant?: 'shield' | 'leaf';

  size?: number;

}



/** @deprecated Use BhuguardLogo with the official brand image. */

export function BhuguardMark({ size = 56 }: BhuguardMarkProps) {

  return <BhuguardLogo size={size} />;

}


