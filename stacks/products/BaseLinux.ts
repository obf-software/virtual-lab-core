import { CfnOutput, CfnParameter } from 'aws-cdk-lib';
import {
    BlockDevice,
    IMachineImage,
    IVpc,
    Instance,
    InstanceType,
    Peer,
    Port,
    SecurityGroup,
    SubnetType,
    UserData,
    Vpc,
} from 'aws-cdk-lib/aws-ec2';
import { IManagedPolicy, PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ProductStack, ProductStackProps } from 'aws-cdk-lib/aws-servicecatalog';
import { Construct } from 'constructs';

interface BaseLinuxProductProps {
    // Parameters
    defaultInstanceType: InstanceType;
    allowedInstanceTypes: InstanceType[];

    // AMI
    machineImage: IMachineImage;

    // User Data
    userDataCommands?: string[];

    // Volumes
    blockDevices?: BlockDevice[];

    // Role
    inlinePolicies?: Record<string, PolicyDocument>;
    managedPolicies?: IManagedPolicy[];

    // Other
    password: string;
    vpc: IVpc;
}

export class BaseLinuxProduct extends ProductStack {
    constructor(scope: Construct, id: string, props: ProductStackProps & BaseLinuxProductProps) {
        super(scope, id);

        const vpc = Vpc.fromLookup(scope, `${id}-Vpc`, { isDefault: true });
        const allowedInstanceTypes = new Set(
            [...props.allowedInstanceTypes, props.defaultInstanceType].map((type) =>
                type.toString(),
            ),
        );

        const instanceTypeParam = new CfnParameter(this, `${id}-InstanceTypeParam`, {
            type: 'String',
            default: props.defaultInstanceType.toString(),
            allowedValues: [...allowedInstanceTypes],
            description: 'Instance Type',
        });

        const securityGroup = new SecurityGroup(this, `${id}-SecurityGroup`, {
            vpc,
            allowAllIpv6Outbound: true,
            allowAllOutbound: true,
        });

        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'SSH Connection IPV4');
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3389), 'RDP Connection IPV4');
        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(5901), 'VNC Connection IPV4');
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(22), 'SSH Connection IPV6');
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(3389), 'RDP Connection IPV6');
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(5901), 'VNC Connection IPV6');

        const role = new Role(scope, `${id}-Role`, {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            inlinePolicies: props.inlinePolicies,
            managedPolicies: props.managedPolicies,
        });

        const userData = UserData.forLinux();
        userData.addCommands(
            ...[
                // `yum update -y`,
                `amazon-linux-extras install mate-desktop1.x`,
                `echo 'PREFERRED=/usr/bin/mate-session' > /etc/sysconfig/desktop`,
                `yum -y install tigervnc-server`,
                `yum -y install expect`,
                `mkdir -p /home/ec2-user/.vnc`,
                `echo ${props.password} | vncpasswd -f > /home/ec2-user/.vnc/passwd`,
                `chown -R ec2-user:ec2-user /home/ec2-user/.vnc`,
                `chmod 0600 /home/ec2-user/.vnc/passwd`,
                `mkdir -p /etc/tigervnc`,
                `echo '' > /etc/tigervnc/vncserver-config-mandatory`,
                `cp /lib/systemd/system/vncserver@.service /etc/systemd/system/vncserver@.service`,
                `sed -i 's/<USER>/ec2-user/' /etc/systemd/system/vncserver@.service`,
                `systemctl daemon-reload`,
                `systemctl enable vncserver@:1`,
                `systemctl start vncserver@:1`,
                ...(props.userDataCommands ?? []),
            ],
        );

        const instance = new Instance(this, `${id}-Instance`, {
            vpc: props.vpc,
            instanceType: new InstanceType(instanceTypeParam.valueAsString),
            machineImage: props.machineImage,
            securityGroup,
            role,
            userData,
            keyName: 'debug-key',
            blockDevices: props.blockDevices,
            vpcSubnets: {
                subnetType: SubnetType.PUBLIC,
            },
        });

        new CfnOutput(this, `${id}-OutputAwsInstanceId`, {
            value: instance.instanceId,
            description: 'awsInstanceId',
        });

        new CfnOutput(this, `${id}-OutputConnectionType`, {
            value: 'VNC',
            description: 'connectionType',
        });
    }
}
