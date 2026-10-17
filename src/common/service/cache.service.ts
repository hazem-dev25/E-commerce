import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { RedisClientType } from "redis";



@Injectable()
export class CacheService {
constructor(@Inject('Redis_url') private readonly client: RedisClientType ){

}
    
set = async ({ key, value, ttl } : {key:string,value:any,ttl:any} ) => {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }

  if (ttl) {
    return await this.client.set(key, value, { EX: ttl });
  }

  return await this.client.set(key, value);
};

get = async (key: string) => {
  let data : any = await this.client.get(key);

  try {
    data = JSON.parse(data);
  } catch (err) {}

  return data;
};

del = async (key: string) => {
  return await this.client.del(key);
};

exists = async (key: string) => {
  return await this.client.exists(key);
};

mget = async (...keys : string[]) => {
  let values: (string | null)[] = await this.client.mGet(keys);
    if(!values){
        throw new BadRequestException('value not found')
    }
  return values.map((val) => {
    try {
        if(!val) throw new Error("null")
      return JSON.parse(val);
    } catch {
      return val;
    }
  });
};
 keysByPrefix = async (prefix: string) => {
  return await this.client.keys(`${prefix}*`);
};

 setIfNotExists = async ({ key, value, ttl } : {key: string , value: any , ttl: any}) => {
  if (typeof value === "object") {
    value = JSON.stringify(value);
  }

  return await this.client.set(key, value, {
    NX: true,
    EX: ttl,
  });
};

increment = async (key: string) => {
  return await this.client.incr(key);
};

ttl = async (key: string) => {
  return await this.client.ttl(key);
};

deleteByPrefix = async (prefix: string) => {
  const keys = await this.client.keys(`${prefix}*`);

  if (keys.length === 0) return 0;

  return await this.client.del(keys);
};

}