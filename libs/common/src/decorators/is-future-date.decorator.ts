import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const date = new Date(value);
          const now = new Date();
          return date > now; // Ensures the date is in the future
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} should be a future date. Please select a date after today.`;
        },
      },
    });
  };
}
