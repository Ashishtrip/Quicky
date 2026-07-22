declare module '@react-native-picker/picker' {
  import * as React from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface PickerProps<T> {
    selectedValue?: T;
    onValueChange?: (itemValue: T, itemIndex: number) => void;
    style?: ViewStyle | TextStyle | (ViewStyle | TextStyle)[];
    dropdownIconColor?: string;
    children?: React.ReactNode;
  }

  export class Picker<T> extends React.Component<PickerProps<T>> {
    static Item: React.ComponentType<{ label: string; value: T; color?: string; key?: string | number }>;
  }
}

declare module '@react-native-community/datetimepicker' {
  import * as React from 'react';

  export interface DateTimePickerEvent {
    type: string;
    nativeEvent: any;
  }

  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'inline';
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    testID?: string;
  }

  const DateTimePicker: React.ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}
