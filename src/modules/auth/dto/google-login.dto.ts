import { IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @IsNotEmpty({ message: 'Google credential is required' })
  credential: string;
}
