import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sst from 'sst/constructs';
import { SSTConfig } from 'sst';
import { Api } from './stacks/Api';
import { Auth } from './stacks/Auth';
import { Client } from './stacks/Client';
import { Core } from './stacks/Core';
import { AppSyncApi } from './stacks/AppSyncApi';
import { ServiceCatalog } from './stacks/ServiceCatalog';
import { ConnectionGateway } from './stacks/ConnectionGateway';
import { featureFlagIsEnabled } from './stacks/config/feature-flags';
import { Docs } from './stacks/Docs';

export default {
    config() {
        return {
            name: 'virtual-lab-core',
            region: 'us-east-1',
        };
    },
    async stacks(app) {
        if (
            featureFlagIsEnabled({
                featureFlag: 'READABLE_LOG_FORMAT',
                components: ['Lambda Powertools Dev Logging'],
                forceEnable: app.mode === 'dev',
            })
        ) {
            app.addDefaultFunctionEnv({ POWERTOOLS_DEV: 'true' });
        }

        const enableNewRelicLambdaInstrumentation = featureFlagIsEnabled({
            featureFlag: 'NEW_RELIC_LAMBDA_INSTRUMENTATION',
            components: ['New Relic Lambda Layer'],
            forceDisable: app.mode === 'dev',
        });

        if (enableNewRelicLambdaInstrumentation) {
            app.setDefaultFunctionProps((stack) => {
                /**
                 * @see https://layers.newrelic-external.com/
                 */
                const newRelicLayer = lambda.LayerVersion.fromLayerVersionArn(
                    stack,
                    'NewRelicLayer',
                    'arn:aws:lambda:us-east-1:451483290750:layer:NewRelicNodeJS18X:69',
                );

                return {
                    layers: [newRelicLayer.layerVersionArn],
                };
            });
        }

        app.stack(Core);
        app.stack(Auth);
        app.stack(AppSyncApi);
        app.stack(Api);
        app.stack(Docs);
        app.stack(ServiceCatalog);
        app.stack(ConnectionGateway);
        app.stack(Client);

        if (enableNewRelicLambdaInstrumentation) {
            await app.finish();

            const newRelicAccountId = process.env.NEW_RELIC_ACCOUNT_ID;
            const newRelicTrustedAccountKey = process.env.NEW_RELIC_TRUSTED_ACCOUNT_KEY;
            const newRelicLicenseKey = process.env.NEW_RELIC_LICENSE_KEY;

            if (!newRelicAccountId || !newRelicTrustedAccountKey || !newRelicLicenseKey) {
                throw new Error(
                    'NEW_RELIC_ACCOUNT_ID and NEW_RELIC_TRUSTED_ACCOUNT_KEY must be set in the environment',
                );
            }

            app.node.children.forEach((stack) => {
                if (stack instanceof sst.Stack) {
                    stack.getAllFunctions().forEach((fn) => {
                        const cfnFunction = fn.node.defaultChild as lambda.CfnFunction;

                        if (cfnFunction.handler) {
                            fn.addEnvironment('NEW_RELIC_LAMBDA_HANDLER', cfnFunction.handler);
                            fn.addEnvironment('NEW_RELIC_ACCOUNT_ID', newRelicAccountId);
                            fn.addEnvironment(
                                'NEW_RELIC_TRUSTED_ACCOUNT_KEY',
                                newRelicTrustedAccountKey,
                            );
                            fn.addEnvironment('NEW_RELIC_LICENSE_KEY', newRelicLicenseKey);
                        }

                        cfnFunction.handler = 'newrelic-lambda-wrapper.handler';
                    });
                }
            });
        }
    },
} satisfies SSTConfig;
