import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { algoliasearch } from 'algoliasearch';

@Injectable()
export class AlgoliaService {
  private readonly client: ReturnType<typeof algoliasearch>;
  constructor(private readonly ConfigService: ConfigService) {
    this.client = algoliasearch(
      this.ConfigService.get('ALGOLIA_APP_ID'),
      this.ConfigService.get('ALGOLIA_API_KEY'),
    );
  }

  async initIndex(indexName: string, settings: any) {
    await this.client.setSettings({
      indexName,
      indexSettings: settings,
      forwardToReplicas: true,
    });
  }

  async saveObject(indexName: string, object: any) {
    const result = await this.client.saveObject({
      indexName,
      body: object,
    });
  }

  async search(indexName: string, query: string, options?: any) {
    return this.client.searchSingleIndex({
      indexName,
      searchParams: {
        query,
        ...options,
      },
    });
  }

  async deleteObject(indexName: string, objectID: string) {
    await this.client.deleteObject({
      indexName,
      objectID,
    });
  }

  async updateObject(
    indexName: string,
    objectID: string,
    attributes: Record<string, any>,
    createIfNotExists = false,
  ) {
    return this.client.partialUpdateObject({
      indexName,
      objectID,
      attributesToUpdate: attributes,
      createIfNotExists,
    });
  }
}
