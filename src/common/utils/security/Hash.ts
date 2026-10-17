import { compare, hash } from 'bcrypt';

export const HashPassword = async ({
  plainText,
  Salt = process.env.SALT,
}: {
  plainText: string;
  Salt?: string;
}): Promise<string> => {
  return await hash(plainText, +Salt!);
};

export const ComparePassword = async ({
  PlainText,
  CipherText,
}: {
  PlainText: string;
  CipherText: string;
}): Promise<boolean> => {
  return await compare(PlainText, CipherText);
};
