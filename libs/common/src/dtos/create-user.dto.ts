import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail(
    {
      require_tld: true,
    },
    {
      message: 'email is required',
    },
  )
  @IsNotEmpty()
  email: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 2,
      minNumbers: 2,
      minUppercase: 2,
      minSymbols: 1,
    },
    {
      message:
        'Password must be at least 8 characters long, contain at least 2 lowercase letters, 2 uppercase letters, 2 numbers, and 1 special symbol.',
    },
  )
  @IsString()
  @IsNotEmpty()
  password: string;

  @MaxLength(20)
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
