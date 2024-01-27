import * as sst from 'sst/constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export const LambdaLayers = ({ stack }: sst.StackContext) => {
    const paramsAndSecretsExtension = lambda.LayerVersion.fromLayerVersionArn(
        stack,
        'ParamsAndSecretsExtension',
        'arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:4',
    );

    return {
        paramsAndSecretsExtension,
    };
};
