import * as bcrypt from 'bcrypt';

export const hashString = async (string: string) => {
  return await bcrypt.hash(string, 10);
};
