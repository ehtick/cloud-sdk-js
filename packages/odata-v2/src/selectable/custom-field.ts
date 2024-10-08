import { CustomField as CustomFieldBase } from '@sap-cloud-sdk/odata-common/internal';
import type { OrderableEdmTypeField } from '@sap-cloud-sdk/odata-common/internal';
import type { DeSerializers } from '../de-serializers';
import type { Entity } from '../entity';

export class CustomField<
  EntityT extends Entity,
  DeSerializersT extends DeSerializers,
  NullableT extends boolean = false
> extends CustomFieldBase<EntityT, DeSerializersT, NullableT> {
  edmDateTime(): OrderableEdmTypeField<
    EntityT,
    DeSerializersT,
    'Edm.DateTime',
    NullableT,
    true
  > {
    return this.fieldBuilder.buildEdmTypeField(
      this._fieldName,
      'Edm.DateTime',
      this._fieldOptions.isNullable
    );
  }
  edmTime(): OrderableEdmTypeField<
    EntityT,
    DeSerializersT,
    'Edm.Time',
    NullableT,
    true
  > {
    return this.fieldBuilder.buildEdmTypeField(
      this._fieldName,
      'Edm.Time',
      this._fieldOptions.isNullable
    );
  }
}
