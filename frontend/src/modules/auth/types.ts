export type User = {
  id: string;
  email: string;
  full_name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};
