import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'MatchedFileds', async: false })
export class MatchedFileds implements ValidatorConstraintInterface {
  validate(value: any, args?: ValidationArguments) {
    return value == args?.object['password'];
  }
  defaultMessage(args?: ValidationArguments): string {
    return 'the confirmPassword is not matched password';
  }
}

export class AuthLoginDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password!: string;
}

export class AuthSignUpDTO extends AuthLoginDto {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(25)
  username!: string;

  @IsNotEmpty()
  @Min(18)
  @Max(60)
  age!: number;

  @Validate(MatchedFileds)
  confirmPassword!: string;
}

export class AuthVarifyEmail {
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;
}
