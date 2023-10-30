import { CfnOutput, CfnParameter } from 'aws-cdk-lib';
import {
    BlockDevice,
    IVpc,
    Instance,
    InstanceType,
    Peer,
    Port,
    SecurityGroup,
    SubnetType,
    UserData,
    Vpc,
    WindowsImage,
} from 'aws-cdk-lib/aws-ec2';
import { IManagedPolicy, PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ProductStack, ProductStackProps } from 'aws-cdk-lib/aws-servicecatalog';
import { Construct } from 'constructs';

interface BaseWindowsProductProps {
    // Parameters
    defaultInstanceType: InstanceType;
    allowedInstanceTypes: InstanceType[];

    // AMI
    machineImage: WindowsImage;

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

export class BaseWindowsProduct extends ProductStack {
    constructor(scope: Construct, id: string, props: ProductStackProps & BaseWindowsProductProps) {
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

        securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3389), 'RDP Connection IPV4');
        securityGroup.addIngressRule(Peer.anyIpv6(), Port.tcp(3389), 'RDP Connection IPV6');

        const role = new Role(scope, `${id}-Role`, {
            assumedBy: new ServicePrincipal('ec2.amazonaws.com'),
            inlinePolicies: props.inlinePolicies,
            managedPolicies: props.managedPolicies,
        });

        const userData = UserData.forWindows();
        userData.addCommands(
            ...[
                `$password = "${props.password}"`,
                `$securePass = ConvertTo-SecureString $password -AsPlainText -Force`,
                `New-LocalUser "developer" -Password $securePass -FullName "Developer" -Description "Developer Account"`,
                `Add-LocalGroupMember -Group "Administrators" -Member "developer"`,
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

        new CfnOutput(this, `${id}-OutputInstanceId`, {
            value: instance.instanceId,
            description: 'instanceId',
        });

        new CfnOutput(this, `${id}-OutputConnectionType`, {
            value: 'RDP',
            description: 'connectionType',
        });
    }
}
