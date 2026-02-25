import * as LocalAuthentication from "expo-local-authentication";

/**
 * Check if biometric hardware is available.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

/**
 * Prompt user for biometric authentication.
 * Returns true if authenticated, false if cancelled/failed.
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock NEB School ERP",
    cancelLabel: "Use Password",
    disableDeviceFallback: false,
    fallbackLabel: "Use Passcode",
  });

  return result.success;
}
