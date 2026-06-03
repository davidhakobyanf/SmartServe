import { Transform, Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

/** Form/JSON often sends numbers as strings — coerce before validation. */
export function NumericField(): PropertyDecorator {
  return (target, propertyKey) => {
    Transform(({ value }) => {
      if (value === '' || value === null || value === undefined) return value;
      const n = Number(value);
      return Number.isFinite(n) ? n : value;
    })(target, propertyKey);
    Type(() => Number)(target, propertyKey);
    IsNumber()(target, propertyKey);
  };
}
