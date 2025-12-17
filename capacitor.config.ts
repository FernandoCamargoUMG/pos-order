import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'Monsterburger',
  webDir: 'www',
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      iosIsEncryption: false,
      iosKeychainPrefix: 'ionic',
      iosBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite'
      },
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        biometricTitle: 'Biometric login for capacitor sqlite',
        biometricSubTitle: 'Log in using your biometric'
      },
      electronIsEncryption: false,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
      electronMacLocation: '/Users/YourName/CapacitorDatabases',
      electronLinuxLocation: 'Databases'
    }
  }
};

export default config;
