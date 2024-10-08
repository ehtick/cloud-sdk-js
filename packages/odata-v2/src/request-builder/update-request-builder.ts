import { createLogger, isNullish } from '@sap-cloud-sdk/util';
import {
  UpdateRequestBuilderBase,
  isNavigationProperty,
  removePropertyOnCondition,
  entitySerializer
} from '@sap-cloud-sdk/odata-common/internal';
import { extractODataEtag } from '../extract-odata-etag';
import { createODataUri } from '../uri-conversion';
import type { HttpDestinationOrFetchOptions } from '@sap-cloud-sdk/connectivity';
import type { HttpResponse } from '@sap-cloud-sdk/http-client';
import type {
  EntityIdentifiable,
  ODataRequest,
  ODataUpdateRequestConfig,
  EntityApi
} from '@sap-cloud-sdk/odata-common/internal';
import type { Entity } from '../entity';
import type { DefaultDeSerializers, DeSerializers } from '../de-serializers';

const logger = createLogger({
  package: 'odata-v2',
  messageContext: 'update-request-builder-v2'
});

/**
 * Create OData query to update an entity.
 * @typeParam EntityT - Type of the entity to be updated.
 */
export class UpdateRequestBuilder<
    EntityT extends Entity,
    DeSerializersT extends DeSerializers = DefaultDeSerializers
  >
  extends UpdateRequestBuilderBase<EntityT, DeSerializersT>
  implements EntityIdentifiable<EntityT, DeSerializersT>
{
  /**
   * Creates an instance of UpdateRequestBuilder.
   * @param entityApi - Entity API for building and executing the request.
   * @param _entity - Entity to be updated.
   */
  constructor(
    entityApi: EntityApi<EntityT, DeSerializersT>,
    readonly _entity: EntityT
  ) {
    super(
      entityApi,
      _entity,
      createODataUri(entityApi.deSerializers),
      entitySerializer(entityApi.deSerializers),
      extractODataEtag,
      removeNavPropsAndComplexTypes
    );
  }

  /**
   * Executes the query.
   * @param destination - Destination or DestinationFetchOptions to execute the request against.
   * @returns A promise resolving to the entity once it was updated.
   */
  async execute(destination: HttpDestinationOrFetchOptions): Promise<EntityT> {
    if (this.isEmptyObject(this.requestConfig.payload)) {
      return this._entity;
    }

    const request = await this.build(destination);
    warnIfNavigation(request, this._entity, this._entityApi.schema);

    return super.executeRequest(request);
  }

  /**
   * Execute request and return an {@link @sap-cloud-sdk/http-client!HttpResponse}. The request is only executed if some properties of the entity are modified.
   * @param destination - Destination or DestinationFetchOptions to execute the request against.
   * @returns A promise resolving to an {@link @sap-cloud-sdk/http-client!HttpResponse} when the request is executed or `undefined` otherwise.
   */
  async executeRaw(
    destination: HttpDestinationOrFetchOptions
  ): Promise<HttpResponse | undefined> {
    if (this.isEmptyObject(this.requestConfig.payload)) {
      logger.info(
        'The request is not executed because no properties of the entity are modified.'
      );
      return;
    }

    const request = await this.build(destination);
    warnIfNavigation(request, this._entity, this._entityApi.schema);

    return super.executeRequestRaw(request);
  }
}

/*
 * In case the entity contains a navigation to a different entity a warning is printed.
 */
function warnIfNavigation<
  EntityT extends Entity,
  DeSerializersT extends DeSerializers
>(
  request: ODataRequest<ODataUpdateRequestConfig<EntityT, DeSerializersT>>,
  entity: EntityT,
  schema: Record<string, any>
): ODataRequest<ODataUpdateRequestConfig<EntityT, DeSerializersT>> {
  const setNavigationProperties = Object.keys(entity).filter(
    key => !isNullish(entity[key]) && isNavigationProperty(key, schema)
  );

  if (setNavigationProperties.length) {
    logger.warn(
      `The navigation properties ${setNavigationProperties} have been included in your update request. Update of navigation properties is not supported and will be ignored.`
    );
  }

  return request;
}

function removeNavPropsAndComplexTypes(
  body: Record<string, any>
): Record<string, any> {
  return removePropertyOnCondition(
    // Special handling for null values because 'typeof null' is 'object', but we don't want to filter null values here.
    // See this issue for more info: https://github.com/SAP/cloud-sdk-js/issues/3204
    ([, val]) => val !== null && typeof val === 'object',
    body
  );
}
