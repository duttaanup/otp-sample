//@ts-nocheck
import type { APIGatewayProxyHandler } from "aws-lambda";
import { PinpointClient, VerifyOTPMessageCommand } from '@aws-sdk/client-pinpoint';

// Initialize the Pinpoint client
const pinpointClient = new PinpointClient({ region: process.env.PINPOINT_REGION });

export const handler: APIGatewayProxyHandler = async (event: any) => {
    // validate OTP and phone number
    const { phoneNumber, otp } = JSON.parse(event.body);
    const params = {
        ApplicationId: process.env.PINPOINT_PROJECT_ID,
        VerifyOTPMessageRequestParameters: {
            DestinationIdentity: phoneNumber,
            Otp: otp,
            ReferenceId: `${phoneNumber}-YourAppName`,
        },
    };
    console.log(params)
    try {
        const command = new VerifyOTPMessageCommand(params);
        const result = await pinpointClient.send(command);
        console.log('OTP verification result', result);

        if(result.VerificationResponse && result.VerificationResponse.Valid) {
            // generate signed URL
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({
                    message: 'OTP verified successfully',
                    signedURL : "XXXXXXXXXXXXXXXXXXXXXX",
                    status: true
                })
            };
        }else{
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                },
                body: JSON.stringify({
                    message: 'OTP verification failed',
                    status: false
                })
            };
        }

        
    } catch (error) {
        console.error('Error verifying OTP', error);
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            },
            body: JSON.stringify({ message: 'OTP verification failed' })
        };
    }
};