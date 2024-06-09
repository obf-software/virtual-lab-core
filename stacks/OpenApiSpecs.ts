import { Construct } from 'constructs';
import * as sst from 'sst/constructs';
import {
    OpenAPIObject,
    OperationObject,
    PathsObject,
    ReferenceObject,
    ResponseObject,
} from 'openapi3-ts/dist/oas30';
import * as s3deployment from 'aws-cdk-lib/aws-s3-deployment';
import { Stack } from 'aws-cdk-lib';
import _ from 'lodash';

export type OpenApiSpecsProps = Omit<OpenAPIObject, 'openapi' | 'paths'> & {
    paths: PathsObject[];
};

export class OpenApiSpecs extends Construct {
    private region: string;
    private bucket: sst.Bucket;
    private bucketSpecsFileKey: string;
    private bucketDeployment: s3deployment.BucketDeployment;
    private specs: OpenAPIObject;

    constructor(scope: Construct, id: string, props: OpenApiSpecsProps) {
        super(scope, id);

        this.specs = {
            openapi: '3.0.0',
            info: props.info,
            servers: props.servers,
            paths: _.merge({}, ...props.paths) as PathsObject,
            components: props.components,
            security: props.security,
            tags: props.tags,
            externalDocs: props.externalDocs,
        };

        this.region = Stack.of(this).region;

        this.bucket = new sst.Bucket(scope, 'OpenApiSpecsBucket', {
            cors: true,
            cdk: {
                bucket: {
                    publicReadAccess: true,
                },
            },
        });

        this.bucketSpecsFileKey = 'specs.json';

        this.bucketDeployment = new s3deployment.BucketDeployment(
            scope,
            'OpenApiSpecsBucketDeployment',
            {
                destinationBucket: this.bucket.cdk.bucket,
                sources: [s3deployment.Source.jsonData(this.bucketSpecsFileKey, this.specs)],
            },
        );
    }

    public getSpecsUrl = (): string => {
        return `https://${this.bucket.bucketName}.s3.${this.region}.amazonaws.com/${this.bucketSpecsFileKey}`;
    };

    static readonly addHttpApiRoutes = <T extends Record<string, sst.ApiAuthorizer>>(
        scope: Construct,
        api: sst.Api<T>,
        routes: Record<
            string,
            {
                handler: sst.ApiRouteProps<keyof T>;
                specs: Omit<OperationObject, 'responses'> & {
                    responses?: Record<string, ResponseObject | ReferenceObject>;
                };
            }
        >,
    ): PathsObject => {
        api.addRoutes(
            scope,
            Object.entries(routes)
                .map(([route, { handler }]) => ({ [route]: handler }))
                .reduce((acc, curr) => ({ ...acc, ...curr }), {}),
        );

        return Object.entries(routes).reduce((acc, [route, { specs }]) => {
            const [upperCaseMethod, path] = route.replace(/^\//, '').split(' ');
            const method = upperCaseMethod.toLowerCase();

            return {
                ...acc,
                [path]: {
                    ...acc[path],
                    [method]: { ...specs },
                },
            };
        }, {} as PathsObject);
    };

    static readonly markdown = (
        stringTemplates: TemplateStringsArray,
        ...templateArguments: (string | number | undefined)[]
    ): string => {
        const lines = stringTemplates
            .reduce((acc, segment, i) => acc + segment + (templateArguments[i] ?? ''), '')
            .trimEnd()
            .split('\n')
            .map((line) => line.replace(/^ +$/, ''));

        while (lines[0].length === 0) lines.shift();
        while (lines[lines.length - 1].length === 0) lines.pop();

        const minLeadingSpaces = lines
            .filter((line) => line.length > 0)
            .reduce((acc, line) => {
                const leadingSpaces = line.match(/^ */)?.[0].length ?? 0;
                return leadingSpaces < acc ? leadingSpaces : acc;
            }, Infinity);

        return lines
            .map((line) => (line.length > 0 ? line.substring(minLeadingSpaces) : line))
            .join('\n');
    };
}
