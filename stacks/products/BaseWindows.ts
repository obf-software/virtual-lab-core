import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as servicecatalog from 'aws-cdk-lib/aws-servicecatalog';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface BaseWindowsProductProps {
    /**
     * VPC to launch the instance in
     */
    vpc: ec2.IVpc;
    /**
     * Region to launch the instance in
     */
    region: string;
    /**
     * File Key for the User Data script in S3 used to prepare the instance
     */
    userDataS3FileKey: string;
    /**
     * File Bucket for the User Data script in S3 used to prepare the instance
     */
    userDataS3FileBucket: s3.IBucket;
    /**
     * SSM Parameter Name for the password
     */
    passwordSsmParameterName: string;
    /**
     * SSH Key Name to use for the instance
     */
    sshKeyName?: string;
    /**
     * Connection Proxy IPV4 CIDR
     */
    connectionProxyIpv4Cidr?: string;
    /**
     * Connection Proxy IPV6 CIDR
     */
    connectionProxyIpv6Cidr?: string;
}

export class BaseWindowsProduct extends servicecatalog.ProductStack {
    constructor(
        scope: Construct,
        id: string,
        props: servicecatalog.ProductStackProps & BaseWindowsProductProps,
    ) {
        super(scope, id, {
            assetBucket: props.assetBucket,
            serverSideEncryption: props.serverSideEncryption,
            serverSideEncryptionAwsKmsKeyId: props.serverSideEncryptionAwsKmsKeyId,
        });

        const machineImageIdParam = new cdk.CfnParameter(this, `${id}-MachineImageIdParam`, {
            type: 'String',
            description: 'machineImageId',
        });

        const instanceTypeParam = new cdk.CfnParameter(this, `${id}-InstanceTypeParam`, {
            type: 'String',
            description: 'instanceType',
        });

        const ebsVolumeSizeParam = new cdk.CfnParameter(this, `${id}-EbsVolumeSizeParam`, {
            type: 'Number',
            description: 'ebsVolumeSize',
            minValue: 30,
            default: 30,
        });

        const enableHibernationParam = new cdk.CfnParameter(this, `${id}-EnableHibernationParam`, {
            type: 'String',
            description: 'enableHibernation',
            allowedValues: ['true', 'false'],
            default: 'false',
        });

        const securityGroup = new ec2.SecurityGroup(this, `${id}-SecurityGroup`, {
            vpc: props.vpc,
            allowAllIpv6Outbound: true,
            allowAllOutbound: true,
        });

        if (props.connectionProxyIpv4Cidr !== undefined) {
            securityGroup.addIngressRule(
                ec2.Peer.ipv4(props.connectionProxyIpv4Cidr),
                ec2.Port.tcp(22),
                'SSH Connection IPV4 from Connection Proxy',
            );
            securityGroup.addIngressRule(
                ec2.Peer.ipv4(props.connectionProxyIpv4Cidr),
                ec2.Port.tcp(3389),
                'RDP Connection IPV4 from Connection Proxy',
            );
        }

        if (props.connectionProxyIpv6Cidr !== undefined) {
            securityGroup.addIngressRule(
                ec2.Peer.ipv6(props.connectionProxyIpv6Cidr),
                ec2.Port.tcp(22),
                'SSH Connection IPV6 from Connection Proxy',
            );
            securityGroup.addIngressRule(
                ec2.Peer.ipv6(props.connectionProxyIpv6Cidr),
                ec2.Port.tcp(3389),
                'RDP Connection IPV6 from Connection Proxy',
            );
        }

        if (
            props.connectionProxyIpv4Cidr === undefined &&
            props.connectionProxyIpv6Cidr === undefined
        ) {
            securityGroup.addIngressRule(
                ec2.Peer.anyIpv4(),
                ec2.Port.tcp(22),
                'SSH Connection IPV4',
            );
            securityGroup.addIngressRule(
                ec2.Peer.anyIpv6(),
                ec2.Port.tcp(22),
                'SSH Connection IPV6',
            );
            securityGroup.addIngressRule(
                ec2.Peer.anyIpv4(),
                ec2.Port.tcp(3389),
                'RDP Connection IPV4',
            );
            securityGroup.addIngressRule(
                ec2.Peer.anyIpv6(),
                ec2.Port.tcp(3389),
                'RDP Connection IPV6',
            );
        }

        const userData = ec2.UserData.forWindows();
        const baseWindowsUserDataFilePath = userData.addS3DownloadCommand({
            bucket: props.userDataS3FileBucket,
            bucketKey: props.userDataS3FileKey,
            localFile: 'C:\\Users\\Administrator\\base-windows-user-data.ps1',
            region: props.region,
        });
        userData.addExecuteFileCommand({
            filePath: baseWindowsUserDataFilePath,
            arguments: [props.passwordSsmParameterName, props.region].join(' '),
        });

        const instance = new ec2.Instance(this, `${id}-Instance`, {
            vpc: props.vpc,
            instanceType: new ec2.InstanceType(instanceTypeParam.valueAsString),
            machineImage: ec2.MachineImage.genericWindows({
                [props.region]: machineImageIdParam.valueAsString,
            }),
            securityGroup,
            userData,
            keyName: props.sshKeyName,
            blockDevices: [
                {
                    deviceName: 'xvda',
                    volume: ec2.BlockDeviceVolume.ebs(ebsVolumeSizeParam.valueAsNumber, {
                        deleteOnTermination: true,
                        encrypted: true,
                        volumeType: ec2.EbsDeviceVolumeType.GP2,
                    }),
                },
            ],
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            requireImdsv2: true,
            ssmSessionPermissions: true,
        });

        const instanceAsL1 = instance.node.defaultChild as ec2.CfnInstance;
        instanceAsL1.addPropertyOverride(
            'HibernationOptions.Configured',
            enableHibernationParam.valueAsString === 'true',
        );

        new cdk.CfnOutput(this, `${id}-OutputInstanceId`, {
            value: instance.instanceId,
            description: 'instanceId',
        });

        new cdk.CfnOutput(this, `${id}-OutputConnectionType`, {
            value: 'RDP',
            description: 'connectionType',
        });
    }
}
