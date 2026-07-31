export type BoundarySessionMode = 'farm' | 'onboarding' | 'prefarm';

export interface BoundaryFlowRoutes {
  start: string;
  capture: string;
  preview: string;
  confirm: string;
  uploading: string;
  success: string;
  cameraStart: string;
  cameraLive: string;
  cameraPoints: string;
  cameraPreview: string;
  cameraUploading: string;
}

export function getBoundaryFlowRoutes(mode: BoundarySessionMode): BoundaryFlowRoutes {
  if (mode === 'onboarding') {
    return {
      start: 'OnboardingBoundaryStart',
      capture: 'FarmBoundaryMap',
      preview: 'OnboardingBoundaryPreview',
      confirm: 'OnboardingBoundaryPreview',
      uploading: 'OnboardingBoundaryPreview',
      success: 'FarmerLandDetails',
      cameraStart: 'OnboardingCameraBoundaryStart',
      cameraLive: 'OnboardingCameraBoundaryLive',
      cameraPoints: 'OnboardingCameraBoundaryPoints',
      cameraPreview: 'OnboardingCameraBoundaryPreview',
      cameraUploading: 'OnboardingBoundaryPreview',
    };
  }

  if (mode === 'prefarm') {
    return {
      start: 'FarmBoundaryStart',
      capture: 'FarmBoundaryCapture',
      preview: 'FarmBoundaryPreview',
      confirm: 'FarmBoundarySaveConfirm',
      uploading: 'FarmBoundarySaveConfirm',
      success: 'FarmerAddFarm',
      cameraStart: 'CameraBoundaryStart',
      cameraLive: 'CameraBoundaryLive',
      cameraPoints: 'CameraBoundaryPoints',
      cameraPreview: 'CameraBoundaryPreview',
      cameraUploading: 'PrefarmBoundaryConfirm',
    };
  }

  return {
    start: 'FarmBoundaryStart',
    capture: 'FarmBoundaryCapture',
    preview: 'FarmBoundaryPreview',
    confirm: 'FarmBoundarySaveConfirm',
    uploading: 'FarmBoundaryUploading',
    success: 'FarmBoundarySuccess',
    cameraStart: 'CameraBoundaryStart',
    cameraLive: 'CameraBoundaryLive',
    cameraPoints: 'CameraBoundaryPoints',
    cameraPreview: 'CameraBoundaryPreview',
    cameraUploading: 'CameraBoundaryUploading',
  };
}
