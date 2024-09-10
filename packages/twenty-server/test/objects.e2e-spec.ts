import { INestApplication } from '@nestjs/common';

import request from 'supertest';

import setup from './utils/global-setup';

describe('objectsResolver (e2e)', () => {
  let app: INestApplication;
  let accessToken: string | undefined;

  beforeAll(async () => {
    const setupData = await setup();

    app = setupData.app;
    accessToken = setupData.accessToken;
  });

  it('should find many objects', () => {
    const queryData = {
      query: `
        query objects {
          objects {
            edges {
              node {
                id
                dataSourceId
                nameSingular
                namePlural
                labelSingular
                labelPlural
                description
                icon
                isCustom
                isRemote
                isActive
                isSystem
                createdAt
                updatedAt
                labelIdentifierFieldMetadataId
                imageIdentifierFieldMetadataId
              }
            }
          }
        }
      `,
    };

    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(queryData)
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeDefined();
        expect(res.body.errors).toBeUndefined();
      })
      .expect((res) => {
        const data = res.body.data.objects;

        expect(data).toBeDefined();
        expect(Array.isArray(data.edges)).toBe(true);

        const edges = data.edges;

        expect(edges.length).toBeGreaterThan(0);

        const objects = edges[0].node;

        expect(objects).toHaveProperty('id');
        expect(objects).toHaveProperty('dataSourceId');
        expect(objects).toHaveProperty('nameSingular');
        expect(objects).toHaveProperty('namePlural');
        expect(objects).toHaveProperty('labelSingular');
        expect(objects).toHaveProperty('labelPlural');
        expect(objects).toHaveProperty('description');
        expect(objects).toHaveProperty('icon');
        expect(objects).toHaveProperty('isCustom');
        expect(objects).toHaveProperty('isRemote');
        expect(objects).toHaveProperty('isActive');
        expect(objects).toHaveProperty('isSystem');
        expect(objects).toHaveProperty('createdAt');
        expect(objects).toHaveProperty('updatedAt');
        expect(objects).toHaveProperty('labelIdentifierFieldMetadataId');
        expect(objects).toHaveProperty('imageIdentifierFieldMetadataId');
      });
  });
});
