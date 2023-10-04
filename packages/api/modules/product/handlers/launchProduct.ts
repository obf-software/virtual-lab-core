// import { APIGatewayProxyHandlerV2WithJWTAuthorizer } from 'aws-lambda';
// import { createHandler } from '../../../integrations/powertools';
// import { drizzle } from 'drizzle-orm/postgres-js';
// import postgres from 'postgres';
// import * as schema from '../../../infrastructure/drizzle/schema';
// import { AwsEc2Integration } from '../../../integrations/aws-ec2/service';
// import { AwsServiceCatalogIntegration } from '../../../integrations/aws-service-catalog/service';
// import { AwsCloudformationIntegration } from '../../../integrations/aws-cloudformation/service';
// import { GuacamoleIntegration } from '../../../infrastructure/guacamole/guacamole';
// import { GroupRepository } from '../../group/repository';
// import { InstanceRepository } from '../../instance/repository';
// import { GroupService } from '../../group/service';
// import { InstanceService } from '../../instance/service';
// import { ProductService } from '../service';
// import { AuthService } from '../../auth/service';

// // Config
// const { AWS_REGION, DATABASE_URL, GUACAMOLE_CYPHER_KEY, INSTANCE_PASSWORD } = process.env;
// const dbClient = drizzle(postgres(DATABASE_URL), { schema });

// // Integration
// const awsEc2Integration = new AwsEc2Integration({ AWS_REGION });
// const awsServiceCatalogIntegration = new AwsServiceCatalogIntegration({ AWS_REGION });
// const awsCloudformationIntegration = new AwsCloudformationIntegration({ AWS_REGION });
// const guacamoleIntegration = new GuacamoleIntegration();

// // Repository
// const groupRepository = new GroupRepository(dbClient);
// const instanceRepository = new InstanceRepository(dbClient);

// // Service
// const groupService = new GroupService({ awsServiceCatalogIntegration, groupRepository });
// const instanceService = new InstanceService({
//     awsEc2Integration,
//     awsServiceCatalogIntegration,
//     GUACAMOLE_CYPHER_KEY,
//     guacamoleIntegration,
//     INSTANCE_PASSWORD,
//     instanceRepository,
// });
// const productService = new ProductService({
//     awsServiceCatalogIntegration,
//     awsEc2Integration,
//     awsCloudformationIntegration,
//     groupService,
//     instanceService,
// });
// const authService = new AuthService();

// export const handler = createHandler<APIGatewayProxyHandlerV2WithJWTAuthorizer>(
//     (event) => {},
//     true,
// );
