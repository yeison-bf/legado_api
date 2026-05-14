// dto/login-response.dto.ts
export class LoginResponseDto {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    institutionId: number;
    institutionName: string;
  };
}