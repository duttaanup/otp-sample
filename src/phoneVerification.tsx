//@ts-nocheck
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { post } from 'aws-amplify/api';
import { Alert, Button, Container, FormField, SpaceBetween } from '@cloudscape-design/components';

const API_NAME = "otpAPI";

const PhoneVerificationForm: React.FC = () => {
    const [phoneNumber, setPhoneNumber] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [signedUrl, setSignedUrl] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setPhoneNumber(e.target.value);
    };

    const handleOtpChange = (e: ChangeEvent<HTMLInputElement>): void => {
        setOtp(e.target.value);
    };

    const sendOTP = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setError('');

        try {
            const restOperation = post({
                apiName: API_NAME,
                path: 'otp',
                options: {
                    body: { phoneNumber },
                }
            });
            const { body } = await restOperation.response;
            await body.json();
            setIsOtpSent(true);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to send OTP');
        }
    };

    const verifyOTP = async (e: FormEvent): Promise<void> => {
        e.preventDefault();
        setError('');

        try {
            const restOperation = post({
                apiName: API_NAME,
                path: 'validate',
                options: {
                    body: {
                        phoneNumber,
                        otp
                    },
                }
            });
            const { body } = await restOperation.response;
            const response = await body.json();
            console.log(response)
            if (response && response.status) {
                setIsVerified(true);
                setSignedUrl(response.signedURL);
            }else{
                setError("Invalid OTP");
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Verification failed');
        }
    };

    return (
        <Container>
            <SpaceBetween size='l'>
                {error && <Alert type="error" header="Error" >{error}</Alert>}

                <form onSubmit={!isOtpSent ? sendOTP : verifyOTP}>
                    <SpaceBetween size='xl'>
                        <FormField label="Phone Number">
                            <input
                                type="tel"
                                value={phoneNumber}
                                onChange={handlePhoneChange}
                                placeholder="Enter phone number"
                                disabled={isOtpSent}
                                required
                                pattern="^\+?[1-9]\d{1,14}$"
                            />
                        </FormField>

                        {!isOtpSent && (
                            <Button type="submit">Send OTP</Button>
                        )}

                        {isOtpSent && !isVerified && (
                            <FormField label="Enter OTP">
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={handleOtpChange}
                                    placeholder="Enter OTP"
                                    required
                                    pattern="^\d{6}$"
                                />
                                <button type="submit">Verify OTP</button>
                            </FormField>
                        )}
                    </SpaceBetween>
                </form>

                {isVerified && signedUrl && (
                    <Alert type="success" header="Success">
                        <p>Phone number verified successfully!</p>
                        <a
                            href={signedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="download-link"
                        >
                            Download File
                        </a>
                    </Alert>
                )}
            </SpaceBetween>
        </Container>
    );
};

export default PhoneVerificationForm;
