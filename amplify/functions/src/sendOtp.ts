//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { PinpointClient, SendOTPMessageCommand, SendMessagesCommand } from '@aws-sdk/client-pinpoint';

// Initialize the Pinpoint client
const pinpointClient = new PinpointClient({ region: process.env.PINPOINT_REGION });

export const handler: APIGatewayProxyHandler = async (event: any) => {
  const { phoneNumber } = JSON.parse(event.body);

  // validate phone number in database. If it exists generate OTP else throw error

  if (isPhoneNumberExists(phoneNumber)) {
    await sendOTP(phoneNumber);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ message: 'OTP sent successfully' })
    };
  } else {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*"
      },
      body: JSON.stringify({ message: 'Phone number not found in database' })
    };
  }
};

const isPhoneNumberExists = (phoneNumber: string) => {
  // Check if phone number exists in database
  return phoneNumber == process.env.ORIGINATION_NUMBER;
};

const sendOTP = async (phoneNumber: string) => {
  console.log('Sending OTP to', phoneNumber);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const params = {
    ApplicationId: process.env.PINPOINT_PROJECT_ID,
    SendOTPMessageRequestParameters: {
      Channel: 'SMS',
      BrandName: 'YourAppName', // Replace with your app name
      CodeLength: 6,
      ValidityPeriod: 15, // OTP valid for 15 minutes
      AllowedAttempts: 3,
      Language: 'en-US',
      DestinationIdentity: phoneNumber,
      OriginationIdentity: "Test",
      ReferenceId: `${phoneNumber}-YourAppName`
    }
  };

  console.log('Sending OTP with params', params);

  // Send OTP using Pinpoint
  const command = new SendOTPMessageCommand(params);
  const response = await pinpointClient.send(command);

  console.log('OTP sent successfully', response);
};
