import { defineFunction } from '@aws-amplify/backend';

export const sendOtpFunction = defineFunction({
  name: 'sendOtp',
  entry: 'src/sendOtp.ts',
  timeoutSeconds: 60,
});

export const verifyOtpFunction = defineFunction({
  name: 'verifyOtp',
  entry: 'src/verifyOtp.ts',
  timeoutSeconds: 60,
});
