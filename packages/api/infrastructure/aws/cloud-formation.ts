import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';

export class CloudFormation {
    private client: CloudFormationClient;

    constructor(AWS_REGION: string) {
        this.client = new CloudFormationClient({ region: AWS_REGION });
    }

    async describeStackByName(stackName: string) {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const { Stacks } = await this.client.send(command);
        if (Stacks === undefined || Stacks.length === 0) {
            return undefined;
        }
        return Stacks[0];
    }
}
