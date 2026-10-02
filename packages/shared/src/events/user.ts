export enum UserEvents {
  userCreated = "user.created",
}

export type UserCreatedEvent = {
  uuid: string;
  email: string;
};
