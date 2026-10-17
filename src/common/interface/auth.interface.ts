import { Types } from "mongoose";


export interface iAuth {
  username: string;
  _id: Types.ObjectId
  age: number;
  email: string;
  password: string;
  phone: string;
  gender: string;
  role: string;
  provider: string;
  isverify: boolean;
}
