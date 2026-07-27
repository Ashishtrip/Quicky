declare module 'react-native-maps' {
  import { Component, ReactNode } from 'react';
  import { ViewStyle, StyleProp } from 'react-native';

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface MapViewProps {
    style?: StyleProp<ViewStyle>;
    region?: Region;
    initialRegion?: Region;
    showsUserLocation?: boolean;
    scrollEnabled?: boolean;
    zoomEnabled?: boolean;
    children?: ReactNode;
  }

  export default class MapView extends Component<MapViewProps> {}

  export interface MarkerProps {
    coordinate: { latitude: number; longitude: number };
    title?: string;
    description?: string;
    pinColor?: string;
    children?: ReactNode;
  }

  export class Marker extends Component<MarkerProps> {}

  export interface PolylineProps {
    coordinates: Array<{ latitude: number; longitude: number }>;
    strokeColor?: string;
    strokeWidth?: number;
    lineDashPattern?: number[];
  }

  export class Polyline extends Component<PolylineProps> {}

  export interface CircleProps {
    center: { latitude: number; longitude: number };
    radius: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
  }

  export class Circle extends Component<CircleProps> {}
}
