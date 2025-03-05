import { defineBackend } from '@aws-amplify/backend';
import { aws_dynamodb as DDB, RemovalPolicy, Duration, aws_pinpoint as Pinpoint, Stack } from "aws-cdk-lib";
import {Cors,LambdaIntegration,RestApi,MethodLoggingLevel} from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

import { sendOtpFunction, verifyOtpFunction } from './functions/resource';

const backend = defineBackend({
    sendOtpFunction, verifyOtpFunction
});

const otp_table = new DDB.Table(backend.stack, "UserRegistration", {
    partitionKey: { name: "phone_number", type: DDB.AttributeType.STRING },
    billingMode: DDB.BillingMode.PAY_PER_REQUEST,
    removalPolicy: RemovalPolicy.DESTROY
});

// Create Amazon Pinpoint Project
const pinpointProject = new Pinpoint.CfnApp(backend.stack, "otp_pinpoint_project", {
    name: "otp_pinpoint_project",
});

backend.sendOtpFunction.addEnvironment("OTP_TABLE", otp_table.tableName);
backend.sendOtpFunction.addEnvironment("PINPOINT_PROJECT_ID", pinpointProject.ref);
backend.sendOtpFunction.addEnvironment("ORIGINATION_NUMBER", "+919953729194");
backend.sendOtpFunction.addEnvironment("PINPOINT_REGION", Stack.of(backend.stack).region);


// Grant Pinpoint permissions to Lambda
backend.sendOtpFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            'mobiletargeting:SendOTPMessage',
            'mobiletargeting:VerifyOTPMessage',
            'mobiletargeting:SendMessages',
            'mobiletargeting:SendUsersMessages'
        ],
        resources: ["*"]
    })
);

backend.verifyOtpFunction.addEnvironment("PINPOINT_PROJECT_ID", pinpointProject.ref);
backend.verifyOtpFunction.addEnvironment("PINPOINT_REGION", Stack.of(backend.stack).region);


backend.verifyOtpFunction.resources.lambda.addToRolePolicy(
    new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
            'mobiletargeting:SendOTPMessage',
            'mobiletargeting:VerifyOTPMessage',
            'mobiletargeting:SendMessages',
            'mobiletargeting:SendUsersMessages'
        ],
        resources: ["*"]
    })
);


const otpAPI = new RestApi(backend.stack, "OTPAPI", {
    restApiName: "otpAPI",
    deploy: true,
    deployOptions: {
        stageName: "dev",
        throttlingRateLimit: 100,
        throttlingBurstLimit: 50,
        cacheClusterEnabled: true,
        cacheClusterSize: "0.5",
        cacheTtl: Duration.seconds(60),
        loggingLevel: MethodLoggingLevel.INFO,
        tracingEnabled: true,
        metricsEnabled: true,
        dataTraceEnabled: true,
        methodOptions: {
            "/*/*": {
                throttlingRateLimit: 100,
                throttlingBurstLimit: 50,
            },
        },
    },
    defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS, // Restrict this to domains you trust
        allowMethods: Cors.ALL_METHODS, // Specify only the methods you need to allow
        allowHeaders: [
            'Content-Type',
            'X-Amz-Date',
            'Authorization',
            'X-Api-Key',
            'X-Amz-Security-Token'
        ]
    },
});

const otpPath = otpAPI.root.addResource("otp");
otpPath.addMethod("POST", new LambdaIntegration(backend.sendOtpFunction.resources.lambda));

const validatePath = otpAPI.root.addResource("validate");
validatePath.addMethod("POST", new LambdaIntegration(backend.verifyOtpFunction.resources.lambda));

backend.addOutput({
    custom: {
        API: {
            [otpAPI.restApiName]: {
                endpoint: otpAPI.url,
                region: Stack.of(otpAPI).region,
                apiName: otpAPI.restApiName,
            },
        }
    }
});