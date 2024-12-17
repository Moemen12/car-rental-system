import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function IsFutureDateAndBefore(
  propertyToCompare?: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDateAndBefore',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [propertyToCompare],
      options: validationOptions, // Accepts ValidationOptions here
      validator: {
        validate(value: string, args: ValidationArguments) {
          const relatedProperty = args.constraints[0];
          const relatedValue = (args.object as any)[relatedProperty];
          const currentDate = new Date(value);
          const comparisonDate = relatedValue ? new Date(relatedValue) : null;

          // Check if the date is in the future
          if (currentDate <= new Date()) {
            return false;
          }

          // Check if endDate is after startDate
          if (comparisonDate && currentDate <= comparisonDate) {
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a future date and after ${args.constraints[0]}.`;
        },
      },
    });
  };
}
