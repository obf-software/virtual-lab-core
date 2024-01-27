import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as servicecatalog from 'aws-cdk-lib/aws-servicecatalog';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BaseLinuxProductProps {
    /**
     * VPC to launch the instance in
     */
    vpc: ec2.IVpc;
    /**
     * Region to launch the instance in
     */
    region: string;
    /**
     * Machine Image to use for the instance
     */
    machineImage: ec2.IMachineImage;
    /**
     * File Key for the User Data script in S3 used to prepare the instance
     */
    userDataS3FileKey: string;
    /**
     * File Bucket for the User Data script in S3 used to prepare the instance
     */
    userDataS3FileBucket: s3.IBucket;
    /**
     * User Data to run once on instance launch
     */
    extraUserDataCommands?: string[];
    /**
     * Block Devices to attach to the instance
     */
    blockDevices?: ec2.BlockDevice[];
    /**
     * Inline Policies to attach to the role
     */
    inlinePolicies?: Record<string, iam.PolicyDocument>;
    /**
     * Managed Policies to attach to the role
     */
    managedPolicies?: iam.IManagedPolicy[];
    /**
     * SSM Parameter Name for the password
     */
    passwordSsmParameterName: string;
    /**
     * SSH Key Name to use for the instance
     */
    sshKeyName?: string;
}

export class BaseLinuxProduct extends servicecatalog.ProductStack {
    constructor(
        scope: Construct,
        id: string,
        props: servicecatalog.ProductStackProps & BaseLinuxProductProps,
    ) {
        super(scope, id, {
            assetBucket: props.assetBucket,
            serverSideEncryption: props.serverSideEncryption,
            serverSideEncryptionAwsKmsKeyId: props.serverSideEncryptionAwsKmsKeyId,
        });

        const vpc = ec2.Vpc.fromLookup(scope, `${id}-Vpc`, { isDefault: true });

        const instanceTypeParam = new cdk.CfnParameter(this, `${id}-InstanceTypeParam`, {
            type: 'String',
            description: 'Instance Type',
            constraintDescription: 'Must be a valid EC2 instance type.',
        });

        const securityGroup = new ec2.SecurityGroup(this, `${id}-SecurityGroup`, {
            vpc,
            allowAllIpv6Outbound: true,
            allowAllOutbound: true,
        });

        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH Connection IPV4');
        securityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(22), 'SSH Connection IPV6');
        securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(5901), 'VNC Connection IPV4');
        securityGroup.addIngressRule(ec2.Peer.anyIpv6(), ec2.Port.tcp(5901), 'VNC Connection IPV6');

        const role = new iam.Role(scope, `${id}-Role`, {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            inlinePolicies: props.inlinePolicies,
            managedPolicies: props.managedPolicies,
        });

        const userData = ec2.UserData.forLinux();
        const baseLinuxUserDataFilePath = userData.addS3DownloadCommand({
            bucket: props.userDataS3FileBucket,
            bucketKey: props.userDataS3FileKey,
            localFile: '/home/ec2-user/base-linux-user-data.sh',
            region: props.region,
        });
        userData.addCommands(`chmod 777 ${baseLinuxUserDataFilePath}`);
        userData.addExecuteFileCommand({
            filePath: baseLinuxUserDataFilePath,
            arguments: [props.passwordSsmParameterName, props.region].join(' '),
        });
        userData.addCommands(`rm -f ${baseLinuxUserDataFilePath}`);
        if (props.extraUserDataCommands !== undefined && props.extraUserDataCommands.length > 0) {
            userData.addCommands(...props.extraUserDataCommands);
        }

        const instance = new ec2.Instance(this, `${id}-Instance`, {
            vpc: props.vpc,
            instanceType: new ec2.InstanceType(instanceTypeParam.valueAsString),
            machineImage: props.machineImage,
            securityGroup,
            role,
            userData,
            keyName: props.sshKeyName,
            blockDevices: props.blockDevices,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
        });

        new cdk.CfnOutput(this, `${id}-OutputInstanceId`, {
            value: instance.instanceId,
            description: 'instanceId',
        });

        new cdk.CfnOutput(this, `${id}-OutputConnectionType`, {
            value: 'VNC',
            description: 'connectionType',
        });
    }
}
