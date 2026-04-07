import { create } from 'zustand';

interface CameraRotationState {
  /** True while the camera rig is animating between sides. */
  isRotating: boolean;
  setIsRotating: (value: boolean) => void;
}

/**
 * Tracks whether the camera rig is currently animating a forced rotation.
 * Other systems (e.g. AI move scheduler) read this to wait for rotation
 * completion before performing their own actions.
 */
export const useCameraRotationStore = create<CameraRotationState>((set) => ({
  isRotating: false,
  setIsRotating: (value) => set({ isRotating: value }),
}));
