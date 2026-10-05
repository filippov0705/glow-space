import { Status } from "../types/user";

export type GoogleAuthResponse = {
  is_new_user: boolean;
  user: { uuid: string; status: Status; email: string; name: string };
};

export type UserResponse = {
  uuid: string;
  email: string;
  name: string;
};

export type RegisterResponse = {
  uuid: string;
  email: string;
  name: string;
};
