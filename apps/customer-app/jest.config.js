module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-navigation|@react-native-firebase)'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
