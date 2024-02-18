import * as ec2 from 'aws-cdk-lib/aws-ec2';
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
            minValue: 8,
            default: 8,
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
                ec2.Port.tcp(5901),
                'VNC Connection IPV4 from Connection Proxy',
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
                ec2.Port.tcp(5901),
                'VNC Connection IPV6 from Connection Proxy',
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
                ec2.Port.tcp(5901),
                'VNC Connection IPV4',
            );
            securityGroup.addIngressRule(
                ec2.Peer.anyIpv6(),
                ec2.Port.tcp(5901),
                'VNC Connection IPV6',
            );
        }

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
        userData.addCommands(
            ...[
                `rm -f ${baseLinuxUserDataFilePath}`,
                'wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm',
                'yum -y install ./google-chrome-stable_current_*.rpm',
                'rm -f ./google-chrome-stable_current_*.rpm',
            ],
        );

        const instance = new ec2.Instance(this, `${id}-Instance`, {
            vpc: props.vpc,
            instanceType: new ec2.InstanceType(instanceTypeParam.valueAsString),
            machineImage: ec2.MachineImage.genericLinux({
                [props.region]: machineImageIdParam.valueAsString,
            }),
            securityGroup,
            userData,
            keyName: props.sshKeyName,
            blockDevices: [
                {
                    deviceName: '/dev/xvda',
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
            value: 'VNC',
            description: 'connectionType',
        });
    }
}
