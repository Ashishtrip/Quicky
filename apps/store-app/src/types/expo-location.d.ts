declare module 'expo-location' {
  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function getCurrentPositionAsync(options?: any): Promise<{
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }>;
  export const Accuracy: {
    Lowest: 1;
    Low: 2;
    Balanced: 3;
    High: 4;
    Highest: 5;
    BestForNavigation: 6;
  };
}
